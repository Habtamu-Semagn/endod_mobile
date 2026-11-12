import { COLORS, TAB_CONTENT_PADDING } from "../../lib/theme";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Switch, TextInput, View, Alert } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useRouter } from "expo-router";
import { useSession } from "../../lib/session";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api, ApiError, passwordProblem, setAuthToken } from "../../lib/api";
import { useI18n, type TranslationKey } from "../../lib/i18n";
import { Bone, FieldBones, Skeleton } from "../../components/skeleton";
import { Select } from "../../components/Select";
import { Passkey } from "react-native-passkey";
import { PasskeyModal } from "../../components/PasskeyModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Text } from "../../components/ui/Text";
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
  age_range: string | null;
  date_of_birth: string | null;
  age_years: number | null;
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
const STRENGTH_COLORS = ["text-brand-muted", "text-brand-danger", "text-brand-muted", "text-brand-heading", "text-brand-heading"];

export default function SettingsScreen({ onToast = (title: string, message?: string) => Alert.alert(title, message), onProfileChange = () => {}, hideTitle }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const { signOut } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
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
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showDob, setShowDob] = useState(false);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyModalVisible, setPasskeyModalVisible] = useState(false);
  const [deleteDataModalVisible, setDeleteDataModalVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState("");
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);
  const [deleteAccountUseSms, setDeleteAccountUseSms] = useState(false);
  const [deleteAccountPhoneCode, setDeleteAccountPhoneCode] = useState("");
  const [deleteAccountVerificationToken, setDeleteAccountVerificationToken] = useState("");

  const applyPersonal = useCallback((p: Profile) => {
    setFirstName(p.first_name ?? "");
    setMiddleName(p.middle_name ?? "");
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
    if (h.date_of_birth) setDateOfBirth(h.date_of_birth);
    else if (h.age_years != null) {
      const d = new Date();
      d.setFullYear(d.getFullYear() - h.age_years);
      setDateOfBirth(d.toISOString().slice(0, 10));
    }
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
        if (p.consent?.treatment_processing) void loadHealth().catch(() => {});
        void api<{ passkeys: any[] }>("users/me/passkeys").then((d) => { if (!cancelled) setPasskeys(d?.passkeys ?? []); }).catch(() => {});
      })
      .catch((error) => {
        if (!cancelled) setLoadError(message(error, t("settings.error.load")));
      });
    return () => { cancelled = true; };
  }, [applyProfile, loadHealth, t]);

  const addPasskey = async () => {
    if (!Passkey.isSupported()) {
      onToast("Passkeys", "This device doesn't support passkeys.");
      return;
    }
    setPasskeyBusy(true);
    try {
      let opts: any;
      try {
        opts = await api("users/me/passkeys/registration/options", { method: "POST", body: {} });
        console.log("passkey reg options:", JSON.stringify(opts));
      } catch (e: any) {
        if (e?.status === 428) {
          const pwd = await new Promise<string>((resolve) => {
            Alert.prompt?.("Recent sign-in required", "Enter your current password to add a passkey.", (v: string) => resolve(v ?? ""), "plain-text");
          });
          if (!pwd) { setPasskeyBusy(false); return; }
          opts = await api("users/me/passkeys/registration/options", { method: "POST", body: { current_password: pwd } });
        } else throw e;
      }
      const credential = await Passkey.create(opts?.options ?? opts);
      const name = (typeof navigator !== "undefined" ? (navigator as any).userAgent : "") || "This device";
      await api("users/me/passkeys/registration/verify", { method: "POST", body: { credential, name } });
      const d = await api<{ passkeys: any[] }>("users/me/passkeys");
      setPasskeys(d?.passkeys ?? []);
      onToast("Passkey added", "You can now sign in with this device.");
    } catch (e: any) {
      console.log("passkey add error:", JSON.stringify(e));
      if (e?.error !== "UserCancelled" && !String(e?.message ?? "").toLowerCase().includes("cancel")) {
        onToast("Could not add passkey", e?.message ?? "Try again.");
      } else {
        onToast("Passkey", "Passkey setup was cancelled.");
      }
    } finally {
      setPasskeyBusy(false);
    }
  };

  const deletePasskey = async (id: string) => {
    Alert.alert("Remove passkey", "Remove this passkey?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          setPasskeyBusy(true);
          try {
            await api(`users/me/passkeys/${id}`, { method: "DELETE" });
            setPasskeys((prev) => prev.filter((p) => p.id !== id));
            onToast("Passkey removed", "Removed.");
          } catch (e: any) {
            if (e?.status === 428) {
              // ask password
              Alert.prompt?.("Recent sign-in required", "Enter your current password.", async (pwd: string) => {
                if (!pwd) return;
                setPasskeyBusy(true);
                try {
                  await api(`users/me/passkeys/${id}`, { method: "DELETE", body: { current_password: pwd } });
                  setPasskeys((prev) => prev.filter((p) => p.id !== id));
                  onToast("Passkey removed", "Removed.");
                } catch (err: any) {
                  onToast("Could not remove", err?.message ?? "Try again.");
                } finally {
                  setPasskeyBusy(false);
                }
              }, "plain-text");
            } else {
              onToast("Could not remove", e?.message ?? "Try again.");
            }
          } finally {
            setPasskeyBusy(false);
          }
        },
      },
    ]);
  };
  const deleteUserData = async () => {
    setDeleteAccountVisible(true);
    setDeleteAccountPassword("");
    setDeleteAccountConfirm("");
    setDeleteAccountUseSms(false);
    setDeleteAccountPhoneCode("");
    setDeleteAccountVerificationToken("");
  };

  const requestDeleteSmsCode = async () => {
    setDeleteAccountBusy(true);
    try {
      await api("/auth/phone/request-code", { method: "POST", body: { phone: profile?.phone } });
      onToast("Code sent", "Enter the code sent to your phone.");
    } catch (e: any) {
      onToast("Could not send code", e?.message ?? "Try again.");
    } finally {
      setDeleteAccountBusy(false);
    }
  };

  const verifyDeleteSmsCode = async () => {
    if (deleteAccountPhoneCode.length !== 6) return;
    setDeleteAccountBusy(true);
    try {
      const data = await api("/auth/phone/verify", { method: "POST", body: { phone: profile?.phone, code: deleteAccountPhoneCode } });
      setDeleteAccountVerificationToken(data?.verification_token ?? "");
      onToast("Verified", "Now confirm deletion.");
    } catch (e: any) {
      onToast("Could not verify", e?.message ?? "Try again.");
    } finally {
      setDeleteAccountBusy(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (deleteAccountConfirm !== "DELETE") {
      onToast("Confirmation required", 'Type "DELETE" to confirm.');
      return;
    }
    setDeleteAccountBusy(true);
    try {
      const body: any = { confirm: "DELETE" };
      if (deleteAccountUseSms && deleteAccountVerificationToken) body.verification_token = deleteAccountVerificationToken;
      else body.current_password = deleteAccountPassword;
      const res = await api("/users/me/delete", { method: "POST", body });
      setDeleteAccountVisible(false);
      // forget token
      setAuthToken(null);
      signOut();
      Alert.alert("Account deleted", `Your account was deleted. Your data will be erased for good on ${res?.erase_after ?? "30 days"}. Sign in before then to restore it.`);
      router.replace("/login");
    } catch (e: any) {
      if (e?.status === 428) {
        onToast("Recent sign-in required", "Enter your password and try again.");
      } else if (e?.status === 403) {
        onToast("Wrong password", e?.message ?? "Try again.");
      } else {
        onToast("Could not delete account", e?.message ?? "Try again.");
      }
    } finally {
      setDeleteAccountBusy(false);
    }
  };

  const saveProfile = async () => {
    if (!firstName.trim() && !middleName.trim() && !lastName.trim() && !email.trim()) {
      onToast("Missing input", "Please fill the input element you want to update.");
      return;
    }
    setBusy("profile");
    try {
      const updated = await api<Profile>("users/me", {
        method: "PATCH",
        body: { first_name: firstName.trim(), middle_name: middleName.trim() || null, last_name: lastName.trim(), email: email.trim() || null },
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
    if (!address.trim() && !city.trim() && !region.trim() && !postalCode.trim()) {
      onToast("Missing input", "Please fill the input element you want to update.");
      return;
    }
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
    if (!newPhone.trim()) {
      onToast("Missing input", "Please fill the input element you want to update.");
      return;
    }
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
    if (phoneCode.length !== 6) {
      onToast("Missing input", "Please fill the input element you want to update.");
      return;
    }
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
      const result = await api<{ changed: boolean; access_token?: string }>("auth/password", {
        method: "POST",
        body: {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        },
      });
      if (result?.access_token) setAuthToken(result.access_token);
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
          applyHealth({ blood_type: null, allergies: [], emergency_contact_name: null, emergency_contact_phone: null, age_range: null, date_of_birth: null, age_years: null });
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
    if (!dateOfBirth.trim() && !emergencyName.trim() && !emergencyPhone.trim()) {
      onToast("Missing input", "Please fill the input element you want to update.");
      return;
    }
    setBusy("card");
    try {
      const updated = await api<HealthProfile>("users/me/health-profile", {
        method: "PATCH",
        body: {
          blood_type: null,
          allergies: [],
          emergency_contact_name: emergencyName.trim() || null,
          emergency_contact_phone: emergencyPhone.trim() || null,
          date_of_birth: dateOfBirth.trim() || null,
        },
      });
      applyHealth(updated);
      invalidateHealthCard();
      onToast(t("settings.toast.cardUpdatedTitle"), t("settings.toast.cardUpdated"));
      router.push("/(tabs)/card");
    } catch (error) {
      onToast(t("common.couldNotSave"), message(error, t("settings.toast.checkDetails")));
    } finally {
      setBusy(null);
    }
  };

  if (!profile) {
    return (
      <View className="flex-1 bg-brand-bg">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_CONTENT_PADDING }} keyboardShouldPersistTaps="handled">
          {loadError ? <Text className="text-sm text-brand-danger">{loadError}</Text> : (
            <Skeleton className="gap-6" label={t("settings.loading")}>
              {[3, 2, 2].map((fields, section) => (
                <View key={section} className="bg-white rounded-2xl border border-brand-border p-5 gap-5">
                  <Bone className="h-4 w-40 rounded" />
                  <View className="gap-5">
                    {Array.from({ length: fields }, (_, i) => <FieldBones key={i} />)}
                  </View>
                </View>
              ))}
            </Skeleton>
          )}
        </ScrollView>
      </View>
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
    <View key={id} className="flex-row items-start justify-between gap-4 py-3 border-b border-brand-alt last:border-0">
      <View className="flex-1">
        <Text className="text-sm font-semibold text-brand-heading">{label}</Text>
        <Text className="text-xs text-brand-body">{hint}</Text>
      </View>
      <Switch value={checked} onValueChange={onChange} disabled={busy !== null} trackColor={{ true: COLORS.heading, false: COLORS.border }} thumbColor={COLORS.surface} />
    </View>
  );

  return (
    <View className="flex-1 bg-brand-bg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_CONTENT_PADDING }} keyboardShouldPersistTaps="handled">
        <View className="gap-6 py-6">
          <View className="bg-white rounded-2xl border border-brand-border p-5 gap-6">
            <View className="flex-col gap-2 border-b border-brand-alt pb-4">
              <Text className="text-lg font-bold text-brand-heading">{t("settings.personal.title")}</Text>
              <Text className="text-xs text-brand-body">{t("settings.personal.subtitle")}</Text>
              <Text className="self-start px-3 py-1 bg-brand-alt text-brand-heading text-xs font-semibold rounded-full border border-brand-border">{profile?.dedan_user_id ?? ""}</Text>
            </View>
            <View className="gap-5">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.personal.firstName")}</Text>
                <TextInput value={firstName} onChangeText={setFirstName} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.personal.middleName")}</Text>
                <TextInput value={middleName} onChangeText={setMiddleName} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.personal.lastName")}</Text>
                <TextInput value={lastName} onChangeText={setLastName} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.personal.email")}</Text>
                <TextInput value={email} onChangeText={setEmail} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.personal.phone")}</Text>
                <TextInput editable={false} value={profile?.phone ? formatPhoneDisplay(profile.phone) : ""} className="w-full text-sm rounded-xl bg-brand-alt border border-brand-border py-2.5 px-3.5 text-brand-body" />
                {phoneStep === "idle" && (
                  <Pressable onPress={() => { setPhoneStep("number"); setNewPhone(""); setPhoneError(""); }} className="mt-1.5">
                    <Text className="text-[11px] font-semibold text-brand-heading">{profile?.phone ? (profile?.phone_verified ? t("settings.personal.changeNumber") : t("settings.personal.verifyNumber")) : t("settings.personal.addPhone")}</Text>
                  </Pressable>
                )}
                {phoneStep !== "idle" && (
                  <View className="bg-brand-alt border border-brand-border rounded-xl p-4 mt-3 gap-3">
                    <Text className="text-xs text-brand-body">{t("settings.personal.phoneHint")}</Text>
                    {phoneStep === "number" ? (
                      <View className="flex-row gap-2">
                        <TextInput value={newPhone} onChangeText={setNewPhone} placeholder="09XXXXXXXX" className="flex-1 text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
                        <Pressable onPress={() => void sendPhoneCode()} disabled={busy !== null || !newPhone.trim()} className="px-4 py-2.5 bg-brand-accent rounded-xl">
                          <Text className="text-white font-semibold text-xs">{t("settings.personal.sendCode")}</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View className="flex-row gap-2">
                        <TextInput value={phoneCode} onChangeText={(v) => setPhoneCode(v.replace(/\D/g, ""))} placeholder={t("settings.personal.codePlaceholder")} keyboardType="numeric" maxLength={6} className="flex-1 text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
                        <Pressable onPress={() => void confirmPhone()} disabled={busy !== null || phoneCode.length !== 6} className="px-4 py-2.5 bg-brand-accent rounded-xl">
                          <Text className="text-white font-semibold text-xs">{t("common.confirm")}</Text>
                        </Pressable>
                      </View>
                    )}
                    {phoneError ? <Text className="text-xs text-brand-danger">{phoneError}</Text> : null}
                    <Pressable onPress={() => setPhoneStep("idle")}>
                      <Text className="text-[11px] text-brand-body">{t("common.cancel")}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
            <View className="flex-row items-center justify-end gap-3 pt-3 border-t border-brand-alt">
              <Pressable onPress={saveProfile} disabled={busy !== null} className="px-5 py-2.5 bg-brand-accent rounded-xl">
                <Text className="text-white font-semibold text-sm">{t("settings.personal.saveChanges")}</Text>
              </Pressable>
            </View>
          </View>

          {/* Location */}
          <View className="bg-white rounded-2xl border border-brand-border p-5 gap-6">
            <View className="border-b border-brand-alt pb-4">
              <Text className="text-lg font-bold text-brand-heading">{t("settings.location.title")}</Text>
            </View>
            <View className="gap-5" style={{ zIndex: 10 }}>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.location.address")}</Text>
                <TextInput value={address} onChangeText={setAddress} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.location.city")}</Text>
                <TextInput value={city} onChangeText={setCity} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.location.region")}</Text>
                <TextInput value={region} onChangeText={setRegion} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.location.postalCode")}</Text>
                <TextInput value={postalCode} onChangeText={setPostalCode} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View style={{ zIndex: 9999, elevation: 9999 }}>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.location.country")}</Text>
                <Select value={COUNTRIES.find((c) => c.value === country)?.labelKey ? t(COUNTRIES.find((c) => c.value === country)!.labelKey) : country} onValueChange={(v) => { const c = COUNTRIES.find((x) => t(x.labelKey) === v); if (c) setCountry(c.value); }} options={COUNTRIES.map((c) => t(c.labelKey))} className="w-full" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.location.radius")}</Text>
                <View className="flex-row items-center gap-2">
                  <TextInput value={String(radius)} onChangeText={(v) => { const n = Number(v); if (!isNaN(n)) setRadius(Math.min(RADIUS_MAX_KM, Math.max(RADIUS_MIN_KM, n))); }} keyboardType="numeric" className="flex-1 text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
                  <Text className="text-xs text-brand-body">km</Text>
                </View>
                <Text className="text-[11px] text-brand-muted mt-1 text-left">{t("settings.location.within", { km: RADIUS_MIN_KM })} – {t("settings.location.within", { km: RADIUS_MAX_KM })}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-end gap-3 pt-3 border-t border-brand-alt">
              <Pressable onPress={saveLocation} disabled={busy !== null} className="px-5 py-2.5 bg-brand-accent rounded-xl">
                <Text className="text-white font-semibold text-sm">{t("settings.location.update")}</Text>
              </Pressable>
            </View>
          </View>

          {/* Privacy */}
          <View className="bg-white rounded-2xl border border-brand-border p-5">
            <View className="border-b border-brand-alt pb-4 mb-2">
              <Text className="text-lg font-bold text-brand-heading">{t("settings.privacy.title")}</Text>
              <Text className="text-xs text-brand-body">{t("settings.privacy.subtitle")}</Text>
            </View>
            {toggle("consent-health", profile?.consent?.treatment_processing ?? false, (v) => void setConsent("treatment_processing", v),
              t("settings.privacy.consentHealth.label"), t("settings.privacy.consentHealth.hint"))}
            {toggle("consent-sharing", profile?.consent?.data_sharing_with_clinicians ?? false, (v) => void setConsent("data_sharing_with_clinicians", v),
              t("settings.privacy.consentSharing.label"), t("settings.privacy.consentSharing.hint"))}
            {toggle("pref-sms", profile?.preferences?.sms_notifications ?? false, (v) => void setNotification("sms_notifications", v),
              t("settings.privacy.sms.label"), t("settings.privacy.sms.hint"))}
          </View>

          {/* Password */}
          <View className="bg-white rounded-2xl border border-brand-border p-5 gap-6">
            <View className="border-b border-brand-alt pb-4">
              <Text className="text-lg font-bold text-brand-heading">{t("settings.password.title")}</Text>
              <Text className="text-xs text-brand-body">{t("settings.password.subtitle")}</Text>
            </View>
            <View className="gap-5">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.password.current")}</Text>
                <TextInput secureTextEntry={!showPasswords} value={currentPassword} onChangeText={setCurrentPassword} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.password.new")}</Text>
                <TextInput secureTextEntry={!showPasswords} value={newPassword} onChangeText={setNewPassword} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.password.confirm")}</Text>
                <TextInput secureTextEntry={!showPasswords} value={confirmPassword} onChangeText={setConfirmPassword} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
            </View>
            <View className="p-3.5 bg-brand-alt rounded-xl border border-brand-border gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-brand-body">{t("settings.password.strength")}</Text>
                <Text className="text-xs font-semibold">{t(STRENGTH_LABEL_KEYS[strength(newPassword)])}</Text>
              </View>
              {requirements.map((req) => (
                <View key={req.id} className="flex-row items-center gap-1.5">
                  <Text className={`text-xs ${req.met ? "text-brand-heading" : "text-brand-muted"}`}>{req.met ? "✓" : "•"}</Text>
                  <Text className={`text-xs ${req.met ? "text-brand-heading" : "text-brand-muted"}`}>{req.label}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row items-center justify-between gap-3 pt-3 border-t border-brand-alt">
              <Pressable onPress={() => setShowPasswords(!showPasswords)} className="flex-row items-center gap-2">
                <View className={`w-4 h-4 rounded border ${showPasswords ? "bg-brand-accent border-brand-accent" : "border-brand-border"}`} />
                <Text className="text-xs text-brand-body">{t("settings.password.show")}</Text>
              </Pressable>
              <Pressable onPress={changePassword} disabled={busy !== null} className="px-5 py-2.5 bg-brand-accent rounded-xl">
                <Text className="text-white font-semibold text-sm">{t("settings.password.update")}</Text>
              </Pressable>
            </View>
          </View>

          {/* Digital health card */}
          <View className="bg-white rounded-2xl border border-brand-border p-5 gap-6">
            <View className="flex-col gap-3 border-b border-brand-alt pb-4">
              <View>
                <Text className="text-lg font-bold text-brand-heading">{t("settings.card.title")}</Text>
              </View>
              <View className="flex-row gap-2">
                <Pressable onPress={() => setCardVisible(!cardVisible)} className="px-3.5 py-1.5 rounded-lg bg-brand-alt border border-brand-border">
                  <Text className="text-xs font-semibold text-brand-heading">{cardVisible ? t("settings.card.hidePreview") : t("settings.card.showPreview")}</Text>
                </Pressable>
                <Pressable onPress={() => router.push("/(tabs)/card" as any)} className="px-3.5 py-1.5 rounded-lg bg-brand-accent">
                  <Text className="text-white text-xs font-semibold">{t("settings.card.open")}</Text>
                </Pressable>
              </View>
            </View>
            {cardVisible && (
              <View className="bg-gradient-to-br from-brand-accent to-brand-accent-deep rounded-2xl p-4">
                <View className="flex-row items-start justify-between gap-3 mb-3">
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg font-extrabold text-white">Endod</Text>
                    </View>
                    <Text className="text-[11px] font-semibold text-brand-alt uppercase tracking-widest mt-1">
                      {t("healthCard.digitalId")}
                    </Text>
                    <Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>
                      {[firstName, lastName].filter(Boolean).join(" ") || "—"}
                    </Text>
                    <Text className="text-[11px] font-semibold text-brand-alt mt-0.5" numberOfLines={1}>
                      {profile?.dedan_user_id ?? ""}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-end justify-between gap-3">
                  <View className="flex-1" style={{ gap: 4 }}>
                    <View className="flex-row" style={{ gap: 12 }}>
                      <View className="flex-1">
                        <Text className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">{t("settings.card.phone")}</Text>
                        <Text className="text-[11px] font-semibold text-white mt-0.5" numberOfLines={1}>{profile?.phone ? formatPhoneDisplay(profile.phone) : "—"}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">{t("settings.card.age")}</Text>
                        <Text className="text-[11px] font-semibold text-white mt-0.5">{dateOfBirth ? (() => { const b=new Date(dateOfBirth); const n=new Date(); let a=n.getFullYear()-b.getFullYear(); if(n.getMonth()<b.getMonth()||(n.getMonth()===b.getMonth()&&n.getDate()<b.getDate()))a--; return a; })() : "—"}</Text>
                      </View>
                    </View>
                    <View>
                      <Text className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">{t("settings.card.address")}</Text>
                      <Text className="text-[11px] font-semibold text-white mt-0.5" numberOfLines={2}>{address || "—"}</Text>
                    </View>
                    <View className="flex-row" style={{ gap: 12 }}>
                      <View className="flex-1">
                        <Text className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">{t("settings.card.emergency")}</Text>
                        <Text className="text-[11px] font-medium text-white/75 mt-0.5" numberOfLines={1}>{emergencyName || "—"}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">{t("healthCard.expires")}</Text>
                        <Text className="text-[11px] font-semibold text-brand-alt mt-0.5">Oct 2027</Text>
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
              <Text className="text-xs text-brand-body bg-brand-alt border border-brand-border rounded-xl p-3">{t("settings.card.needsConsent")}</Text>
            )}
            <View className="gap-5">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.card.dateOfBirth")}</Text>
                <Pressable onPress={() => setShowDob(true)} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading">
                  <Text>{dateOfBirth || "YYYY-MM-DD"}</Text>
                </Pressable>
                {showDob && (
                  <DateTimePicker
                    value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(e, d) => {
                      setShowDob(false);
                      if (d) setDateOfBirth(d.toISOString().slice(0, 10));
                    }}
                  />
                )}
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.card.addressLabel")}</Text>
                <TextInput value={address} onChangeText={setAddress} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.card.emergencyName")}</Text>
                <TextInput value={emergencyName} onChangeText={setEmergencyName} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-body mb-1.5">{t("settings.card.emergencyPhone")}</Text>
                <TextInput value={emergencyPhone} onChangeText={setEmergencyPhone} className="w-full text-sm rounded-xl border border-brand-border py-2.5 px-3.5 text-brand-heading" />
              </View>
              <View className="flex-row items-center justify-end gap-3 pt-3 border-t border-brand-alt">
                <Pressable onPress={() => void saveCard()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="px-5 py-2.5 bg-brand-accent rounded-xl">
                  <Text className="text-white font-semibold text-sm">{t("settings.card.save")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Passkeys */}
        <View className="bg-white rounded-2xl border border-brand-border p-4 mt-4">
          <Text className="text-sm font-bold text-brand-heading mb-3">Passkeys</Text>
          {passkeys.length === 0 ? (
            <Text className="text-xs text-brand-body mb-3">No passkeys on this account yet.</Text>
          ) : (
            <View className="gap-2 mb-3">
              {passkeys.map((p: any) => (
                <View key={p.id} className="flex-row items-center justify-between py-2 border-b border-brand-alt">
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-semibold text-brand-heading" numberOfLines={1}>{p.name}</Text>
                    <Text className="text-xs text-brand-muted">{p.blocked ? "Blocked" : "Active"}</Text>
                  </View>
                  <Pressable onPress={() => deletePasskey(p.id)} disabled={passkeyBusy} className="px-3 py-1.5 rounded-lg border border-brand-danger">
                    <Text className="text-xs font-semibold text-brand-danger">Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          {Passkey.isSupported() ? (
            <Pressable onPress={() => setPasskeyModalVisible(true)} disabled={passkeyBusy} className="w-full py-2.5 rounded-xl bg-brand-accent items-center">
              <Text className="text-sm font-semibold text-white">{passkeyBusy ? "Working…" : "Add passkey"}</Text>
            </Pressable>
          ) : (
            <Text className="text-xs text-brand-muted">This device doesn&apos;t support passkeys.</Text>
          )}
        </View>

        {/* Sign out */}
        <View className="mt-2">
          <Pressable
            onPress={() => { signOut(); router.replace("/login"); }}
            className="w-full py-3 rounded-xl border border-brand-border bg-white items-center"
          >
            <Text className="text-sm font-semibold text-brand-danger">Sign out</Text>
          </Pressable>
        </View>
              {/* Delete account */}
        <View className="mt-6">
          <Pressable
            onPress={deleteUserData}
            disabled={busy !== null}
            className="w-full py-3 rounded-xl border border-brand-danger bg-white items-center"
          >
            <Text className="text-sm font-semibold text-brand-danger">Delete account</Text>
          </Pressable>
          <Text className="text-xs text-brand-muted mt-2 text-center">
            Permanently deletes your account. You can restore it within 30 days.
          </Text>
        </View>

</ScrollView>

          <PasskeyModal
        visible={passkeyModalVisible}
        busy={passkeyBusy}
        onClose={() => { if (!passkeyBusy) setPasskeyModalVisible(false); }}
        onConfirm={() => { setPasskeyModalVisible(false); void addPasskey(); }}
      />
      <Modal
        visible={deleteAccountVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!deleteAccountBusy) setDeleteAccountVisible(false); }}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.overlay, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ width: "100%", maxWidth: 360, backgroundColor: COLORS.surface, borderRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: COLORS.heading, marginBottom: 8 }}>Delete account</Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: COLORS.body, marginBottom: 12 }}>
              Type &quot;DELETE&quot; to confirm, then enter your current password.
            </Text>
            <TextInput
              value={deleteAccountConfirm}
              onChangeText={setDeleteAccountConfirm}
              placeholder='Type "DELETE"'
              autoCapitalize="characters"
              style={{ backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 }}
            />
            <TextInput
              value={deleteAccountPassword}
              onChangeText={setDeleteAccountPassword}
              placeholder="Current password"
              secureTextEntry
              style={{ backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => { if (!deleteAccountBusy) setDeleteAccountVisible(false); }}
                disabled={deleteAccountBusy}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", opacity: deleteAccountBusy ? 0.5 : 1 }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.body }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteAccount}
                disabled={deleteAccountBusy}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", opacity: deleteAccountBusy ? 0.5 : 1 }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.surface }}>
                  {deleteAccountBusy ? "Working…" : "Delete"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
</View>
  );
}
