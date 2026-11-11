import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Pressable, type ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppHeader } from "../../components/AppHeader";
import { useI18n } from "../../lib/i18n";

const SURFACE = "#F5F1EA";
const ON_SURFACE = "#FFFFFF";
const ON_SURFACE_VARIANT = "#756E68";
const INVERSE_SURFACE = "#2D2327";
const INVERSE_ON_SURFACE = "#FFFFFF";
const OUTLINE_VARIANT = "rgba(0,0,0,0.06)";

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
  const stroke = typeof color === "string" ? color : "#64748b";
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

export default function TabsLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1" style={{ backgroundColor: "transparent" }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          header: () => <AppHeader />,
          headerStyle: { backgroundColor: SURFACE },
          tabBarActiveTintColor: INVERSE_ON_SURFACE,
          tabBarInactiveTintColor: ON_SURFACE_VARIANT,
          tabBarActiveBackgroundColor: INVERSE_SURFACE,
          tabBarButton: (props: any) => (
            <Pressable {...props} style={[props.style, { borderRadius: 16, overflow: "hidden", paddingVertical: 10, paddingHorizontal: 12, marginVertical: 4 }]} />
          ),
          tabBarStyle: {
            backgroundColor: SURFACE,
            borderTopWidth: 0,
            paddingVertical: 6,
            paddingHorizontal: 8,
            height: 72,
            marginHorizontal: 16,
            marginBottom: 16 + insets.bottom,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: OUTLINE_VARIANT,
            shadowColor: "#2D1E14",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            fontFamily: "PlusJakartaSans-SemiBold",
            marginTop: 2,
          },
          tabBarItemStyle: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            overflow: "hidden",
            paddingVertical: 0,
            paddingHorizontal: 0,
            marginHorizontal: 0,
          },
        }}
      >
        <Tabs.Screen
          name="booking"
          options={{
            title: t("tab.booking"),
            tabBarIcon: ({ color }) => <TabIcon name="booking" color={color} />,
          }}
        />
        <Tabs.Screen
          name="card"
          options={{
            title: t("tab.card"),
            tabBarIcon: ({ color }) => <TabIcon name="card" color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: t("tab.home"),
            tabBarIcon: ({ color }) => <TabIcon name="overview" color={color} />,
          }}
        />
        <Tabs.Screen
          name="appointment"
          options={{
            title: t("tab.appointments"),
            tabBarIcon: ({ color }) => <TabIcon name="appointment" color={color} />,
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: "Records",
            tabBarItemStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t("tab.settings"),
            tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: t("tab.notifications"),
            tabBarItemStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="bills"
          options={{
            title: t("tab.bills"),
            tabBarItemStyle: { display: "none" },
          }}
        />
      </Tabs>
    </View>
  );
}
