import { View, Text } from "react-native";
import type { ReactNode } from "react";

export function Bone({ className = "" }: { className?: string }) {
  return <View className={`bg-slate-200/80 ${className}`} />;
}

export function Skeleton({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <View className={className} data-purpose="skeleton">
      <Text className="sr-only">{label}</Text>
      {children}
    </View>
  );
}

export function FieldBones() {
  return (
    <View className="gap-2">
      <View className="h-3 w-24 rounded bg-slate-200/80" />
      <View className="h-10 w-full rounded-xl bg-slate-200/80" />
    </View>
  );
}

export function RowBones({ className = "" }: { className?: string }) {
  return (
    <View className={`bg-white rounded-2xl border border-slate-200 p-4 flex-row items-center gap-4 ${className}`}>
      <View className="w-10 h-10 rounded-xl bg-slate-200/80 flex-shrink-0" />
      <View className="flex-1 gap-2">
        <View className="h-3.5 w-2/3 rounded bg-slate-200/80" />
        <View className="h-3 w-1/2 rounded bg-slate-200/80" />
      </View>
      <View className="h-8 w-20 rounded-lg bg-slate-200/80 flex-shrink-0" />
    </View>
  );
}
