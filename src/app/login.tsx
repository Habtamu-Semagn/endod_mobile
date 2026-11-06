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
import Svg, { Path } from "react-native-svg";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui";
import { useSession } from "../lib/session";
import { api } from "../lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      router.replace(onboarded ? "/(tabs)" : "/onboarding");
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
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
          {/* Brand */}
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
            <Text className="text-sm text-brand-muted mt-1">Your AI Doctor</Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-white/60">
            <Text className="text-xl font-bold text-brand-heading">Welcome back</Text>
            <Text className="text-sm text-brand-muted mt-1 mb-5">
              Sign in to continue your care journey.
            </Text>

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

            {error ? <Text className="text-xs text-rose-500 mb-3 -mt-1">{error}</Text> : null}

            <Button title="Sign In" size="lg" loading={submitting} onPress={handleSubmit} />
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-brand-muted">New to ENDOD? </Text>
            <Link href="/signup" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-teal-700">Create an account</Text>
              </Pressable>
            </Link>
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
        stroke="#64748b"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        stroke="#64748b"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
