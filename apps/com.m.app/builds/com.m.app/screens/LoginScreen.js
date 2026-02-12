import React, { useCallback, useEffect, useState, useRef } from "react";
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
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';

import { Config } from "../constants/Config";
import CustomAlert from "../components/CustomAlert";
import { useTheme } from "../components/ThemeContext";
import { appService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { PremiumInput, PremiumButton } from "../components/PremiumUI";
import { PremiumBackground } from "../components/PremiumBackground";

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const { login, isAuthenticated } = useAuth();
  const { isDark, theme } = useTheme();
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

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  const showAlert = useCallback((message, type = "info") => {
    setAlert({ visible: true, message, type });
    if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("Please enter both email and password", "error");
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success) {
        await AsyncStorage.setItem('biometric_credentials', JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        }));
        showAlert("Login successful!", "success");
        router.replace("/(tabs)");
      } else {
        showAlert(response.message || "Invalid credentials", "error");
      }
    } catch (error) {
      showAlert(error.message || "An unexpected error occurred", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
      });

      if (result.success) {
        const credentials = await AsyncStorage.getItem('biometric_credentials');
        if (credentials) {
          setIsLoggingIn(true);
          const { email: savedEmail, password: savedPassword } = JSON.parse(credentials);
          const response = await login({ email: savedEmail, password: savedPassword });
          if (response.success) {
            router.replace("/(tabs)");
          } else {
            showAlert("Biometric login failed", "error");
          }
        }
      }
    } catch (error) {
      showAlert("Biometric login error", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const brandColor = theme.primary;
  const textColor = theme.text;
  const textSecondaryColor = theme.textSecondary;

  return (
    <PremiumBackground isDark={isDark} brandColor={brandColor}>
      <CustomAlert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
            <Animated.View entering={ZoomIn.delay(400).springify()}>
              <View style={styles.logoContainer}>
                <Image
                  source={branding?.logo_url ? { uri: branding.logo_url } : require("../assets/images/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>
            <Text style={[styles.title, { color: textColor }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
              Login to access your dashboard
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.form}>
            <PremiumInput
              label="Username or Email"
              icon="email-outline"
              value={email}
              onChangeText={setEmail}
              isDark={isDark}
              placeholder="Enter your email"
              keyboardType="email-address"
            />

            <PremiumInput
              label="Password"
              icon="lock-outline"
              value={password}
              onChangeText={setPassword}
              isDark={isDark}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/forgot-password");
              }}
              style={styles.forgotBtn}
            >
              <Text style={[styles.forgotText, { color: brandColor }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <PremiumButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoggingIn}
              disabled={!email || !password}
              brandColor={brandColor}
              style={{ marginTop: 10 }}
            />

            {isBiometricSupported && hasSavedCredentials && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                style={styles.biometricBtn}
              >
                <MaterialCommunityIcons name="fingerprint" size={40} color={brandColor} />
                <Text style={[styles.biometricText, { color: textColor }]}>Use Biometrics</Text>
              </TouchableOpacity>
            )}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: textSecondaryColor }]}>
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => {
                Haptics.selectionAsync();
                router.push("/signup");
              }}>
                <Text style={[styles.signUpText, { color: brandColor }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PremiumBackground>
  );
};

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
  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,173,255,0.08)',
    borderRadius: 12,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  biometricBtn: {
    alignItems: 'center',
    marginTop: 30,
    padding: 10,
  },
  biometricText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '500',
  },
  signUpText: {
    fontSize: 15,
    fontWeight: '800',
  }
});

export default LoginScreen;
