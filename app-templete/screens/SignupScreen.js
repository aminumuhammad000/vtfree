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

  const router = useRouter();
  const { isDark } = useTheme();

  const theme = {
    primary: "#0A2540",
    accent: "#FF9F43",
    backgroundLight: "#F8F9FA",
    backgroundDark: "#111921",
    textHeadings: "#1E293B",
    textBody: "#475569",
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const textColor = isDark ? "#FFFFFF" : theme.textHeadings;
  const textBodyColor = isDark ? "#9CA3AF" : theme.textBody;
  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const borderColor = isDark ? "#374151" : "#334155";

  /* REMOVED handleNextStep1 */

  /* REMOVED OTP LOGIC 
  const handleVerifyEmail = async () => { ... }
  */

  const handleSignup = async () => {
    // Validate all fields at once
    if (!fullName || !email || !phone_number || !password || !pin) {
      Alert.alert("Missing Information", "Please fill in all fields");
      return;
    }

    if (!/^[0-9]{10,15}$/.test(phone_number)) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      Alert.alert("Validation Error", "PIN must be exactly 4 digits");
      return;
    }

    setIsLoading(true);

    // Split full name
    const names = fullName.trim().split(" ");
    const first_name = names[0];
    const last_name = names.slice(1).join(" ") || names[0]; // Fallback if no last name

    try {
      // Direct Register without OTP
      const response = await authService.register({
        email,
        phone_number,
        password,
        first_name,
        last_name,
        referral_code: referral_code || undefined,
        pin,
      });

      if (response.success) {
        Alert.alert("🎉 Account Created", `Welcome ${first_name}! Your account is ready.`, [
          { text: "Continue", onPress: () => router.replace("/(tabs)") }
        ]);
      }
    } catch (error) {
      Alert.alert(
        "❌ Signup Failed",
        error.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: textColor }]}>Full Name</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Enter your full name"
            placeholderTextColor={textBodyColor}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            selectionColor="#3B82F6"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: textColor }]}>Email Address</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Enter your email address"
            placeholderTextColor={textBodyColor}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor="#3B82F6"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: textColor }]}>Phone Number</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.countryCode, { color: textColor }]}>+234</Text>
          <TextInput
            style={[styles.input, { marginLeft: 8, color: textColor }]}
            placeholder="Enter your phone number"
            placeholderTextColor={textBodyColor}
            value={phone_number}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={15}
            selectionColor="#3B82F6"
          />
        </View>
      </View>

      {/* Merged Password Fields */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: textColor }]}>Create Password</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Create a password"
            placeholderTextColor={textBodyColor}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            selectionColor="#3B82F6"
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
        <Text style={[styles.inputLabel, { color: textColor }]}>Create Transaction PIN</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Enter 4-digit PIN"
            placeholderTextColor={textBodyColor}
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            selectionColor="#3B82F6"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: textColor }]}>Referral Code (Optional)</Text>
        <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Enter referral code"
            placeholderTextColor={textBodyColor}
            value={referral_code}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            selectionColor="#3B82F6"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  /* REMOVED renderStep2 and renderStep3 */

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
            source={require("../assets/images/ibdatalogo.png")}
            style={styles.logo}
          />
          <Text style={[styles.title, { color: textColor }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: textBodyColor }]}>
            Fill in your details to get started
          </Text>
        </View>

        {renderStep1()}
        {/* Step 2 and 3 removed */}

        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: textBodyColor }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={[styles.loginLink, { color: isDark ? theme.accent : theme.primary }]}>Log In</Text>
          </TouchableOpacity>
        </View>
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
