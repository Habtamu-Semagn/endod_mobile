import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../lib/api";

type QueueEntry = {
  entry_id: string;
  hospital_id: string;
  hospital_name: string;
  ticket: number;
  status: "waiting" | "called" | "done" | "skipped" | "cancelled";
  ahead: number;
  position: number;
};

const POLL_MS = 15000;

export default function QueueScreen() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api<{ entries: QueueEntry[] }>("users/me/queue");
      setEntries((data.entries ?? []).filter((e) => e.status === "waiting" || e.status === "called"));
    } catch {
      // keep shown
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer === null) timer = setInterval(() => void load(), POLL_MS);
    };
    const stop = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first fetch
    void load();
    start();
    return () => stop();
  }, [load]);

  const filtered = entries.filter((e) =>
    e.hospital_name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search hospital"
          className="border border-[#DCE4E6] rounded-xl px-4 py-3 mb-4 text-[#18242B]"
        />
        {filtered.length === 0 ? (
          <Text className="text-4xl font-extrabold text-[#18242B] text-center mt-8">0</Text>
        ) : (
          filtered.map((entry) => (
            <View key={entry.entry_id} className="items-center mt-8 mb-8">
              <Text className="text-6xl font-extrabold text-[#176B65]">{entry.position}</Text>
              <Text className="text-base font-semibold text-[#18242B] mt-4">{entry.hospital_name}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
