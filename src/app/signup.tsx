import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui";

export default function SignupScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
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
    // Mock auth — real app calls /api/auth/send-otp.
    setTimeout(() => {
      setSubmitting(false);
      router.push(`/verify-otp?phone=${encodeURIComponent(phone.trim())}`);
    }, 600);
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          className="px-6 py-8"
        >
          <View className="items-center mb-7">
            <Image
              source={require("../../assets/endod_logo.png")}
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
            />
            <View className="flex-row items-baseline gap-1.5 mt-3">
              <Text className="text-2xl font-black tracking-tight text-brand-heading">ENDOD</Text>
              <Text className="text-2xl font-bold text-teal-600">Health</Text>
            </View>
            <Text className="text-sm text-brand-muted mt-1">Create your account</Text>
          </View>

          <View className="bg-white rounded-3xl p-6 shadow-sm border border-white/60">
            <Text className="text-xl font-bold text-brand-heading">Get started</Text>
            <Text className="text-sm text-brand-muted mt-1 mb-5">
              We&apos;ll text you a verification code to confirm your number.
            </Text>

            <Field
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (617) 555-0198"
              keyboardType="phone-pad"
            />

            <Pressable
              onPress={() => setAgree((v) => !v)}
              className="flex-row items-start gap-2.5 mb-4"
            >
              <View
                className={`w-5 h-5 rounded-md border-2 items-center justify-center mt-0.5 ${
                  agree ? "bg-emerald-600 border-emerald-600" : "border-slate-300 bg-white"
                }`}
              >
                {agree ? <Text className="text-white text-xs font-bold">✓</Text> : null}
              </View>
              <Text className="text-xs text-brand-muted flex-1 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" asChild>
                  <Pressable>
                    <Text className="text-xs text-teal-700 font-semibold">Terms of Service</Text>
                  </Pressable>
                </Link>{" "}
                and{" "}
                <Link href="/privacy" asChild>
                  <Pressable>
                    <Text className="text-xs text-teal-700 font-semibold">Privacy Policy</Text>
                  </Pressable>
                </Link>
                , and consent to receive care-related SMS messages.
              </Text>
            </Pressable>

            {error ? <Text className="text-xs text-rose-500 mb-3 -mt-1">{error}</Text> : null}

            <Button title="Send Code" size="lg" loading={submitting} onPress={handleSubmit} />
          </View>

          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-brand-muted">Already have an account? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-teal-700">Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
