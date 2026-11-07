import { useState, useEffect } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Select } from "./Select";
import { BOOKING_HOSPITALS } from "../lib/data";
import { api } from "../lib/api";

export function AddVisitModal({ onClose, onSaved }: { onClose: () => void; onOpenSettings?: () => void; onSaved?: () => void }) {
  const [hospitals, setHospitals] = useState<string[]>(BOOKING_HOSPITALS.map((h) => h.name));
  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ facilities: any[] }>("users/me/care/facilities");
        const names = (data?.facilities ?? []).map((f: any) => f.name).filter(Boolean);
        if (names.length) setHospitals(names);
      } catch {}
    })();
  }, []);
  const [date, setDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [followUpDays, setFollowUpDays] = useState("");
  const [hospital, setHospital] = useState("");
  const [department, setDepartment] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState("");
  const [note, setNote] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async () => {
    try {
      const occurredAt = new Date(`${date}T00:00:00`).toISOString();
      await api("users/me/records", {
        method: "POST",
        body: {
          occurred_at: occurredAt,
          facility_name: hospital || BOOKING_HOSPITALS[0].name,
          department: department || null,
          diagnosis: diagnosis || null,
          medications: medicines ? medicines.split(",").map((m) => m.trim()).filter(Boolean) : [],
          follow_up_days: followUpDays ? Number(followUpDays) : null,
          follow_up_note: note || null,
        },
      });
      onSaved?.();
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-[#1c1c18]/60 items-center justify-center p-4">
        <View className="bg-white rounded-3xl w-full max-w-lg p-6 border border-[#e1bfbc] max-h-[95%]">
          <View className="flex-row items-center justify-between pb-3 border-b border-[#f6f3ed]">
            <Text className="text-base font-bold text-[#1c1c18]">Add a past visit</Text>
            <Pressable onPress={onClose} className="p-1.5 rounded-lg">
              <Text className="text-[#8d706e] text-lg">✕</Text>
            </Pressable>
          </View>

          <ScrollView className="mt-4" contentContainerStyle={{ gap: 12 }}>
            <View>
              <Text className="text-xs font-bold text-[#59413f] uppercase tracking-wider mb-1.5">Date</Text>
              <Pressable onPress={() => setShowDatePicker(true)} className="w-full text-xs bg-[#f6f3ed] border border-[#e1bfbc] rounded-xl px-3 py-2">
                <Text className="text-xs text-[#1c1c18]">{date}</Text>
              </Pressable>
              {showDatePicker ? (
                <DateTimePicker
                  value={date ? new Date(date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    if (d) {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      setDate(`${y}-${m}-${dd}`);
                    }
                  }}
                />
              ) : null}
            </View>

            <View>
              <Text className="text-xs font-bold text-[#59413f] uppercase tracking-wider mb-1.5">Follow-up in (days)</Text>
              <TextInput
                value={followUpDays}
                onChangeText={setFollowUpDays}
                keyboardType="numeric"
                className="w-full text-xs bg-[#f6f3ed] border border-[#e1bfbc] rounded-xl px-3 py-2 text-[#1c1c18]"
              />
            </View>

            <View style={{ zIndex: 1000, elevation: 1000 }}>
              <Text className="text-xs font-bold text-[#59413f] uppercase tracking-wider mb-1.5">Hospital / Clinic</Text>
              <Select
                value={hospital || hospitals[0]}
                onValueChange={(v) => setHospital(v)}
                options={hospitals}
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-[#59413f] uppercase tracking-wider mb-1.5">Department</Text>
              <TextInput
                value={department}
                onChangeText={setDepartment}
                className="w-full text-xs bg-[#f6f3ed] border border-[#e1bfbc] rounded-xl px-3 py-2 text-[#1c1c18]"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-[#59413f] uppercase tracking-wider mb-1.5">Diagnosis</Text>
              <TextInput
                value={diagnosis}
                onChangeText={setDiagnosis}
                className="w-full text-xs bg-[#f6f3ed] border border-[#e1bfbc] rounded-xl px-3 py-2 text-[#1c1c18]"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-[#59413f] uppercase tracking-wider mb-1.5">Medicines (comma separated)</Text>
              <TextInput
                value={medicines}
                onChangeText={setMedicines}
                className="w-full text-xs bg-[#f6f3ed] border border-[#e1bfbc] rounded-xl px-3 py-2 text-[#1c1c18]"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-[#59413f] uppercase tracking-wider mb-1.5">Follow-up note</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                className="w-full text-xs bg-[#f6f3ed] border border-[#e1bfbc] rounded-xl px-3 py-2 text-[#1c1c18] min-h-[80px]"
              />
            </View>
          </ScrollView>

          <View className="pt-3 mt-3 border-t border-[#f6f3ed] flex-row items-center justify-end gap-3">
            <Pressable onPress={onClose} className="px-4 py-2 rounded-xl border border-[#e1bfbc]">
              <Text className="text-xs font-semibold text-[#59413f]">Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} className="px-5 py-2 bg-[#423238] rounded-xl">
              <Text className="text-white text-xs font-bold">Save visit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ShareModal({ items, onClose, onShared }: { items?: any; onClose: () => void; onShared?: (s: any) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [hospitals, setHospitals] = useState<{ hospital_id: string; name: string }[]>([]);
  const [hospitalId, setHospitalId] = useState("");
  const [shareUntil, setShareUntil] = useState("");
  const [showDate, setShowDate] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ hospitals: any[] }>("users/me/shares/hospitals");
        const list = data?.hospitals ?? [];
        setHospitals(list);
        if (list.length) setHospitalId(list[0].hospital_id);
      } catch {}
    })();
  }, []);

  const hospital = hospitals.find((h) => h.hospital_id === hospitalId)?.name ?? "";

  const list = Array.isArray(items) ? items : [];
  const filtered = list.filter((it: any) => !query || String(it.title ?? "").toLowerCase().includes(query.toLowerCase()));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map((it: any) => it.id)));
  const clearAll = () => setSelected(new Set());

  const handleShare = async () => {
    setError("");
    if (!hospitalId) {
      setError("Please choose a partner hospital.");
      return;
    }
    if (selected.size === 0) {
      setError("Please choose at least one record.");
      return;
    }
    try {
      const result = await api<any>("users/me/shares", {
        method: "POST",
        body: {
          hospital_id: hospitalId,
          record_ids: Array.from(selected),
          expires_at: shareUntil ? new Date(shareUntil).toISOString() : null,
        },
      });
      onShared?.({ hospital_name: hospital, ...result });
    } catch (e: any) {
      setError(e?.message ?? "Sharing failed");
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-[#1c1c18]/60 items-center justify-center p-4">
        <View className="bg-white rounded-3xl w-full max-w-lg p-6 border border-[#e1bfbc] max-h-[95%]">
          <View className="flex-row items-center justify-between pb-3 border-b border-[#f6f3ed]">
            <Text className="text-base font-bold text-[#1c1c18]">Share records with a hospital</Text>
            <Pressable onPress={onClose} className="p-1.5 rounded-lg">
              <Text className="text-[#8d706e] text-lg">✕</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator className="mt-3" contentContainerStyle={{ minWidth: "100%" }}>
            <ScrollView contentContainerStyle={{ gap: 12 }} style={{ maxHeight: 500, minWidth: 360 }}>
            <Text className="text-xs text-[#59413f]">
              Choose records to share with a partner hospital.
            </Text>

            <View className="flex-row items-center justify-between mt-4">
              <Text className="text-xs font-bold text-black">choose records - {selected.size} records</Text>
            </View>

            <View className="flex-row items-center gap-1 mt-0.5">
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search records..."
                className="text-xs bg-[#f6f3ed] border border-[#e1bfbc] rounded-xl px-3 py-2 text-[#1c1c18]"
                style={{ width: 180 }}
              />
              <Pressable onPress={selectAll} className="px-3 py-2 rounded-xl border border-[#e1bfbc]">
                <Text className="text-xs font-semibold text-[#59413f]">Select all</Text>
              </Pressable>
              <Pressable onPress={clearAll} className="px-3 py-2 rounded-xl border border-[#e1bfbc]">
                <Text className="text-xs font-semibold text-[#59413f]">Clear</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
              {filtered.map((it: any) => (
                <Pressable
                  key={it.id}
                  onPress={() => toggle(it.id)}
                  className="flex-row items-start gap-3 py-2 border-b border-[#f6f3ed]"
                >
                  <View className={`w-5 h-5 rounded border items-center justify-center ${selected.has(it.id) ? "bg-black border-black" : "border-[#e1bfbc]"}`}>
                    {selected.has(it.id) ? <Text className="text-white text-xs">✓</Text> : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-[#1c1c18]">{it.title}</Text>
                    <Text className="text-xs text-[#59413f] mt-0.5">
                      {it.occurred_at ? new Date(it.occurred_at).toLocaleDateString() : ""} · {it.kind === "self" ? "Self-reported" : "Verified"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <View className="mt-4">
              <Text className="text-xs font-bold text-[#59413f] uppercase tracking-wider mb-1.5">Choose partner hospital</Text>
              {hospitals.length === 0 ? (
                <Text className="text-xs text-rose-500">No partner hospitals available.</Text>
              ) : (
                <Select
                  value={hospital}
                  onValueChange={(v) => {
                    const h = hospitals.find((x) => x.name === v);
                    if (h) setHospitalId(h.hospital_id);
                  }}
                  options={hospitals.map((h) => h.name)}
                />
              )}
            </View>

            {error ? <Text className="text-xs text-rose-500 mt-2">{error}</Text> : null}

            <View className="mt-4">
              <Text className="text-xs font-bold text-[#59413f] uppercase tracking-wider mb-1.5">Share until (optional)</Text>
              <Pressable onPress={() => setShowDate(true)} className="text-xs bg-[#f6f3ed] border border-[#e1bfbc] rounded-xl px-3 py-2" style={{ width: 180 }}>
                <Text className="text-xs text-[#1c1c18]">{shareUntil || "Select date"}</Text>
              </Pressable>
              {showDate ? (
                <DateTimePicker
                  value={shareUntil ? new Date(shareUntil) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowDate(false);
                    if (d) {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      setShareUntil(`${y}-${m}-${dd}`);
                    }
                  }}
                />
              ) : null}
            </View>
          </ScrollView>
          </ScrollView>

          <View className="pt-3 mt-3 border-t border-[#f6f3ed] flex-row items-center justify-end gap-3">
            <Pressable onPress={onClose} className="px-4 py-2 rounded-xl border border-[#e1bfbc]">
              <Text className="text-xs font-semibold text-[#59413f]">Cancel</Text>
            </Pressable>
            <Pressable onPress={handleShare} className="px-5 py-2 bg-[#423238] rounded-xl">
              <Text className="text-white text-xs font-bold">Share</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function SharesList({ shares, onChanged, onToast }: { shares: any; onChanged?: () => void; onToast?: (t: string, m: string) => void }) {
  return null;
}
