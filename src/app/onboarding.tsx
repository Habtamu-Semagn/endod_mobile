import { useEffect, useRef, useState } from "react";
import { Text } from "../components/ui/Text";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui";
import { useSession } from "../lib/session";
import { api, getAuthToken } from "../lib/api";
import { COLORS } from "../lib/theme";

const LOOKING_FOR = [
  { id: "symptoms", label: "Understand my symptoms", hint: "Talk to Endod AI about how you're feeling" },
  { id: "hospitals", label: "Find the right hospital", hint: "Nearby hospitals with live crowd levels" },
  { id: "appointments", label: "Book an appointment", hint: "Reserve a slot with SMS reminders" },
  { id: "treatment", label: "Follow my treatment plan", hint: "Timelines, doses and remaining counts" },
  { id: "history", label: "Access my medical history", hint: "One record across all hospitals" },
];

const SEX_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

const AGE_RANGES = [
  { value: "1-20", label: "1–20" },
  { value: "21-40", label: "21–40" },
  { value: "41-60", label: "41–60" },
  { value: "61-80", label: "61–80" },
  { value: "81-100", label: "81–100" },
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const STEP_TITLES = [
  "What's your name?",
  "What are you looking for?",
  "What's your sex?",
  "What's your age?",
  "Emergency health card",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useSession();
  const [step, setStep] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [sex, setSex] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [healthConsent, setHealthConsent] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goNext = async () => {
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }
    // Save to backend
    try {
      if (lookingFor.length) {
        await api("users/me/preferences", { method: "PATCH", body: { onboarding_goals: lookingFor } });
      }
      if (healthConsent) {
        await api("users/me/consent", { method: "PATCH", body: { treatment_processing: true } });
        await api("users/me/health-profile", {
          method: "PATCH",
          body: {
            sex,
            age_range: ageRange,
            ...(bloodType ? { blood_type: bloodType } : {}),
            ...(allergies.trim() ? { allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean) } : {}),
            ...(emergencyName.trim() ? { emergency_contact_name: emergencyName.trim() } : {}),
          },
        });
      }
      await api("users/me", {
        method: "PATCH",
        body: {
          first_name: firstName.trim(),
          middle_name: middleName.trim() || null,
          last_name: lastName.trim(),
        },
      });
    } catch (e) {
      // ignore
    }
    completeOnboarding({ firstName, middleName, lastName, lookingFor, sex, ageRange }, getAuthToken());
    router.replace("/(tabs)");
  };

  const toggleLookingFor = (id: string) => {
    setError("");
    const next = lookingFor.includes(id)
      ? lookingFor.filter((x) => x !== id)
      : [...lookingFor, id];
    setLookingFor(next);
  };

  const handleContinue = () => {
    if (step === 0 && (!firstName.trim() || !middleName.trim() || !lastName.trim())) {
      setError("Please enter your first and last name.");
      return;
    }
    if (step === 1 && lookingFor.length === 0) {
      setError("Please select at least one option.");
      return;
    }
    if (step === 2 && !sex) {
      setError("Please select your sex.");
      return;
    }
    if (step === 3 && !ageRange) {
      setError("Please select your age range.");
      return;
    }
    goNext();
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <KeyboardAvoidingView
        enabled={Platform.OS === "ios"}
        behavior="padding"
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, marginTop: Platform.OS === "ios" && keyboardVisible ? -40 : 0 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          className="px-6 pt-4 pb-8"
        >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          {step > 0 ? (
            <Pressable
              onPress={() => setStep((s) => s - 1)}
              className="w-10 h-10 rounded-full bg-white items-center justify-center border border-brand-border"
            >
              <ChevronLeft />
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
          <Text className="text-xs font-semibold text-brand-muted">
            Step {step + 1} of 5
          </Text>
          <View className="w-10" />
        </View>

        {/* Progress */}
        <View className="flex-row gap-1.5 mb-7">
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-brand-primary" : "bg-white"}`}
            />
          ))}
        </View>

        <Text className="text-2xl font-bold text-brand-heading mb-6">{STEP_TITLES[step]}</Text>

        {/* Step 0 — name */}
        {step === 0 ? (
          <View>
            <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="Daniel" />
            <Field label="Middle Name" value={middleName} onChangeText={setMiddleName} placeholder="" />
            <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Everett" />
            {error ? <Text className="text-xs text-brand-danger mb-2">{error}</Text> : null}
            <Button title="Continue" variant="dark" size="lg" onPress={handleContinue} />
          </View>
        ) : null}

        {/* Step 1 — looking for */}
        {step === 1 ? (
          <View>
            {LOOKING_FOR.map((opt) => {
              const selected = lookingFor.includes(opt.id);
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => toggleLookingFor(opt.id)}
                  className={`flex-row items-center gap-3 p-4 rounded-2xl border mb-2.5 ${
                    selected ? "bg-brand-success-soft border-brand-success" : "bg-white border-brand-border"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-md border-2 items-center justify-center ${
                      selected ? "bg-brand-primary border-brand-primary" : "border-brand-border"
                    }`}
                  >
                    {selected ? <Text className="text-white text-xs font-bold">✓</Text> : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-brand-heading">{opt.label}</Text>
                    <Text className="text-xs text-brand-muted mt-0.5">{opt.hint}</Text>
                  </View>
                </Pressable>
              );
            })}
            {error ? <Text className="text-xs text-brand-danger mb-2">{error}</Text> : null}
            <Button title="Continue" variant="dark" size="lg" onPress={handleContinue} />
          </View>
        ) : null}

        {/* Step 2 — sex */}
        {step === 2 ? (
          <View>
            {SEX_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => {
                  setSex(opt);
                  setError("");
                }}
                className={`flex-row items-center gap-3 p-4 rounded-2xl border mb-2.5 ${
                  sex === opt ? "bg-brand-success-soft border-brand-success" : "bg-white border-brand-border"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    sex === opt ? "border-brand-primary" : "border-brand-border"
                  }`}
                >
                  {sex === opt ? <View className="w-2.5 h-2.5 rounded-full bg-brand-primary" /> : null}
                </View>
                <Text className="text-sm font-semibold text-brand-heading">{opt}</Text>
              </Pressable>
            ))}
            <Button title="Continue" variant="dark" size="lg" onPress={goNext} />
          </View>
        ) : null}

        {/* Step 3 — age range */}
        {step === 3 ? (
          <View>
            {AGE_RANGES.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setAgeRange(opt.value);
                  setError("");
                }}
                className={`flex-row items-center gap-3 p-4 rounded-2xl border mb-2.5 ${
                  ageRange === opt.value ? "bg-brand-success-soft border-brand-success" : "bg-white border-brand-border"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    ageRange === opt.value ? "border-brand-primary" : "border-brand-border"
                  }`}
                >
                  {ageRange === opt.value ? (
                    <View className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                  ) : null}
                </View>
                <Text className="text-sm font-semibold text-brand-heading">{opt.label}</Text>
              </Pressable>
            ))}
            <Button title="Continue" variant="dark" size="lg" onPress={goNext} />
          </View>
        ) : null}

        {/* Step 4 — emergency health card */}
        {step === 4 ? (
          <View>
            <Text className="text-xs font-semibold text-brand-muted mb-1.5">Blood type (optional)</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {BLOOD_TYPES.map((bt) => (
                <Pressable
                  key={bt}
                  onPress={() => setBloodType(bt)}
                  className={`px-3 py-2 rounded-xl border ${bloodType === bt ? "bg-brand-success-soft border-brand-success" : "bg-white border-brand-border"}`}
                >
                  <Text className="text-sm font-semibold text-brand-heading">{bt}</Text>
                </Pressable>
              ))}
            </View>

            <Field label="Allergies (comma separated, optional)" value={allergies} onChangeText={setAllergies} placeholder="e.g. penicillin, peanuts" />

            <Field label="Emergency contact name (optional)" value={emergencyName} onChangeText={setEmergencyName} placeholder="Full name" />
            <Field label="Emergency contact phone (optional)" value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="+1 (617) 555-0198" keyboardType="phone-pad" />

            <Pressable onPress={() => setHealthConsent((v) => !v)} className="flex-row items-start gap-2 mb-4">
              <View className={`w-5 h-5 rounded border items-center justify-center ${healthConsent ? "bg-brand-primary border-brand-primary" : "border-brand-border"}`}>
                {healthConsent ? <Text className="text-white text-xs">✓</Text> : null}
              </View>
              <Text className="text-xs text-brand-muted flex-1">
                I consent to storing my health details for emergency care.
              </Text>
            </Pressable>

            <Button title="Finish" variant="dark" size="lg" onPress={goNext} />
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChevronLeft() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={COLORS.body}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
