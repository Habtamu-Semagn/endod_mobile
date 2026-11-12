import { refreshUnreadCount, useUnreadCount } from "../../lib/unread";
import { useContentWidth, useScaledWidth } from "../../lib/layout";
import { COLORS, TAB_CONTENT_PADDING } from "../../lib/theme";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { api } from "../../lib/api";
import { useSession } from "../../lib/session";
import { useI18n } from "../../lib/i18n";
import { ACTIVE_STATUSES, type Appointment } from "../../lib/appointments/data";
import { Text } from "../../components/ui/Text";

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

/** Size of a care service card on the reference device (ZTE Blade V30). */
const SERVICE_CARD_WIDTH = 260;
/** Height of the picture inside a care service card on the reference device. */
const SERVICE_CARD_IMAGE_HEIGHT = 256;

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { t } = useI18n();
  const firstName = session?.firstName || "";
  const unreadCount = useUnreadCount();
  const [recordsCount, setRecordsCount] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    api<Appointment[]>("users/me/appointments", { query: { limit: 200 } })
      .then((data) => { if (!cancelled) setAppointments(data); })
      .catch(() => undefined);
    void refreshUnreadCount();
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

  const cardWidth = useContentWidth(32);
  // The care service cards are scaled against the reference device (ZTE Blade
  // V30) in both directions, so they always occupy the same share of the
  // screen on a Galaxy M12, a ZTE Blade V30 or any other phone.
  const serviceCardWidth = useScaledWidth(SERVICE_CARD_WIDTH);
  // The picture keeps the proportions of the reference card.
  const serviceCardImageHeight = Math.round(
    (serviceCardWidth / SERVICE_CARD_WIDTH) * SERVICE_CARD_IMAGE_HEIGHT
  );
  const movingCards = [
    { badge: "HEALTH CARD", title: "Your Digital Health ID", link: "View your health card", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVKZZ04Ldk4yrZTQxz3jycLzvSiSybyozoQbBrPGrjWHBM_TRTiM-dI7upw6-6brV2OgPhTIKu5Dy3rvO-HGNFEn0rPms9hmfAuSCW-26Fha6y2jiEa2YRmC2P0C7D7HvHWw20y9h_SGnIRDhNDchHgZo_C5sbgtx6v-NNvvEslIe6W3sCroE7ZYlpCltD5RemwXzGv39Q4eRPW8Ke3slInn72XHb8DhuLF1FtihAu", activeDot: 0 },
    { badge: "APPOINTMENTS", title: "Manage Your Appointments", link: "View upcoming visits", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvdDNF387dzvZp4Rm9hqQda-qzI9aJ77Y2zruR2p-rbqR84yUMVMIFGkvWJOCv2Bvpum5wY46xlmFZP7yHgbfjWskiakXlRUIlYbjZlY3onasLr3uSDHUDrVkGVgKgW-RpIB7WUWHAnIaZdvLCNoMYI_fsSKCmv5h0vuhKvJG14K8qc9MoIdDzvhT5oMrmJFgLWS--dpDoxvxic-GKQ8oa_SaiMWMuylbqsKNYkvJ3", activeDot: 1 },
    { badge: "BOOKING", title: "Find Care Near You", link: "Book a hospital visit", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2SdjCvKU1ewqqBWV3S2UAZQIFeHgN80OCxXne7u8XebnIJN9dLVFkJYyfzSEFh833ohjeiVC8s2acKmtL_lS0k4BAC1qDnG8VdVHsz8ncNdBG4R_RK8NpErJGHHZfYer11-F6CdqbN6F2anpn8QFY43eSxyjBKrtrBIwdR6vGM0Je9za6rciAbBCUPWE92QhWe-c59YiDjjIhKtFLcQt4zBicmtA5VrfDE4L4v1h-", activeDot: 2 },
    { badge: "RECORDS", title: "Your Medical Records", link: "View your history", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbvKmoDL7-d2kKo7MrZjkESqVJxtp4SL-2SznjGpiWuMVLDK2fhobwJaslrPkJa4-45uzWH5Ad6I1PT8R7cN4dRQ_M6QCD3Bi16-kongo7qpwd6Nd3DxPQwSEAdz6yZFW12U5yYSY0J19So-9WHGZC-bi3rRKCP_9vUjVTdjxMdlGht6RJuOdgjD4WeUx1_b8eYQ1ft6_wpmxuUw_2s4WSd2vJxajSdlDU5DcQ1aq7", activeDot: 3 },
  ];
  const moveRef = useRef<any>(null);
  const moveIndex = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      moveIndex.current = (moveIndex.current + 1) % movingCards.length;
      moveRef.current?.scrollTo({ x: moveIndex.current * (cardWidth + 12), animated: true });
    }, 1800);
    return () => clearInterval(id);
  }, [cardWidth, movingCards.length]);

  const SURFACE = COLORS.bg;
  const ON_SURFACE = COLORS.heading;
  const ON_SURFACE_VARIANT = COLORS.body;
  const PRIMARY = COLORS.primary;
  const SECONDARY_FIXED = COLORS.surfaceAlt;
  const ON_SECONDARY_FIXED = COLORS.heading;
  const ON_SECONDARY_FIXED_VARIANT = COLORS.body;

  return (
    <View className="flex-1" style={{ backgroundColor: SURFACE }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_CONTENT_PADDING }}>
        <View className="px-4 pt-3">
          <Text style={{ color: ON_SURFACE, fontSize: 30, lineHeight: 36, fontWeight: "500", letterSpacing: -0.3, fontFamily: "Newsreader-Medium" }}>
            Welcome back, <Text style={{ fontStyle: "italic", fontWeight: "400", fontFamily: "Newsreader-Italic" }}>{firstName || "there"}.</Text>
          </Text>
        </View>

        {/* Auto-moving care service cards */}
        <View className="mt-4">
          <ScrollView ref={moveRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 12 }}>
            {movingCards.map((c, i) => (
              <View
                key={i}
                className="relative overflow-hidden active:scale-[0.99]"
                style={{ width: cardWidth, backgroundColor: COLORS.surfaceAlt, borderRadius: 28, borderWidth: 1, borderColor: COLORS.border, padding: 20, shadowColor: COLORS.body, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 2 }}
              >
                  <View style={{ width: "62%", paddingRight: 8 }}>
                    {/* Reserve two lines so the banner is the same height on
                        every phone, whether the title wraps or not. */}
                    <Text numberOfLines={2} style={{ color: COLORS.heading, fontSize: 17, fontWeight: "600", lineHeight: 24, minHeight: 48 }}>{c.title}</Text>
                  <View className="flex-row items-center mt-2.5">
                    <Text style={{ color: COLORS.body, fontSize: 13, fontWeight: "500" }}>{c.link}</Text>
                    <Text style={{ color: COLORS.body, fontSize: 13, marginLeft: 2 }}>›</Text>
                  </View>
                  <View className="flex-row items-center pt-4" style={{ gap: 6 }}>
                    {[0,1,2,3,4].map((d) => (
                      <View key={d} style={{ height: 6, width: d === c.activeDot ? 20 : 6, borderRadius: 3, backgroundColor: d === c.activeDot ? COLORS.accent : COLORS.border }} />
                    ))}
                  </View>
                </View>
                <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "40%" }}>
                  <Image source={{ uri: c.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {nextAppt && (
          <Pressable onPress={() => router.push("/(tabs)/appointment" as any)} className="mx-4 mt-3 rounded-2xl p-4 flex-row items-center justify-between active:opacity-90" style={{ backgroundColor: `${SECONDARY_FIXED}80` }}>
            <View className="flex-row items-center gap-3 min-w-0 flex-1">
              <View className="w-10 h-10 rounded-full items-center justify-center shrink-0" style={{ backgroundColor: COLORS.surface }}>
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

        <View className="px-4 mt-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: ON_SURFACE, fontSize: 18, fontWeight: "600", fontFamily: "Newsreader-SemiBold" }}>Care Services</Text>
            <Text style={{ color: ON_SURFACE_VARIANT, fontSize: 11, fontWeight: "500", fontFamily: "PlusJakartaSans-Medium" }}>{cards.length} curated hubs</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
            {cards.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push(c.href as any)}
                className="rounded-2xl overflow-hidden active:scale-[0.99]"
                style={{ width: serviceCardWidth, backgroundColor: COLORS.surface, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 }}
              >
                <View className="relative w-full overflow-hidden" style={{ height: serviceCardImageHeight, backgroundColor: COLORS.surfaceAlt }}>
                  <Image source={typeof c.image === "number" ? c.image : { uri: c.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  {c.badge && (
                    <View className="absolute top-3 left-3 px-3 py-1 rounded-full" style={{ backgroundColor: COLORS.scrimOnImage }}>
                      <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: "600", fontFamily: "PlusJakartaSans-SemiBold" }}>{c.badge}</Text>
                    </View>
                  )}
                  <View className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: COLORS.scrimOnImage }}>
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
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
}
