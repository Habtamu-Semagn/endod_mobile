import "../../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../lib/session";
import { ToastProvider } from "../components/ui/Toast";
import { I18nProvider } from "../lib/i18n";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F6F9FA" } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="verify-otp" />
              <Stack.Screen name="set-password" />
              <Stack.Screen name="onboarding" />
            </Stack>
          </ToastProvider>
        </SessionProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
