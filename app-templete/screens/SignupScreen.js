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
import { authService } from "../services/auth.service";
import { useTheme } from "../components/ThemeContext";

const SignupScreen = () => {
  const [email, setEmail] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [referral_code, setReferralCode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSignup = async () => {
    // Validation
    if (
      !email ||
      !password ||
      !confirmPassword ||
      !first_name ||
      !last_name ||
      !phone_number
    ) {
      Alert.alert("❌ Validation Error", "Please fill in all required fields");
      return;
    }

    if (!/^[0-9]{10,15}$/.test(phone_number)) {
      Alert.alert(
        "❌ Validation Error",
        "Please enter a valid phone number (10-15 digits)"
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("❌ Validation Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "❌ Validation Error",
        "Password must be at least 6 characters"
      );
      return;
    }

    // Validate Transaction PIN
    if (!/^\d{4}$/.test(pin) || !/^\d{4}$/.test(confirmPin)) {
      Alert.alert("❌ Validation Error", "Transaction PIN must be exactly 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("❌ Validation Error", "PIN codes do not match");
      return;
    }


    setIsLoading(true);

    try {
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
          <Text style={[styles.title, { color: textColor }]}>Create an Account</Text>
          <Text style={[styles.subtitle, { color: textBodyColor }] }>
            Fill in your details to get started
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textColor }]}>First Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }] }>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Enter your first name"
                placeholderTextColor={textBodyColor}
                value={first_name}
                onChangeText={setFirstName}
                autoCapitalize="words"
                selectionColor="#3B82F6"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textColor }]}>Last Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }] }>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Enter your last name"
                placeholderTextColor={textBodyColor}
                value={last_name}
                onChangeText={setLastName}
                autoCapitalize="words"
                selectionColor="#3B82F6"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textColor }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }] }>
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
            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }] }>
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

          {/* Transaction PIN */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textColor }]}>Transaction PIN</Text>
            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }] }>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor={textBodyColor}
                value={pin}
                onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0,4))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                selectionColor="#3B82F6"
              />
            </View>
          </View>

          {/* Confirm PIN */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textColor }]}>Confirm PIN</Text>
            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }] }>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Confirm 4-digit PIN"
                placeholderTextColor={textBodyColor}
                value={confirmPin}
                onChangeText={(t) => setConfirmPin(t.replace(/\D/g, '').slice(0,4))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                selectionColor="#3B82F6"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textColor }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }] }>
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
            <Text style={[styles.inputLabel, { color: textColor }]}>Confirm Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor }] }>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Confirm your password"
                placeholderTextColor={textBodyColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                selectionColor="#3B82F6"
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter referral code"
                placeholderTextColor="#9CA3AF"
                value={referral_code}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
                selectionColor="#3B82F6"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* <TouchableOpacity style={[styles.button, styles.socialButton, { backgroundColor: '#FFFFFF' }]}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-LBgmwH2QdH0SMXnLSqgIzuC4R-0W0RvWdTNEr_NpllN6NV6rCHU_urzGTET9ukQggSllwcntrBKYQVjrGy6faoX8uS7vMBRmj0MiDrwzQTD-97DXh-l4_fFuLdxeafoJtGGTZjvDSFe-Tugarxj95ecQrLItSiak6VEG-9Pqy0iohz03Fe4YsS2boiowmrtRdqaEmWb_nGbE4XQ7PMnEtyIWbNQZVKOkerrQijPeUgoC9hU4LIZhja9XBx2__jIaqbHK7v8GfLs' }} 
                style={styles.socialIcon} 
              />
              <Text style={[styles.socialButtonText, { color: '#111921' }]}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.socialButton, { backgroundColor: '#000000' }]}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmzEF8JMM9NDAf9oj1zKEI0KwqP4hZG4VTwaApPexK9L1_rwmqnvXuKJlhgkreSD-iNyFk17kJdRAjl9EwrnTSIuTVXTrtxlhA-95OTv2fdWMxTqm9-3J-zE_EcVsQn7Kq8vKwYnZ0-GynAsisF9cihvbvPu5mbfPLqFHZiZt7tRvc4bF9KrB3a04CcTB2cEDRy3D3jJTU80LXIqGIBmJYoIyFsABv8BaX35UJXMnOYzvI88HfG6SxUMEbkf5NE9P93VUnCr6Dn8c' }} 
                style={styles.socialIcon} 
              />
              <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>Continue with Apple</Text>
            </TouchableOpacity> */}
          </View>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: textBodyColor }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={[styles.loginLink, { color: isDark ? theme.accent : theme.primary }]}>Log In</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.termsText, { color: textBodyColor }]}>
            By signing up, you agree to our{" "}
            <Text style={styles.linkText}>Terms of Service</Text> and{" "}
            <Text style={styles.linkText}>Privacy Policy</Text>.
          </Text>
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
    color: "##1E293B",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#5e6875ff",
    textAlign: "center",
    marginBottom: 32,
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
  },
  primaryButton: {
    backgroundColor: "#0A2A4E",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
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
  termsText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
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
