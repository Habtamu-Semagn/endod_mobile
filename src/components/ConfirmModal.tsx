import { Modal, Pressable, View } from "react-native";
import { COLORS } from "../lib/theme";
import { Text } from "./ui/Text";

type Props = {
  visible: boolean;
  busy?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  visible,
  busy = false,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.overlay,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 360,
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: COLORS.heading, marginBottom: 8 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: COLORS.body, marginBottom: 20 }}>
            {message}
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={onClose}
              disabled={busy}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: "center",
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.body }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: destructive ? COLORS.primary : COLORS.accent,
                alignItems: "center",
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.surface }}>
                {busy ? "Working…" : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
