import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { COLORS } from "../lib/theme";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { Text } from "../components/ui/Text";

export default function RecordsDownloadScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data: any = await api("users/me/history");
        setItems(data?.items ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePrint = async () => {
    setSaving(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 0; }
            body { margin: 0; padding: 24px; font-family: sans-serif; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            .item { margin-bottom: 12px; padding: 12px; border: 1px solid ${COLORS.border}; border-radius: 8px; }
            .title { font-weight: bold; font-size: 14px; }
            .meta { color: ${COLORS.body}; font-size: 12px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <h1>Medical History</h1>
          ${items.map((it: any) => `
            <div class="item">
              <div class="title">${it.title ?? ""}</div>
              <div class="meta">${it.occurred_at ? new Date(it.occurred_at).toLocaleDateString() : ""} · ${it.hospital_name ?? ""} · ${it.kind === "self" ? "Self-reported" : "Verified"}</div>
            </div>
          `).join("")}
        </body>
        </html>
      `;
      const result = await Print.printToFileAsync({ html });
      const pdfUri = result?.uri;
      if (!pdfUri) {
        if (Platform.OS === "web") {
          await Print.printAsync({ html });
          return;
        }
        throw new Error("PDF generation returned no file");
      }

      if (Platform.OS === "android") {
        const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permission.granted) return;
        const response = await fetch(pdfUri);
        if (!response.ok) throw new Error("Could not read generated PDF");
        const blob = await response.blob();
        const base64Pdf = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(",")[1] ?? "");
          reader.onerror = () => reject(new Error("Could not read generated PDF"));
          reader.readAsDataURL(blob);
        });
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(permission.directoryUri, "medical-history.pdf", "application/pdf");
        await FileSystem.writeAsStringAsync(fileUri, base64Pdf, { encoding: FileSystem.EncodingType.Base64 });
      } else if (Platform.OS === "ios") {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(pdfUri, { mimeType: "application/pdf", dialogTitle: "Save medical history PDF" });
        }
      }
    } catch (e) {
      console.error("Print error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-brand-bg">
      <View className="bg-white border-b border-brand-border px-4 py-3 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
          <Text className="text-xl font-bold text-brand-heading">←</Text>
          <Text className="text-sm font-semibold text-brand-body">Back to app</Text>
        </Pressable>
        <Pressable onPress={handlePrint} disabled={saving || loading} className="px-4 py-2 rounded-xl bg-brand-accent">
          <Text className="text-white text-xs font-bold">{saving ? "Saving..." : loading ? "Loading..." : "Print or save as PDF"}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-lg font-bold text-brand-heading mb-4">Medical History</Text>
        {loading ? (
          <Text className="text-sm text-brand-body">Loading...</Text>
        ) : (
          <View className="gap-3">
            {items.map((it: any) => (
              <View key={it.id} className="bg-white rounded-2xl border border-brand-border p-4">
                <Text className="text-sm font-semibold text-brand-heading">{it.title}</Text>
                <Text className="text-xs text-brand-body mt-1">
                  {[it.occurred_at ? new Date(it.occurred_at).toLocaleDateString() : "", it.hospital_name, it.kind === "self" ? "Self-reported" : "Verified"].filter(Boolean).join(" · ")}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}