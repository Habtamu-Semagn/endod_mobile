import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Svg, Path } from "react-native-svg";
import { api, ApiError } from "../../lib/api";
import { useI18n, type TranslationKey } from "../../lib/i18n";
import { Bone, RowBones, Skeleton } from "../../components/skeleton";
import { router } from "expo-router";

type Category = "appointments" | "records" | "messages" | "security";

type InboxItem = {
  id: string;
  category: Category;
  kind: string;
  title: string;
  body: string | null;
  link: { screen: string; id: string | null } | null;
  created_at: string;
  read: boolean;
};

type InboxPage = {
  items: InboxItem[];
  next_cursor: string | null;
  unread_count: number;
  unread_by_category: Record<Category, number>;
};

type Props = {
  onOpen: (nav: string, target: string | null) => void;
  onToast: (title: string, message: string) => void;
  hideTitle?: boolean;
};

const CATEGORIES: {
  id: Category;
  titleKey: TranslationKey;
  labelKey: TranslationKey;
  iconPath: string;
  iconWrap: string;
  iconColor: string;
}[] = [
  {
    id: "appointments", titleKey: "notifications.cat.appointments.title", labelKey: "notifications.cat.appointments.label",
    iconPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    iconWrap: "bg-[#F4F7F7] border border-[#F4F7F7]", iconColor: "text-[#25343D]",
  },
  {
    id: "records", titleKey: "notifications.cat.records.title", labelKey: "notifications.cat.records.label",
    iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    iconWrap: "bg-[#F4F7F7] border border-[#F4F7F7]", iconColor: "text-[#25343D]",
  },
  {
    id: "messages", titleKey: "notifications.cat.messages.title", labelKey: "notifications.cat.messages.label",
    iconPath: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    iconWrap: "bg-[#E8F0F8] border border-[#E8F0F8]", iconColor: "text-[#2463A6]",
  },
  {
    id: "security", titleKey: "notifications.cat.security.title", labelKey: "notifications.cat.security.label",
    iconPath: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    iconWrap: "bg-[#B7791F]/10 border border-[#B7791F]/20", iconColor: "text-[#B7791F]",
  },
];

function destination(item: InboxItem): { nav: string; target: string | null } | null {
  if (item.link?.screen === "appointment") {
    return { nav: "appointment", target: item.link.id ? `appointment-card-${item.link.id}` : null };
  }
  if (item.link?.screen === "record" || item.link?.screen === "history") {
    return { nav: "followup", target: item.link.id ? `record-${item.link.id}` : null };
  }
  if (item.link?.screen === "bills") {
    return { nav: "bills", target: null };
  }
  if (item.link?.screen === "follow_up") {
    return { nav: "followup", target: item.link.id ? `follow-up-${item.link.id}` : null };
  }
  return null;
}

function timeAgo(iso: string, locale: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3600) return `${Math.round(abs / 60)}m`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h`;
  return `${Math.round(abs / 86400)}d`;
}

export default function NotificationsScreen({ onOpen = (nav: string) => {
  if (nav === "appointment") router.push("/(tabs)/appointment");
  else if (nav === "bills") router.push("/(tabs)/bills");
  else if (nav === "followup") router.push("/(tabs)/records");
}, onToast = () => {}, hideTitle }: Props) {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unread, setUnread] = useState<{ total: number; byCategory: Partial<Record<Category, number>> }>({ total: 0, byCategory: {} });
  const [loadError, setLoadError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const generation = useRef(0);

  const load = useCallback(async (cursor?: string) => {
    const mine = generation.current;
    if (!cursor) {
      setItems(null);
      setNextCursor(null);
      setLoadError("");
    }
    try {
      const page = await api<InboxPage>("users/me/inbox", {
        query: { category: filter === "all" ? undefined : filter, cursor, limit: 30 },
      });
      if (mine !== generation.current) return;
      setItems((previous) => (cursor && previous ? [...previous, ...page.items] : page.items));
      setNextCursor(page.next_cursor);
      setUnread({ total: page.unread_count, byCategory: page.unread_by_category });
      setLoadError("");
    } catch (error) {
      if (mine !== generation.current) return;
      setLoadError(error instanceof ApiError ? error.message : t("notifications.error.load"));
    }
  }, [filter]);

  useEffect(() => {
    generation.current += 1;
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    await load(nextCursor);
    setLoadingMore(false);
  };

  const markRead = (item: InboxItem) => {
    if (item.read) return;
    setItems((list) => list?.map((n) => (n.id === item.id ? { ...n, read: true } : n)) ?? null);
    setUnread((u) => ({
      total: Math.max(0, u.total - 1),
      byCategory: { ...u.byCategory, [item.category]: Math.max(0, (u.byCategory[item.category] ?? 1) - 1) },
    }));
    api(`users/me/inbox/${item.id}/read`, { method: "POST" }).catch(() => void load());
  };

  const open = (item: InboxItem) => {
    const to = destination(item);
    if (!to) return;
    markRead(item);
    onOpen(to.nav, to.target);
  };

  const dismiss = async (item: InboxItem) => {
    try {
      await api(`users/me/inbox/${item.id}`, { method: "DELETE" });
      setItems((list) => list?.filter((n) => n.id !== item.id) ?? null);
      if (!item.read) {
        setUnread((u) => ({
          total: Math.max(0, u.total - 1),
          byCategory: { ...u.byCategory, [item.category]: Math.max(0, (u.byCategory[item.category] ?? 1) - 1) },
        }));
      }
    } catch (error) {
      onToast(t("notifications.toast.couldNotDismiss"), error instanceof ApiError ? error.message : t("common.pleaseTryAgain"));
    }
  };

  const markAllRead = async () => {
    try {
      await api("users/me/inbox/read-all", {
        method: "POST",
        query: { category: filter === "all" ? undefined : filter },
      });
      await load();
    } catch (error) {
      onToast(t("notifications.toast.couldNotUpdate"), error instanceof ApiError ? error.message : t("common.pleaseTryAgain"));
    }
  };

  const groups = CATEGORIES.filter((c) => filter === "all" || filter === c.id)
    .map((category) => ({ category, entries: (items ?? []).filter((n) => n.category === category.id) }))
    .filter((group) => group.entries.length > 0);

  return (
    <SafeAreaView className="flex-1 bg-app" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="gap-6 pb-6">
          {/* Header */}
          <View className="flex-col gap-4 pb-6 border-b border-[#DCE4E6]">
            <View>
              <View className="flex-row items-center gap-2">
                <View className={`px-2 py-0.5 rounded-full border ${unread.total === 0 ? "bg-[#F4F7F7] border-[#DCE4E6]" : "bg-[#F4F7F7] border-[#DCE4E6]"}`}>
                  <Text className="text-xs font-medium text-[#25343D]">{t("notifications.unreadCount", { count: unread.total })}</Text>
                </View>
              </View>
            </View>
            <Pressable onPress={markAllRead} disabled={unread.total === 0} className="self-start px-3 py-1.5 border border-[#DCE4E6] rounded-lg bg-white">
              <Text className="text-xs font-medium text-[#25343D]">{t("notifications.markAllRead")}</Text>
            </Pressable>
          </View>

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3 pb-2">
              {[{ id: "all" as const, label: t("notifications.all"), count: unread.total }, ...CATEGORIES.map((c) => ({ id: c.id, label: t(c.labelKey), count: unread.byCategory[c.id] ?? 0 }))].map((pill) => (
                <Pressable
                  key={pill.id}
                  onPress={() => setFilter(pill.id)}
                  className={`px-4 py-1.5 rounded-full flex-row items-center gap-1.5 ${filter === pill.id ? "bg-black" : "bg-white border border-[#DCE4E6]"}`}
                >
                  <Text className={`text-sm ${filter === pill.id ? "font-semibold text-white" : "font-medium text-[#25343D]"}`}>{pill.label}{pill.count ? ` (${pill.count})` : ""}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {loadError ? (
            <Text className="text-xs text-[#B42318] bg-[#B42318]/10 border border-[#B42318]/20 rounded-lg px-3 py-2">{loadError}</Text>
          ) : null}
          {!items && !loadError && (
            <Skeleton className="gap-3" label={t("common.loading")}>
              <Bone className="h-3 w-28 rounded" />
              <RowBones />
              <RowBones />
              <RowBones />
            </Skeleton>
          )}
          {items && groups.length === 0 && !loadError && (
            <Text className="text-xs text-[#25343D] bg-white border border-[#DCE4E6] rounded-2xl p-4">{t("notifications.empty")}</Text>
          )}

          {groups.map(({ category, entries }) => (
            <View key={category.id} className="gap-3">
              <View className="flex-row items-center justify-between px-1">
                <View className="flex-row items-center gap-2">
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d={category.iconPath} stroke="#46545B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text className="text-xs font-semibold text-[#25343D] uppercase tracking-wider">{t(category.titleKey)}</Text>
                </View>
                <Text className="text-[11px] font-normal text-[#46545B] lowercase">
                  {t(entries.length === 1 ? "notifications.countOne" : "notifications.countOther", { count: entries.length })}
                </Text>
              </View>

              <View className="gap-2.5">
                {entries.map((n) => {
                  const to = destination(n);
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => open(n)}
                      className="bg-white rounded-xl border border-[#DCE4E6] p-4"
                    >
                      <View className="flex-row items-start gap-3">
                        <View className={`w-9 h-9 rounded-lg items-center justify-center flex-shrink-0 mt-0.5 ${category.iconWrap}`}>
                          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                            <Path d={category.iconPath} stroke={category.iconColor === "text-[#25343D]" ? "#25343D" : category.iconColor === "text-[#2463A6]" ? "#2463A6" : "#B7791F"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        </View>
                        <View className="flex-1 min-w-0">
                          <View className="flex-row items-center justify-between gap-2">
                            <Text className="text-sm font-semibold text-[#18242B]">{n.title}</Text>
                            <View className="flex-row items-center gap-2 flex-shrink-0">
                              <Text className="text-[11px] text-[#46545B]">{timeAgo(n.created_at, locale)}</Text>
                              {!n.read && <View className="w-2 h-2 rounded-full bg-[#25343D]" />}
                            </View>
                          </View>
                          {n.body && <Text className="text-sm text-[#25343D] mt-1.5 leading-relaxed">{n.body}</Text>}
                          <View className="mt-3 pt-3 border-t border-[#F4F7F7] flex-row flex-wrap items-center justify-end gap-2.5">
                            {!n.read && !to && (
                              <Pressable onPress={(e) => { e?.stopPropagation?.(); markRead(n); }} className="px-2.5 py-1 rounded">
                                <Text className="text-xs text-[#25343D]">{t("notifications.markRead")}</Text>
                              </Pressable>
                            )}
                            <Pressable onPress={(e) => { e?.stopPropagation?.(); void dismiss(n); }} className="px-2.5 py-1 rounded">
                              <Text className="text-xs text-[#25343D]">{t("common.dismiss")}</Text>
                            </Pressable>
                            {to && (
                              <View className="px-3 py-1.5 rounded-lg bg-[#F4F7F7] border border-[#DCE4E6]">
                                <Text className="text-xs font-medium text-[#25343D]">{to.nav === "appointment" ? t("notifications.viewInAppointments") : t("notifications.viewRecord")}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {nextCursor && (
            <View className="items-center">
              <Pressable onPress={loadMore} disabled={loadingMore} className="px-4 py-2 border border-[#DCE4E6] rounded-lg bg-white">
                <Text className="text-xs font-semibold text-[#25343D]">{loadingMore ? t("common.loading") : t("notifications.loadMore")}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
