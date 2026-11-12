import { useEffect, useState } from "react";
import { Text } from "../components/ui/Text";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui";
import { api } from "../lib/api";

export default function SignupScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
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

  const handleSubmit = async () => {
    setError("");
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!agree) {
      setError("Please accept the terms to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await api("/auth/phone/request-code", { method: "POST", body: { phone: phone.trim() } });
      router.push(`/verify-otp?phone=${encodeURIComponent(phone.trim())}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to send code");
    } finally {
      setSubmitting(false);
    }
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

          <View className="bg-white rounded-3xl p-6 shadow-sm border border-white/60">
            <Field
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="0987452325"
              keyboardType="phone-pad"
            />

            <Pressable
              onPress={() => setAgree((v) => !v)}
              className="flex-row items-start gap-2.5 mb-4"
            >
              <View
                className={`w-5 h-5 rounded-md border-2 items-center justify-center mt-0.5 ${
                  agree ? "bg-brand-primary border-brand-primary" : "border-brand-border bg-white"
                }`}
              >
                {agree ? <Text className="text-white text-xs font-bold">✓</Text> : null}
              </View>
              <Text className="text-xs text-brand-muted flex-1 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" asChild>
                  <Text className="text-xs text-brand-primary font-semibold">Terms of Service</Text>
                </Link>{" "}
                and{" "}
                <Link href="/privacy" asChild>
                  <Text className="text-xs text-brand-primary font-semibold">Privacy Policy</Text>
                </Link>
                , and consent to receive care-related SMS messages.
              </Text>
            </Pressable>

            {error ? <Text className="text-xs text-brand-danger mb-3 -mt-1">{error}</Text> : null}

            <Button title="Send Code" variant="dark" size="lg" loading={submitting} onPress={handleSubmit} />
          </View>

          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-brand-muted">Already have an account? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-brand-primary">Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
