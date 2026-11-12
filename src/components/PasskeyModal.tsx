import { useEffect, useState } from "react";
import { Image, Modal, Pressable, View } from "react-native";
import { COLORS } from "../lib/theme";
import { Text } from "./ui/Text";

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
  /** Optional "Don't ask again" link under the buttons. */
  neverLabel?: string;
  onNever?: () => void;
  /** The "all set" state: the description and a single Done button. */
  done?: boolean;
  doneLabel?: string;
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
  neverLabel,
  onNever,
  done = false,
  doneLabel = "Done",
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
          backgroundColor: COLORS.overlay,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 370,
            backgroundColor: COLORS.surface,
            borderRadius: 28,
            overflow: "hidden",
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.12,
            shadowRadius: 45,
            elevation: 12,
          }}
        >
          <View style={{ width: "100%", overflow: "hidden", backgroundColor: COLORS.surfaceAlt }}>
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
                color: COLORS.heading,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: 13,
                lineHeight: 20,
                color: COLORS.body,
                textAlign: "center",
                paddingHorizontal: 4,
                marginBottom: 24,
              }}
            >
              {description}
            </Text>

            {done ? (
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                style={{ width: "100%", paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.heading, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.surface }}>{doneLabel}</Text>
              </Pressable>
            ) : (
            <View style={{ width: "100%", flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={onClose}
                disabled={busy}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: "center",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.accent }}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                disabled={busy}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: COLORS.heading,
                  alignItems: "center",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.surface }}>
                  {busy ? "Working…" : confirmLabel}
                </Text>
              </Pressable>
            </View>
            )}
            {!done && neverLabel && onNever ? (
              <Pressable onPress={onNever} disabled={busy} accessibilityRole="button" style={{ marginTop: 14, padding: 4 }}>
                <Text style={{ fontSize: 12, color: COLORS.body, textDecorationLine: "underline" }}>{neverLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
