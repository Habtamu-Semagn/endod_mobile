import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../../lib/api";
import { useI18n, type TranslationKey } from "../../lib/i18n";
import { AppHeader } from "../../components/AppHeader";
import { RowBones } from "../../components/skeleton";

type BillItem = { category: string; name: string; code?: string; amount: number; quantity: number };

type Bill = {
  id: string;
  hospital_name: string | null;
  items: BillItem[];
  subtotal: number;
  service_fee: number;
  total: number;
  currency: string;
  status: "open" | "paid" | "voided";
  paid_at: string | null;
  created_at: string;
};

type Bills = { items: Bill[]; open_total: number; currency: string };

function birr(santim: number): string {
  return (santim / 100).toFixed(2);
}

const STATUS: Record<Bill["status"], { key: TranslationKey; className: string }> = {
  open: { key: "bills.status.open", className: "bg-[#8d706e]/10 text-[#8d706e] border-[#8d706e]/20" },
  paid: { key: "bills.status.paid", className: "bg-[#f6f3ed] text-[#59413f] border-[#e1bfbc]" },
  voided: { key: "bills.status.voided", className: "bg-[#f6f3ed] text-[#59413f] border-[#e1bfbc]" },
};

export default function BillsScreen({ hideTitle = false }: { hideTitle?: boolean }) {
  const { t, locale } = useI18n();
  const [bills, setBills] = useState<Bills | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<Bills>("users/me/bills")
      .then((value) => {
        if (!cancelled) setBills(value);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : t("bills.error.load"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-app" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="w-full gap-6 pb-6">
          <View className="pb-6 border-b border-[#e1bfbc]/80">
            <Text className="text-sm text-[#59413f] mt-1">{t("bills.subtitle")}</Text>
            {bills && bills.open_total > 0 && (
              <View className="mt-3 self-start px-3 py-1.5 rounded-lg bg-[#8d706e]/10 border border-[#8d706e]/20">
                <Text className="text-sm font-semibold text-[#8d706e]">{t("bills.openTotal", { amount: birr(bills.open_total) })}</Text>
              </View>
            )}
          </View>

          {error ? <Text className="text-sm text-[#ba1a1a]">{error}</Text> : null}
          {!bills && !error ? <RowBones /> : null}
          {bills && bills.items.length === 0 ? (
            <Text className="text-sm text-[#59413f]">{t("bills.empty")}</Text>
          ) : null}

          {bills?.items.map((bill) => {
            const status = STATUS[bill.status] ?? STATUS.open;
            const isPaid = bill.status === "paid";
            const isVoided = bill.status === "voided";
            const statusColor = bill.status === "open" ? "text-[#8d706e]" : "text-[#59413f]";
            const statusBg = bill.status === "open" ? "bg-[#8d706e]/10 border-[#8d706e]/20" : "bg-[#f6f3ed] border-[#e1bfbc]";
            return (
              <View key={bill.id} className="bg-white rounded-2xl border border-[#e1bfbc] p-4 gap-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View>
                    <Text className="text-sm font-bold text-[#1c1c18]">{bill.hospital_name ?? t("bills.title")}</Text>
                    <Text className="text-xs text-[#8d706e] mt-0.5">{new Date(bill.created_at).toLocaleDateString(locale)}</Text>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full border ${statusBg}`}>
                    <Text className={`text-xs font-medium ${statusColor}`}>{t(status.key)}</Text>
                  </View>
                </View>
                <View className="mt-3 border-t border-[#f6f3ed]">
                  {bill.items.map((item, index) => (
                    <View key={index} className="flex-row justify-between py-1.5 border-b border-[#f6f3ed]">
                      <Text className="text-sm text-[#59413f]">{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</Text>
                      <Text className="text-sm text-[#59413f] tabular-nums">ETB {birr(item.amount * item.quantity)}</Text>
                    </View>
                  ))}
                </View>
                <View className="mt-3 pt-3 border-t border-[#e1bfbc] gap-1">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-[#59413f]">{t("bills.subtotal")}</Text>
                    <Text className="text-sm text-[#59413f] tabular-nums">ETB {birr(bill.subtotal)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-[#59413f]">{t("bills.fee")}</Text>
                    <Text className="text-sm text-[#59413f] tabular-nums">ETB {birr(bill.service_fee)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm font-bold text-[#1c1c18]">{t("bills.total")}</Text>
                    <Text className="text-sm font-bold text-[#1c1c18] tabular-nums">ETB {birr(bill.total)}</Text>
                  </View>
                </View>
                {bill.status === "open" && (
                  <Text className="mt-3 text-xs text-[#59413f]">{t("bills.payAtHospital", { amount: birr(bill.total) })}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}