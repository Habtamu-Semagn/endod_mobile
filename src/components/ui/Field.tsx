import { useState, type ReactNode } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { COLORS } from "../../lib/theme";
import { Text } from "./Text";

type FieldProps = {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
  editable?: boolean;
  multiline?: boolean;
  error?: string;
  right?: ReactNode;
  autoFocus?: boolean;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType = "default",
  editable = true,
  multiline = false,
  error,
  right,
  autoFocus = false,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="mb-3">
      {label ? (
        <Text className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center bg-brand-inputbg rounded-xl border px-3 ${
          focused ? "border-brand-primary" : error ? "border-brand-danger" : "border-brand-border"
        } ${multiline ? "min-h-[72px] items-start py-2" : "py-0"}`}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.muted}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`flex-1 text-sm text-brand-heading outline-none ${multiline ? "" : "py-3"}`}
        />
        {right}
      </View>
      {error ? <Text className="text-xs text-brand-danger mt-1">{error}</Text> : null}
    </View>
  );
}

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  title: string;
  badge?: string;
  subtitle?: ReactNode;
  children: ReactNode;
};

export function Sheet({ visible, onClose, onDismiss, title, badge = "Booking", subtitle, children }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} onDismiss={onDismiss}>
      <Pressable className="flex-1 bg-brand-heading/50 items-center justify-center p-4" onPress={onClose}>
        <Pressable className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-brand-border max-h-[95%]" onPress={() => {}}>
          <View className="flex-row items-start justify-between pb-4 border-b border-brand-alt">
            <View className="flex-1">
              <Text className="text-[11px] font-semibold text-brand-heading uppercase tracking-wider">{badge}</Text>
              <Text className="text-lg font-bold text-brand-heading mt-0.5">{title}</Text>
              {subtitle ? <View className="mt-1">{subtitle}</View> : null}
            </View>
            <Pressable onPress={onClose} className="p-1 rounded-lg">
              <Text className="text-brand-body text-xl font-bold">✕</Text>
            </Pressable>
          </View>
          <View className="mt-4">{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
