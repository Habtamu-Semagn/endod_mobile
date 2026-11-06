import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
};

const VARIANTS: Record<string, string> = {
  primary: "bg-emerald-600 active:bg-emerald-700",
  secondary: "bg-brand-primary active:bg-brand-accent",
  outline: "bg-white border border-slate-300 active:bg-slate-50",
  ghost: "bg-transparent active:bg-slate-100",
};

const TEXT_VARIANTS: Record<string, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-slate-700",
  ghost: "text-slate-600",
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
}: ButtonProps) {
  const height = size === "lg" ? "py-4" : "py-3.5";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${VARIANTS[variant]} ${height} ${fullWidth ? "w-full" : ""} rounded-xl flex-row items-center justify-center gap-2 ${disabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <>
          {icon}
          <Text className={`${TEXT_VARIANTS[variant]} font-semibold text-sm`}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

type CardProps = {
  children: ReactNode;
  className?: string;
  padded?: boolean;
};

export function Card({ children, className = "", padded = true }: CardProps) {
  return (
    <View className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${padded ? "p-4" : ""} ${className}`}>
      {children}
    </View>
  );
}

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full border mr-2 ${
        selected
          ? "bg-emerald-600 border-emerald-600"
          : "bg-white border-slate-200 active:bg-slate-50"
      }`}
    >
      <Text className={`text-xs font-semibold ${selected ? "text-white" : "text-slate-600"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

type BadgeProps = {
  label: string;
  tone?: "emerald" | "rose" | "slate" | "teal" | "blue";
};

const TONES: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
};

export function Badge({ label, tone = "emerald" }: BadgeProps) {
  return (
    <View className={`self-start px-2.5 py-1 rounded-full border ${TONES[tone]}`}>
      <Text className="text-[11px] font-semibold">{label}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 mt-5">
      {children}
    </Text>
  );
}

export function Divider() {
  return <View className="h-px bg-slate-100 my-3" />;
}
