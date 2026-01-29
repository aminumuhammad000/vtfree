import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from "expo-router";
import { Config } from "../constants/Config";
import { useCallback, useEffect, useState, useRef } from "react";
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
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from "../components/CustomAlert";
import { useTheme } from "../components/ThemeContext";
import { appService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get('window');

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
  const [branding, setBranding] = useState(null);
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const passwordFocusAnim = useRef(new Animated.Value(0)).current;

  // Fetch branding and animate on mount
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

    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
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

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
        duration={5000}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: logoScale }
                ]
              }
            ]}
          >
            <View style={styles.logoWrapper}>
              <Image
                source={branding?.logo_url ? { uri: branding.logo_url } : require("../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { color: textColor }]}>Log In</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.formContent}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>USERNAME OR EMAIL</Text>
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
                    onFocus={() => Animated.spring(emailFocusAnim, { toValue: 1, useNativeDriver: true }).start()}
                    onBlur={() => Animated.spring(emailFocusAnim, { toValue: 0, useNativeDriver: true }).start()}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>PASSWORD</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder=""
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    selectionColor={brandColor}
                    onFocus={() => Animated.spring(passwordFocusAnim, { toValue: 1, useNativeDriver: true }).start()}
                    onBlur={() => Animated.spring(passwordFocusAnim, { toValue: 0, useNativeDriver: true }).start()}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={20}
                      color={textSecondaryColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={() => router.push("/forgot-password")}
                activeOpacity={0.7}
              >
                <Text style={[styles.forgotPassword, { color: brandColor }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: brandColor },
                  (isLoggingIn || !email || !password) && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoggingIn || !email || !password}
                activeOpacity={0.85}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </TouchableOpacity>

              {/* Biometric Login */}
              {isBiometricSupported && hasSavedCredentials && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={isLoggingIn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="finger-print" size={32} color={brandColor} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: textSecondaryColor }]}>
              New to the app?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/signup")} activeOpacity={0.7}>
              <Text style={[styles.signupLink, { color: brandColor }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 32,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  formContainer: {
    width: "100%",
  },
  formContent: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
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
  eyeIcon: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  forgotPasswordContainer: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: "600",
  },
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
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  biometricButton: {
    alignSelf: 'center',
    padding: 12,
  },
  buttonDisabled: {
    // Removed opacity to maintain full color
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  signupText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
