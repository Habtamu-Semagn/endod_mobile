import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type SelectProps = {
  value: string;
  onValueChange?: (v: string) => void;
  options: string[];
  className?: string;
  triggerTextClassName?: string;
  triggerArrowClassName?: string;
  direction?: "down" | "up";
};

export function Select({ value, onValueChange, options, className = "", triggerTextClassName = "text-[#1c1c18]", triggerArrowClassName = "text-[#8d706e]", direction = "down" }: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className={`relative ${className}`} style={{ zIndex: 1000, elevation: 1000 }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className="flex-row items-center justify-start"
      >
        <Text className={`${triggerTextClassName}`} numberOfLines={1}>
          {value}
        </Text>
        <Text className={`${triggerArrowClassName} ml-2`}>▾</Text>
      </Pressable>

      {open ? (
        <View
          className="absolute left-0 bg-[#fcf9f3] rounded-xl border border-[#e1bfbc] overflow-visible"
          style={direction === "up"
            ? { bottom: "100%", marginBottom: 4, zIndex: 9999, elevation: 9999, minWidth: "100%" }
            : { top: "100%", marginTop: 4, zIndex: 9999, elevation: 9999, minWidth: "100%" }}
        >
          <ScrollView style={{ maxHeight: 240 }}>
            {options.map((opt) => {
              const active = opt === value;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onValueChange?.(opt);
                    setOpen(false);
                  }}
                  className={`px-4 py-3 border-b border-[#e1bfbc] ${
                    active ? "bg-[#f6f3ed]" : ""
                  }`}
                >
                  <Text
                    className={`text-sm text-center ${
                      active ? "text-[#423238] font-semibold" : "text-[#59413f]"
                    }`}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
