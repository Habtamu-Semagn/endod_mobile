import { TAB_CONTENT_PADDING } from "../../lib/theme";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { api, ApiError } from "../../lib/api";
import { useI18n, type TranslationKey } from "../../lib/i18n";
import { AppHeader } from "../../components/AppHeader";
import { RowBones } from "../../components/skeleton";
import { Text } from "../../components/ui/Text";

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
  open: { key: "bills.status.open", className: "bg-brand-muted/10 text-brand-muted border-brand-muted/20" },
  paid: { key: "bills.status.paid", className: "bg-brand-alt text-brand-body border-brand-border" },
  voided: { key: "bills.status.voided", className: "bg-brand-alt text-brand-body border-brand-border" },
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
    <View className="flex-1 bg-brand-bg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_CONTENT_PADDING }}>
        <View className="w-full gap-6 pb-6">
          <View className="pb-6 border-b border-brand-border/80">
            <Text className="text-sm text-brand-body mt-1">{t("bills.subtitle")}</Text>
            {bills && bills.open_total > 0 && (
              <View className="mt-3 self-start px-3 py-1.5 rounded-lg bg-brand-muted/10 border border-brand-muted/20">
                <Text className="text-sm font-semibold text-brand-muted">{t("bills.openTotal", { amount: birr(bills.open_total) })}</Text>
              </View>
            )}
          </View>

          {error ? <Text className="text-sm text-brand-danger">{error}</Text> : null}
          {!bills && !error ? <RowBones /> : null}
          {bills && bills.items.length === 0 ? (
            <Text className="text-sm text-brand-body">{t("bills.empty")}</Text>
          ) : null}

          {bills?.items.map((bill) => {
            const status = STATUS[bill.status] ?? STATUS.open;
            const isPaid = bill.status === "paid";
            const isVoided = bill.status === "voided";
            const statusColor = bill.status === "open" ? "text-brand-muted" : "text-brand-body";
            const statusBg = bill.status === "open" ? "bg-brand-muted/10 border-brand-muted/20" : "bg-brand-alt border-brand-border";
            return (
              <View key={bill.id} className="bg-white rounded-2xl border border-brand-border p-4 gap-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View>
                    <Text className="text-sm font-bold text-brand-heading">{bill.hospital_name ?? t("bills.title")}</Text>
                    <Text className="text-xs text-brand-muted mt-0.5">{new Date(bill.created_at).toLocaleDateString(locale)}</Text>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full border ${statusBg}`}>
                    <Text className={`text-xs font-medium ${statusColor}`}>{t(status.key)}</Text>
                  </View>
                </View>
                <View className="mt-3 border-t border-brand-alt">
                  {bill.items.map((item, index) => (
                    <View key={index} className="flex-row justify-between py-1.5 border-b border-brand-alt">
                      <Text className="text-sm text-brand-body">{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</Text>
                      <Text className="text-sm text-brand-body tabular-nums">ETB {birr(item.amount * item.quantity)}</Text>
                    </View>
                  ))}
                </View>
                <View className="mt-3 pt-3 border-t border-brand-border gap-1">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-brand-body">{t("bills.subtotal")}</Text>
                    <Text className="text-sm text-brand-body tabular-nums">ETB {birr(bill.subtotal)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-brand-body">{t("bills.fee")}</Text>
                    <Text className="text-sm text-brand-body tabular-nums">ETB {birr(bill.service_fee)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm font-bold text-brand-heading">{t("bills.total")}</Text>
                    <Text className="text-sm font-bold text-brand-heading tabular-nums">ETB {birr(bill.total)}</Text>
                  </View>
                </View>
                {bill.status === "open" && (
                  <Text className="mt-3 text-xs text-brand-body">{t("bills.payAtHospital", { amount: birr(bill.total) })}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}