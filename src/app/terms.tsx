import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";

export default function TermsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-xl font-bold text-[#18242B]">←</Text>
        </Pressable>
        <Text className="text-base font-bold text-slate-900">Terms of Service</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-sm text-brand-muted leading-relaxed">
          Welcome to ENDOD Health. By creating an account, you agree to use the
          service responsibly, provide accurate information, and comply with all
          applicable laws. The service is provided for healthcare coordination
          and personal health record management. We may update these terms from
          time to time; continued use constitutes acceptance. For questions,
          contact support@endod.health.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
