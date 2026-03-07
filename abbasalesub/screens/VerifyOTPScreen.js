import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useTheme } from "../components/ThemeContext";
import CustomAlert from "../components/CustomAlert";
import { authService } from "../services/auth.service";
import { appService } from "../services/api";
import { Config } from "../constants/Config";
import { PremiumInput, PremiumButton } from "../components/PremiumUI";
import { PremiumBackground } from "../components/PremiumBackground";
import { ConnectionIndicator } from "../components/ConnectionIndicator";

export default function VerifyOTPScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const emailParam = useMemo(() => (typeof params.email === 'string' ? params.email : ''), [params.email]);

  const [email] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ visible: false, message: "", type: "info" });
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await appService.getPublicDetails(Config.APP_ID);
        if (response.data.success) {
          setBranding(response.data.data.app.branding);
        }
      } catch (error) {
        console.log('Failed to fetch branding:', error);
      }
    };
    fetchBranding();
  }, []);

  const showAlert = useCallback((message, type = "info") => {
    setAlert({ visible: true, message, type });
    if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const onVerify = async () => {
    if (!otp || otp.length < 6) {
      showAlert("Enter the 6 digit OTP sent to your email.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.verifyEmailOTP({ email: email.trim().toLowerCase(), otp_code: otp.trim() });
      if (res?.success) {
        showAlert("OTP verified successfully.", "success");
        setTimeout(() => {
          router.replace("/login");
        }, 1500);
      } else {
        showAlert(res?.message || "Invalid OTP", "error");
      }
    } catch (e) {
      showAlert(e.message || "Verification failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await authService.resendOTP('', email.trim().toLowerCase());
      if (res?.success) {
        showAlert("A new OTP has been sent.", "success");
      } else {
        showAlert(res?.message || "Failed to resend OTP", "error");
      }
    } catch (e) {
      showAlert(e.message || "Failed to resend OTP", "error");
    }
  };

  const brandColor = branding?.primary_color || "#00ADFF";
  const textColor = isDark ? "#FFF" : "#000";

  return (
    <PremiumBackground isDark={isDark} brandColor={brandColor}>
      <ConnectionIndicator />
      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
            <View style={styles.iconBox}>
              <Image
                source={branding?.logo_url ? { uri: branding.logo_url } : require("../assets/images/logo.png")}
                style={styles.logo}
              />
            </View>
            <Text style={[styles.title, { color: textColor }]}>Verification</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#AAA' : '#666' }]}>
              Enter the code sent to your email
            </Text>
            <Text style={[styles.emailText, { color: brandColor }]}>{email}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)} style={styles.form}>
            <PremiumInput
              label="OTP Code"
              icon="numeric"
              value={otp}
              onChangeText={setOtp}
              isDark={isDark}
              placeholder="••••••"
              keyboardType="number-pad"
              autoCapitalize="none"
            />

            <PremiumButton
              title="Verify Code"
              onPress={onVerify}
              loading={submitting}
              disabled={otp.length < 6}
              brandColor={brandColor}
              style={{ marginTop: 20 }}
            />

            <View style={styles.footer}>
              <TouchableOpacity onPress={onResend}>
                <Text style={[styles.resendText, { color: brandColor }]}>Resend OTP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.replace("/login")}>
                <Text style={[styles.backText, { color: isDark ? '#AAA' : '#666' }]}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 14, fontFamily: "Poppins-Regular" },
  formContainer: { paddingHorizontal: 24 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, marginBottom: 8, fontFamily: "Poppins-Medium" },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 50 },
  input: { flex: 1, height: 50, fontFamily: "Poppins-Regular" },
  buttonContainer: { marginTop: 8 },
  button: { height: 50, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  primaryButton: { backgroundColor: "#0A2540" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Poppins-SemiBold" },
  buttonDisabled: { opacity: 0.6 },
  secondaryButton: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#334155" },
  ghostButton: { backgroundColor: "transparent" },
  secondaryButtonText: { color: "#334155", fontFamily: "Poppins-Medium" },
});
