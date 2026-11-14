import { COLORS, TAB_CONTENT_PADDING } from "../../lib/theme";
import { Text } from "../../components/ui/Text";
import {
  ScrollView,
  View,
  Pressable,
  Modal,
  Image,
  ActivityIndicator,
  Platform,
  ImageBackground,
} from "react-native";
import { useState, useRef, useCallback } from "react";
import { captureRef } from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import Svg, { Path, Circle } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import { DEFAULT_PROFILE } from "../../lib/data";
import { api } from "../../lib/api";
import { useSession } from "../../lib/session";
import { useI18n } from "../../lib/i18n";
import { useFocusEffect } from "expo-router";
import { useToast } from "../../components/ui/Toast";
import { LinearGradient } from "expo-linear-gradient";

export default function HealthCardScreen() {
  const { session } = useSession();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [qrOpen, setQrOpen] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const cardRef = useRef<any>(null);

  const busy = savingImage || savingPdf;

  const [profile, setProfile] = useState<any>(null);
  const [healthProfile, setHealthProfile] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const p = await api("users/me");
          setProfile(p);
        } catch {}
        try {
          const h = await api("users/me/health-profile");
          setHealthProfile(h);
        } catch {}
      })();
    }, [])
  );

  const fullName = profile
    ? `${profile.first_name ?? ""} ${profile.middle_name ?? ""} ${profile.last_name ?? ""}`.replace(/\s+/g, " ").trim() || (session
        ? `${session.firstName} ${session.middleName} ${session.lastName}`.replace(/\s+/g, " ").trim()
        : `${DEFAULT_PROFILE.firstName} ${DEFAULT_PROFILE.middleName} ${DEFAULT_PROFILE.lastName}`)
    : (session
        ? `${session.firstName} ${session.middleName} ${session.lastName}`.replace(/\s+/g, " ").trim() || `${DEFAULT_PROFILE.firstName} ${DEFAULT_PROFILE.middleName} ${DEFAULT_PROFILE.lastName}`
        : `${DEFAULT_PROFILE.firstName} ${DEFAULT_PROFILE.middleName} ${DEFAULT_PROFILE.lastName}`);
  const userId = profile?.dedan_user_id ?? DEFAULT_PROFILE.patientId;
  const phone = profile?.phone ?? session?.phone ?? DEFAULT_PROFILE.phone;
  const address = profile?.address_line ?? DEFAULT_PROFILE.address;
  const city = profile?.city ?? "";
  const emergencyPhone = healthProfile?.emergency_contact_phone ?? phone;

  const age = healthProfile?.age_years != null ? String(healthProfile.age_years) : (healthProfile?.age_range ?? "—");
  const expiry = "Oct 2027";
  const qrData = userId;

  // Wait briefly so gradients, fonts, QR code and images are fully rendered
  const captureCard = async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!cardRef.current) throw new Error(t("card.error.notAvailable"));
    return captureRef(cardRef.current, { format: "png", quality: 1 });
  };

  const downloadImage = async () => {
    if (busy) return;
    setSavingImage(true);
    try {
      const uri = await captureCard();

      let base64: string;
      if (Platform.OS === "web") {
        const res = await fetch(uri);
        const blob = await res.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(",")[1] ?? "");
          reader.onerror = () => reject(new Error(t("card.error.readImage")));
          reader.readAsDataURL(blob);
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Save health card image" });
        }
        showToast(t("common.done"), t("card.saved.ready"));
        return;
      } else {
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      if (Platform.OS === "android") {
        const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permission.granted) {
          showToast(t("card.cancelled"), t("card.noFolder"));
          return;
        }
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permission.directoryUri,
          "health-card",
          "image/png"
        );
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        showToast(t("common.done"), t("card.saved.image"));
      } else {
        const dest = `${FileSystem.cacheDirectory}health-card.png`;
        try {
          await FileSystem.deleteAsync(dest, { idempotent: true });
        } catch {
          // ignore
        }
        await FileSystem.writeAsStringAsync(dest, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(dest, { mimeType: "image/png", dialogTitle: "Save health card image" });
        }
        showToast(t("common.done"), t("card.saved.image"));
      }
    } catch (e: any) {
      showToast(t("common.somethingWrong"), e?.message ?? t("card.error.saveImage"));
    } finally {
      setSavingImage(false);
    }
  };

  const downloadPdf = async () => {
    if (busy) return;
    setSavingPdf(true);
    try {
      const imageUri = await captureCard();

      let base64: string;
      if (Platform.OS === "web") {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(",")[1] ?? "");
          reader.onerror = () => reject(new Error(t("card.error.readImage")));
          reader.readAsDataURL(blob);
        });
      } else {
        base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 0; }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      img {
        max-width: 90vw;
        height: auto;
        display: block;
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <img src="data:image/png;base64,${base64}" />
  </body>
</html>`;

      const result = await Print.printToFileAsync({ html });
      const uri = result?.uri;
      if (!uri) throw new Error(t("card.error.pdfGeneration"));

      const response = await fetch(uri);
      if (!response.ok) throw new Error(t("card.error.readPdf"));
      const blob = await response.blob();
      const base64Pdf = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error(t("card.error.encodePdf")));
        reader.readAsDataURL(blob);
      });

      if (Platform.OS === "android") {
        const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permission.granted) {
          showToast(t("card.cancelled"), t("card.noFolder"));
          return;
        }
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permission.directoryUri,
          "health-card",
          "application/pdf"
        );
        await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
          encoding: FileSystem.EncodingType.Base64,
        });
        showToast(t("common.done"), t("card.saved.pdfFolder"));
      } else {
        const dest = `${FileSystem.cacheDirectory}health-card.pdf`;
        try {
          await FileSystem.deleteAsync(dest, { idempotent: true });
        } catch {
          // ignore
        }
        await FileSystem.writeAsStringAsync(dest, base64Pdf, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(dest, { mimeType: "application/pdf", dialogTitle: "Save health card PDF" });
        }
        showToast(t("common.done"), t("card.saved.pdf"));
      }
    } catch (e: any) {
      showToast(t("common.somethingWrong"), e?.message ?? t("card.error.savePdf"));
    } finally {
      setSavingPdf(false);
    }
  };

  return (
    <View className="flex-1 bg-brand-bg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_CONTENT_PADDING }}>
        {/* ===== Digital Health Card ===== */}
        <View ref={cardRef} collapsable={false} style={{ marginTop: 24 }}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentDeep, COLORS.black]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          // minHeight keeps every field visible on narrow screens, where the
          // 1.4 aspect ratio would otherwise clip the bottom of the card.
          style={{ width: "100%", aspectRatio: 1.4, minHeight: 264, borderRadius: 16, overflow: "hidden" }}
        >
          {/* Sheen */}
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.sheen }} />
          {/* Decorative rings */}
          <View style={{ position: "absolute", top: -64, right: -64, width: 224, height: 224, opacity: 0.06 }}>
            <Svg width={224} height={224} viewBox="0 0 200 200" fill="none">
              <Circle cx={100} cy={100} r={40} stroke="white" strokeWidth={0.5} />
              <Circle cx={100} cy={100} r={70} stroke="white" strokeWidth={0.5} />
              <Circle cx={100} cy={100} r={98} stroke="white" strokeWidth={0.5} />
            </Svg>
          </View>

          <View style={{ flex: 1, padding: 16, paddingBottom: 32, justifyContent: "space-between" }}>
            {/* Top row: brand, name, id, contactless */}
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-2">
                  <Image
                    source={require("../../../assets/endod_logo.png")}
                    style={{ width: 24, height: 24, tintColor: COLORS.surface }}
                    resizeMode="contain"
                    onLoadEnd={() => {}}
                  />
                  <Text className="font-extrabold tracking-tight text-white" style={{ fontSize: 22, lineHeight: 22 }}>Endod</Text>
                </View>
                <Text className="font-semibold text-brand-on-dark-accent uppercase tracking-widest mt-1" style={{ fontSize: 11 }}>
                  {t("card.digitalId")}
                </Text>
                <Text className="font-bold text-white mt-3" style={{ fontSize: 16, fontFamily: "serif" }} numberOfLines={1}>
                  {fullName}
                </Text>
                <Text className="font-semibold text-brand-on-dark-accent mt-0.5" style={{ fontSize: 11 }} numberOfLines={1}>
                  {userId}
                </Text>
              </View>
              {/* Contactless icon */}
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={COLORS.onDarkStroke} strokeWidth={1.8}>
                <Path d="M8.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
                <Path d="M12 6a8 8 0 0 1 0 12" strokeLinecap="round" />
                <Path d="M15.5 3.5a11 11 0 0 1 0 17" strokeLinecap="round" />
              </Svg>
            </View>

            {/* Bottom row: fields + QR */}
            <View className="flex-row items-end justify-between gap-3" style={{ marginBottom: 8 }}>
              <View className="flex-1" style={{ gap: 6, marginTop: 8 }}>
                <View className="flex-row" style={{ gap: 16 }}>
                  <View className="flex-1">
                    <Text className="font-semibold text-brand-on-dark uppercase tracking-wider" style={{ fontSize: 10 }}>Phone</Text>
                    <Text className="font-semibold text-white mt-0.5" style={{ fontSize: 11 }} numberOfLines={1}>{phone}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-brand-on-dark uppercase tracking-wider" style={{ fontSize: 10 }}>Age</Text>
                    <Text className="font-semibold text-white mt-0.5" style={{ fontSize: 11 }}>{age}</Text>
                  </View>
                </View>
                <View>
                  <Text className="font-semibold text-brand-on-dark uppercase tracking-wider" style={{ fontSize: 10 }}>Address</Text>
                  <Text className="font-semibold text-white mt-0.5" style={{ fontSize: 11 }} numberOfLines={2}>{city || address}</Text>
                </View>
                <View className="flex-row" style={{ gap: 16 }}>
                  <View className="flex-1">
                    <Text className="font-semibold text-brand-on-dark uppercase tracking-wider" style={{ fontSize: 10 }}>E/contact</Text>
                    <Text className="font-medium text-white/75 mt-0.5" style={{ fontSize: 11 }} numberOfLines={1}>{emergencyPhone}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-brand-on-dark uppercase tracking-wider" style={{ fontSize: 10 }}>Expires</Text>
                    <Text className="font-semibold text-brand-on-dark-accent mt-0.5" style={{ fontSize: 11 }}>{expiry}</Text>
                  </View>
                </View>
              </View>

              {/* QR */}
              <View className="bg-white rounded-lg items-center justify-center" style={{ padding: 8 }}>
                <QRCode value={qrData} size={80} />
              </View>
            </View>
          </View>
        </LinearGradient>
        </View>

        {/* Show QR */}
        <View className="mt-6 items-center">
          <Pressable onPress={() => setQrOpen(true)}>
            <Text className="text-xl font-semibold text-brand-accent underline">{t("card.showQr")}</Text>
          </Pressable>
        </View>

        <Modal visible={qrOpen} transparent animationType="fade" onRequestClose={() => setQrOpen(false)}>
          <Pressable onPress={() => setQrOpen(false)} style={{ flex: 1, backgroundColor: "white", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <View style={{ width: "100%", maxWidth: 360, alignItems: "center" }} onStartShouldSetResponder={() => true}>
              <Text className="text-sm font-semibold text-brand-body uppercase tracking-wider">{t("card.scanToVerify")}</Text>
              <View style={{ marginVertical: 24, padding: 12, backgroundColor: "white", borderRadius: 12 }}>
                <QRCode value={qrData} size={200} />
              </View>
              <Text className="text-2xl font-bold text-brand-heading">{fullName}</Text>
              <Text className="text-base font-semibold text-brand-accent mt-1">{userId}</Text>
              <Pressable onPress={() => setQrOpen(false)} className="mt-8 px-8 py-3 rounded-full border border-brand-border">
                <Text className="text-brand-body font-semibold">{t("card.close")}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

      </ScrollView>
    </View>
  );
}