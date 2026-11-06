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

export function Select({ value, onValueChange, options, className = "", triggerTextClassName = "text-slate-700", triggerArrowClassName = "text-slate-400", direction = "down" }: SelectProps) {
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
          className="absolute left-0 bg-white rounded-xl border border-slate-200 overflow-visible"
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
                  className={`px-4 py-3 border-b border-slate-100 ${
                    active ? "bg-emerald-50" : ""
                  }`}
                >
                  <Text
                    className={`text-sm text-center ${
                      active ? "text-emerald-700 font-semibold" : "text-slate-700"
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
