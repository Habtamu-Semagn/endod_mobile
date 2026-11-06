import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api, ApiError, passwordProblem } from "../../lib/api";
import { useI18n, type TranslationKey } from "../../lib/i18n";
import { Bone, FieldBones, Skeleton } from "../../components/skeleton";
import { Select } from "../../components/Select";
import {
  BLOOD_TYPES, formatPhoneDisplay, invalidateHealthCard, splitAllergies, type ProfileForCard,
} from "../../lib/health-card/health-card-data";

type Profile = ProfileForCard & {
  email: string | null;
  phone_verified: boolean;
  address_line: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country_code: string | null;
  preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    care_search_radius_km: number | null;
  };
  consent: {
    treatment_processing: boolean;
    data_sharing_with_clinicians: boolean;
  };
};

type HealthProfile = {
  blood_type: string | null;
  allergies: string[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
};

type Props = {
  onToast: (title: string, message: string) => void;
  onProfileChange: (profile: ProfileForCard) => void;
  hideTitle?: boolean;
};

const COUNTRIES: { value: string; labelKey: TranslationKey }[] = [
  { value: "ET", labelKey: "settings.country.ET" },
  { value: "KE", labelKey: "settings.country.KE" },
  { value: "DJ", labelKey: "settings.country.DJ" },
  { value: "ER", labelKey: "settings.country.ER" },
  { value: "SO", labelKey: "settings.country.SO" },
  { value: "SD", labelKey: "settings.country.SD" },
  { value: "SS", labelKey: "settings.country.SS" },
  { value: "UG", labelKey: "settings.country.UG" },
  { value: "TZ", labelKey: "settings.country.TZ" },
];
const DEFAULT_RADIUS_KM = 15;
const RADIUS_MIN_KM = 5;
const RADIUS_MAX_KM = 200;

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function strength(password: string): number {
  let score = 0;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_LABEL_KEYS: TranslationKey[] = [
  "settings.password.strength.none",
  "settings.password.strength.weak",
  "settings.password.strength.fair",
  "settings.password.strength.good",
  "settings.password.strength.strong",
];
const STRENGTH_COLORS = ["text-[#46545B]", "text-[#B42318]", "text-[#B7791F]", "text-[#18242B]", "text-[#18242B]"];

export default function SettingsScreen({ onToast, onProfileChange, hideTitle }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneStep, setPhoneStep] = useState<"idle" | "number" | "code">("idle");
  const [newPhone, setNewPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("ET");
  const [radius, setRadius] = useState(15);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [health, setHealth] = useState<HealthProfile | null>(null);
  const [healthError, setHealthError] = useState("");
  const [cardVisible, setCardVisible] = useState(false);
  const [age, setAge] = useState("32");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const applyPersonal = useCallback((p: Profile) => {
    setFirstName(p.first_name ?? "");
    setLastName(p.last_name ?? "");
    setEmail(p.email ?? "");
  }, []);
  const applyLocation = useCallback((p: Profile) => {
    setAddress(p.address_line ?? "");
    setCity(p.city ?? "");
    setRegion(p.region ?? "");
    setPostalCode(p.postal_code ?? "");
    setCountry(p.country_code ?? "ET");
    setRadius(p.preferences?.care_search_radius_km ?? DEFAULT_RADIUS_KM);
  }, []);
  const applyProfile = useCallback((p: Profile) => {
    setProfile(p);
    applyPersonal(p);
    applyLocation(p);
  }, [applyPersonal, applyLocation]);

  const applyHealth = useCallback((h: HealthProfile) => {
    setHealth(h);
    setEmergencyName(h.emergency_contact_name ?? "");
    setEmergencyPhone(h.emergency_contact_phone ?? "");
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      applyHealth(await api<HealthProfile>("users/me/health-profile"));
      setHealthError("");
    } catch (error) {
      setHealth(null);
      setHealthError(error instanceof ApiError && error.status === 403 ? "" : message(error, t("settings.card.loadError")));
    }
  }, [applyHealth, t]);

  useEffect(() => {
    let cancelled = false;
    api<Profile>("users/me")
      .then((p) => {
        if (cancelled) return;
        applyProfile(p);
        if (p.consent?.treatment_processing) void loadHealth();
      })
      .catch((error) => {
        if (!cancelled) setLoadError(message(error, t("settings.error.load")));
      });
    return () => { cancelled = true; };
  }, [applyProfile, loadHealth, t]);

  const saveProfile = async () => {
    setBusy("profile");
    try {
      const updated = await api<Profile>("users/me", {
        method: "PATCH",
        body: { first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim() || null },
      });
      setProfile(updated);
      applyPersonal(updated);
      onProfileChange(updated);
      invalidateHealthCard();
      onToast(t("settings.toast.profileSavedTitle"), t("settings.toast.profileSaved"));
    } catch (error) {
      onToast(t("common.couldNotSave"), message(error, t("settings.toast.checkDetails")));
    } finally {
      setBusy(null);
    }
  };

  const saveLocation = async () => {
    setBusy("location");
    try {
      const updated = await api<Profile>("users/me", {
        method: "PATCH",
        body: {
          address_line: address.trim() || null, city: city.trim() || null, region: region.trim() || null,
          postal_code: postalCode.trim() || null, country_code: country,
        },
      });
      setProfile(updated);
      let radiusSaved = true;
      if (radius !== (updated.preferences.care_search_radius_km ?? DEFAULT_RADIUS_KM)) {
        try {
          await api("users/me/preferences", { method: "PATCH", body: { care_search_radius_km: radius } });
          setProfile({ ...updated, preferences: { ...updated.preferences, care_search_radius_km: radius } });
        } catch {
          radiusSaved = false;
        }
      }
      onToast(
        radiusSaved ? t("settings.toast.locationUpdatedTitle") : t("settings.toast.partlySavedTitle"),
        radiusSaved ? t("settings.toast.locationUpdated") : t("settings.toast.partlySaved"),
      );
    } catch (error) {
      onToast(t("common.couldNotSave"), message(error, t("settings.toast.checkDetails")));
    } finally {
      setBusy(null);
    }
  };

  const sendPhoneCode = async () => {
    setBusy("phone");
    setPhoneError("");
    try {
      setPhoneCode("");
      setPhoneStep("code");
    } catch (error) {
      setPhoneError(message(error, t("settings.toast.sendCodeFailed")));
    } finally {
      setBusy(null);
    }
  };

  const confirmPhone = async () => {
    setBusy("phone");
    setPhoneError("");
    try {
      setPhoneStep("idle");
      onToast(t("settings.toast.phoneVerifiedTitle"), t("settings.toast.phoneVerified"));
    } catch (error) {
      setPhoneError(message(error, t("settings.toast.confirmFailed")));
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async () => {
    const problem = passwordProblem(newPassword);
    if (problem) {
      onToast(t("settings.toast.passwordErrorTitle"), problem);
      return;
    }
    if (newPassword !== confirmPassword) {
      onToast(t("settings.toast.mismatchTitle"), t("settings.toast.mismatch"));
      return;
    }
    setBusy("password");
    try {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onToast(t("settings.toast.passwordUpdatedTitle"), t("settings.toast.passwordUpdated"));
    } catch (error) {
      onToast(t("settings.toast.passwordErrorTitle"), message(error, t("settings.toast.changePasswordFailed")));
    } finally {
      setBusy(null);
    }
  };

  const setConsent = async (field: "treatment_processing" | "data_sharing_with_clinicians", value: boolean) => {
    if (!profile) return;
    const previous = profile;
    setProfile({ ...profile, consent: { ...profile.consent, [field]: value } });
    setBusy(field);
    try {
      const consent = await api<Profile["consent"]>("users/me/consent", { method: "PATCH", body: { [field]: value } });
      invalidateHealthCard();
      setProfile((p) => (p ? { ...p, consent: { ...p.consent, ...consent } } : p));
      if (field === "treatment_processing") {
        if (value) {
          await loadHealth();
        } else {
          applyHealth({ blood_type: null, allergies: [], emergency_contact_name: null, emergency_contact_phone: null });
          setHealth(null);
          onToast(t("settings.toast.consentWithdrawnTitle"), t("settings.toast.consentWithdrawn"));
        }
      }
    } catch (error) {
      setProfile(previous);
      onToast(t("common.couldNotUpdate"), message(error, t("common.pleaseTryAgain")));
    } finally {
      setBusy(null);
    }
  };

  const setNotification = async (field: "email_notifications" | "sms_notifications", value: boolean) => {
    if (!profile) return;
    const previous = profile;
    setProfile({ ...profile, preferences: { ...profile.preferences, [field]: value } });
    setBusy(field);
    try {
      const preferences = await api<Profile["preferences"]>("users/me/preferences", { method: "PATCH", body: { [field]: value } });
      setProfile((p) => (p ? { ...p, preferences: { ...p.preferences, ...preferences } } : p));
    } catch (error) {
      setProfile(previous);
      onToast(t("common.couldNotUpdate"), message(error, t("common.pleaseTryAgain")));
    } finally {
      setBusy(null);
    }
  };

  const saveCard = async () => {
    setBusy("card");
    try {
      const updated = await api<HealthProfile>("users/me/health-profile", {
        method: "PATCH",
        body: {
          blood_type: null,
          allergies: [],
          emergency_contact_name: emergencyName.trim() || null,
          emergency_contact_phone: emergencyPhone.trim() || null,
        },
      });
      applyHealth(updated);
      invalidateHealthCard();
      onToast(t("settings.toast.cardUpdatedTitle"), t("settings.toast.cardUpdated"));
    } catch (error) {
      onToast(t("common.couldNotSave"), message(error, t("settings.toast.checkDetails")));
    } finally {
      setBusy(null);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-app" edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {loadError ? <Text className="text-sm text-[#B42318]">{loadError}</Text> : (
            <Skeleton className="gap-6" label={t("settings.loading")}>
              {[3, 2, 2].map((fields, section) => (
                <View key={section} className="bg-white rounded-2xl border border-[#DCE4E6] p-5 gap-5">
                  <Bone className="h-4 w-40 rounded" />
                  <View className="gap-5">
                    {Array.from({ length: fields }, (_, i) => <FieldBones key={i} />)}
                  </View>
                </View>
              ))}
            </Skeleton>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const score = strength(newPassword);
  const requirements = [
    { id: "req-length", label: t("settings.password.req.length"), met: newPassword.length >= 10 },
    { id: "req-upper", label: t("settings.password.req.upper"), met: /[A-Z]/.test(newPassword) },
    { id: "req-lower", label: t("settings.password.req.lower"), met: /[a-z]/.test(newPassword) },
  ];
  const hasConsent = profile?.consent?.treatment_processing ?? false;

  const toggle = (id: string, checked: boolean, onChange: (value: boolean) => void, label: string, hint: string) => (
    <View key={id} className="flex-row items-start justify-between gap-4 py-3 border-b border-[#F4F7F7] last:border-0">
      <View className="flex-1">
        <Text className="text-sm font-semibold text-[#18242B]">{label}</Text>
        <Text className="text-xs text-[#25343D]">{hint}</Text>
      </View>
      <Switch value={checked} onValueChange={onChange} disabled={busy !== null} trackColor={{ true: "#18242B", false: "#DCE4E6" }} thumbColor="#ffffff" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-app" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="gap-6 py-6">
          <View className="bg-white rounded-2xl border border-[#DCE4E6] p-5 gap-6">
            <View className="flex-col gap-2 border-b border-[#F4F7F7] pb-4">
              <Text className="text-lg font-bold text-[#18242B]">{t("settings.personal.title")}</Text>
              <Text className="text-xs text-[#25343D]">{t("settings.personal.subtitle")}</Text>
              <Text className="self-start px-3 py-1 bg-[#F4F7F7] text-[#18242B] text-xs font-semibold rounded-full border border-[#DCE4E6]">{profile?.dedan_user_id ?? ""}</Text>
            </View>
            <View className="gap-5">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.personal.firstName")}</Text>
                <TextInput value={firstName} onChangeText={setFirstName} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.personal.lastName")}</Text>
                <TextInput value={lastName} onChangeText={setLastName} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.personal.email")}</Text>
                <TextInput value={email} onChangeText={setEmail} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.personal.phone")}</Text>
                <TextInput editable={false} value={profile?.phone ? formatPhoneDisplay(profile.phone) : ""} className="w-full text-sm rounded-xl bg-[#F4F7F7] border border-[#DCE4E6] py-2.5 px-3.5 text-[#25343D]" />
                {phoneStep === "idle" && (
                  <Pressable onPress={() => { setPhoneStep("number"); setNewPhone(""); setPhoneError(""); }} className="mt-1.5">
                    <Text className="text-[11px] font-semibold text-[#18242B]">{profile?.phone ? (profile?.phone_verified ? t("settings.personal.changeNumber") : t("settings.personal.verifyNumber")) : t("settings.personal.addPhone")}</Text>
                  </Pressable>
                )}
                {phoneStep !== "idle" && (
                  <View className="bg-[#F4F7F7] border border-[#DCE4E6] rounded-xl p-4 mt-3 gap-3">
                    <Text className="text-xs text-[#25343D]">{t("settings.personal.phoneHint")}</Text>
                    {phoneStep === "number" ? (
                      <View className="flex-row gap-2">
                        <TextInput value={newPhone} onChangeText={setNewPhone} placeholder="09XXXXXXXX" className="flex-1 text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
                        <Pressable onPress={() => void sendPhoneCode()} disabled={busy !== null || !newPhone.trim()} className="px-4 py-2.5 bg-black rounded-xl">
                          <Text className="text-white font-semibold text-xs">{t("settings.personal.sendCode")}</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View className="flex-row gap-2">
                        <TextInput value={phoneCode} onChangeText={(v) => setPhoneCode(v.replace(/\D/g, ""))} placeholder={t("settings.personal.codePlaceholder")} keyboardType="numeric" maxLength={6} className="flex-1 text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
                        <Pressable onPress={() => void confirmPhone()} disabled={busy !== null || phoneCode.length !== 6} className="px-4 py-2.5 bg-black rounded-xl">
                          <Text className="text-white font-semibold text-xs">{t("common.confirm")}</Text>
                        </Pressable>
                      </View>
                    )}
                    {phoneError ? <Text className="text-xs text-[#B42318]">{phoneError}</Text> : null}
                    <Pressable onPress={() => setPhoneStep("idle")}>
                      <Text className="text-[11px] text-[#25343D]">{t("common.cancel")}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
            <View className="flex-row items-center justify-end gap-3 pt-3 border-t border-[#F4F7F7]" style={{ zIndex: 0 }}>
              <Pressable onPress={saveProfile} disabled={busy !== null} className="px-5 py-2.5 bg-black rounded-xl">
                <Text className="text-white font-semibold text-sm">{t("settings.personal.saveChanges")}</Text>
              </Pressable>
            </View>
          </View>

          {/* Location */}
          <View className="bg-white rounded-2xl border border-[#DCE4E6] p-5 gap-6" style={{ zIndex: 100 }}>
            <View className="border-b border-[#F4F7F7] pb-4">
              <Text className="text-lg font-bold text-[#18242B]">{t("settings.location.title")}</Text>
            </View>
            <View className="gap-5" style={{ zIndex: 10 }}>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.location.address")}</Text>
                <TextInput value={address} onChangeText={setAddress} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.location.city")}</Text>
                <TextInput value={city} onChangeText={setCity} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.location.region")}</Text>
                <TextInput value={region} onChangeText={setRegion} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.location.postalCode")}</Text>
                <TextInput value={postalCode} onChangeText={setPostalCode} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View style={{ zIndex: 9999, elevation: 9999 }}>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.location.country")}</Text>
                <Select value={COUNTRIES.find((c) => c.value === country)?.labelKey ? t(COUNTRIES.find((c) => c.value === country)!.labelKey) : country} onValueChange={(v) => { const c = COUNTRIES.find((x) => t(x.labelKey) === v); if (c) setCountry(c.value); }} options={COUNTRIES.map((c) => t(c.labelKey))} className="w-full" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.location.radius")}</Text>
                <View className="flex-row items-center gap-2">
                  <TextInput value={String(radius)} onChangeText={(v) => { const n = Number(v); if (!isNaN(n)) setRadius(Math.min(RADIUS_MAX_KM, Math.max(RADIUS_MIN_KM, n))); }} keyboardType="numeric" className="flex-1 text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
                  <Text className="text-xs text-[#25343D]">km</Text>
                </View>
                <Text className="text-[11px] text-[#46545B] mt-1 text-left">{t("settings.location.within", { km: RADIUS_MIN_KM })} – {t("settings.location.within", { km: RADIUS_MAX_KM })}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-end gap-3 pt-3 border-t border-[#F4F7F7]" style={{ zIndex: 0 }}>
              <Pressable onPress={saveLocation} disabled={busy !== null} className="px-5 py-2.5 bg-black rounded-xl">
                <Text className="text-white font-semibold text-sm">{t("settings.location.update")}</Text>
              </Pressable>
            </View>
          </View>

          {/* Privacy */}
          <View className="bg-white rounded-2xl border border-[#DCE4E6] p-5">
            <View className="border-b border-[#F4F7F7] pb-4 mb-2">
              <Text className="text-lg font-bold text-[#18242B]">{t("settings.privacy.title")}</Text>
              <Text className="text-xs text-[#25343D]">{t("settings.privacy.subtitle")}</Text>
            </View>
            {toggle("consent-health", profile?.consent?.treatment_processing ?? false, (v) => void setConsent("treatment_processing", v),
              t("settings.privacy.consentHealth.label"), t("settings.privacy.consentHealth.hint"))}
            {toggle("consent-sharing", profile?.consent?.data_sharing_with_clinicians ?? false, (v) => void setConsent("data_sharing_with_clinicians", v),
              t("settings.privacy.consentSharing.label"), t("settings.privacy.consentSharing.hint"))}
            {toggle("pref-sms", profile?.preferences?.sms_notifications ?? false, (v) => void setNotification("sms_notifications", v),
              t("settings.privacy.sms.label"), t("settings.privacy.sms.hint"))}
          </View>

          {/* Password */}
          <View className="bg-white rounded-2xl border border-[#DCE4E6] p-5 gap-6">
            <View className="border-b border-[#F4F7F7] pb-4">
              <Text className="text-lg font-bold text-[#18242B]">{t("settings.password.title")}</Text>
              <Text className="text-xs text-[#25343D]">{t("settings.password.subtitle")}</Text>
            </View>
            <View className="gap-5">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.password.current")}</Text>
                <TextInput secureTextEntry={!showPasswords} value={currentPassword} onChangeText={setCurrentPassword} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.password.new")}</Text>
                <TextInput secureTextEntry={!showPasswords} value={newPassword} onChangeText={setNewPassword} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.password.confirm")}</Text>
                <TextInput secureTextEntry={!showPasswords} value={confirmPassword} onChangeText={setConfirmPassword} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
            </View>
            <View className="p-3.5 bg-[#F4F7F7] rounded-xl border border-[#DCE4E6] gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-[#25343D]">{t("settings.password.strength")}</Text>
                <Text className="text-xs font-semibold">{t(STRENGTH_LABEL_KEYS[strength(newPassword)])}</Text>
              </View>
              {requirements.map((req) => (
                <View key={req.id} className="flex-row items-center gap-1.5">
                  <Text className={`text-xs ${req.met ? "text-[#18242B]" : "text-[#46545B]"}`}>{req.met ? "✓" : "•"}</Text>
                  <Text className={`text-xs ${req.met ? "text-[#18242B]" : "text-[#46545B]"}`}>{req.label}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row items-center justify-between gap-3 pt-3 border-t border-[#F4F7F7]">
              <Pressable onPress={() => setShowPasswords(!showPasswords)} className="flex-row items-center gap-2">
                <View className={`w-4 h-4 rounded border ${showPasswords ? "bg-black border-black" : "border-[#DCE4E6]"}`} />
                <Text className="text-xs text-[#25343D]">{t("settings.password.show")}</Text>
              </Pressable>
              <Pressable onPress={changePassword} disabled={busy !== null} className="px-5 py-2.5 bg-black rounded-xl">
                <Text className="text-white font-semibold text-sm">{t("settings.password.update")}</Text>
              </Pressable>
            </View>
          </View>

          {/* Digital health card */}
          <View className="bg-white rounded-2xl border border-[#DCE4E6] p-5 gap-6">
            <View className="flex-col gap-3 border-b border-[#F4F7F7] pb-4">
              <View>
                <Text className="text-lg font-bold text-[#18242B]">{t("settings.card.title")}</Text>
              </View>
              <View className="flex-row gap-2">
                <Pressable onPress={() => setCardVisible(!cardVisible)} className="px-3.5 py-1.5 rounded-lg bg-[#F4F7F7] border border-[#DCE4E6]">
                  <Text className="text-xs font-semibold text-[#18242B]">{cardVisible ? t("settings.card.hidePreview") : t("settings.card.showPreview")}</Text>
                </Pressable>
                <Pressable onPress={() => router.push("/(tabs)/card" as any)} className="px-3.5 py-1.5 rounded-lg bg-black">
                  <Text className="text-white text-xs font-semibold">{t("settings.card.open")}</Text>
                </Pressable>
              </View>
            </View>
            {cardVisible && (
              <View className="bg-gradient-to-br from-[#1e3a2e] to-black rounded-2xl p-4">
                <View className="flex-row items-start justify-between gap-3 mb-3">
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg font-extrabold text-white">Endod</Text>
                    </View>
                    <Text className="text-[8px] font-semibold text-[#94e0c0] uppercase tracking-widest mt-1">
                      {t("healthCard.digitalId")}
                    </Text>
                    <Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>
                      {[firstName, lastName].filter(Boolean).join(" ") || "—"}
                    </Text>
                    <Text className="text-[9px] font-semibold text-[#94e0c0] mt-0.5" numberOfLines={1}>
                      {profile?.dedan_user_id ?? ""}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-end justify-between gap-3">
                  <View className="flex-1" style={{ gap: 4 }}>
                    <View className="flex-row" style={{ gap: 12 }}>
                      <View className="flex-1">
                        <Text className="text-[7px] font-semibold text-[#94a3a8] uppercase tracking-wider">{t("settings.card.phone")}</Text>
                        <Text className="text-[9px] font-semibold text-white mt-0.5" numberOfLines={1}>{profile?.phone ? formatPhoneDisplay(profile.phone) : "—"}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[7px] font-semibold text-[#94a3a8] uppercase tracking-wider">{t("settings.card.age")}</Text>
                        <Text className="text-[9px] font-semibold text-white mt-0.5">{age || "—"}</Text>
                      </View>
                    </View>
                    <View>
                      <Text className="text-[7px] font-semibold text-[#94a3a8] uppercase tracking-wider">{t("settings.card.address")}</Text>
                      <Text className="text-[9px] font-semibold text-white mt-0.5" numberOfLines={2}>{address || "—"}</Text>
                    </View>
                    <View className="flex-row" style={{ gap: 12 }}>
                      <View className="flex-1">
                        <Text className="text-[7px] font-semibold text-[#94a3a8] uppercase tracking-wider">{t("settings.card.emergency")}</Text>
                        <Text className="text-[9px] font-medium text-white/75 mt-0.5" numberOfLines={1}>{emergencyName || "—"}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[7px] font-semibold text-[#94a3a8] uppercase tracking-wider">{t("healthCard.expires")}</Text>
                        <Text className="text-[9px] font-semibold text-[#6ee7b7] mt-0.5">Oct 2027</Text>
                      </View>
                    </View>
                  </View>
                  <View className="bg-white rounded-lg items-center justify-center" style={{ padding: 4 }}>
                    <QRCode value={profile?.dedan_user_id ?? ""} size={40} />
                  </View>
                </View>
              </View>
            )}
            {!hasConsent && (
              <Text className="text-xs text-[#25343D] bg-[#F4F7F7] border border-[#DCE4E6] rounded-xl p-3">{t("settings.card.needsConsent")}</Text>
            )}
            <View className="gap-5">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.card.ageLabel")}</Text>
                <View className="relative w-full">
                  <TextInput value={age} onChangeText={setAge} keyboardType="numeric" className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 pr-10 text-[#18242B]" />
                  <View className="absolute right-2 top-0 bottom-0 justify-center gap-0.5">
                    <Pressable onPress={() => setAge((a) => String((parseInt(a) || 0) + 1))}>
                      <Text className="text-[#25343D] text-xs font-bold">▲</Text>
                    </Pressable>
                    <Pressable onPress={() => setAge((a) => String(Math.max(0, (parseInt(a) || 0) - 1)))}>
                      <Text className="text-[#25343D] text-xs font-bold">▼</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.card.addressLabel")}</Text>
                <TextInput value={address} onChangeText={setAddress} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.card.emergencyName")}</Text>
                <TextInput value={emergencyName} onChangeText={setEmergencyName} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-[#25343D] mb-1.5">{t("settings.card.emergencyPhone")}</Text>
                <TextInput value={emergencyPhone} onChangeText={setEmergencyPhone} className="w-full text-sm rounded-xl border border-[#DCE4E6] py-2.5 px-3.5 text-[#18242B]" />
              </View>
              <View className="flex-row items-center justify-end gap-3 pt-3 border-t border-[#F4F7F7]" style={{ zIndex: 0 }}>
                <Pressable onPress={saveCard} disabled={busy !== null} className="px-5 py-2.5 bg-black rounded-xl">
                  <Text className="text-white font-semibold text-sm">{t("settings.card.save")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
