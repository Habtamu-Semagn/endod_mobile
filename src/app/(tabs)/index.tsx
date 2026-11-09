import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { api } from "../../lib/api";
import { useSession } from "../../lib/session";
import { useI18n } from "../../lib/i18n";
import { ACTIVE_STATUSES, type Appointment } from "../../lib/appointments/data";

const IMG = {
  book: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZha_fm_4p_Dur4AnvxO8Gq66PkgVZojxAjw7VHoi_XabytKfMab4bEpZQyNUddQN05gwXQGf6ChiDgngeAIwxdBbOYwI78kSL5P9SFYGzJQJOc_FzXPHepyhoXR4iMeZg8BUm5wMDSgwyt0ydeT2uzKBBHMrRo4DC8ewfyzQZC4HGrFqX_ppxeNMXBbGApF_7KfVzIlwGnVnBn0cdXDh4AfFxfnq0vFUKiHPw87U",
  holistic: "https://lh3.googleusercontent.com/aida-public/AB6AXuANLGsjOBcPwASW5ZejkK9ttEUH4yQMCHuowoaHDGIhQQrBWThV3SCFOytbKsS1vqFCPD99A4swA4wQnMYuKPWi3AAV0PGXl4IqySJffua4rYQzEjS6_vsoZyCmqBYZqM6GVFmDAt3rqWNruNbi5G1YUK3x0MvXpwCbNfRmgc6WSSmmDS-p8Z42NoP5mfCbKKH_RwLQJ81ZMWQ8yr4rdO9T1aCewyhphhKhvzJPjCQ",
  bills: require("../../../assets/images/home/bills.png"),
  records: require("../../../assets/images/home/medical_records.png"),
  notifications: require("../../../assets/images/home/notification.png"),
  appointmentImg: require("../../../assets/images/home/appointment.png"),
  doctor: "https://lh3.googleusercontent.com/aida/ALJJyrByIcXP_KQm9GCkjQOr7bsTvPq1I8GdW7cAwjV0Gb-t8tK9mo3wQZD0MyWT0HsENhsd9o6JGJXANTJ7XTJWYbRunqZzK9IKTcAzZDwybdyKme7r8diZxscd0imf5325syarY-u9ZtGP5eLtEqoJHp4L-_PruHQ83X_31lfC2yE3H3zleWX7xvbLi7vMX0-CcguNzHrzbcqP3SWwMzYNhBoV-k-8mAhVgVyXARDjz__5",
};

type Card = { id: string; label: string; sub: string; href: string; image: any; badge?: string; meta?: string };

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { t } = useI18n();
  const firstName = session?.firstName || "";
  const [unreadCount, setUnreadCount] = useState(0);
  const [recordsCount, setRecordsCount] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    api<Appointment[]>("users/me/appointments", { query: { limit: 200 } })
      .then((data) => { if (!cancelled) setAppointments(data); })
      .catch(() => undefined);
    api<any>("users/me/inbox", { query: { limit: 1 } })
      .then((data) => { if (!cancelled) setUnreadCount(data?.unread_count ?? 0); })
      .catch(() => undefined);
    api<any>("users/me/history")
      .then((data) => { if (!cancelled) setRecordsCount((data?.items ?? []).length); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const [now] = useState(() => Date.now());
  const upcoming = (appointments ?? []).filter((a) => ACTIVE_STATUSES.includes(a.status) && new Date(a.scheduled_at).getTime() + (a.duration_minutes || 30) * 60_000 >= now).length;
  const nextAppt = (appointments ?? []).find((a) => ACTIVE_STATUSES.includes(a.status) && new Date(a.scheduled_at).getTime() + (a.duration_minutes || 30) * 60_000 >= now) ?? null;

  const cards: Card[] = [
    { id: "card", label: t("home.shortcut.card.title"), sub: t("healthCard.digitalId"), href: "/(tabs)/card", image: require("../../../assets/images/home/health_card.png") },
    { id: "booking", label: t("home.shortcut.booking.title"), sub: t("home.shortcut.booking.hint"), href: "/(tabs)/booking", image: IMG.book, badge: nextAppt ? `Next: ${new Date(nextAppt.scheduled_at).toLocaleDateString()}` : undefined },
    { id: "appointment", label: t("home.shortcut.appointment.title"), sub: `${upcoming} ${t("home.shortcut.appointment.hint")}`, href: "/(tabs)/appointment", image: require("../../../assets/images/home/appointments.png"), meta: `${upcoming} upcoming` },
    { id: "records", label: t("home.shortcut.followup.title"), sub: `${recordsCount} ${t("home.shortcut.records.hint")}`, href: "/(tabs)/records", image: IMG.records },
    { id: "notifications", label: t("home.shortcut.message.title"), sub: `${unreadCount} ${t("home.shortcut.notifications.hint")}`, href: "/(tabs)/notifications", image: IMG.notifications, badge: unreadCount > 0 ? `${unreadCount} unread` : undefined },
    { id: "bills", label: t("bills.title"), sub: t("home.shortcut.bills.hint"), href: "/(tabs)/bills", image: IMG.bills },
  ];

  const SURFACE = "#FCF9F3";
  const ON_SURFACE = "#1C1C18";
  const ON_SURFACE_VARIANT = "#59413F";
  const PRIMARY = "#AD292F";
  const SECONDARY_FIXED = "#EBE1DA";
  const ON_SECONDARY_FIXED = "#1F1B17";
  const ON_SECONDARY_FIXED_VARIANT = "#4C4641";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: SURFACE }} edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-5 pt-3">
          <Text style={{ color: ON_SURFACE, fontSize: 30, lineHeight: 36, fontWeight: "500", letterSpacing: -0.3, fontFamily: "Newsreader-Medium" }}>
            Welcome back, <Text style={{ fontStyle: "italic", fontWeight: "400", fontFamily: "Newsreader-Italic" }}>{firstName || "there"}.</Text>
          </Text>
        </View>

        {nextAppt && (
          <Pressable onPress={() => router.push("/(tabs)/appointment" as any)} className="mx-5 mt-3 rounded-2xl p-4 flex-row items-center justify-between active:opacity-90" style={{ backgroundColor: `${SECONDARY_FIXED}80` }}>
            <View className="flex-row items-center gap-3 min-w-0 flex-1">
              <View className="w-10 h-10 rounded-full items-center justify-center shrink-0" style={{ backgroundColor: "#FFFFFF" }}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke={PRIMARY} strokeWidth={1.8} strokeLinecap="round" />
                </Svg>
              </View>
              <View className="flex-col min-w-0 flex-1">
                <Text style={{ color: ON_SECONDARY_FIXED, fontSize: 11, fontWeight: "600", fontFamily: "PlusJakartaSans-SemiBold" }}>{new Date(nextAppt.scheduled_at).toLocaleDateString()} at {new Date(nextAppt.scheduled_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</Text>
                <Text style={{ color: ON_SECONDARY_FIXED_VARIANT, fontSize: 13, fontFamily: "PlusJakartaSans" }} numberOfLines={1}>{nextAppt.provider_name ?? "—"} • {nextAppt.facility?.name ?? nextAppt.location ?? ""}</Text>
              </View>
            </View>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M9 6l6 6-6 6" stroke={ON_SECONDARY_FIXED_VARIANT} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        )}

        <View className="px-5 mt-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: ON_SURFACE, fontSize: 18, fontWeight: "600", fontFamily: "Newsreader-SemiBold" }}>Care Services</Text>
            <Text style={{ color: ON_SURFACE_VARIANT, fontSize: 11, fontWeight: "500", fontFamily: "PlusJakartaSans-Medium" }}>{cards.length} curated hubs</Text>
          </View>
          <View style={{ gap: 12 }}>
            {cards.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push(c.href as any)}
                className="rounded-2xl overflow-hidden active:scale-[0.99]"
                style={{ backgroundColor: "#FFFFFF", shadowColor: "#2A2521", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 }}
              >
                <View className="relative w-full h-40 overflow-hidden" style={{ backgroundColor: "#F0EEE8" }}>
                  <Image source={typeof c.image === "number" ? c.image : { uri: c.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  {c.badge && (
                    <View className="absolute top-3 left-3 px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(252,249,243,0.9)" }}>
                      <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: "600", fontFamily: "PlusJakartaSans-SemiBold" }}>{c.badge}</Text>
                    </View>
                  )}
                  <View className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(252,249,243,0.9)" }}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M9 6l6 6-6 6" stroke={ON_SURFACE_VARIANT} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                </View>
                <View className="p-4">
                  <View className="flex-row items-center justify-between">
                    <Text style={{ color: ON_SURFACE, fontSize: 18, fontWeight: "600", fontFamily: "Newsreader-SemiBold" }}>{c.label}</Text>
                    {c.meta && (
                      <Text style={{ color: ON_SURFACE_VARIANT, fontSize: 11, fontWeight: "500", fontFamily: "PlusJakartaSans-Medium" }}>{c.meta}</Text>
                    )}
                  </View>
                  <Text style={{ color: ON_SURFACE_VARIANT, fontSize: 13, marginTop: 2, lineHeight: 18, fontFamily: "PlusJakartaSans" }} numberOfLines={2}>{c.sub}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
