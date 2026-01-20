import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { authService } from "../services/auth.service";
import { useAlert } from "../components/AlertContext";

import { Config } from "../constants/Config";
import { appService } from "../services/api"; // Added import
import { useEffect } from "react"; // Added useEffect

const SignupScreen = () => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [referral_code, setReferralCode] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [branding, setBranding] = useState(null);

  const router = useRouter();
  const { isDark } = useTheme();

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

  const theme = {
    primary: "#0A2540",
    accent: "#FF9F43",
    backgroundLight: "#F8F9FA",
    backgroundDark: "#111921",
    textHeadings: "#1E293B",
    textBody: "#475569",
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const brandColor = branding?.primary_color || (isDark ? theme.accent : theme.primary);
  const textColor = isDark ? "#FFFFFF" : theme.textHeadings;
  const textBodyColor = isDark ? "#9CA3AF" : theme.textBody;
  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const borderColor = branding?.primary_color || (isDark ? "#374151" : "#334155");

  const { showSuccess, showError, showWarning } = useAlert();

  const handleNextStep1 = async () => {
    if (!fullName || !email || !phone_number) {
      showWarning("Please fill in all fields");
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

    setPhoneNumber(formattedPhone);

    setIsLoading(true);
    try {
      await authService.resendOTP(formattedPhone, email);
      showSuccess(`We have sent a verification code to ${email}`);
      setStep(2);
    } catch (error) {
      console.log("OTP Error", error);
      showError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!otpCode) {
      showWarning("Please enter the verification code");
      return;
    }
    setIsVerifying(true);
    try {
      await authService.verifyOTP(phone_number, otpCode);
      setStep(3);
    } catch (error) {
      showError(error.message || "Invalid code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignup = async () => {
    if (!password || !pin) {
      showWarning("Please fill in all fields");
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
      const response = await authService.register({
        email,
        phone_number,
        password,
        first_name,
        last_name,
        referral_code: referral_code || undefined,
        pin,
        app_id: Config.APP_ID, // Include app_id
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

  const renderStep1 = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: brandColor }]}>Full Name</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Enter your full name"
            placeholderTextColor={textBodyColor}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            selectionColor={brandColor}
          />
        </View>
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: brandColor }]}>Email Address</Text>
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
        <Text style={[styles.inputLabel, { color: brandColor }]}>Phone Number</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <Text style={[styles.countryCode, { color: textColor }]}>+234</Text>
          <TextInput
            style={[styles.input, { marginLeft: 8, color: textColor }]}
            placeholder="Enter your phone number"
            placeholderTextColor={textBodyColor}
            value={phone_number}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={15}
            selectionColor={brandColor}
          />
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton, { backgroundColor: brandColor }]}
        onPress={handleNextStep1}
      >
        <Text style={styles.primaryButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formContainer}>
      <Text style={[styles.stepTitle, { color: brandColor }]}>Confirm Email</Text>
      <Text style={[styles.stepSubtitle, { color: textBodyColor }]}>
        We've sent a verification code to {email}
      </Text>
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: brandColor }]}>Verification Code</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor, textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
            placeholder="000000"
            placeholderTextColor={textBodyColor}
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            maxLength={6}
            selectionColor={brandColor}
          />
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton, { backgroundColor: brandColor }]}
        onPress={handleVerifyEmail}
        disabled={isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Verify Email</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
        <Text style={[styles.linkText, { textAlign: 'center', color: brandColor }]}>Back to details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: brandColor }]}>Create Password</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Create a password"
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
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: brandColor }]}>Create Transaction PIN</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Enter 4-digit PIN"
            placeholderTextColor={textBodyColor}
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            selectionColor={brandColor}
          />
        </View>
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: brandColor }]}>Referral Code (Optional)</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Enter referral code"
            placeholderTextColor={textBodyColor}
            value={referral_code}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            selectionColor={brandColor}
          />
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled, { backgroundColor: brandColor }]}
        onPress={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setStep(2)} style={styles.backButton}>
        <Text style={[styles.linkText, { textAlign: 'center', color: brandColor }]}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
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
          <Text style={[styles.title, { color: brandColor }]}>
            {step === 1 ? "Create Account" : step === 2 ? "Verify Email" : "Secure Account"}
          </Text>
          <Text style={[styles.subtitle, { color: textBodyColor }]}>
            {step === 1 ? "Fill in your details to get started" : step === 2 ? "Enter the code sent to your email" : "Set up your security credentials"}
          </Text>
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {step === 1 && (
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: textBodyColor }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={[styles.loginLink, { color: brandColor }]}>Log In</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    color: "#5e6875ff",
    textAlign: "center",
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 16,
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
    borderColor: "#334155",
    height: 56,
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  countryCode: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
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
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 16,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: "#0A2A4E",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 8,
    padding: 8,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loginLink: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  linkText: {
    color: "#3B82F6",
    textDecorationLine: "underline",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default SignupScreen;
