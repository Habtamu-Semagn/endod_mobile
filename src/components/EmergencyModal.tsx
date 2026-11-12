import { Linking, Modal, Pressable, ScrollView, View } from "react-native";
import { WebView } from "react-native-webview";
import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { BOOKING_HOSPITALS } from "../lib/data";
import { useFittedHeight } from "../lib/layout";
import { COLORS } from "../lib/theme";
import { Text } from "./ui/Text";

const AMBULANCE = "907";
const NATIONAL = [
  { service: "police", number: "911", label: "Police" },
  { service: "fire", number: "939", label: "Fire" },
];

export function EmergencyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [locating, setLocating] = useState(false);
  // Scale the map and the hospital list to the viewport so the sheet never
  // overflows on shorter screens.
  const mapHeight = useFittedHeight(160, 0.17, 110);
  const listHeight = useFittedHeight(320, 0.3, 150);

  const call = (num: string) => {
    Linking.openURL(`tel:${num.replace(/[^0-9+]/g, "")}`).catch(() => {});
  };
  const directions = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-brand-heading/50" onPress={onClose} />
        <View className="bg-white rounded-t-3xl px-5 pt-4 pb-8 max-h-[92%]">
          <View className="w-10 h-1 rounded-full bg-brand-border self-center mb-4" />
          <View className="flex-row items-start justify-between mb-4">
            <View>
              <Text className="text-xl font-extrabold text-brand-danger">{t("emergency.title")}</Text>
              <Text className="text-xs text-brand-body mt-1">{t("emergency.subtitle")}</Text>
            </View>
            <Pressable onPress={onClose} className="p-2 rounded-lg">
              <Text className="text-brand-body text-lg font-bold">✕</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => call(AMBULANCE)}
            className="flex-row items-center justify-center gap-3 w-full rounded-2xl bg-brand-danger py-4 mb-3"
          >
            <Text className="text-white text-lg font-extrabold">{t("emergency.callAmbulance", { number: AMBULANCE })}</Text>
          </Pressable>

          <View className="flex-row gap-2 mb-4">
            {NATIONAL.map((n) => (
              <Pressable
                key={n.service}
                onPress={() => call(n.number)}
                className="flex-1 rounded-xl border border-brand-border py-2.5 items-center"
              >
                <Text className="text-sm font-semibold text-brand-body">{n.label === "Police" ? t("emergency.police") : t("emergency.fire")} · {n.number}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ height: mapHeight, borderRadius: 16, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: COLORS.border }}>
            {(() => {
              const pts = BOOKING_HOSPITALS.map((h) => ({ id: h.id, name: h.name, lat: h.latitude, lng: h.longitude }));
              const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;padding:0;}</style></head><body><div id="map"></div>
<script>
var map=L.map('map').setView([9.03,38.75],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map);
var pts=${JSON.stringify(pts)};
pts.forEach(function(p){ L.marker([p.lat,p.lng]).addTo(map).bindPopup(p.name); });
</script></body></html>`;
              if (typeof document !== "undefined") {
                return <iframe title="emergency map" srcDoc={html} style={{ width: "100%", height: "100%", border: 0 }} />;
              }
              return <WebView style={{ flex: 1 }} originWhitelist={["*"]} source={{ html }} />;
            })()}
          </View>

          <View style={{ height: listHeight, overflow: "hidden" }}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <Text className="text-sm font-bold text-brand-heading mb-2">{t("emergency.nearby")}</Text>
            {BOOKING_HOSPITALS.map((h) => (
              <View key={h.id} className="rounded-2xl border border-brand-border p-3.5 mb-2">
                <Text className="text-sm font-bold text-brand-heading">{h.name}</Text>
                <Text className="text-xs text-brand-body">
                  {h.tags.slice(0, 3).join(" · ")}
                </Text>
                <View className="flex-row flex-wrap gap-2 mt-3">
                  <Pressable
                    onPress={() => directions(h.latitude, h.longitude)}
                    className="px-3 py-1.5 rounded-lg border border-brand-border"
                  >
                    <Text className="text-xs font-semibold text-brand-body">{t("emergency.directions")}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
      </View>
    </Modal>
  );
}
