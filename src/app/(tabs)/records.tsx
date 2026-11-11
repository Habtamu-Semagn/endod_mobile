import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { Bone, Skeleton } from "../../components/skeleton";
import { QueueCard, FollowUpCards } from "../../components/care-cards";
import {
  type BookingPreset, CATEGORY_LABEL, type HistoryResponse,
  type Share, TABS,
} from "../../lib/records/history-data";
import { AddVisitModal, ShareModal, SharesList } from "../../components/history-modals";
import { MedicalRecordDetailView } from "../../components/medical-record-detail-view";

const ARRIVING_POLL_MS = 10_000;
const ARRIVING_POLL_FOR_MS = 5 * 60_000;

type Props = {
  highlightTarget: string | null;
  onToast: (title: string, message: string) => void;
  onOpenSettings: () => void;
  onBook: (preset: BookingPreset) => void;
  recordId?: string;
  onBack?: () => void;
  onSelectRecord?: (id: string) => void;
  hideTitle?: boolean;
};

export default function RecordsScreen({ highlightTarget, onToast = () => {}, onOpenSettings = () => {}, onBook = () => {}, recordId, onBack, onSelectRecord, hideTitle }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("all");
  const [adding, setAdding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shares, setShares] = useState<Share[] | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<HistoryResponse>("users/me/history"));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : t("history.error.load"));
    }
  }, []);

  const loadShares = useCallback(async () => {
    try {
      setShares((await api<{ shares: Share[] }>("users/me/shares")).shares);
    } catch {
      setShares([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
    void loadShares();
  }, [load, loadShares]);

  const items = useMemo(() => data?.items ?? [], [data]);

  const arriving = useMemo(() => items.some((i: any) => i.files?.some((f: any) => f.state === "arriving")), [items]);
  useEffect(() => {
    if (!arriving) return;
    const until = Date.now() + ARRIVING_POLL_FOR_MS;
    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => { if (timer !== null) clearInterval(timer); timer = null; };
    const tick = () => { if (Date.now() > until) stop(); else void load(); };
    const start = () => { if (timer === null && Date.now() <= until) timer = setInterval(tick, ARRIVING_POLL_MS); };
    const onVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        if (Date.now() <= until) void load();
        start();
      } else {
        stop();
      }
    };
    if (typeof document === "undefined" || document.visibilityState === "visible") start();
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [arriving, load]);

  const shown = useMemo(() => {
    const matches = TABS.find((t: any) => t.id === tab)?.matches ?? (() => true);
    return items.filter(matches as any);
  }, [items, tab]);
  const summary = data?.summary;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { dateStyle: "medium" });

  if (recordId) {
    return (
      <SafeAreaView className="flex-1 bg-app" edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <MedicalRecordDetailView recordId={recordId} onBack={onBack} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="gap-5 pb-6">
          <View className="flex-col gap-3">
            <View>
            </View>
            <View className="flex-row flex-wrap gap-2 self-start">
              <Pressable onPress={() => setAdding(true)} className="px-3.5 py-2 rounded-full bg-[#423238]">
                <Text className="text-white text-xs font-semibold">{t("records.addVisit")}</Text>
              </Pressable>
              <Pressable onPress={() => setSharing(true)} disabled={!items.length} className="px-3.5 py-2 rounded-full border border-[#1c1c18] bg-white">
                <Text className="text-[#1c1c18] text-xs font-semibold">{t("history.share")}</Text>
              </Pressable>
              <Pressable onPress={() => router.push("/records-download")} className="px-3.5 py-2 rounded-full border border-[#e1bfbc] bg-white">
                <Text className="text-[#59413f] text-xs font-semibold">{t("history.download")}</Text>
              </Pressable>
            </View>
          </View>

          <QueueCard />
          <FollowUpCards onBook={onBook} highlight={highlightTarget} />

          {/* Summary */}
          <View className="flex-row flex-wrap gap-3">
            {[
              { id: "stat-total", label: t("history.stat.total"), value: summary?.total },
              { id: "stat-verified", label: t("history.stat.verified"), value: summary?.verified },
              { id: "stat-hospitals", label: t("history.stat.hospitals"), value: summary?.hospitals },
              { id: "stat-self", label: t("history.stat.selfReported"), value: summary?.self_reported },
            ].map((stat) => (
              <View key={stat.id} className="bg-white rounded-2xl border border-[#e1bfbc] p-3.5 flex-1 min-w-[40%]">
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-[#8d706e]">{stat.label}</Text>
                {data ? (
                  <Text className="text-xl font-bold text-[#1c1c18] leading-tight">{stat.value ?? 0}</Text>
                ) : loadError ? (
                  <Text className="text-xl font-bold text-[#e1bfbc] leading-tight">—</Text>
                ) : (
                  <Bone className="h-6 w-12 rounded mt-0.5" />
                )}
              </View>
            ))}
          </View>

          {/* Tabs */}
          <View className="bg-white rounded-2xl border border-[#e1bfbc] p-3 mt-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2.5 px-1">
                {TABS.map((item: any) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setTab(item.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full border ${tab === item.id ? "bg-[#423238] border-[#423238]" : "bg-white border-[#e1bfbc]"}`}
                  >
                    <Text className={`text-sm font-semibold ${tab === item.id ? "text-white" : "text-[#59413f]"}`}>{t(item.labelKey)}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {loadError ? (
            <Text className="text-xs text-[#ba1a1a] bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 rounded-lg px-3 py-2">{loadError}</Text>
          ) : null}

          {/* Records */}
          {!data && !loadError ? (
            <Skeleton className="gap-3" label={t("common.loading")}>
              {[0, 1, 2].map((i) => (
                <View key={i} className="bg-white rounded-2xl border border-[#e1bfbc] p-4 gap-2.5">
                  <Bone className="h-3 w-24 rounded" />
                  <Bone className="h-4 w-2/3 rounded" />
                  <Bone className="h-3 w-1/2 rounded" />
                </View>
              ))}
            </Skeleton>
          ) : data && !items.length ? (
            <Text className="bg-white rounded-2xl border border-dashed border-[#e1bfbc] px-5 py-8 text-sm text-[#59413f] text-center">{t("history.empty")}</Text>
          ) : data && !shown.length ? (
            <Text className="bg-white rounded-2xl border border-dashed border-[#e1bfbc] px-5 py-8 text-sm text-[#59413f] text-center">{t("history.noMatch")}</Text>
          ) : (
            <View className="gap-3">
              {shown.map((item: any) => {
                const target = `record-${item.id}`;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelectRecord?.(item.id)}
                    className={`bg-white rounded-2xl border overflow-hidden p-4 ${highlightTarget === target ? "border-[#8d706e]" : "border-[#e1bfbc]"}`}
                  >
                    <View className="flex-row items-start gap-3">
                      <View className={`w-9 h-9 rounded-xl items-center justify-center flex-shrink-0 ${item.kind === "hospital" ? "bg-[#f6f3ed] border border-[#f6f3ed]" : "bg-[#f6f3ed] border border-[#e1bfbc]"}`}>
                        <Text className="text-[11px] font-bold text-[#59413f]">{t(CATEGORY_LABEL[item.category as keyof typeof CATEGORY_LABEL]).slice(0, 2)}</Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                          <Text className="text-[11px] font-semibold uppercase tracking-wider text-[#8d706e]">{t(CATEGORY_LABEL[item.category as keyof typeof CATEGORY_LABEL])}</Text>
                          <View className={`rounded px-1.5 py-0.5 border ${item.verified ? "bg-[#f6f3ed] border-[#e1bfbc]" : "bg-[#f6f3ed] border-[#e1bfbc]"}`}>
                            <Text className="text-[10px] font-semibold text-[#59413f]">{item.verified ? t("records.verified") : t("records.selfReported")}</Text>
                          </View>
                        </View>
                        <Text className="text-sm font-semibold text-[#1c1c18] mt-0.5">{item.title}</Text>
                        <Text className="text-xs text-[#59413f] mt-0.5">
                          {[formatDate(item.occurred_at), item.hospital_name, item.recorded_by].filter(Boolean).join(" · ")}
                        </Text>
                        {item.files?.length > 0 && (
                          <Text className="text-[11px] text-[#59413f] mt-1">{t(item.files.length === 1 ? "history.filesOne" : "history.filesOther", { count: item.files.length })}</Text>
                        )}
                      </View>
                      <Pressable onPress={(e) => { e?.stopPropagation?.(); onSelectRecord?.(item.id); }} className="mt-1 rounded-lg border border-[#e1bfbc] px-2 py-1">
                        <Text className="text-[11px] font-semibold text-[#59413f]">Open</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <SharesList shares={shares} onChanged={loadShares} onToast={onToast} />
        </View>

        {adding && (
          <AddVisitModal
            onClose={() => setAdding(false)}
            onOpenSettings={onOpenSettings}
            onSaved={async () => {
              setAdding(false);
              onToast(t("records.toast.addedTitle"), t("records.toast.added"));
              await load();
            }}
          />
        )}
        {sharing && (
          <ShareModal
            items={items}
            onClose={() => setSharing(false)}
            onShared={async (share: any) => {
              setSharing(false);
              onToast(t("share.toastTitle"), t("share.toast", { hospital: share.hospital_name }));
              await loadShares();
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
