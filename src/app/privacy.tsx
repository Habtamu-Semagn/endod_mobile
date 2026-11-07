import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";

const SECTIONS = [
  { title: "1. Information We Collect", body: "We collect information you provide directly: name, phone number, email, health profile (age, blood type, allergies, emergency contacts), medical records, appointments, and consent preferences. We also collect device and usage data to operate and improve the Service." },
  { title: "2. How We Use Your Information", body: "Your information is used to provide care coordination, manage appointments, maintain your digital health card, enable secure sharing with partner providers you authorize, and comply with legal obligations." },
  { title: "3. Health Data Protection", body: "Health data is treated with heightened protection. It is stored securely with encryption at rest and in transit. Access is restricted to authorized personnel and only shared with partner hospitals or clinics you explicitly select." },
  { title: "4. Data Sharing", body: "We do not sell your personal or health data. We share data only with partner providers you authorize through the app's sharing feature, or as required by law." },
  { title: "5. Data Retention", body: "We retain your data for as long as your account is active or as needed to provide the Service. You may request deletion of your account and associated data at any time by contacting support@endod.health." },
  { title: "6. Your Rights", body: "You have the right to access, correct, or delete your personal data, and to withdraw consent for treatment processing. Withdrawing consent may limit Service functionality." },
  { title: "7. Security", body: "We implement industry-standard security measures including encryption, access controls, and audit logging. No system is 100% secure; we encourage you to protect your credentials." },
  { title: "8. Children's Privacy", body: "The Service is not directed to children under 13. We do not knowingly collect data from children without parental consent." },
  { title: "9. Changes to This Policy", body: "We may update this Privacy Policy periodically. We will notify you of material changes through the app. Continued use constitutes acceptance." },
  { title: "10. Contact", body: "For privacy questions or data requests, contact us at support@endod.health." },
];

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
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {SECTIONS.map((s) => (
          <View key={s.title} className="mb-4">
            <Text className="text-sm font-bold text-[#18242B] mb-1">{s.title}</Text>
            <Text className="text-sm text-brand-muted leading-relaxed">{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
