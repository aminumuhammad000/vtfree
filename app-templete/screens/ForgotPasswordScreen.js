import React, { useCallback, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../components/ThemeContext";
import CustomAlert from "../components/CustomAlert";
import { authService } from "../services/auth.service";
import { appService } from "../services/api";

import { Config } from "../constants/Config";

export default function ForgotPasswordScreen() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ visible: false, message: "", type: "info" });
  const [branding, setBranding] = useState(null);

  // Fetch branding
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
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const theme = {
    primary: "#00ADFF", // Snapchat Blue
    backgroundLight: "#FFFFFF",
    backgroundDark: "#000000",
    inputLight: "#F2F2F2",
    inputDark: "#1E1E1E",
    textLight: "#000000",
    textDark: "#FFFFFF",
    textSecondaryLight: "#757575",
    textSecondaryDark: "#A0A0A0",
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
  const inputBg = isDark ? theme.inputDark : theme.inputLight;
  const brandColor = branding?.primary_color || theme.primary;

  const onSubmit = async () => {
    if (!email) {
      showAlert("Please enter your email address", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authService.requestPasswordReset({ email: email.trim().toLowerCase() });
      if (res?.success) {
        showAlert("OTP has been sent to your email.", "success");
        setTimeout(() => {
          router.push({ pathname: "/verify-otp", params: { email: email.trim().toLowerCase() } });
        }, 500);
      } else {
        showAlert(res?.message || "Failed to send OTP. Please try again.", "error");
      }
    } catch (e) {
      const msg = e?.message || "Failed to send OTP. Please try again.";
      showAlert(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
        duration={5000}
      />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={branding?.logo_url ? { uri: branding.logo_url } : require("../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { color: textColor }]}>Forgot Password</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>EMAIL ADDRESS</Text>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder=""
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={brandColor}
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, (submitting || !email) && styles.buttonDisabled, { backgroundColor: brandColor }]}
                onPress={onSubmit}
                disabled={submitting || !email}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace("/login")}>
                <Text style={[styles.secondaryButtonText, { color: brandColor }]}>Back to Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    padding: 32,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  logoContainer: { alignItems: "center", marginBottom: 48 },
  logoWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: { width: 70, height: 70 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  formContainer: { width: "100%" },
  inputContainer: { marginBottom: 20 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 1,
    paddingLeft: 4,
  },
  inputWrapper: {
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    fontSize: 16,
    height: "100%",
    flex: 1,
    fontWeight: '500',
  },
  buttonContainer: { marginTop: 16 },
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  buttonDisabled: { opacity: 0.5 },
  secondaryButton: {
    alignSelf: 'center',
    padding: 12,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "700" },
});
