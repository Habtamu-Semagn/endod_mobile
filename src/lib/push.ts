// Push notifications: the notification bar, with Endod's own sound, even when
// the app is closed. Every in-app notification is also pushed (the server's
// push.py); a push only says which kind of update it is ("Appointment update"),
// the details open in the app after a tap.
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { AndroidImportance, AndroidNotificationVisibility } from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { api } from "./api";
import { refreshUnreadCount } from "./unread";

/** Android channel; the server sends every push to it. */
export const PUSH_CHANNEL = "updates";
const SOUND = "endod.wav";
const OFF_KEY = "endod_push_off";

/** This phone's token while it is registered for the signed-in patient. */
let currentToken: string | null = null;

// While the app is open, show the push as a banner too, with the sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
    // Only a convenience: the next sign-in registers again.
  }
}

async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(PUSH_CHANNEL, {
    name: "Endod updates",
    description: "Appointments, records, messages and account security.",
    importance: AndroidImportance.HIGH,
    sound: SOUND,
    vibrationPattern: [0, 180, 120, 180],
    // On a locked phone the content stays hidden (the push has no details anyway).
    lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
  });
}

export async function pushSwitchedOn(): Promise<boolean> {
  return (await read(OFF_KEY)) !== "1";
}

/**
 * Registers this phone for the signed-in patient. Asks for the permission
 * when `ask` is true (sign-in, or the switch in Settings); otherwise only
 * refreshes a permission already given. Resolves to whether pushes are on.
 */
export async function registerForPush(language: string, ask = true): Promise<boolean> {
  if (Platform.OS === "web" || !(await pushSwitchedOn())) return false;
  try {
    await ensureChannel();
    let { granted, canAskAgain } = await Notifications.getPermissionsAsync();
    if (!granted && ask && canAskAgain) {
      ({ granted } = await Notifications.requestPermissionsAsync());
    }
    if (!granted) return false;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api("users/me/push-devices", {
      method: "PUT",
      body: { token, platform: Platform.OS, language: language === "am" ? "am" : "en" },
    });
    currentToken = token;
    return true;
  } catch {
    // No network, or push not set up in this build: try again next time.
    return false;
  }
}

/**
 * At sign-out, or when the patient switches pushes off. The request starts
 * synchronously, so it still carries the session when the caller signs out
 * right after.
 */
export function unregisterPush(): Promise<void> {
  const token = currentToken;
  currentToken = null;
  if (!token) return Promise.resolve();
  return api("users/me/push-devices", { method: "DELETE", body: { token } }).then(
    () => undefined,
    // Offline: the server drops the token once Expo reports it gone, or when
    // the next account signs in on this phone.
    () => undefined,
  );
}

export async function setPushSwitchedOn(on: boolean, language: string): Promise<boolean> {
  await write(OFF_KEY, on ? null : "1");
  if (!on) {
    await unregisterPush();
    return false;
  }
  return registerForPush(language, true);
}

/** The screen a tapped push opens, from the server's `data`. */
export function pushRoute(data: Record<string, unknown> | undefined): string {
  switch (data?.screen) {
    case "appointment":
      return "/(tabs)/appointment";
    case "bills":
      return "/(tabs)/bills";
    case "record":
    case "history":
    case "follow_up":
      return "/(tabs)/records";
    case "settings":
      return "/(tabs)/settings";
    default:
      return "/(tabs)/notifications";
  }
}

/** Keeps the bell's count current when a push arrives while the app is open. */
export function listenForPushes(): () => void {
  const sub = Notifications.addNotificationReceivedListener(() => void refreshUnreadCount());
  return () => sub.remove();
}
