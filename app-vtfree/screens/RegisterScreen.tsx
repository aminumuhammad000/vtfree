import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, LayoutAnimationConfig } from 'react-native-reanimated';
import CustomAlert from '../components/CustomAlert';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone_number: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const passwordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    };

    const strength = passwordStrength(formData.password);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    });

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        setAlertConfig({ visible: true, type, title, message });
    };

    const handleAlertClose = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (alertConfig.type === 'success') {
            // @ts-ignore
            router.replace('/(tabs)/home');
        }
    };

    const handleSubmit = async () => {
        if (!formData.fullName || !formData.email || !formData.password) {
            showAlert('error', 'Missing Fields', 'Please fill in all required fields');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            showAlert('error', 'Mismatch', 'Passwords do not match');
            return;
        }

        const nameParts = formData.fullName.trim().split(' ');
        const first_name = nameParts[0];
        const last_name = nameParts.slice(1).join(' ') || '';

        setIsSubmitting(true);
        try {
            await signUp({
                first_name,
                last_name,
                email: formData.email,
                password: formData.password,
                phone_number: formData.phone_number
            });
            showAlert('success', 'Account Created', 'Registration Successful!');
        } catch (error: any) {
            showAlert('error', 'Registration Failed', error.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.backgroundGradient}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <ArrowLeft color={Colors.white} size={24} />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Logo & Welcome */}
                        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.logoContainer}>
                            <View style={styles.logoBox}>
                                <Image
                                    source={require('../assets/images/logo.png')}
                                    style={{ width: 50, height: 50 }}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join thousands of entrepreneurs</Text>
                        </Animated.View>

                        {/* Form Card */}
                        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.formCard}>
                            {/* Full Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputContainer}>
                                    <User color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor={Colors.gray[400]}
                                        value={formData.fullName}
                                        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputContainer}>
                                    <Mail color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="john@example.com"
                                        placeholderTextColor={Colors.gray[400]}
                                        value={formData.email}
                                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                    />
                                </View>
                            </View>

                            {/* Phone Number */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <View style={styles.inputContainer}>
                                    <User color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="08012345678"
                                        placeholderTextColor={Colors.gray[400]}
                                        value={formData.phone_number}
                                        onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>



                            {/* Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, styles.inputWithIcon]}
                                        placeholder="••••••••"
                                        placeholderTextColor={Colors.gray[400]}
                                        value={formData.password}
                                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        {showPassword ? (
                                            <EyeOff color={Colors.gray[400]} size={20} />
                                        ) : (
                                            <Eye color={Colors.gray[400]} size={20} />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Password Strength */}
                                {formData.password.length > 0 && (
                                    <Animated.View entering={FadeInDown} style={styles.strengthContainer}>
                                        <View style={styles.strengthBars}>
                                            {[...Array(4)].map((_, i) => (
                                                <View
                                                    key={i}
                                                    style={[
                                                        styles.strengthBar,
                                                        {
                                                            backgroundColor:
                                                                i < strength
                                                                    ? strength <= 1
                                                                        ? Colors.red[500]
                                                                        : strength <= 2
                                                                            ? Colors.yellow[500]
                                                                            : Colors.primary
                                                                    : Colors.gray[200],
                                                        },
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                        <Text style={styles.strengthText}>
                                            {strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength <= 3 ? 'Good' : 'Strong'} password
                                        </Text>
                                    </Animated.View>
                                )}
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, styles.inputWithIcon]}
                                        placeholder="••••••••"
                                        placeholderTextColor={Colors.gray[400]}
                                        value={formData.confirmPassword}
                                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff color={Colors.gray[400]} size={20} />
                                        ) : (
                                            <Eye color={Colors.gray[400]} size={20} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                                    <Text style={styles.errorText}>Passwords don't match</Text>
                                )}
                            </View>

                            {/* Terms */}
                            <View style={styles.termsContainer}>
                                <CheckCircle color={Colors.primary} size={20} />
                                <Text style={styles.termsText}>
                                    By creating an account, you agree to our Terms of Service and Privacy Policy
                                </Text>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={isSubmitting || formData.password !== formData.confirmPassword}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryLight]}
                                    style={styles.submitButtonGradient}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Create Account</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Login Link */}
                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Already have an account?</Text>
                                <TouchableOpacity onPress={() => router.push('/login')}>
                                    <Text style={styles.loginLink}>Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
                <CustomAlert
                    visible={alertConfig.visible}
                    type={alertConfig.type}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={handleAlertClose}
                />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoBox: {
        width: 72,
        height: 72,
        backgroundColor: Colors.white,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    formCard: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    inputGroup: {
        marginBottom: 20,
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray[700],
        marginLeft: 4,
    },
    inputContainer: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 1,
    },
    input: {
        backgroundColor: Colors.gray[50],
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 48,
        fontSize: 16,
        color: Colors.text.primary,
    },
    inputWithIcon: {
        paddingRight: 48,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 16,
    },
    strengthContainer: {
        marginTop: 8,
    },
    strengthBars: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 4,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 12,
        color: Colors.gray[600],
    },
    errorText: {
        fontSize: 12,
        color: Colors.red[500],
        marginTop: 4,
        marginLeft: 4,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: Colors.primaryLighter,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    termsText: {
        flex: 1,
        fontSize: 12,
        color: Colors.gray[700],
        lineHeight: 18,
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 24,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.white,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    loginText: {
        fontSize: 14,
        color: Colors.gray[600],
    },
    loginLink: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '700',
    },
});
