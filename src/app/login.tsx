import { useEffect, useRef, useState } from "react";
import { Text } from "../components/ui/Text";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui";
import { useSession } from "../lib/session";
import { api } from "../lib/api";
import {
  deviceHasPasskey,
  neverOfferPasskey,
  passkeysSupported,
  pendingDeletion,
  registerPasskey,
  shouldOfferPasskey,
  signInWithPasskey,
  snoozePasskeyOffer,
} from "../lib/passkeys";
import { PasskeyModal } from "../components/PasskeyModal";
import { COLORS } from "../lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const supported = passkeysSupported();

  const handlePasskeySignIn = async () => {
    setError("");
    setPasskeySubmitting(true);
    const result = await signInWithPasskey();
    setPasskeySubmitting(false);
    if (result.ok) {
      const data = result.data;
      const profile = data?.profile ?? {};
      signIn(profile?.phone ?? data?.dedan_user_id ?? "", data?.access_token ?? null);
      router.replace(profile?.onboarding_complete ? "/(tabs)" : "/onboarding");
    } else if (result.failure.kind !== "cancelled") {
      setError(result.failure.message);
    }
  };

  // Like the website: on a phone that already has a passkey, ask for the
  // fingerprint or face straight away, once; cancelling shows the normal form.
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current || !supported) return;
    autoTried.current = true;
    void deviceHasPasskey().then((has) => {
      if (has) void handlePasskeySignIn();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api("/auth/login", { method: "POST", body: { identifier: phone.trim(), password } });
      const token = data?.access_token ?? null;
      signIn(phone.trim(), token);
      const onboarded = data?.profile?.onboarding_complete;
      const go = () => router.replace(onboarded ? "/(tabs)" : "/onboarding");
      if (await shouldOfferPasskey()) {
        setPendingNav(() => go);
        setPasskeyDone(false);
        setShowPasskeyPrompt(true);
      } else {
        go();
      }
    } catch (e: any) {
      const pending = pendingDeletion(e);
      if (pending) {
        const restoreToken = pending.restoreToken;
        const eraseAfter = pending.eraseAfter?.slice(0, 10);
        Alert.alert(
          "Restore account?",
          `This account was deleted. You can restore it until ${eraseAfter ?? "it is erased"}.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Restore",
              onPress: async () => {
                try {
                  const r = await api("/auth/restore", { method: "POST", body: { restore_token: restoreToken } });
                  const t = r?.access_token ?? null;
                  signIn(phone.trim(), t);
                  const onb = r?.profile?.onboarding_complete;
                  router.replace(onb ? "/(tabs)" : "/onboarding");
                } catch (err: any) {
                  setError(err?.message ?? "Restore failed");
                }
              },
            },
          ],
        );
        return;
      }
      setError(e?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const [passkeyPromptBusy, setPasskeyPromptBusy] = useState(false);
  const [passkeyDone, setPasskeyDone] = useState(false);
  const [passkeyPromptError, setPasskeyPromptError] = useState("");
  const leavePrompt = () => {
    setShowPasskeyPrompt(false);
    setPasskeyDone(false);
    setPasskeyPromptError("");
    if (pendingNav) pendingNav();
    setPendingNav(null);
  };
  const handlePasskeyPromptConfirm = async () => {
    setPasskeyPromptBusy(true);
    setPasskeyPromptError("");
    const result = await registerPasskey();
    setPasskeyPromptBusy(false);
    if (result.ok) {
      setPasskeyDone(true);
      setTimeout(leavePrompt, 3000);
    } else if (result.failure.kind === "cancelled") {
      // The phone's prompt was dismissed: close quietly, ask again next sign-in.
      leavePrompt();
    } else {
      setPasskeyPromptError(result.failure.message);
    }
  };
  // "Not now": don't ask again for 30 days on this phone.
  const handlePasskeyPromptClose = () => {
    if (passkeyPromptBusy) return;
    if (!passkeyDone) void snoozePasskeyOffer();
    leavePrompt();
  };
  const handlePasskeyPromptNever = () => {
    if (passkeyPromptBusy) return;
    void neverOfferPasskey();
    leavePrompt();
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <KeyboardAvoidingView
        enabled={Platform.OS === "ios"}
        behavior="padding"
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", marginTop: Platform.OS === "ios" && keyboardVisible ? -60 : 0 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          className="px-6 py-8"
        >
          {/* Brand */}
          <View className="items-center mb-7">
            <Image
              source={require("../../assets/endod_logo.png")}
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
            />
            <View className="flex-row items-baseline gap-1.5 mt-3">
              <Text className="text-2xl tracking-tight text-brand-heading">Endod</Text>
              <Text className="text-2xl text-brand-accent">Health</Text>
            </View>

          </View>

          {/* Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-white/60">
            <Field
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="0987452325"
              keyboardType="phone-pad"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secure={!showPassword}
              right={
                <Pressable onPress={() => setShowPassword((v) => !v)} className="p-2" hitSlop={8}>
                  <EyeIcon open={showPassword} />
                </Pressable>
              }
            />

            {error ? <Text className="text-xs text-brand-danger mb-3 -mt-1">{error}</Text> : null}

            <Button title="Sign In" variant="dark" size="lg" loading={submitting} onPress={handleSubmit} />

            {supported ? (
              <Pressable
                onPress={handlePasskeySignIn}
                disabled={passkeySubmitting}
                className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border border-brand-border bg-white py-3"
              >
                <Text className="text-sm font-semibold text-brand-heading">
                  {passkeySubmitting ? "Signing in…" : "Sign in with passkey"}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-brand-muted">New to ENDOD? </Text>
            <Link href="/signup" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-brand-primary">Create an account</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <PasskeyModal
        visible={showPasskeyPrompt}
        busy={passkeyPromptBusy}
        done={passkeyDone}
        title={passkeyDone ? "All set" : "Sign in faster next time"}
        description={
          passkeyDone
            ? "Next time, just use your fingerprint or face."
            : passkeyPromptError || "Use your fingerprint, face or phone screen lock instead of your password."
        }
        confirmLabel="Confirm"
        cancelLabel="Not now"
        neverLabel="Don't ask again"
        onConfirm={handlePasskeyPromptConfirm}
        onClose={handlePasskeyPromptClose}
        onNever={handlePasskeyPromptNever}
      />
    </SafeAreaView>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d={open ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"}
        stroke={COLORS.body}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        stroke={COLORS.body}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
