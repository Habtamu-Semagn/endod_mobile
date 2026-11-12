// Passkeys in the app, the same flow as the website (docs/passkeys.md in the
// platform repo): offer one right after a password sign-in, remember on this
// phone that it has one, and next time sign in with it before showing the form.
// Options and credentials are never logged: they identify the patient's keys.
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Passkey } from "react-native-passkey";
import { ApiError, api } from "./api";

const DEVICE_KEY = "endod_passkey_device";
const OFFER_KEY = "endod_passkey_offer";
const SNOOZE_DAYS = 30;

export type PasskeyFailure = {
  kind: "cancelled" | "needs_password" | "no_passkey" | "unknown_passkey" | "failed";
  message: string;
};

export function passkeysSupported(): boolean {
  try {
    return Passkey.isSupported();
  } catch {
    return false;
  }
}

async function read(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string | null) {
  try {
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Storage is a convenience: without it we simply ask again.
  }
}

/** True once a passkey was added or used on this phone. */
export async function deviceHasPasskey(): Promise<boolean> {
  return (await read(DEVICE_KEY)) === "1";
}

export async function setDeviceHasPasskey(value: boolean) {
  await write(DEVICE_KEY, value ? "1" : null);
}

/** Whether to show the "sign in faster next time" pop-up after a password sign-in. */
export async function shouldOfferPasskey(): Promise<boolean> {
  if (!passkeysSupported() || (await deviceHasPasskey())) return false;
  const offer = await read(OFFER_KEY);
  if (offer === "never") return false;
  if (offer && offer.startsWith("until:")) return Date.now() > Number(offer.slice(6));
  return true;
}

export async function snoozePasskeyOffer() {
  await write(OFFER_KEY, `until:${Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000}`);
}

export async function neverOfferPasskey() {
  await write(OFFER_KEY, "never");
}

function deviceName(): string {
  return Platform.OS === "ios" ? "iPhone" : "Android phone";
}

/** The server wraps its details: { error, error_code, details: {...} }. */
function serverDetails(e: unknown): Record<string, any> {
  const body = e instanceof ApiError ? (e.details as any) : undefined;
  return (body?.details ?? {}) as Record<string, any>;
}

function failure(e: any, fallback: string): PasskeyFailure {
  const code = e?.error;
  const text = String(e?.message ?? "").toLowerCase();
  if (code === "UserCancelled" || code === "Interrupted" || text.includes("cancel")) {
    return { kind: "cancelled", message: "" };
  }
  if (code === "NoCredentials") {
    return { kind: "no_passkey", message: "No passkey for Endod on this phone. Sign in with your phone number and password." };
  }
  if (e instanceof ApiError && e.status === 428) {
    return { kind: "needs_password", message: "For your security, enter your password to continue." };
  }
  return { kind: "failed", message: e instanceof ApiError ? e.message : (e?.message || fallback) };
}

/**
 * Adds a passkey for the signed-in patient on this phone. Right after a sign-in
 * no password is needed; later the server asks for it (428) and the caller
 * passes it as currentPassword.
 */
export async function registerPasskey(currentPassword?: string): Promise<{ ok: true } | { ok: false; failure: PasskeyFailure }> {
  try {
    const body = currentPassword ? { current_password: currentPassword } : {};
    const res = await api<{ options: any }>("users/me/passkeys/registration/options", { method: "POST", body });
    const credential = await Passkey.create(res.options);
    await api("users/me/passkeys/registration/verify", { method: "POST", body: { credential, name: deviceName() } });
    await setDeviceHasPasskey(true);
    return { ok: true };
  } catch (e: any) {
    const f = failure(e, "The passkey could not be added. Please try again.");
    if (f.kind === "needs_password") f.message = serverDetails(e).has_password === false
      ? "Sign in again, then add the passkey."
      : f.message;
    return { ok: false, failure: f };
  }
}

/** Signs in with a passkey on this phone; resolves to the same body as /auth/login. */
export async function signInWithPasskey(): Promise<{ ok: true; data: any } | { ok: false; failure: PasskeyFailure }> {
  try {
    const res = await api<{ challenge_id: string; options: any }>("auth/passkey/options", { method: "POST", body: {} });
    const credential = await Passkey.get(res.options);
    const data = await api("auth/passkey/verify", {
      method: "POST",
      body: { challenge_id: res.challenge_id, credential },
    });
    await setDeviceHasPasskey(true);
    return { ok: true, data };
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 401) {
      // The server no longer knows this passkey (removed or blocked): stop offering it.
      await setDeviceHasPasskey(false);
      return { ok: false, failure: { kind: "unknown_passkey", message: "That passkey no longer works. Sign in with your phone number and password." } };
    }
    return { ok: false, failure: failure(e, "We couldn't sign you in with that passkey. Try again, or use your phone number and password.") };
  }
}

/** The 409 code the server sends when the account is waiting to be erased. */
export function pendingDeletion(e: unknown): { restoreToken?: string; eraseAfter?: string } | null {
  if (!(e instanceof ApiError) || e.status !== 409) return null;
  const d = serverDetails(e);
  return d.code === "account_pending_deletion" ? { restoreToken: d.restore_token, eraseAfter: d.erase_after } : null;
}
