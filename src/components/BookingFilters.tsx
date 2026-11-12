import { Pressable, ScrollView, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { COLORS } from "../lib/theme";
import { Text } from "./ui/Text";

type Option<T extends string> = { value: T; label: string };

type Props<O extends string, S extends string> = {
  query: string;
  onQuery: (value: string) => void;
  placeholder: string;
  clearLabel: string;
  /** Specialty chips; the first is "all". */
  specialties: Option<string>[];
  specialty: string;
  onSpecialty: (value: string) => void;
  ownership: Option<O>[];
  ownershipValue: O;
  onOwnership: (value: O) => void;
  sorts: Option<S>[];
  sort: S;
  onSort: (value: S) => void;
};

/**
 * The hospital search on the booking screen: a search pill, one row of
 * specialty chips and two small segmented switches (public/private and the
 * order). Everything is one tap, no drop-down, and it looks the same on every
 * phone: the chips scroll sideways instead of wrapping.
 */
export function BookingFilters<O extends string, S extends string>(props: Props<O, S>) {
  return (
    <View style={{ marginBottom: 12, gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 48,
          paddingLeft: 16,
          paddingRight: 6,
          borderRadius: 24,
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke={COLORS.muted} strokeWidth={2} />
          <Path d="M20 20l-3.5-3.5" stroke={COLORS.muted} strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <TextInput
          value={props.query}
          onChangeText={props.onQuery}
          placeholder={props.placeholder}
          placeholderTextColor={COLORS.muted}
          returnKeyType="search"
          autoCorrect={false}
          style={{ flex: 1, marginLeft: 10, paddingVertical: 0, fontSize: 14, color: COLORS.heading, fontFamily: "PlusJakartaSans" }}
        />
        {props.query ? (
          <Pressable
            onPress={() => props.onQuery("")}
            accessibilityRole="button"
            accessibilityLabel={props.clearLabel}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M6 6l12 12M18 6L6 18" stroke={COLORS.body} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 4 }}
        keyboardShouldPersistTaps="handled"
      >
        {props.specialties.map((option) => {
          const selected = option.value === props.specialty;
          return (
            <Pressable
              key={option.value || "all"}
              onPress={() => props.onSpecialty(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{
                height: 36,
                paddingHorizontal: 14,
                borderRadius: 18,
                justifyContent: "center",
                backgroundColor: selected ? COLORS.accentDeep : COLORS.surface,
                borderWidth: 1,
                borderColor: selected ? COLORS.accentDeep : COLORS.border,
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: "PlusJakartaSans-SemiBold", color: selected ? COLORS.surface : COLORS.body }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Segmented options={props.ownership} value={props.ownershipValue} onChange={props.onOwnership} flex={3} />
        <Segmented options={props.sorts} value={props.sort} onChange={props.onSort} flex={2} />
      </View>
    </View>
  );
}

function Segmented<T extends string>({
  options, value, onChange, flex,
}: { options: Option<T>[]; value: T; onChange: (value: T) => void; flex: number }) {
  return (
    <View
      style={{
        flex,
        flexDirection: "row",
        height: 40,
        padding: 3,
        borderRadius: 20,
        backgroundColor: COLORS.surfaceAlt,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              minWidth: 0,
              borderRadius: 17,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
              backgroundColor: selected ? COLORS.surface : "transparent",
              borderWidth: selected ? 1 : 0,
              borderColor: COLORS.border,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={{ fontSize: 12, fontFamily: selected ? "PlusJakartaSans-SemiBold" : "PlusJakartaSans-Medium", color: selected ? COLORS.heading : COLORS.muted }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
