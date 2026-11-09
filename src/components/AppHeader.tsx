import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useI18n } from "../lib/i18n";
import { Select } from "./Select";
import { useState } from "react";
import { EmergencyModal } from "./EmergencyModal";
import { NOTIFICATIONS } from "../lib/data";

const ON_SURFACE = "#1C1C18";
const ON_SURFACE_VARIANT = "#59413F";

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useI18n();
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const TITLES: Record<string, string> = {
    "/": "ENDOD",
    "/(tabs)": "ENDOD",
    "/(tabs)/index": "ENDOD",
    "/(tabs)/card": t("tab.card"),
    "/(tabs)/booking": t("tab.booking"),
    "/(tabs)/appointment": t("tab.appointments"),
    "/(tabs)/records": t("tab.records"),
    "/(tabs)/settings": t("tab.settings"),
    "/(tabs)/notifications": t("tab.notifications"),
    "/(tabs)/bills": t("tab.bills"),
    "/(tabs)/queue": t("tab.queue"),
  };

  const segment = pathname.split("/").filter(Boolean).pop() || "index";
  const isHome =
    pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/index" || pathname === "/index" || segment === "index";
  const title = TITLES[pathname] ?? TITLES["/(tabs)/" + segment] ?? TITLES["/" + segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);

  const containerStyle = {
    height: 64 + insets.top,
    paddingTop: insets.top,
    paddingHorizontal: 12,
    backgroundColor: "rgba(252,249,243,0.85)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  };

  return (
    <>
      <View style={containerStyle} className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
        {isHome ? (
          <Image
            source={require("../../assets/endod_logo.png")}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        ) : (
          <Pressable onPress={() => router.replace("/(tabs)")} style={{ marginRight: 8 }}>
            <Text style={{ color: ON_SURFACE, fontSize: 22, fontWeight: "700" }}>←</Text>
          </Pressable>
        )}
        <Text
          style={{ color: ON_SURFACE, fontSize: 18, lineHeight: 24, fontWeight: "700", fontFamily: "Newsreader-SemiBold" }}
        >
          ENDOD
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Pressable
          onPress={() => setLanguage(language === "en" ? "am" : "en")}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999, borderWidth: 1, borderColor: "#E1BFBC", alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: ON_SURFACE, fontSize: 12, fontWeight: "600", fontFamily: "PlusJakartaSans-SemiBold" }}>{language === "en" ? "EN" : "AM"}</Text>
        </Pressable>
        <Pressable
          onPress={() => setEmergencyOpen(true)}
          accessibilityLabel="Emergency"
          style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#BA1A1A", alignItems: "center", justifyContent: "center" }}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>
    </View>
    <EmergencyModal visible={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </>
  );
}

