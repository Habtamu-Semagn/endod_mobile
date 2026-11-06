import { ScrollView, Text, View, Pressable, Image } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { APPOINTMENTS, MEDICAL_RECORDS, NOTIFICATIONS } from "../../lib/data";
import { useSession } from "../../lib/session";
import { useToast } from "../../components/ui/Toast";
import { Select } from "../../components/Select";
import { EmergencyModal } from "../../components/EmergencyModal";
import { useI18n } from "../../lib/i18n";

type Section = {
  id: string;
  label: string;
  sub: string;
  href: string;
  icon: React.ReactNode;
};

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { showToast } = useToast();
  const { t, language, setLanguage } = useI18n();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const firstName = session?.firstName || "";
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  const upcoming = APPOINTMENTS.filter((a) => a.status === "Upcoming").length;

  const sections: Section[] = [
    { id: "card", label: t("home.shortcut.card.title"), sub: t("healthCard.digitalId"), href: "/(tabs)/card", icon: <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#176B65" strokeWidth={2}><Rect x="2" y="5" width="20" height="14" rx="2" /><Path d="M2 10h20" /></Svg> },
    { id: "booking", label: t("home.shortcut.booking.title"), sub: t("home.shortcut.booking.hint"), href: "/(tabs)/booking", icon: <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#176B65" strokeWidth={2}><Path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></Svg> },
    { id: "queue", label: t("queue.title"), sub: t("home.shortcut.queue.hint"), href: "/(tabs)/queue", icon: <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#176B65" strokeWidth={2}><Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><Circle cx="9" cy="7" r="4" /><Path d="M23 21v-2a4 4 0 00-3-3.87" /><Path d="M16 3.13a4 4 0 010 7.75" /></Svg> },
    { id: "appointment", label: t("home.shortcut.appointment.title"), sub: `${upcoming} ${t("home.shortcut.appointment.hint")}`, href: "/(tabs)/appointment", icon: <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#176B65" strokeWidth={2}><Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></Svg> },
    { id: "records", label: t("home.shortcut.followup.title"), sub: `${MEDICAL_RECORDS.length} ${t("home.shortcut.records.hint")}`, href: "/(tabs)/records", icon: <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#176B65" strokeWidth={2}><Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></Svg> },
    { id: "notification", label: t("home.shortcut.message.title"), sub: `${unread} ${t("home.shortcut.notifications.hint")}`, href: "/(tabs)/notifications", icon: <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#176B65" strokeWidth={2}><Path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></Svg> },
    { id: "bills", label: t("bills.title"), sub: t("home.shortcut.bills.hint"), href: "/(tabs)/bills", icon: <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#176B65" strokeWidth={2}><Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></Svg> },
    { id: "setting", label: t("home.shortcut.settings.title"), sub: t("home.shortcut.settings.hint"), href: "/(tabs)/settings", icon: <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#176B65" strokeWidth={2}><Path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><Circle cx="12" cy="12" r="3" /></Svg> },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#E5E7EB]" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        <View className="px-5 pt-4 pb-4 bg-[#18242B]" style={{ zIndex: 100 }}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <Circle cx="12" cy="7" r="4" />
              </Svg>
              <Text className="text-lg font-semibold text-white" numberOfLines={1}>
                {firstName ? t("mobile.dashboard.greeting", { name: firstName }) : t("mobile.dashboard.greetingNoName")}
              </Text>
            </View>
            <View style={{ width: 120 }}>
              <Select
                value={language === "en" ? "English" : "Amharic"}
                onValueChange={(v) => setLanguage(v === "English" ? "en" : "am")}
                options={["English", "Amharic"]}
                triggerTextClassName="text-white"
                triggerArrowClassName="text-white"
              />
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap px-4 mt-4" style={{ gap: 16 }}>
          {sections.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => router.push(s.href as any)}
              className="bg-white rounded-2xl p-4 active:bg-slate-50 items-center"
              style={{ width: "47%" }}
            >
              <View className="w-14 h-14 rounded-2xl items-center justify-center mb-2">
                {s.icon}
              </View>
              <Text className="text-base font-semibold text-[#18242B] leading-tight text-center">{s.label}</Text>
            </Pressable>
          ))}
        </View>

        <View className="px-4 mt-6 mb-2">
          <Pressable
            onPress={() => setEmergencyOpen(true)}
            className="w-full flex-row items-center justify-center gap-2 bg-red-600 rounded-2xl py-3.5 active:opacity-90"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </Svg>
            <Text className="text-white font-bold text-base">{t("emergency.button")}</Text>
          </Pressable>
        </View>
      </ScrollView>
      <EmergencyModal visible={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </SafeAreaView>
  );
}
