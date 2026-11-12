import { useEffect, useRef, useState } from "react";
import { Text } from "../components/ui/Text";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui";
import { api } from "../lib/api";

const RESEND_COOLDOWN = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone = "" } = useLocalSearchParams<{ phone?: string }>();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<any[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((v) => v - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const setDigit = (position: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[position] = clean;
      return next;
    });
    setError("");
    if (clean && position < 5) {
      inputs.current[position + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (digits.some((d) => !d)) {
      setError("Please enter all 6 digits.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api("/auth/phone/verify", { method: "POST", body: { phone: phone.trim(), code: digits.join("") } });
      const token = data?.verification_token ?? "";
      router.replace(`/set-password?phone=${encodeURIComponent(phone)}&token=${encodeURIComponent(token)}`);
    } catch (e: any) {
      setError(e?.message ?? "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const maskPhone = (raw: string) => {
    const total = (raw.match(/\d/g) ?? []).length;
    let seen = 0;
    return raw.replace(/\d/g, (d) => {
      seen += 1;
      return total - seen < 4 ? d : "•";
    });
  };

  const masked = maskPhone(phone);

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
              <Text className="text-2xl">📱</Text>
            </View>
            <Text className="text-xl font-bold text-brand-heading">Verify your number</Text>
            <Text className="text-sm text-brand-muted mt-1 text-center">
              Enter the 6-digit code sent to{"\n"}
              <Text className="font-semibold text-brand-heading">{masked || "your phone"}</Text>
            </Text>
          </View>

          <View className="flex-row justify-between mb-5">
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputs.current[i] = ref;
                }}
                value={digit}
                onChangeText={(v) => setDigit(i, v)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                className={`w-[48px] h-[56px] rounded-xl border-2 bg-white text-center text-xl font-bold text-brand-heading ${
                  digit ? "border-brand-primary" : "border-brand-border"
                }`}
              />
            ))}
          </View>

          {error ? (
            <Text className="text-xs text-brand-danger text-center mb-3">{error}</Text>
          ) : null}

          <Button title="Verify" size="lg" loading={submitting} onPress={handleVerify} />

          <View className="items-center mt-5">
            {cooldown > 0 ? (
              <Text className="text-sm text-brand-muted">
                Resend code in{" "}
                <Text className="font-semibold text-brand-heading">{cooldown}s</Text>
              </Text>
            ) : (
              <Pressable onPress={() => setCooldown(RESEND_COOLDOWN)}>
                <Text className="text-sm font-semibold text-brand-success">Resend code</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
