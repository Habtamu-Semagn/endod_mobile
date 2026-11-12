import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { COLORS } from "../lib/theme";
import { Text } from "./ui/Text";

type SelectProps = {
  value: string;
  onValueChange?: (v: string) => void;
  options: string[];
  className?: string;
  triggerTextClassName?: string;
  triggerArrowClassName?: string;
  direction?: "down" | "up";
  dialog?: boolean;
};

type Pos = { x: number; y: number; width: number; height: number };

export function Select({ value, onValueChange, options, className = "", triggerTextClassName = "text-brand-heading", triggerArrowClassName = "text-brand-muted", direction = "down", dialog = false }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const triggerRef = useRef<any>(null);

  const longest = options.reduce((m, o) => Math.max(m, o.length), 0);
  const dropdownMinWidth = Math.max(120, longest * 9 + 40);

  const openDropdown = () => {
    if (dialog) {
      setOpen(true);
      return;
    }
    triggerRef.current?.measureInWindow?.((x: number, y: number, width: number, height: number) => {
      setPos({ x, y, width, height });
      setOpen(true);
    });
  };

  const close = () => setOpen(false);

  return (
    <View className={`relative ${className}`} style={{ zIndex: 1000, elevation: 1000 }}>
      <Pressable ref={triggerRef} onPress={openDropdown} className="flex-row items-center justify-start gap-2 border border-brand-border rounded-lg px-3 py-1.5">
        <Text className={`${triggerTextClassName}`} numberOfLines={1}>
          {value}
        </Text>
        <Text className={`${triggerArrowClassName}`}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        {dialog ? (
          <Pressable style={{ flex: 1, backgroundColor: COLORS.overlay, justifyContent: "center", alignItems: "center", padding: 24 }} onPress={close}>
            <Pressable style={{ width: "100%", maxWidth: 360, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" }} onPress={() => {}}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
                {options.map((opt) => {
                  const active = opt === value;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        onValueChange?.(opt);
                        close();
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: COLORS.border,
                        backgroundColor: active ? COLORS.surfaceAlt : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: active ? COLORS.accent : COLORS.body,
                          fontWeight: active ? "600" : "400",
                        }}
                        numberOfLines={1}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        ) : (
          <Pressable style={{ flex: 1 }} onPress={close}>
            {pos ? (
              <View
                style={{
                  position: "absolute",
                  top: pos.y + pos.height + 4,
                  left: pos.x,
                  minWidth: dropdownMinWidth,
                  maxHeight: 240,
                  backgroundColor: COLORS.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  overflow: "hidden",
                  zIndex: 9999,
                  elevation: 9999,
                }}
              >
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 240 }}>
                  {options.map((opt) => {
                    const active = opt === value;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => {
                          onValueChange?.(opt);
                          close();
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: COLORS.border,
                          backgroundColor: active ? COLORS.surfaceAlt : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: active ? COLORS.accent : COLORS.body,
                            fontWeight: active ? "600" : "400",
                          }}
                          numberOfLines={1}
                        >
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
          </Pressable>
        )}
      </Modal>
    </View>
  );
}
