import React, { useState, useEffect, useRef } from "react";
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
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  Layout
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../components/ThemeContext";
import { authService } from "../services/auth.service";
import { useAlert } from "../components/AlertContext";
import { Config } from "../constants/Config";
import { appService } from "../services/api";
import { PremiumInput, PremiumButton } from "../components/PremiumUI";
import { PremiumBackground } from "../components/PremiumBackground";
import { ConnectionIndicator } from "../components/ConnectionIndicator";

const { width } = Dimensions.get('window');

const SignupScreen = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [referral_code, setReferralCode] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [branding, setBranding] = useState(null);

  const router = useRouter();
  const { isDark, theme } = useTheme();
  const { showSuccess, showError, showWarning } = useAlert();

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

  const handleSignup = async () => {
    if (!fullName || !email || !phone_number || !password || !pin) {
      showWarning("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    const names = fullName.trim().split(" ");
    const first_name = names[0];
    const last_name = names.slice(1).join(" ") || names[0];

    try {
      const response = await authService.register({
        email: email.trim().toLowerCase(),
        phone_number: phone_number.replace(/\D/g, ''),
        password,
        first_name,
        last_name,
        referral_code: referral_code || undefined,
        pin,
        app_id: Config.APP_ID,
      });

      if (response.success) {
        showSuccess(`Welcome ${first_name}! Your account is ready.`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      }
    } catch (error) {
      showError(error.message || "Registration failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep === 1) {
      if (!fullName || !email) return showWarning("Please fill in your name and email");
      if (!email.includes('@')) return showWarning("Please enter a valid email");
    } else if (currentStep === 2) {
      if (!phone_number || !password) return showWarning("Please fill in your phone and password");
      if (password.length < 6) return showWarning("Password must be at least 6 characters");
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSignup();
    }
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const brandColor = theme.primary;
  const textColor = theme.text;
  const textSecondaryColor = theme.textSecondary;

  return (
    <PremiumBackground isDark={isDark} brandColor={brandColor}>
      <ConnectionIndicator />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={textColor} />
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: brandColor,
                  width: `${(currentStep / totalSteps) * 100}%`
                }
              ]}
              layout={Layout.springify()}
            />
          </View>
          <Text style={[styles.stepText, { color: textSecondaryColor }]}>
            {currentStep}/{totalSteps}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            key={currentStep}
            entering={SlideInRight.duration(400)}
            exiting={SlideOutLeft.duration(400)}
            style={styles.stepContainer}
          >
            <Text style={[styles.title, { color: textColor }]}>
              {currentStep === 1 ? "What's your name?" :
                currentStep === 2 ? "Security setup" :
                  "Final touch"}
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#AAA' : '#666' }]}>
              {currentStep === 1 ? "Let's start with the basics" :
                currentStep === 2 ? "Keep your account safe" :
                  "Set your transaction PIN"}
            </Text>

            <View style={styles.form}>
              {currentStep === 1 && (
                <>
                  <PremiumInput
                    label="Full Name"
                    icon="account-outline"
                    value={fullName}
                    onChangeText={setFullName}
                    isDark={isDark}
                    placeholder="John Doe"
                  />
                  <PremiumInput
                    label="Email Address"
                    icon="email-outline"
                    value={email}
                    onChangeText={setEmail}
                    isDark={isDark}
                    placeholder="john@example.com"
                    keyboardType="email-address"
                  />
                </>
              )}

              {currentStep === 2 && (
                <>
                  <PremiumInput
                    label="Phone Number"
                    icon="phone-outline"
                    value={phone_number}
                    onChangeText={setPhoneNumber}
                    isDark={isDark}
                    placeholder="08012345678"
                    keyboardType="phone-pad"
                  />
                  <PremiumInput
                    label="Create Password"
                    icon="lock-outline"
                    value={password}
                    onChangeText={setPassword}
                    isDark={isDark}
                    placeholder="Min. 6 characters"
                    secureTextEntry={!showPassword}
                  />
                </>
              )}

              {currentStep === 3 && (
                <>
                  <PremiumInput
                    label="Transaction PIN"
                    icon="numeric"
                    value={pin}
                    onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
                    isDark={isDark}
                    placeholder="****"
                    keyboardType="number-pad"
                    secureTextEntry={!showPin}
                  />
                  <PremiumInput
                    label="Referral Code (Optional)"
                    icon="ticket-outline"
                    value={referral_code}
                    onChangeText={setReferralCode}
                    isDark={isDark}
                    placeholder="Enter code if any"
                    autoCapitalize="characters"
                  />
                </>
              )}

              <PremiumButton
                title={currentStep === totalSteps ? "Finish & Sign Up" : "Continue"}
                onPress={nextStep}
                loading={isLoading}
                brandColor={brandColor}
                style={{ marginTop: 20 }}
              />
            </View>
          </Animated.View>

          {currentStep === 1 && (
            <Animated.View entering={FadeInDown.delay(600)} style={styles.footer}>
              <Text style={[styles.footerText, { color: textSecondaryColor }]}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={[styles.loginText, { color: brandColor }]}>Log In</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </PremiumBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    width: 35,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  stepContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 40,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '500',
  },
  loginText: {
    fontSize: 15,
    fontWeight: '800',
  }
});

export default SignupScreen;
