import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { COLORS } from "../../lib/theme";
import { Text } from "./Text";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "dark" | "outline" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
};

const VARIANTS: Record<string, string> = {
  primary: "bg-brand-primary active:bg-brand-accent",
  secondary: "bg-brand-primary active:bg-brand-accent",
  dark: "bg-brand-accent-deep active:bg-brand-accent",
  outline: "bg-white border border-brand-border active:bg-brand-bg",
  ghost: "bg-transparent active:bg-brand-bg",
};

const TEXT_VARIANTS: Record<string, string> = {
  primary: "text-white",
  secondary: "text-white",
  dark: "text-white",
  outline: "text-brand-heading",
  ghost: "text-brand-muted",
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
        <ActivityIndicator color={COLORS.surface} />
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
    <View className={`bg-white rounded-2xl border border-brand-border shadow-sm ${padded ? "p-4" : ""} ${className}`}>
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
          ? "bg-brand-primary border-brand-primary"
          : "bg-white border-brand-border active:bg-brand-alt"
      }`}
    >
      <Text className={`text-xs font-semibold ${selected ? "text-white" : "text-brand-muted"}`}>
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
  emerald: "bg-brand-success-soft text-brand-success border-brand-success",
  rose: "bg-brand-danger-soft text-brand-danger border-brand-danger",
  slate: "bg-brand-alt text-brand-muted border-brand-border",
  teal: "bg-brand-success-soft text-brand-success border-brand-success",
  blue: "bg-brand-alt text-brand-muted border-brand-border",
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
    <Text className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2 mt-5">
      {children}
    </Text>
  );
}

export function Divider() {
  return <View className="h-px bg-brand-alt my-3" />;
}
