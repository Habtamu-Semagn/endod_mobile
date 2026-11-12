import { useCallback, useRef, useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { COLORS } from "../lib/theme";
import { Text } from "./ui/Text";

type Ask = { title: string; message: string };

/**
 * A password prompt that works on Android too (Alert.prompt is iOS only).
 * `ask()` resolves to the typed password, or null when cancelled.
 */
export function usePasswordPrompt() {
  const [request, setRequest] = useState<Ask | null>(null);
  const [value, setValue] = useState("");
  const resolver = useRef<((v: string | null) => void) | null>(null);

  const ask = useCallback((title: string, message: string) => {
    setValue("");
    setRequest({ title, message });
    return new Promise<string | null>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const finish = (result: string | null) => {
    resolver.current?.(result);
    resolver.current = null;
    setRequest(null);
    setValue("");
  };

  const element = (
    <Modal visible={request !== null} transparent animationType="fade" onRequestClose={() => finish(null)}>
      <View style={{ flex: 1, backgroundColor: COLORS.overlay, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <View style={{ width: "100%", maxWidth: 370, backgroundColor: COLORS.surface, borderRadius: 24, padding: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: COLORS.heading, marginBottom: 6 }}>{request?.title}</Text>
          <Text style={{ fontSize: 13, lineHeight: 20, color: COLORS.body, marginBottom: 16 }}>{request?.message}</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            secureTextEntry
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Password"
            placeholder="Password"
            placeholderTextColor={COLORS.body}
            onSubmitEditing={() => value && finish(value)}
            style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.heading, marginBottom: 18 }}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable onPress={() => finish(null)} accessibilityRole="button" style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.accent }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => value && finish(value)} disabled={!value} accessibilityRole="button" style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.heading, alignItems: "center", opacity: value ? 1 : 0.5 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.surface }}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return { ask, element };
}
