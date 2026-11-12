import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { View, Pressable, Text, type ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppHeader } from "../../components/AppHeader";
import { useI18n } from "../../lib/i18n";
import { COLORS, TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from "../../lib/theme";

export const unstable_settings = {
  anchor: "index",
};

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const INVERSE_SURFACE = COLORS.accentDeep;
const INVERSE_ON_SURFACE = COLORS.surface;

/** Height of one tab; the dark "active" pill fills it. */
const TAB_ITEM_HEIGHT = 56;
/** Label size; a label too wide for its tab shrinks a little, it is never cut. */
const TAB_LABEL_SIZE = 11;
/** Screens opened from elsewhere in the app that have no tab of their own. */
const HIDDEN_TABS = new Set(["records", "notifications", "bills"]);

const ICONS: Record<string, string[]> = {
  overview: [
    "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  ],
  card: ["M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm0 4h20"],
  live: [
    "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  ],
  booking: ["M12 4v16m8-8H4"],
  appointment: [
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  ],
  queue: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 0 0 7.75",
  ],
  settings: [
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  ],
};

function TabIcon({ name, color }: { name: string; color: ColorValue }) {
  const paths = ICONS[name] ?? [];
  const stroke = typeof color === "string" ? color : COLORS.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={stroke}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

/**
 * The floating tab bar, drawn here instead of by the library.
 *
 * The library's bar sizes its items from the platform, the font and the safe
 * area, so on some phones the labels were squeezed to a dot. Here every tab
 * has a fixed height and an equal share of the width, and the phone's font
 * size setting does not apply, so the bar looks the same on every device.
 */
function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: TabBarProps) {
  const visible = state.routes.filter((route) => !HIDDEN_TABS.has(route.name));
  const activeKey = state.routes[state.index]?.key;
  return (
    <View style={{ backgroundColor: COLORS.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: TAB_BAR_HEIGHT,
          paddingHorizontal: 6,
          marginHorizontal: TAB_BAR_MARGIN,
          marginBottom: TAB_BAR_MARGIN + insets.bottom,
          backgroundColor: COLORS.surface,
          borderRadius: 9999,
          borderWidth: 1,
          borderColor: COLORS.border,
          shadowColor: COLORS.accentDeep,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {visible.map((route) => {
          const focused = route.key === activeKey;
          const { options } = descriptors[route.key];
          const color = focused ? INVERSE_ON_SURFACE : COLORS.muted;
          const label = typeof options.title === "string" ? options.title : route.name;
          const onPress = () => {
            const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              style={{
                flex: 1,
                minWidth: 0,
                height: TAB_ITEM_HEIGHT,
                marginHorizontal: 2,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: focused ? INVERSE_SURFACE : "transparent",
              }}
            >
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                allowFontScaling={false}
                style={{
                  marginTop: 4,
                  paddingHorizontal: 3,
                  fontSize: TAB_LABEL_SIZE,
                  lineHeight: TAB_LABEL_SIZE + 4,
                  fontFamily: "PlusJakartaSans-Medium",
                  color,
                  textAlign: "center",
                  includeFontPadding: false,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <Tabs
        backBehavior="initialRoute"
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          header: () => <AppHeader />,
          headerStyle: { backgroundColor: COLORS.bg },
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="booking"
          options={{
            title: t("tab.short.booking"),
            tabBarAccessibilityLabel: t("tab.booking"),
            tabBarIcon: ({ color }) => <TabIcon name="booking" color={color} />,
          }}
        />
        <Tabs.Screen
          name="card"
          options={{
            title: t("tab.short.card"),
            tabBarAccessibilityLabel: t("tab.card"),
            tabBarIcon: ({ color }) => <TabIcon name="card" color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: t("tab.short.home"),
            tabBarAccessibilityLabel: t("tab.home"),
            tabBarIcon: ({ color }) => <TabIcon name="overview" color={color} />,
          }}
        />
        <Tabs.Screen
          name="appointment"
          options={{
            title: t("tab.short.appointments"),
            tabBarAccessibilityLabel: t("tab.appointments"),
            tabBarIcon: ({ color }) => <TabIcon name="appointment" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t("tab.short.settings"),
            tabBarAccessibilityLabel: t("tab.settings"),
            tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: "Records",
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: t("tab.notifications"),
          }}
        />
        <Tabs.Screen
          name="bills"
          options={{
            title: t("tab.bills"),
          }}
        />
      </Tabs>
    </View>
  );
}
