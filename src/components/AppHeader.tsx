import { Image, Pressable, Text, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useSession } from "../lib/session";
import { useI18n } from "../lib/i18n";
import { Select } from "./Select";
import { NOTIFICATIONS } from "../lib/data";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, signOut } = useSession();
  const { language, setLanguage, t } = useI18n();
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  const name = session ? `${session.firstName} ${session.lastName}`.trim() : "";

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

  if (isHome) {
    return (
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <Image
            source={require("../../assets/endod_logo.png")}
            style={{ width: 36, height: 36 }}
            resizeMode="contain"
          />
          <View>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-base font-black tracking-tight text-slate-900">ENDOD</Text>
              <Text className="text-base font-bold text-teal-600">Health</Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => {
            signOut();
            router.replace("/login");
          }}
          className="px-3 py-1.5 border border-[#DCE4E6] rounded-lg"
        >
          <Text className="text-xs font-medium text-[#25343D]">{t("nav.signOut")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
      <View className="flex-row items-center gap-2.5">
        <Pressable onPress={() => router.replace("/(tabs)")} className="mr-2">
          <Text className="text-xl font-bold text-[#18242B]">←</Text>
        </Pressable>
        <Text className="text-base font-bold text-slate-900">{title}</Text>
      </View>
      <View style={{ width: 110 }}>
        <Select
          value={language === "en" ? "English" : "Amharic"}
          onValueChange={(v) => setLanguage(v === "English" ? "en" : "am")}
          options={["English", "Amharic"]}
        />
      </View>
    </View>
  );
}

function BellIcon({ color = "#475569" }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
