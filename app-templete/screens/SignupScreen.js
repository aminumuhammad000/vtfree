import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
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
import { useTheme } from "../components/ThemeContext";
import { authService } from "../services/auth.service";
import { useAlert } from "../components/AlertContext";
import { Config } from "../constants/Config";
import { appService } from "../services/api";

const { width, height } = Dimensions.get('window');

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
  const { isDark } = useTheme();
  const { showSuccess, showError, showWarning } = useAlert();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Fetch branding and animate on mount
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

  const handleSignup = async () => {
    // Validate all fields at once
    if (!fullName || !email || !phone_number || !password || !pin) {
      showWarning("Please fill in all required fields");
      return;
    }

    let formattedPhone = phone_number.trim().replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '0' + formattedPhone;
    }

    if (formattedPhone.length !== 11 || !formattedPhone.startsWith('0')) {
      showWarning("Please enter a valid 11-digit phone number starting with 0");
      return;
    }

    if (password.length < 6) {
      showWarning("Password must be at least 6 characters");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      showWarning("PIN must be exactly 4 digits");
      return;
    }

    setIsLoading(true);
    const names = fullName.trim().split(" ");
    const first_name = names[0];
    const last_name = names.slice(1).join(" ") || names[0];

    try {
      // Direct Register without OTP
      const response = await authService.register({
        email: email.trim().toLowerCase(),
        phone_number: formattedPhone,
        password,
        first_name,
        last_name,
        referral_code: referral_code || undefined,
        pin,
        app_id: Config.APP_ID,
      });

      if (response.success) {
        showSuccess(`Welcome ${first_name}! Your account is ready.`);
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      }
    } catch (error) {
      showError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!fullName || !email) {
        showWarning("Please fill in your name and email");
        return;
      }
      if (!email.includes('@')) {
        showWarning("Please enter a valid email address");
        return;
      }
    } else if (currentStep === 2) {
      if (!phone_number || !password) {
        showWarning("Please fill in your phone and password");
        return;
      }
      if (password.length < 6) {
        showWarning("Password must be at least 6 characters");
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSignup();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressSegment,
              {
                backgroundColor: s <= currentStep ? brandColor : isDark ? "#333" : "#E0E0E0",
                flex: 1,
                marginHorizontal: 2,
              }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          {renderProgressBar()}
          <View style={{ width: 40 }} />
        </View>

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
            <Text style={[styles.title, { color: textColor }]}>
              {currentStep === 1 ? "What's your name?" :
                currentStep === 2 ? "Security Check" :
                  "Almost there!"}
            </Text>
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
              {currentStep === 1 && (
                <>
                  {/* Full Name */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>FULL NAME</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder=""
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        selectionColor={brandColor}
                      />
                    </View>
                  </View>

                  {/* Email */}
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
                </>
              )}

              {currentStep === 2 && (
                <>
                  {/* Phone */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>PHONE NUMBER</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                      <Text style={[styles.countryCode, { color: textColor }]}>+234</Text>
                      <TextInput
                        style={[styles.input, { marginLeft: 8, color: textColor }]}
                        placeholder=""
                        value={phone_number}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        maxLength={15}
                        selectionColor={brandColor}
                      />
                    </View>
                  </View>

                  {/* Password */}
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
                </>
              )}

              {currentStep === 3 && (
                <>
                  {/* PIN */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>TRANSACTION PIN (4 DIGITS)</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder=""
                        value={pin}
                        onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
                        keyboardType="number-pad"
                        secureTextEntry={!showPin}
                        maxLength={4}
                        selectionColor={brandColor}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPin(!showPin)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name={showPin ? "visibility-off" : "visibility"}
                          size={20}
                          color={textSecondaryColor}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Referral (Optional) */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>REFERRAL CODE (OPTIONAL)</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder=""
                        value={referral_code}
                        onChangeText={setReferralCode}
                        autoCapitalize="characters"
                        selectionColor={brandColor}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: brandColor },
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={nextStep}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {currentStep === totalSteps ? "Sign Up & Accept" : "Continue"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Login Link */}
          {currentStep === 1 && (
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: textSecondaryColor }]}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/login")} activeOpacity={0.7}>
                <Text style={[styles.loginLink, { color: brandColor }]}>
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 4,
    marginHorizontal: 10,
  },
  progressSegment: {
    height: '100%',
    borderRadius: 2,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 32,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
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
    marginBottom: 16,
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
  countryCode: {
    fontSize: 16,
    fontWeight: "600",
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
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
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
  buttonDisabled: {
    // Removed opacity to maintain full color
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
