import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from "expo-router";
import { Config } from "../constants/Config";
import { useCallback, useEffect, useState } from "react";
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
  View
} from "react-native";
import CustomAlert from "../components/CustomAlert";
import { useTheme } from "../components/ThemeContext";
import { appService } from "../services/api"; // Added import

import { useAuth } from "../context/AuthContext";

const LoginScreen = () => {
  const { login, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [branding, setBranding] = useState(null); // Added branding state
  const router = useRouter();

  // Fetch branding
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await appService.getPublicDetails(Config.APP_ID);
        if (response.data.success) {
          console.log('Branding fetched:', response.data.data.app.branding);
          setBranding(response.data.data.app.branding);
        }
      } catch (error) {
        console.log('Failed to fetch branding:', error);
      }
    };
    fetchBranding();
  }, []);

  // Check for biometrics and saved credentials
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const credentials = await AsyncStorage.getItem('biometric_credentials');

        setIsBiometricSupported(compatible && enrolled);
        setHasSavedCredentials(!!credentials);
      } catch (error) {
        console.log('Biometric check failed:', error);
      }
    };

    checkBiometrics();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  const showAlert = useCallback((message, type = "info") => {
    setAlert({
      visible: true,
      message,
      type,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        setIsLoggingIn(true);
        const credentials = await AsyncStorage.getItem('biometric_credentials');

        if (credentials) {
          const { email: savedEmail, password: savedPassword } = JSON.parse(credentials);

          const response = await login({
            email: savedEmail,
            password: savedPassword,
          });

          if (response.success) {
            showAlert("Login successful!", "success");
            router.replace("/(tabs)");
          } else {
            showAlert("Login failed. Please enter password.", "error");
          }
        }
      }
    } catch (error) {
      console.log('Biometric login error:', error);
      showAlert("Biometric login failed", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      showAlert("Please enter both email and password", "error");
      return;
    }

    if (password.length < 6) {
      showAlert("Password must be at least 6 characters", "error");
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success) {
        // Save credentials for biometric login
        await AsyncStorage.setItem('biometric_credentials', JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        }));

        showAlert("Login successful! Biometrics enabled for next time.", "success");
        router.replace("/(tabs)");
      } else {
        showAlert(
          response.message || "Invalid email or password. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (
        error.message &&
        (error.message.includes("Network Error") ||
          error.message.includes("timeout"))
      ) {
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      showAlert(errorMessage, "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const theme = {
    primary: "#0A2540",
    accent: "#FF9F43",
    backgroundLight: "#F8F9FA",
    backgroundDark: "#111921",
    textHeadings: "#1E293B",
    textBody: "#475569",
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  // Use branding color if available, otherwise default
  const brandColor = branding?.primary_color || (isDark ? theme.accent : theme.primary);

  const textColor = isDark ? "#FFFFFF" : theme.textHeadings;
  const textBodyColor = isDark ? "#9CA3AF" : theme.textBody;
  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  // Use branding color for border if available
  const borderColor = branding?.primary_color || (isDark ? "#374151" : "#334155");

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
        duration={5000}
      />

      {/* Full screen loader */}
      {isLoggingIn && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brandColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>Signing in...</Text>
          </View>
        </View>
      )}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={branding?.logo_url ? { uri: branding.logo_url } : require("../assets/images/logo.png")}
              style={styles.logo}
            />
            {/* Apply brand color to title */}
            <Text style={[styles.title, { color: brandColor }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: textBodyColor }]}>Sign in to access your account</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              {/* Apply brand color to label */}
              <Text style={[styles.inputLabel, { color: brandColor }]}>Email</Text>
              <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: borderColor }]}>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Enter your email address"
                  placeholderTextColor={textBodyColor}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={brandColor}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              {/* Apply brand color to label */}
              <Text style={[styles.inputLabel, { color: brandColor }]}>Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: borderColor }]}>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Enter your password"
                  placeholderTextColor={textBodyColor}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  selectionColor={brandColor}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color={textBodyColor}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  (isLoggingIn || !email || !password) && styles.buttonDisabled,
                  { backgroundColor: brandColor } // Apply brand color to button background
                ]}
                onPress={handleLogin}
                disabled={isLoggingIn || !email || !password}
                activeOpacity={0.8}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {isBiometricSupported && hasSavedCredentials && (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton, { marginTop: -8 }]}
                  onPress={handleBiometricLogin}
                  disabled={isLoggingIn}
                >
                  <Ionicons name="finger-print" size={24} color={isDark ? "#FFFFFF" : "#1E293B"} />
                  <Text style={[styles.secondaryButtonText, { color: isDark ? "#FFFFFF" : "#1E293B" }]}>
                    Login with Biometrics
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity
                  onPress={() => router.push("/forgot-password")}
                >
                  <Text style={[styles.forgotPassword, { color: isDark ? theme.accent : theme.primary }]}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: textBodyColor }]}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/signup")}>
                <Text style={[styles.signupLink, { color: isDark ? theme.accent : theme.primary }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
  ;

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    position: "relative",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 32,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 0,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#1E293Bf0",
    textAlign: "center",
    marginBottom: 32,
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    fontSize: 16,
    color: "#1E293B",
    padding: 0,
    margin: 0,
    height: "100%",
    flex: 1,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#1E293B",
    width: "100%",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#1E293B",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  secondaryButtonText: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  forgotPassword: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#D1D5DB",
  },
  dividerText: {
    color: "#6B7280",
    fontSize: 14,
    marginHorizontal: 12,
  },
  socialButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  signupText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signupLink: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  termsText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  linkText: {
    color: "#3B82F6",
    textDecorationLine: "underline",
  },
  otpContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111921",
    marginBottom: 12,
    textAlign: "center",
  },
  otpSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#111921",
  },
  resendText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  resendLink: {
    color: "#3B82F6",
    fontWeight: "500",
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});
