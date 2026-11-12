import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { Text } from "../components/ui/Text";

const SECTIONS = [
  { title: "1. Acceptance of Terms", body: "By creating an account or using the ENDOD Health mobile application (\"Service\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree, do not use the Service." },
  { title: "2. Description of Service", body: "ENDOD Health provides healthcare coordination tools, including appointment booking, medical records management, digital health cards, and secure sharing of health information with partner hospitals and clinics. The Service is not a substitute for professional medical advice, diagnosis, or treatment." },
  { title: "3. User Accounts", body: "You must provide accurate, current, and complete information when creating an account. You are responsible for safeguarding your credentials and for all activity under your account. Notify us immediately of any unauthorized use." },
  { title: "4. Health Data", body: "You consent to the collection and processing of your health information (including medical records, appointments, and health profile data) for the purpose of providing care coordination. Health data is stored securely and shared only with partner providers you explicitly authorize." },
  { title: "5. Acceptable Use", body: "You agree not to misuse the Service, attempt to access other users' data, reverse engineer the application, or use it for any unlawful purpose. We reserve the right to suspend or terminate accounts that violate these Terms." },
  { title: "6. Intellectual Property", body: "All content, trademarks, and software in the Service are owned by ENDOD Health or its licensors. You may not copy, modify, or distribute any part of the Service without prior written consent." },
  { title: "7. Disclaimer of Warranties", body: "The Service is provided \"as is\" without warranties of any kind. We do not guarantee uninterrupted or error-free operation. Medical decisions should always be made with qualified healthcare professionals." },
  { title: "8. Limitation of Liability", body: "To the maximum extent permitted by law, ENDOD Health shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service." },
  { title: "9. Changes to Terms", body: "We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms. We will notify users of material changes through the app." },
  { title: "10. Contact", body: "For questions about these Terms, contact us at support@endod.health." },
];

export default function TermsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <View className="bg-white border-b border-brand-border px-4 py-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-xl font-bold text-brand-heading">←</Text>
        </Pressable>
        <Text className="text-base font-bold text-brand-heading">Terms of Service</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {SECTIONS.map((s) => (
          <View key={s.title} className="mb-4">
            <Text className="text-sm font-bold text-brand-heading mb-1">{s.title}</Text>
            <Text className="text-sm text-brand-muted leading-relaxed">{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
