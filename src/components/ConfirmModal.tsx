import { Modal, Pressable, Text, View } from "react-native";

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
          backgroundColor: "rgba(28,28,24,0.45)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 360,
            backgroundColor: "#FCF9F3",
            borderRadius: 20,
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#1C1C18", marginBottom: 8 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: "#59413F", marginBottom: 20 }}>
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
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E1BFBC",
                alignItems: "center",
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#59413F" }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: destructive ? "#AD292F" : "#423238",
                alignItems: "center",
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
                {busy ? "Working…" : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
