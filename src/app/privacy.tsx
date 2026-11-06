import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-xl font-bold text-[#18242B]">←</Text>
        </Pressable>
        <Text className="text-base font-bold text-slate-900">Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-sm text-brand-muted leading-relaxed">
          ENDOD Health respects your privacy. We collect only the information
          needed to provide care coordination and store your health records
          securely. Your data is never sold. You may request deletion of your
          account and associated data at any time by contacting support. By
          using the service you consent to this policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
