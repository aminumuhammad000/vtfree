import React, { useCallback, useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import { useTheme } from "../components/ThemeContext";
import CustomAlert from "../components/CustomAlert";
import { authService } from "../services/auth.service";
import { appService } from "../services/api";
import { Config } from "../constants/Config";
import { PremiumInput, PremiumButton } from "../components/PremiumUI";
import { PremiumBackground } from "../components/PremiumBackground";
import { ConnectionIndicator } from "../components/ConnectionIndicator";

export default function ForgotPasswordScreen() {
  const { isDark, theme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
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

  const onSubmit = async () => {
    if (!email) {
      showAlert("Please enter your email", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authService.requestPasswordReset({ email: email.trim().toLowerCase() });
      if (res?.success) {
        showAlert("OTP has been sent to your email.", "success");
        setTimeout(() => {
          router.push({ pathname: "/verify-otp", params: { email: email.trim().toLowerCase() } });
        }, 1500);
      } else {
        showAlert(res?.message || "Failed to send OTP", "error");
      }
    } catch (e) {
      showAlert(e.message || "An error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const brandColor = branding?.primary_color || theme.primary;
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;

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
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Image
                source={branding?.logo_url ? { uri: branding.logo_url } : require("../assets/images/logo.png")}
                style={styles.logo}
              />
            </TouchableOpacity>
            <Text style={[styles.title, { color: textColor }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
              Enter your email to receive a reset OTP
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)} style={styles.form}>
            <PremiumInput
              label="Email Address"
              icon="email-outline"
              value={email}
              onChangeText={setEmail}
              isDark={isDark}
              placeholder="Enter your email"
              keyboardType="email-address"
            />

            <PremiumButton
              title="Send Reset OTP"
              onPress={onSubmit}
              loading={submitting}
              disabled={!email}
              brandColor={brandColor}
              style={{ marginTop: 20 }}
            />

            <TouchableOpacity
              style={[styles.backToLogin, { backgroundColor: brandColor + '15' }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.replace("/login");
              }}
            >
              <Text style={[styles.backText, { color: brandColor }]}>Back to Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 100 : 70,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backBtn: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  backToLogin: {
    marginTop: 30,
    alignSelf: 'center',
    padding: 10,
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
  }
});
