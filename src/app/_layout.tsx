import "../../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../lib/session";
import { ToastProvider } from "../components/ui/Toast";
import { I18nProvider } from "../lib/i18n";
import { useFonts } from "expo-font";
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";

export default function RootLayout() {
  useFonts({
    Newsreader: Newsreader_400Regular,
    "Newsreader-Italic": Newsreader_400Regular_Italic,
    "Newsreader-Medium": Newsreader_500Medium,
    "Newsreader-SemiBold": Newsreader_600SemiBold,
    "PlusJakartaSans": PlusJakartaSans_400Regular,
    "PlusJakartaSans-Medium": PlusJakartaSans_500Medium,
    "PlusJakartaSans-SemiBold": PlusJakartaSans_600SemiBold,
    "PlusJakartaSans-Bold": PlusJakartaSans_700Bold,
  });
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FCF9F3" } }}>
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
