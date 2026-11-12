import { useEffect, useMemo, useState } from "react";
import { Text } from "../components/ui/Text";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui";
import { useSession } from "../lib/session";
import { api, setAuthToken } from "../lib/api";
import { COLORS } from "../lib/theme";

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_BAR_COLORS = ["bg-brand-alt", "bg-brand-danger-soft", "bg-brand-accent", "bg-brand-primary", "bg-brand-primary"];

export default function SetPasswordScreen() {
  const router = useRouter();
  const { phone = "", token = "" } = useLocalSearchParams<{ phone?: string; token?: string }>();
  const { beginSignUp } = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const handleSubmit = async () => {
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api("/auth/phone/complete", {
        method: "POST",
        body: {
          verification_token: token,
          password,
          password_confirmation: confirm,
        },
      });
      const accessToken = data?.access_token ?? null;
      const created = data?.created ?? true;
      if (accessToken) setAuthToken(accessToken);
      if (created) {
        beginSignUp(phone);
        router.replace("/onboarding");
      } else {
        router.replace("/login");
      }
    } catch (e: any) {
      const code = (e as any)?.details?.code;
      if (e?.status === 409 && ((e as any)?.details?.restore_with === "verification_token" || code === "account_pending_deletion")) {
        try {
          const r = await api("/auth/restore", { method: "POST", body: { verification_token: token, password, password_confirmation: confirm } });
          const accessToken = r?.access_token ?? null;
          if (accessToken) setAuthToken(accessToken);
          const onboarded = r?.profile?.onboarding_complete;
          router.replace(onboarded ? "/(tabs)" : "/onboarding");
          return;
        } catch (err: any) {
          setError(err?.message ?? "Restore failed");
          return;
        }
      }
      setError(e?.message ?? "Failed to set password");
    } finally {
      setSubmitting(false);
    }
  };

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-brand-success-soft items-center justify-center mb-4">
              <Text className="text-2xl">🔐</Text>
            </View>
            <Text className="text-xl font-bold text-brand-heading">Set your password</Text>
            <Text className="text-sm text-brand-muted mt-1 text-center">
              Choose a strong password to protect your clinical account.
            </Text>
          </View>

          <View className="bg-white rounded-3xl p-6 shadow-sm border border-white/60">
            <Field
              label="New Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secure={!show}
              right={
                <Pressable onPress={() => setShow((v) => !v)} className="p-2" hitSlop={8}>
                  <EyeIcon open={show} />
                </Pressable>
              }
            />

            {/* Strength meter */}
            <View className="flex-row gap-1.5 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  className={`flex-1 h-1.5 rounded-full ${
                    password.length === 0
                      ? "bg-brand-alt"
                      : i < strength
                        ? STRENGTH_BAR_COLORS[strength]
                        : "bg-brand-alt"
                  }`}
                />
              ))}
            </View>
            {password.length > 0 ? (
              <Text className="text-xs text-brand-muted -mt-2 mb-3">
                {STRENGTH_LABELS[strength]}
              </Text>
            ) : null}

            <Field
              label="Confirm Password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-type your password"
              secure={!show}
            />

            {error ? <Text className="text-xs text-brand-danger mb-3 -mt-1">{error}</Text> : null}

            <Button title="Save & Continue" size="lg" loading={submitting} onPress={handleSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d={open ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"}
        stroke={COLORS.muted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        stroke={COLORS.muted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
