import "../../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { SessionProvider } from "../lib/session";
import { ToastProvider } from "../components/ui/Toast";
import { I18nProvider } from "../lib/i18n";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { NavigationBar } from "expo-navigation-bar";
import { COLORS } from "../lib/theme";
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
  const [fontsLoaded, fontError] = useFonts({
    Newsreader: Newsreader_400Regular,
    "Newsreader-Italic": Newsreader_400Regular_Italic,
    "Newsreader-Medium": Newsreader_500Medium,
    "Newsreader-SemiBold": Newsreader_600SemiBold,
    "PlusJakartaSans": PlusJakartaSans_400Regular,
    "PlusJakartaSans-Medium": PlusJakartaSans_500Medium,
    "PlusJakartaSans-SemiBold": PlusJakartaSans_600SemiBold,
    "PlusJakartaSans-Bold": PlusJakartaSans_700Bold,
  });

  // Wait for the brand fonts before painting. Slow devices would otherwise
  // render every label with the system fallback first and then re-flow the
  // whole layout once the real fonts arrive.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <ToastProvider>
            {/*
              The app is a single light theme. Pinning the system bar styles
              keeps the status/navigation bar identical on every device, no
              matter which OEM theme or dark-mode setting the phone uses.
            */}
            <StatusBar style="dark" />
            <NavigationBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
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
