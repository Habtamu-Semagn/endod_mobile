import { COLORS, TAB_CONTENT_PADDING } from "../../lib/theme";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Svg, Path } from "react-native-svg";
import { api, ApiError } from "../../lib/api";
import { useI18n, type TranslationKey } from "../../lib/i18n";
import { Text } from "../../components/ui/Text";
import {
  ACTIVE_STATUSES,
  type Appointment,
  appointmentPlace,
  type BookingPaymentCheck,
  CHAPA_CHECKOUT_ORIGIN,
  type PaymentsStatus,
  appointmentTitle,
  departmentLabel,
  formatBirr,
  formatWhen,
  initials,
  localDateTimeToIso,
  safeCheckoutUrl,
  TIME_WINDOWS,
} from "../../lib/appointments/data";
import { RowBones, Skeleton } from "../../components/skeleton";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Select } from "../../components/Select";
import { QueueCard } from "../../components/care-cards";

type Props = {
  highlightTarget: string | null;
  onToast: (title: string, message: string) => void;
  onBook: () => void;
  hideTitle?: boolean;
};

type Tab = "upcoming" | "past" | "cancelled";
type QueueEntry = {
  entry_id: string;
  hospital_id: string;
  hospital_name: string;
  ticket: number;
  status: "waiting" | "called" | "done" | "skipped" | "cancelled";
  ahead: number;
  position: number;
};
type ModalState = { mode: "reschedule"; appointment: Appointment } | null;

function weekdayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) =>
    formatter.format(new Date(2024, 0, 7 + i)),
  );
}

function tabOf(appointment: Appointment, now: number): Tab {
  if (appointment.status === "CANCELLED") return "cancelled";
  const ends = new Date(appointment.scheduled_at).getTime() + (appointment.duration_minutes || 30) * 60_000;
  if (ACTIVE_STATUSES.includes(appointment.status) && ends >= now) return "upcoming";
  return "past";
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function AppointmentScreen({ highlightTarget, onToast = () => {}, onBook = () => {}, hideTitle }: Props) {
  const { t, locale } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<Tab>("upcoming");
  const [typeFilter, setTypeFilter] = useState<"all" | "in_person" | "telehealth">("all");
  const [sortOrder, setSortOrder] = useState<"earliest" | "latest" | "name">("earliest");
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [modal, setModal] = useState<ModalState>(null);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formDate, setFormDate] = useState(() => localDateInput(new Date(Date.now() + 86_400_000)));
  const [formTime, setFormTime] = useState("10:00");
  const [formWindow, setFormWindow] = useState<Appointment["time_window"]>("exact");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [checkoutOrigins, setCheckoutOrigins] = useState<string[]>([CHAPA_CHECKOUT_ORIGIN]);
  const [videoVisits, setVideoVisits] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<PaymentsStatus>("users/me/payments/status")
      .then((status) => {
        if (cancelled) return;
        setCheckoutOrigins(status.checkout_origins);
        setVideoVisits(status.video_visits === true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      setAppointments(await api<Appointment[]>("users/me/appointments", { query: { limit: 200 } }));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : t("appointments.error.load"));
    }
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      const data = await api<{ entries: QueueEntry[] }>("users/me/queue");
      setQueueEntries((data.entries ?? []).filter((e) => e.status === "waiting" || e.status === "called"));
    } catch {
      // keep shown
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void loadQueue();
    const id = setInterval(() => void loadQueue(), 15000);
    return () => clearInterval(id);
  }, [loadQueue]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const followedTarget = useRef<string | null>(null);
  useEffect(() => {
    if (!highlightTarget || followedTarget.current === highlightTarget) return;
    const target = (appointments ?? []).find((a) => `appointment-card-${a.appointment_id}` === highlightTarget);
    if (!target) return;
    followedTarget.current = highlightTarget;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the linked appointment
    setTab(tabOf(target, now));
  }, [appointments, highlightTarget, now]);

  const counts = useMemo(() => {
    const result = { upcoming: 0, past: 0, cancelled: 0 };
    for (const a of appointments ?? []) result[tabOf(a, now)] += 1;
    return result;
  }, [appointments, now]);

  const visible = useMemo(() => {
    const list = (appointments ?? [])
      .filter((a) => tabOf(a, now) === tab)
      .filter((a) => !videoVisits || typeFilter === "all" || a.visit_mode === typeFilter);
    const time = (a: Appointment) => new Date(a.scheduled_at).getTime();
    if (sortOrder === "name") list.sort((a, b) => appointmentTitle(a, t).localeCompare(appointmentTitle(b, t)));
    else if (sortOrder === "latest") list.sort((a, b) => time(b) - time(a));
    else list.sort((a, b) => time(a) - time(b));
    return list;
  }, [appointments, tab, typeFilter, sortOrder, now, videoVisits, t]);

  const upcomingSorted = useMemo(
    () => (appointments ?? [])
      .filter((a) => tabOf(a, now) === "upcoming")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [appointments, now],
  );
  const nextVisit = upcomingSorted[0];
  const nextVideo = upcomingSorted.find((a) => a.visit_mode === "telehealth");

  const busyDays = useMemo(() => {
    const days = new Map<string, Appointment["visit_mode"]>();
    for (const a of appointments ?? []) {
      if (a.status === "CANCELLED") continue;
      days.set(dateKey(new Date(a.scheduled_at)), a.visit_mode);
    }
    return days;
  }, [appointments]);

  const openReschedule = (appointment: Appointment) => {
    const at = new Date(appointment.scheduled_at);
    setFormDate(localDateInput(at));
    setFormTime(`${pad(at.getHours())}:${pad(at.getMinutes())}`);
    setFormWindow(appointment.time_window);
    setModal({ mode: "reschedule", appointment });
    setSuccess("");
    setFormError("");
  };

  const closeModal = () => {
    setModal(null);
    setSuccess("");
  };

  const submit = async () => {
    if (!modal) return;
    const scheduledAt = localDateTimeToIso(formDate, formTime);
    if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
      setFormError(t("appointments.error.future"));
      return;
    }
    setIsSubmitting(true);
    setFormError("");
    try {
      await api(`users/me/appointments/${modal.appointment.appointment_id}/reschedule`, {
        method: "POST",
        body: { scheduled_at: scheduledAt, time_window: formWindow },
      });
      setSuccess(t("appointments.toast.moved"));
      await load();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : t("common.somethingWrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelAppointment = async (appointment: Appointment) => {
    setBusyId(appointment.appointment_id);
    try {
      await api(`users/me/appointments/${appointment.appointment_id}/status`, {
        method: "PATCH",
        body: { status: "CANCELLED" },
      });
      onToast(t("appointments.toast.cancelledTitle"), t("appointments.toast.cancelled", { name: appointmentTitle(appointment, t) }));
      await load();
    } catch (error) {
      onToast(t("appointments.toast.couldNotCancel"), error instanceof ApiError ? error.message : t("common.pleaseTryAgain"));
    } finally {
      setBusyId(null);
      setConfirmCancelId(null);
    }
  };

  const monthLabel = month.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const weekdays = weekdayLabels(locale);
  const leadingBlanks = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const todayKey = dateKey(new Date());

  const card = (a: Appointment) => {
    const id = `appointment-card-${a.appointment_id}`;
    const highlighted = highlightTarget === id;
    const telehealth = a.visit_mode === "telehealth";
    const cancelled = a.status === "CANCELLED";
    const timeWindowLabel = TIME_WINDOWS.find((w) => w.value === a.time_window);
    const hb = a.hospital_booking ?? null;
    const payment = hb?.payment.status ?? null;
    const closed = hb && (hb.state === "rejected" || hb.state === "cancelled" || hb.state === "payment_expired");
    const unpaid = hb?.state === "awaiting_payment";
    const payNow = unpaid ? safeCheckoutUrl(hb!.payment.checkout_url, checkoutOrigins) : null;
    const atHospital = payment === "at_hospital";
    const amount = hb ? formatBirr(hb.total, locale) : "";

    return (
      <View
        key={a.appointment_id}
        className={`bg-white rounded-2xl border p-4 gap-3 ${highlighted ? "border-brand-heading" : "border-brand-border"}`}
      >
        <View className="flex-row items-center gap-4">
          <View className="w-10 h-10 rounded-xl border border-brand-border bg-brand-alt items-center justify-center flex-shrink-0">
            <Text className="text-brand-heading font-bold text-sm">{initials(appointmentTitle(a, t))}</Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-bold text-brand-heading">{appointmentTitle(a, t)}</Text>
            <Text className="text-xs text-brand-body mt-0.5">{appointmentPlace(a, t)}</Text>
            <View className="flex-row flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
              <Text className="text-xs text-brand-body">{formatWhen(a.scheduled_at, locale)}</Text>
              <Text className="text-xs text-brand-body">{telehealth ? t("appointments.virtual") : t("appointments.inPersonTag")}</Text>
              {a.department && <Text className="text-xs text-brand-body">{departmentLabel(a.department, t)}</Text>}
              {a.time_window !== "exact" && timeWindowLabel && (
                <Text className="text-xs text-brand-body">{t("appointments.arriveIn", { window: t(timeWindowLabel.labelKey) })}</Text>
              )}
            </View>
            {hb && (
              <View className="flex-row flex-wrap items-center gap-2 mt-1.5">
                <View
                  className={`rounded px-1.5 py-0.5 ${
                    hb.state === "confirmed" || hb.state === "completed" ? "bg-brand-alt"
                      : closed ? "bg-brand-danger-soft"
                      : unpaid ? "bg-brand-muted/10" : "bg-brand-alt"
                  }`}
                >
                  <Text className={`text-[11px] font-semibold ${
                    hb.state === "confirmed" || hb.state === "completed" ? "text-brand-heading"
                      : closed ? "text-brand-danger"
                      : unpaid ? "text-brand-muted" : "text-brand-body"
                  }`}>
                    {t(`appointments.hospital.${hb.state}` as TranslationKey)}
                  </Text>
                </View>
                <Text className="text-[11px] text-brand-body">
                  {payment === "awaiting_payment"
                    ? t("appointments.payment.awaiting", {
                        amount,
                        time: hb.payment.due_at
                          ? new Date(hb.payment.due_at).toLocaleTimeString(locale, { timeStyle: "short" })
                          : "",
                      })
                    : payment === "refund_pending" ? t("appointments.payment.refundPending", { amount })
                    : payment === "refunded" ? t("appointments.refunded", { amount })
                    : payment === "expired" ? t("appointments.payment.expired")
                    : atHospital
                      ? closed ? t("appointments.payment.atHospitalClosed" as any)
                        : hb.state === "completed" ? t("appointments.payment.atHospitalDone" as any, { amount })
                        : t("appointments.payment.atHospital" as any, { amount })
                    : t("appointments.paid", { amount })}
                </Text>
                {hb.reason && closed && hb.state !== "payment_expired" && (
                  <Text className="text-[11px] text-brand-body">· {hb.reason}</Text>
                )}
              </View>
            )}
            {payNow && tabOf(a, now) === "upcoming" && (
              <Pressable className="mt-2 px-3 py-1.5 rounded-lg bg-brand-accent self-start">
                <Text className="text-white text-xs font-semibold">{t("appointments.payNow")}</Text>
              </Pressable>
            )}
            {videoVisits && hb?.video_ready && tabOf(a, now) === "upcoming" && (
              <Pressable className="mt-2 px-3 py-1.5 rounded-lg bg-brand-accent self-start">
                <Text className="text-white text-xs font-semibold">{t("appointments.joinVideo")}</Text>
              </Pressable>
            )}
            {!hb && telehealth && a.meeting_url && tabOf(a, now) === "upcoming" && (
              <Text className="mt-1 text-xs font-semibold text-brand-heading">{t("appointments.joinVideo")}</Text>
            )}
          </View>
        </View>
        {tabOf(a, now) === "upcoming" ? (
          confirmCancelId === a.appointment_id ? (
            <View className="flex-row items-center gap-2 flex-shrink-0">
              <Text className="text-xs text-brand-body">
                {unpaid ? t("appointments.cancelUnpaid")
                  : hb && !atHospital ? t("appointments.cancelRefund", { amount }) : t("appointments.cancelThis")}
              </Text>
              <Pressable disabled={busyId === a.appointment_id} onPress={() => cancelAppointment(a)} className="px-3 py-1.5 bg-brand-danger rounded-lg">
                <Text className="text-white text-xs font-semibold">{t("appointments.yesCancel")}</Text>
              </Pressable>
              <Pressable onPress={() => setConfirmCancelId(null)} className="px-3 py-1.5 bg-white border border-brand-border rounded-lg">
                <Text className="text-brand-body text-xs font-semibold">{t("appointments.keep")}</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center gap-2 flex-shrink-0">
              {!hb && (
                <Pressable onPress={() => openReschedule(a)} className="px-3.5 py-1.5 bg-white border border-brand-border rounded-lg">
                  <Text className="text-brand-body text-xs font-semibold">{t("appointments.reschedule")}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setConfirmCancelId(a.appointment_id)} className="px-3.5 py-1.5 bg-white border border-brand-danger rounded-lg">
                <Text className="text-brand-danger text-xs font-semibold">{t("appointments.cancel")}</Text>
              </Pressable>
            </View>
          )
        ) : (
          <View className={`px-3 py-1 rounded-lg flex-shrink-0 border ml-auto ${
            cancelled ? "bg-brand-danger-soft border-brand-danger"
              : a.status === "COMPLETED" ? "bg-brand-alt border-brand-border"
              : "bg-brand-alt border-brand-border"
          }`}>
            <Text className={`text-xs font-semibold ${
              cancelled ? "text-brand-danger"
                : a.status === "COMPLETED" ? "text-brand-heading"
                : "text-brand-body"
            }`}>
              {cancelled ? t("appointments.status.cancelled")
                : a.status === "COMPLETED" ? t("appointments.status.completed")
                : a.status === "MISSED" ? t("appointments.status.missed")
                : t("appointments.status.past")}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const typeLabel = (v: string) => v === "all" ? t("appointments.allTypes") : v === "in_person" ? t("appointments.inPerson") : t("appointments.videoTelehealth");

  return (
    <View className="flex-1 bg-brand-bg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_CONTENT_PADDING }}>
        {/* Queue status */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-brand-heading mb-2">{t("appointments.queue.title")}</Text>
          {queueEntries.length === 0 ? (
            <Text className="text-xs text-brand-body">{t("appointments.queue.empty")}</Text>
          ) : (
            queueEntries.map((entry) => (
              <View key={entry.entry_id} className="bg-white rounded-2xl border border-brand-border p-4 mb-2 items-center">
                <Text className="text-5xl font-extrabold text-brand-accent">{entry.position}</Text>
                <Text className="text-sm font-semibold text-brand-heading mt-2">{entry.hospital_name}</Text>
                <Text className="text-xs text-brand-body mt-1">{entry.ahead} {t("appointments.queue.peopleAhead")}</Text>
              </View>
            ))
          )}
        </View>
        <View className="gap-6 pb-6">
          <QueueCard />

          {/* Stat cards */}
          <View className="gap-4">
            <View className="bg-white p-4 rounded-2xl border border-brand-border flex-row items-center gap-3.5">
              <View className="w-12 h-12 rounded-xl bg-brand-alt items-center justify-center flex-shrink-0">
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke={COLORS.heading} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <View>
                <Text className="text-[11px] font-medium text-brand-muted uppercase tracking-wider">{t("appointments.nextAppointment")}</Text>
                <Text className="text-base font-bold text-brand-heading mt-0.5">{nextVisit ? formatWhen(nextVisit.scheduled_at, locale) : t("appointments.noneScheduled")}</Text>
                {nextVisit && <Text className="text-[11px] text-brand-heading font-medium">{appointmentTitle(nextVisit, t)}</Text>}
              </View>
            </View>
            {videoVisits && (
              <View className="bg-white p-4 rounded-2xl border border-brand-border flex-row items-center gap-3.5">
                <View className="w-12 h-12 rounded-xl bg-brand-alt items-center justify-center flex-shrink-0">
                  <Text className="text-brand-heading text-xl">🎥</Text>
                </View>
                <View>
                  <Text className="text-[11px] font-medium text-brand-muted uppercase tracking-wider">{t("appointments.nextVideoVisit")}</Text>
                  <Text className="text-base font-bold text-brand-heading mt-0.5">{nextVideo ? formatWhen(nextVideo.scheduled_at, locale) : t("appointments.noneScheduled")}</Text>
                  {nextVideo && <Text className="text-[11px] text-brand-heading font-medium">{appointmentTitle(nextVideo, t)}</Text>}
                </View>
              </View>
            )}
          </View>

          <View className="gap-6">
            <View className="gap-5">
              {/* Tabs & Filters */}
              <View className="bg-white p-3.5 rounded-2xl border border-brand-border flex-col gap-3" style={{ zIndex: 1000, elevation: 1000 }}>
                <View className="flex-row items-center gap-1 p-1 bg-brand-alt rounded-xl">
                  {([
                    { id: "upcoming" as const, label: t("appointments.tabUpcoming", { count: counts.upcoming }) },
                    { id: "past" as const, label: t("appointments.tabPast", { count: counts.past }) },
                    { id: "cancelled" as const, label: t("appointments.tabCancelled", { count: counts.cancelled }) },
                  ]).map((t2) => (
                    <Pressable
                      key={t2.id}
                      onPress={() => setTab(t2.id)}
                      className={`px-3.5 py-1.5 rounded-lg ${tab === t2.id ? "bg-white" : ""}`}
                    >
                      <Text className={`text-xs ${tab === t2.id ? "font-semibold text-brand-heading" : "font-medium text-brand-body"}`}>{t2.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <View className="flex-row items-center gap-2" style={{ zIndex: 1000, elevation: 1000 }}>
                  {videoVisits && (
                    <Select
                      value={typeFilter === "all" ? t("appointments.allTypes") : typeFilter === "in_person" ? t("appointments.inPerson") : t("appointments.videoTelehealth")}
                      onValueChange={(v) => {
                        if (v === t("appointments.allTypes")) setTypeFilter("all");
                        else if (v === t("appointments.inPerson")) setTypeFilter("in_person");
                        else setTypeFilter("telehealth");
                      }}
                      options={[t("appointments.allTypes"), t("appointments.inPerson"), t("appointments.videoTelehealth")]}
                    />
                  )}
                  <Select
                    value={sortOrder === "earliest" ? t("appointments.sortEarliest") : sortOrder === "latest" ? t("appointments.sortLatest") : t("appointments.sortName")}
                    onValueChange={(v) => {
                      if (v === t("appointments.sortEarliest")) setSortOrder("earliest");
                      else if (v === t("appointments.sortLatest")) setSortOrder("latest");
                      else setSortOrder("name");
                    }}
                    options={[t("appointments.sortEarliest"), t("appointments.sortLatest"), t("appointments.sortName")]}
                  />
                </View>
              </View>

              {loadError ? (
                <Text className="text-xs text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-lg px-3 py-2">{loadError}</Text>
              ) : null}
              <View className="gap-3">
                {!appointments && !loadError && (
                  <Skeleton className="gap-3" label={t("common.loading")}>
                    <RowBones />
                    <RowBones />
                    <RowBones />
                  </Skeleton>
                )}
                {appointments && visible.length === 0 && (
                  <Text className="text-xs text-brand-body bg-white border border-brand-border rounded-2xl p-4">
                    {tab === "upcoming" ? t("appointments.emptyUpcoming")
                      : tab === "past" ? t("appointments.emptyPast") : t("appointments.emptyCancelled")}
                  </Text>
                )}
                {visible.map(card)}
              </View>
            </View>

            {/* Calendar */}
            <View className="gap-5">
              <View className="bg-white rounded-2xl border border-brand-border p-5">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-sm font-bold text-brand-heading">{monthLabel}</Text>
                  <View className="flex-row items-center gap-1">
                    <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-1 rounded-lg">
                      <Text className="text-brand-muted">‹</Text>
                    </Pressable>
                    <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-1 rounded-lg">
                      <Text className="text-brand-muted">›</Text>
                    </Pressable>
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-x-1">
                  {weekdays.map((d) => <Text key={d} className="w-[13%] text-center text-[11px] font-semibold text-brand-muted mb-2">{d}</Text>)}
                </View>
                <View className="flex-row flex-wrap gap-x-1 gap-y-1">
                  {Array.from({ length: leadingBlanks }, (_, i) => <View key={`blank-${i}`} className="w-[13%]" />)}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day));
                    const mode = busyDays.get(key);
                    let cls = "w-[13%] p-2 mb-1 text-center text-xs text-brand-body rounded-lg";
                    if (mode) cls = "w-[13%] p-2 mb-1 text-center text-xs rounded-lg bg-brand-primary text-white font-bold";
                    if (key === todayKey) cls = "w-[13%] p-2 mb-1 text-center text-xs rounded-lg bg-brand-border text-brand-heading font-bold";
                    return <Text key={key} className={cls}>{day}</Text>;
                  })}
                </View>
                <View className="mt-4 pt-3 border-t border-brand-alt flex-row items-center gap-4">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                    <Text className="text-[11px] text-brand-body">{t("appointments.legendInPerson")}</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-brand-border border border-brand-muted" />
                    <Text className="text-[11px] text-brand-body">Today</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Reschedule Modal */}
        {modal && (
          <View className="absolute inset-0 bg-brand-heading/60 items-center justify-center p-4" style={{ zIndex: 2000, elevation: 2000 }}>
            <View className="bg-white rounded-3xl w-full p-6 border border-brand-border max-h-[95%]">
              <View className="flex-row items-center justify-between pb-3 border-b border-brand-alt">
                <View>
                  <Text className="text-base font-bold text-brand-heading">
                    {t("appointments.modal.rescheduleTitle", { name: appointmentTitle(modal.appointment, t) })}
                  </Text>
                  <Text className="text-xs text-brand-body">{t("appointments.modal.chooseNew")}</Text>
                </View>
                <Pressable onPress={closeModal} className="p-1.5 rounded-lg">
                  <Text className="text-brand-muted text-lg">✕</Text>
                </Pressable>
              </View>

              {success ? (
                <View className="mt-4 p-4 rounded-2xl bg-brand-alt border border-brand-border items-center">
                  <Text className="text-sm font-bold text-brand-heading">{t("appointments.modal.moved")}</Text>
                  <Text className="text-xs text-brand-heading mt-1">{success}</Text>
                  <Pressable onPress={closeModal} className="mt-3 px-4 py-1.5 bg-brand-accent rounded-lg">
                    <Text className="text-white text-xs font-semibold">{t("common.done")}</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="mt-4 gap-4">
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-brand-body uppercase tracking-wider mb-1.5">{t("appointments.modal.date")}</Text>
                      <Pressable onPress={() => setShowDatePicker(true)} className="w-full text-xs bg-brand-alt border border-brand-border rounded-xl px-3 py-2">
                        <Text className="text-xs text-brand-heading">{formDate || t("appointments.modal.date")}</Text>
                      </Pressable>
                      {showDatePicker ? (
                        <DateTimePicker
                          value={formDate ? new Date(formDate) : new Date()}
                          mode="date"
                          display="default"
                          onChange={(e, d) => {
                            setShowDatePicker(false);
                            if (d) {
                              const y = d.getFullYear();
                              const m = String(d.getMonth() + 1).padStart(2, "0");
                              const dd = String(d.getDate()).padStart(2, "0");
                              setFormDate(`${y}-${m}-${dd}`);
                            }
                          }}
                        />
                      ) : null}
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-brand-body uppercase tracking-wider mb-1.5">{t("appointments.modal.time")}</Text>
                      <Pressable onPress={() => setShowTimePicker(true)} className="w-full text-xs bg-brand-alt border border-brand-border rounded-xl px-3 py-2">
                        <Text className="text-xs text-brand-heading">{formTime || t("appointments.modal.time")}</Text>
                      </Pressable>
                      {showTimePicker ? (
                        <DateTimePicker
                          value={formTime ? new Date(`2020-01-01T${formTime}:00`) : new Date()}
                          mode="time"
                          display="default"
                          onChange={(e, d) => {
                            setShowTimePicker(false);
                            if (d) {
                              const h = String(d.getHours()).padStart(2, "0");
                              const m = String(d.getMinutes()).padStart(2, "0");
                              setFormTime(`${h}:${m}`);
                            }
                          }}
                        />
                      ) : null}
                    </View>
                  </View>

                  {modal.appointment.visit_mode === "in_person" && (
                    <View style={{ zIndex: 1000, elevation: 1000 }}>
                      <Text className="text-xs font-bold text-brand-body uppercase tracking-wider mb-1.5">{t("appointments.modal.arrivalWindow")}</Text>
                      <Select
                        value={t(TIME_WINDOWS.find((w) => w.value === formWindow)?.labelKey ?? TIME_WINDOWS[0].labelKey)}
                        onValueChange={(v) => {
                          const w = TIME_WINDOWS.find((x) => t(x.labelKey) === v);
                          if (w) setFormWindow(w.value);
                        }}
                        options={TIME_WINDOWS.map((w) => t(w.labelKey))}
                        direction="up"
                      />
                    </View>
                  )}

                  {formError ? (
                    <Text className="text-xs text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-lg px-3 py-2">{formError}</Text>
                  ) : null}

                  <View className="pt-2 flex-row items-center justify-end gap-3">
                    <Pressable onPress={closeModal} className="px-4 py-2 rounded-xl">
                      <Text className="text-xs font-semibold text-brand-body">{t("common.cancel")}</Text>
                    </Pressable>
                    <Pressable onPress={submit} disabled={isSubmitting} className="px-5 py-2 bg-brand-accent rounded-xl">
                      <Text className="text-white text-xs font-bold">{isSubmitting ? t("common.saving") : t("appointments.modal.confirmReschedule")}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
