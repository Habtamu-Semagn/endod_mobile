import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
const isWeb = (typeof navigator !== "undefined" && typeof document !== "undefined");
let MapView: any = null;
let Marker: any = null;
if (!isWeb) {
  try {
    const m = require("react-native-maps");
    MapView = m.default;
    Marker = m.Marker;
  } catch {
    MapView = null;
    Marker = null;
  }
}

import {
  BOOKING_HOSPITALS,
  BOOKING_TIMES,
  SPECIALTY_FILTERS,
  type Hospital,
} from "../../lib/data";
import { Button, Card, Chip } from "../../components/ui";
import { Field, Sheet } from "../../components/ui/Field";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Select } from "../../components/Select";
import { useI18n } from "../../lib/i18n";
import { useToast } from "../../components/ui/Toast";
import { useSession } from "../../lib/session";
import * as Location from "expo-location";
import { api } from "../../lib/api";

export default function BookingScreen() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const { session } = useSession();
  const patientId = session ? `${session.firstName} ${session.lastName}`.trim() : "—";

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "private" | "public">("all");
  const [sort, setSort] = useState<"name" | "distance">("name");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>(BOOKING_HOSPITALS);
  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ facilities: any[] }>("users/me/care/facilities");
        const mapped: Hospital[] = (data?.facilities ?? []).map((f: any) => ({
          id: f.id,
          name: f.name,
          initials: (f.name || "").slice(0, 2).toUpperCase(),
          website: f.website ?? "",
          distance: f.distance_km != null ? `${f.distance_km} km` : "",
          wait: "",
          rating: "",
          status: "Open",
          tags: [...(f.departments ?? []), f.ownership === "private" ? "Private" : "Public"],
          iconBg: "bg-[#f6f3ed]",
          iconText: "text-[#1c1c18]",
          latitude: f.latitude,
          longitude: f.longitude,
          location: [f.city, f.country].filter(Boolean).join(", "),
          phone: f.phone ?? "",
        }));
        if (mapped.length) setHospitals(mapped);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {}
    })();
  }, []);

  const [selected, setSelected] = useState<Hospital | null>(null);
  const [booked, setBooked] = useState<Hospital | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [bookingTime, setBookingTime] = useState("10:30");
  const [timeWindow, setTimeWindow] = useState("exact");
  const [bookingDepartment, setBookingDepartment] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitMode, setVisitMode] = useState<"in_person" | "telehealth">("in_person");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const facilities = useMemo(() => {
    let list = hospitals;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((h) => h.name.toLowerCase().includes(q) || h.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (department) {
      list = list.filter((h) => h.tags.includes(department));
    }
    if (ownershipFilter !== "all") {
      list = list.filter((h) => (ownershipFilter === "private" ? h.tags.includes("Private") : !h.tags.includes("Private")));
    }
    if (sort === "distance" && coords) {
      const toRad = (d: number) => (d * Math.PI) / 180;
      list = [...list].sort((a, b) => {
        const dA = a.latitude != null && a.longitude != null
          ? 2 * 6371 * Math.asin(Math.sqrt(Math.sin(toRad(a.latitude - coords.latitude) / 2) ** 2 + Math.cos(toRad(coords.latitude)) * Math.cos(toRad(a.latitude)) * Math.sin(toRad(a.longitude - coords.longitude) / 2) ** 2))
          : Infinity;
        const dB = b.latitude != null && b.longitude != null
          ? 2 * 6371 * Math.asin(Math.sqrt(Math.sin(toRad(b.latitude - coords.latitude) / 2) ** 2 + Math.cos(toRad(coords.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(toRad(b.longitude - coords.longitude) / 2) ** 2))
          : Infinity;
        return dA - dB;
      });
    } else if (sort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [query, department, ownershipFilter, hospitals, sort, coords]);

  const useMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast?.("Location permission denied");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      showToast?.("Could not get your location");
    }
  };

  useEffect(() => {
    if (sort === "distance" && !coords) void useMyLocation();
  }, [sort, coords]);

  const openBooking = (facility: Hospital) => {
    setSelected(facility);
    setBooked(null);
    setFormError("");
    setVisitMode("in_person");
    setBookingDepartment(facility.tags[0] ?? "");
    setBookingOpen(true);
  };

  const closeBooking = () => {
    setBookingOpen(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const confirmBooking = async () => {
    if (!selected) return;
    const scheduledAt = `${bookingDate}T${bookingTime}:00`;
    if (new Date(scheduledAt) <= new Date()) {
      setFormError("Please choose a future time.");
      return;
    }
    setIsSubmitting(true);
    setFormError("");
    try {
      const result = await api<{ appointment: any }>("users/me/appointments", {
        method: "POST",
        body: {
          scheduled_at: new Date(scheduledAt).toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          visit_mode: visitMode,
          facility_id: selected.id,
          department: bookingDepartment || null,
          time_window: timeWindow,
          notes: bookingNote.trim() || null,
        },
      });
      setBooked(result?.appointment ?? selected);
      setSuccessOpen(true);
      setBookingOpen(false);
      setBookingNote("");
    } catch (e: any) {
      setFormError(e?.message ?? "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  };

const center = coords ? `[${coords.latitude},${coords.longitude}]` : "[9.03,38.75]";
const mapHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;padding:0;}</style></head><body><div id="map"></div>
<script>
var map=L.map('map').setView(${center},13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map);
${coords ? `L.circleMarker([${coords.latitude},${coords.longitude}],{color:'#AD292F',radius:8}).addTo(map).bindPopup('You are here');` : ""}
var pts=${JSON.stringify(facilities.map((h) => ({ id: h.id, name: h.name, lat: h.latitude, lng: h.longitude })))};
pts.forEach(function(p){ var m=L.marker([p.lat,p.lng]).addTo(map); m.on('click',function(){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(p.id); }); });
</script></body></html>`;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    const handler = (ev: MessageEvent) => {
      const id = typeof ev.data === "string" ? ev.data : null;
      if (!id) return;
      const h = facilities.find((x) => x.id === id);
      if (h) openBooking(h);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [facilities]);

  return (
    <SafeAreaView className="flex-1 bg-app" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {/* Search */}
        <View className="bg-white p-4 rounded-2xl border border-[#e1bfbc] mb-3" style={{ zIndex: 1000, elevation: 10 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search hospitals, specialty, location…"
            className="w-full px-3 py-2 text-sm rounded-xl border border-[#e1bfbc] text-[#1c1c18]"
            placeholderTextColor="#8d706e"
          />
          <View className="flex-row mt-3 gap-2">
            <View className="flex-1">
              <Select
                value={department === "" ? "All specialties" : department}
                onValueChange={(v) => setDepartment(v === "All specialties" ? "" : v)}
                options={["All specialties", ...SPECIALTY_FILTERS.slice(1)]}
              />
            </View>
            <View className="flex-1">
              <Select
                value={ownershipFilter === "all" ? t("booking.allFacilities") : ownershipFilter === "private" ? t("booking.private") : t("booking.public")}
                onValueChange={(v) => setOwnershipFilter(v === t("booking.allFacilities") ? "all" : v === t("booking.private") ? "private" : "public")}
                options={[t("booking.allFacilities"), t("booking.private"), t("booking.public")]}
              />
            </View>
            <View className="flex-1">
              <Select
                value={sort === "name" ? t("booking.sortName") : t("booking.sortDistance")}
                onValueChange={(v) => setSort(v === t("booking.sortName") ? "name" : "distance")}
                options={[t("booking.sortName"), t("booking.sortDistance")]}
              />
            </View>
          </View>
        </View>

        {/* Map */}
        <Pressable onPress={useMyLocation} className="mb-2 self-end">
          <Text className="text-sm text-brand-primary underline">Use my location</Text>
        </Pressable>
        <View style={{ height: 450, borderRadius: 16, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: "#e1bfbc", zIndex: 0, elevation: 0 }}>
          {typeof document !== "undefined" ? (
            <iframe title="Hospitals map" srcDoc={mapHtml} style={{ width: "100%", height: "100%", border: 0 }} />
          ) : (
            <WebView style={{ flex: 1 }} originWhitelist={["*"]} source={{ html: mapHtml }} onMessage={(e) => { const h = facilities.find((x) => x.id === e.nativeEvent.data); if (h) openBooking(h); }} />
          )}
        </View>

        {/* Hospital Grid */}
        {facilities.length === 0 ? (
          <View className="items-center py-10">
            <Text className="text-sm text-[#8d706e]">{t("booking.noMatch")}</Text>
          </View>
        ) : (
          facilities.map((h) => (
            <Card key={h.id} className="mb-3">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-3 flex-1 min-w-0">
                  <View className="w-10 h-10 rounded-xl bg-[#f6f3ed] border border-[#e1bfbc] items-center justify-center">
                    <Text className="text-[#1c1c18] font-bold text-sm">{h.initials}</Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-bold text-[#1c1c18]">{h.name}</Text>
                    <Text className="text-xs text-[#59413f] mt-0.5">{h.tags.slice(0, 3).join(" · ")}</Text>
                  </View>
                </View>
                <Pressable onPress={() => openBooking(h)} className="px-4 py-2 rounded-xl bg-[#423238]">
                  <Text className="text-white text-xs font-semibold">{t("booking.bookNow")}</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Booking modal */}
      <Sheet visible={bookingOpen} onClose={closeBooking} onDismiss={() => setSelected(null)} title={selected ? selected.name : ""} badge="Hospital Booking" subtitle={selected ? (
        <View className="flex-row items-center gap-3">
          <Text className="text-xs text-[#59413f]">{selected.location}</Text>
          <Text className="text-xs text-[#59413f]">{selected.phone}</Text>
        </View>
      ) : undefined}>
        {selected ? (
          <View>
            <View className="bg-[#f6f3ed] rounded-xl p-3 border border-[#f6f3ed] flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 rounded-full bg-[#f6f3ed] items-center justify-center">
                  <Text className="text-[#1c1c18] text-[10px] font-bold">P</Text>
                </View>
                <Text className="text-xs font-medium text-[#59413f]">{t("booking.patient", { id: patientId })}</Text>
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-xs font-semibold text-[#59413f] mb-1">{t("booking.selectDate")}</Text>
              <Pressable onPress={() => setShowDatePicker(true)} className="bg-[#fcf9f3] rounded-xl border border-[#e1bfbc] px-3.5 py-3">
                <Text className="text-sm text-[#1c1c18]">{bookingDate || t("booking.selectDate")}</Text>
              </Pressable>
              {showDatePicker ? (
                <DateTimePicker
                  value={bookingDate ? new Date(bookingDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    if (d) {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      setBookingDate(`${y}-${m}-${dd}`);
                    }
                  }}
                />
              ) : null}
            </View>

            <View className="mb-3">
              <Text className="text-xs font-semibold text-[#59413f] mb-1">{t("booking.visitTime")}</Text>
              <Pressable onPress={() => setShowTimePicker(true)} className="bg-[#fcf9f3] rounded-xl border border-[#e1bfbc] px-3.5 py-3">
                <Text className="text-sm text-[#1c1c18]">{bookingTime || t("booking.visitTime")}</Text>
              </Pressable>
              {showTimePicker ? (
                <DateTimePicker
                  value={bookingTime ? new Date(`2020-01-01T${bookingTime}:00`) : new Date()}
                  mode="time"
                  display="default"
                  onChange={(e, d) => {
                    setShowTimePicker(false);
                    if (d) {
                      const h = String(d.getHours()).padStart(2, "0");
                      const m = String(d.getMinutes()).padStart(2, "0");
                      setBookingTime(`${h}:${m}`);
                    }
                  }}
                />
              ) : null}
            </View>

            <View className="mb-3" style={{ zIndex: 2000, elevation: 2000 }}>
              <Text className="text-xs font-semibold text-[#59413f] mb-1">{t("booking.arrivalWindow")}</Text>
              <Select
                value={t(`booking.timeWindow.${timeWindow}` as any)}
                onValueChange={(v) => {
                  const key = (["exact", "morning", "afternoon", "evening"] as const).find((k) => t(`booking.timeWindow.${k}` as any) === v);
                  if (key) setTimeWindow(key);
                }}
                options={["exact", "morning", "afternoon", "evening"].map((k) => t(`booking.timeWindow.${k}` as any))}
              />
            </View>

            <View className="mb-4" style={{ zIndex: 1000, elevation: 1000 }}>
              <Text className="text-xs font-semibold text-[#59413f] mb-1">{t("booking.departmentClinic")}</Text>
              <Select
                value={bookingDepartment ? bookingDepartment : t("booking.notSure")}
                onValueChange={(v) => setBookingDepartment(v === t("booking.notSure") ? "" : v)}
                options={[...selected.tags, t("booking.notSure")]}
              />
            </View>

            <Field
              label={t("booking.reasonLabel")}
              value={bookingNote}
              onChangeText={setBookingNote}
              placeholder={t("booking.reasonPlaceholder")}
              multiline
            />

            <Text className="text-[11px] text-[#8d706e] mt-2 mb-4">
              {t("booking.paymentNote")}
            </Text>

            <View className="pt-4 border-t border-[#f6f3ed] flex-row items-center justify-end gap-3">
              {formError ? <Text className="text-xs text-rose-500 flex-1">{formError}</Text> : null}
              <Pressable onPress={closeBooking} className="px-4 py-2 rounded-xl border border-[#e1bfbc]">
                <Text className="text-xs font-semibold text-[#59413f]">{t("common.cancel")}</Text>
              </Pressable>
              <Pressable onPress={confirmBooking} className="px-5 py-2 rounded-xl bg-black active:bg-[#1c1c18]">
                <Text className="text-white text-xs font-semibold">{t("booking.submit")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Sheet>

      {/* Success modal */}
      <Modal visible={successOpen} transparent animationType="none" onRequestClose={() => setSuccessOpen(false)} onDismiss={() => setBooked(null)}>
        <Pressable className="flex-1 bg-[#1c1c18]/60 items-center justify-center p-4" onPress={() => setSuccessOpen(false)}>
          <Pressable className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-[#e1bfbc] items-center" onPress={() => {}}>
            <View className="w-14 h-14 rounded-full bg-[#f6f3ed] items-center justify-center mb-4">
              <Text className="text-[#1c1c18] text-2xl font-bold">✓</Text>
            </View>
            <Text className="text-lg font-bold text-[#1c1c18]">{t("booking.visitBooked")}</Text>
            <Text className="text-xs text-[#59413f] mt-1 text-center">
              {booked ? t("booking.savedAt", { name: booked.name }) : ""}
            </Text>
            <View className="bg-[#f6f3ed] rounded-xl p-4 my-4 w-full border border-[#f6f3ed]">
              <View className="flex-row justify-between mb-2">
                <Text className="text-[#8d706e] text-xs">{t("booking.hospital")}</Text>
                <Text className="font-bold text-[#1c1c18] text-xs text-right">{booked?.name}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[#8d706e] text-xs">{t("booking.reference")}</Text>
                <Text className="font-mono font-bold text-[#1c1c18] text-xs">{(booked?.id ?? "").slice(0, 8).toUpperCase()}</Text>
              </View>
            </View>
            <Pressable onPress={() => setSuccessOpen(false)} className="w-full py-2.5 rounded-xl bg-black active:bg-[#1c1c18]">
              <Text className="text-white font-semibold text-xs text-center">{t("common.done")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
