import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useSession } from "../lib/session";
import { COLORS } from "../lib/theme";

export default function Index() {
  const { session } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top", "bottom", "left", "right"]}>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("../../assets/endod_logo.png")}
            style={{ width: 120, height: 120 }}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/login"} />;
}