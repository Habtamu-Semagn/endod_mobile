import { useEffect, useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";

const PASSKEY_IMAGES = [
  require("../../assets/images/passkey_1.png"),
  require("../../assets/images/passkey_2.png"),
  require("../../assets/images/passkey_3.png"),
  require("../../assets/images/passkey_4.png"),
];

type Props = {
  visible: boolean;
  busy?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function PasskeyModal({
  visible,
  busy = false,
  title = "Add a passkey",
  description = "Use your fingerprint, face, or device PIN to sign in faster and more securely. Your passkey stays on this device.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onClose,
  onConfirm,
}: Props) {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageIndex(0);
    const id = setInterval(() => {
      setImageIndex((i) => (i + 1) % PASSKEY_IMAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, [visible]);

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
          backgroundColor: "rgba(58,59,60,0.25)",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 370,
            backgroundColor: "#ffffff",
            borderRadius: 28,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.12,
            shadowRadius: 45,
            elevation: 12,
          }}
        >
          <View style={{ width: "100%", overflow: "hidden", backgroundColor: "#eaf4f1" }}>
            <Image
              source={PASSKEY_IMAGES[imageIndex]}
              style={{ width: "100%", height: 176 }}
              resizeMode="cover"
            />
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 24, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: "#1F2124",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: 13.5,
                lineHeight: 20,
                color: "#6E7179",
                textAlign: "center",
                paddingHorizontal: 4,
                marginBottom: 24,
              }}
            >
              {description}
            </Text>

            <View style={{ width: "100%", flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={onClose}
                disabled={busy}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: "#E1E3E8",
                  alignItems: "center",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#383A42" }}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                disabled={busy}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: "#1F2124",
                  alignItems: "center",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}>
                  {busy ? "Working…" : confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
