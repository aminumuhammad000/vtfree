import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, CheckCircle, Fingerprint } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import CustomAlert from '../components/CustomAlert';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    });

    const submitScale = useSharedValue(1);
    const biometricScale = useSharedValue(1);

    const submitAnimationStyle = useAnimatedStyle(() => ({
        transform: [{ scale: submitScale.value }],
    }));

    const biometricAnimationStyle = useAnimatedStyle(() => ({
        transform: [{ scale: biometricScale.value }],
    }));

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricAvailable(hasHardware && isEnrolled);
    };

    const handlePressIn = (scale: any) => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = (scale: any) => {
        scale.value = withSpring(1);
    };

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAlertConfig({ visible: true, type, title, message });
    };

    const handleAlertClose = () => {
        const wasSuccess = alertConfig.type === 'success';
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (wasSuccess) {
            router.replace('/(tabs)/home');
        }
    };

    const handleSubmit = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (!formData.email || !formData.password) {
            showAlert('error', 'Required Fields', 'Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await signIn(formData, rememberMe);
            showAlert('success', 'Welcome Back!', 'Login Successful!');
        } catch (error: any) {
            showAlert('error', 'Login Failed', error.message || 'An unknown error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBiometricLogin = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const lastEmail = await SecureStore.getItemAsync('user_email');
            const lastPassword = await SecureStore.getItemAsync('user_password');

            if (!lastEmail || !lastPassword) {
                showAlert('error', 'No Credentials', 'Please login with password first to enable biometrics');
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Login to VTFree',
                cancelLabel: 'Use Password',
                disableDeviceFallback: false,
            });

            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setIsSubmitting(true);
                try {
                    await signIn({ email: lastEmail, password: lastPassword });
                    showAlert('success', 'Welcome Back!', 'Biometric Login Successful!');
                } catch (error: any) {
                    showAlert('error', 'Biometric Login Failed', error.message || 'Login failed');
                } finally {
                    setIsSubmitting(false);
                }
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch (error: any) {
            showAlert('error', 'Biometric Error', 'Could not authenticate with biometrics');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.green[700], Colors.primary]} // Using standard Green from project
                style={styles.backgroundGradient}
            >
                <SafeAreaHeader />

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {/* Top Branding Section - Compact */}
                        <View style={styles.brandingSection}>
                            <Animated.View entering={FadeInDown.delay(100).springify()}>
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                                    style={styles.logoCircle}
                                >
                                    <Image
                                        source={require('../assets/images/logo.png')}
                                        style={styles.logoImage}
                                        resizeMode="contain"
                                    />
                                </LinearGradient>
                            </Animated.View>
                            <Animated.View entering={FadeInDown.delay(200).springify()}>
                                <Text style={styles.brandTitle}>VTFree</Text>
                            </Animated.View>
                        </View>

                        {/* Full Width Curved Form Card */}
                        <Animated.View
                            entering={FadeInUp.delay(300).springify().damping(15)}
                            style={styles.formCard}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.welcomeTitle}>Login</Text>
                                <Text style={styles.welcomeSubtitle}>Sign in to your account</Text>
                            </View>

                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputContainer}>
                                    <Mail color={focusedInput === 'email' ? Colors.primary : '#94A3B8'} size={18} style={styles.inputIcon} />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            focusedInput === 'email' && styles.inputFocused
                                        ]}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#94A3B8"
                                        value={formData.email}
                                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                                        onFocus={() => {
                                            setFocusedInput('email');
                                            Haptics.selectionAsync();
                                        }}
                                        onBlur={() => setFocusedInput(null)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputContainer}>
                                    <Lock color={focusedInput === 'password' ? Colors.primary : '#94A3B8'} size={18} style={styles.inputIcon} />
                                    <TextInput
                                        style={[
                                            styles.input,
                                            focusedInput === 'password' && styles.inputFocused
                                        ]}
                                        placeholder="••••••••"
                                        placeholderTextColor="#94A3B8"
                                        value={formData.password}
                                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                                        onFocus={() => {
                                            setFocusedInput('password');
                                            Haptics.selectionAsync();
                                        }}
                                        onBlur={() => setFocusedInput(null)}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        {showPassword ? (
                                            <EyeOff color="#94A3B8" size={18} />
                                        ) : (
                                            <Eye color="#94A3B8" size={18} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Options Row - More compact */}
                            <View style={styles.optionsRow}>
                                <TouchableOpacity
                                    style={styles.rememberMe}
                                    onPress={() => setRememberMe(!rememberMe)}
                                >
                                    <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                                        {rememberMe && <CheckCircle size={12} color="#FFF" />}
                                    </View>
                                    <Text style={styles.rememberText}>Remember me</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                                    <Text style={styles.forgotText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Actions */}
                            <Animated.View style={[styles.submitButtonContainer, submitAnimationStyle]}>
                                <TouchableOpacity
                                    style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                                    onPress={handleSubmit}
                                    onPressIn={() => handlePressIn(submitScale)}
                                    onPressOut={() => handlePressOut(submitScale)}
                                    disabled={isSubmitting}
                                    activeOpacity={1}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.green[700]]}
                                        style={styles.submitButtonGradient}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <Text style={styles.submitButtonText}>Sign In</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            {isBiometricAvailable && (
                                <Animated.View style={[styles.biometricContainer, biometricAnimationStyle]}>
                                    <TouchableOpacity
                                        style={styles.biometricButton}
                                        onPress={handleBiometricLogin}
                                        onPressIn={() => handlePressIn(biometricScale)}
                                        onPressOut={() => handlePressOut(biometricScale)}
                                        disabled={isSubmitting}
                                        activeOpacity={1}
                                    >
                                        <Fingerprint color={Colors.primary} size={24} />
                                        <Text style={styles.biometricText}>Quick Sign-in</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}

                            {/* Footer */}
                            <View style={styles.registerLink}>
                                <Text style={styles.footerText}>Don't have an account?</Text>
                                <TouchableOpacity onPress={() => router.push('/register')}>
                                    <Text style={styles.linkText}>Register</Text>
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

const SafeAreaHeader = () => <View style={{ height: Platform.OS === 'ios' ? 44 : 20 }} />;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    backgroundGradient: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    brandingSection: {
        alignItems: 'center',
        paddingVertical: 25, // Even more compact
    },
    logoCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        marginBottom: 8,
    },
    logoImage: {
        width: 35,
        height: 35,
    },
    brandTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: 1,
    },
    formCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 24,
        paddingTop: 25,
        paddingBottom: 20,
        minHeight: height * 0.72,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    cardHeader: {
        marginBottom: 20,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 6,
        marginLeft: 4,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingVertical: 10,
        paddingLeft: 44,
        paddingRight: 16,
        fontSize: 15,
        color: '#0F172A',
        height: 50, // Slightly smaller than 52
    },
    inputFocused: {
        borderColor: '#16A34A',
        backgroundColor: '#FFF',
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 1,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 16,
        zIndex: 1,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#16A34A',
        borderColor: '#16A34A',
    },
    rememberText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    forgotText: {
        fontSize: 13,
        color: '#16A34A',
        fontWeight: '700',
    },
    submitButtonContainer: {
        marginBottom: 16,
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    submitButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    submitButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    biometricContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F1F5F9',
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    biometricText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '700',
    },
    registerLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    linkText: {
        fontSize: 14,
        color: '#16A34A',
        fontWeight: '700',
    },
});
