import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useSession } from "../lib/session";

export default function Index() {
  const { session } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FCF9F3" }} edges={["top", "bottom", "left", "right"]}>
        <View
          style={{
            flex: 1,
            backgroundColor: "#FCF9F3",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("../../assets/endod_logo.png")}
            style={{ width: 120, height: 120 }}
            resizeMode="contain"
          />
          <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 16, gap: 6 }}>
            <Text style={{ fontSize: 32, letterSpacing: -0.5, color: "#1C1C18", fontWeight: "600" }}>
              Endod
            </Text>
            <Text style={{ fontSize: 32, color: "#423238", fontWeight: "600" }}>Health</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/login"} />;
}