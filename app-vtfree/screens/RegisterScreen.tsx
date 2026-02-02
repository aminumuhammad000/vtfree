import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, CheckCircle, Phone } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import CustomAlert from '../components/CustomAlert';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

type Step = 1 | 2 | 3;

export default function RegisterScreen() {
    const router = useRouter();
    const { signUp } = useAuth();

    // State
    const [step, setStep] = useState<Step>(1);
    const [formData, setFormData] = useState({
        fullName: '',
        phone_number: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    });

    const nextScale = useSharedValue(1);

    const nextAnimationStyle = useAnimatedStyle(() => ({
        transform: [{ scale: nextScale.value }],
    }));

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
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (alertConfig.type === 'success') {
            router.replace('/(tabs)/home');
        }
    };

    const validateStep1 = () => {
        if (!formData.fullName.trim()) {
            showAlert('error', 'Required Field', 'Please enter your full name');
            return false;
        }
        if (!formData.phone_number.trim() || formData.phone_number.length < 10) {
            showAlert('error', 'Invalid Phone', 'Please enter a valid phone number');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.email.trim() || !formData.email.includes('@')) {
            showAlert('error', 'Invalid Email', 'Please enter a valid email address');
            return false;
        }
        if (formData.password.length < 6) {
            showAlert('error', 'Weak Password', 'Password must be at least 6 characters long');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step > 1) setStep((step - 1) as Step);
        else router.back();
    };

    const handleSubmit = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (formData.password !== formData.confirmPassword) {
            showAlert('error', 'Match Error', 'Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        try {
            const nameParts = formData.fullName.split(' ');
            const first_name = nameParts[0];
            const last_name = nameParts.slice(1).join(' ') || '.';

            await signUp({
                first_name,
                last_name,
                email: formData.email,
                password: formData.password,
                phone_number: formData.phone_number
            }, true);

            showAlert('success', 'Success!', 'Account created successfully!');
        } catch (error: any) {
            showAlert('error', 'Registration Failed', error.message || 'An unknown error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderProgress = () => (
        <View style={styles.progressRow}>
            {[1, 2, 3].map((i) => (
                <View
                    key={i}
                    style={[
                        styles.progressDot,
                        step === i ? styles.progressDotActive : styles.progressDotInactive,
                        step > i && styles.progressDotCompleted
                    ]}
                />
            ))}
        </View>
    );

    const getStepTitle = () => {
        switch (step) {
            case 1: return "Personal Details";
            case 2: return "Security Credentials";
            case 3: return "Review & Confirm";
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.green[700], Colors.primary]}
                style={styles.backgroundGradient}
            >
                <View style={{ height: Platform.OS === 'ios' ? 44 : 20 }} />

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                        {/* Header - Compact */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <ArrowLeft color="#FFF" size={24} />
                            </TouchableOpacity>
                            <View style={styles.headerTextWrapper}>
                                <Text style={styles.headerTitle}>Register</Text>
                                <Text style={styles.headerSubtitle}>Step {step} of 3</Text>
                            </View>
                            <View style={{ width: 40 }} />
                        </View>

                        {/* Top Illustration - Consistent with Login */}
                        <View style={styles.topIllustration}>
                            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoBadge}>
                                <Image
                                    source={require('../assets/images/logo.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </Animated.View>
                        </View>

                        {/* Full Width Curved Card */}
                        <Animated.View entering={FadeInUp.delay(200).springify().damping(15)} style={styles.wizardCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.stepTitle}>{getStepTitle()}</Text>
                                {renderProgress()}
                            </View>

                            <View style={styles.formContent}>
                                {step === 1 && (
                                    <View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Full Name</Text>
                                            <View style={styles.inputWrapper}>
                                                <User color={focusedInput === 'fullName' ? Colors.primary : '#94A3B8'} size={18} style={styles.inputIcon} />
                                                <TextInput
                                                    style={[styles.input, focusedInput === 'fullName' && styles.inputFocused]}
                                                    placeholder="John Doe"
                                                    placeholderTextColor="#94A3B8"
                                                    value={formData.fullName}
                                                    onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                                                    onFocus={() => setFocusedInput('fullName')}
                                                    onBlur={() => setFocusedInput(null)}
                                                />
                                            </View>
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Phone Number</Text>
                                            <View style={styles.inputWrapper}>
                                                <Phone color={focusedInput === 'phone' ? Colors.primary : '#94A3B8'} size={18} style={styles.inputIcon} />
                                                <TextInput
                                                    style={[styles.input, focusedInput === 'phone' && styles.inputFocused]}
                                                    placeholder="08012345678"
                                                    placeholderTextColor="#94A3B8"
                                                    keyboardType="phone-pad"
                                                    value={formData.phone_number}
                                                    onChangeText={(t) => setFormData({ ...formData, phone_number: t })}
                                                    onFocus={() => setFocusedInput('phone')}
                                                    onBlur={() => setFocusedInput(null)}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {step === 2 && (
                                    <View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Email Address</Text>
                                            <View style={styles.inputWrapper}>
                                                <Mail color={focusedInput === 'email' ? Colors.primary : '#94A3B8'} size={18} style={styles.inputIcon} />
                                                <TextInput
                                                    style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
                                                    placeholder="john@example.com"
                                                    placeholderTextColor="#94A3B8"
                                                    keyboardType="email-address"
                                                    autoCapitalize="none"
                                                    value={formData.email}
                                                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                                                    onFocus={() => setFocusedInput('email')}
                                                    onBlur={() => setFocusedInput(null)}
                                                />
                                            </View>
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Password</Text>
                                            <View style={styles.inputWrapper}>
                                                <Lock color={focusedInput === 'password' ? Colors.primary : '#94A3B8'} size={18} style={styles.inputIcon} />
                                                <TextInput
                                                    style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
                                                    placeholder="••••••••"
                                                    placeholderTextColor="#94A3B8"
                                                    secureTextEntry={!showPassword}
                                                    value={formData.password}
                                                    onChangeText={(t) => setFormData({ ...formData, password: t })}
                                                    onFocus={() => setFocusedInput('password')}
                                                    onBlur={() => setFocusedInput(null)}
                                                />
                                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                                    {showPassword ? <EyeOff color="#94A3B8" size={18} /> : <Eye color="#94A3B8" size={18} />}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {step === 3 && (
                                    <View>
                                        <View style={styles.confirmBox}>
                                            <CheckCircle color="#10B981" size={28} />
                                            <Text style={styles.confirmText}>Final Review</Text>
                                            <Text style={styles.confirmSub}>Confirm your password below</Text>
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Confirm Password</Text>
                                            <View style={styles.inputWrapper}>
                                                <Lock color={focusedInput === 'confirm' ? Colors.primary : '#94A3B8'} size={18} style={styles.inputIcon} />
                                                <TextInput
                                                    style={[styles.input, focusedInput === 'confirm' && styles.inputFocused]}
                                                    placeholder="••••••••"
                                                    placeholderTextColor="#94A3B8"
                                                    secureTextEntry
                                                    value={formData.confirmPassword}
                                                    onChangeText={(t) => setFormData({ ...formData, confirmPassword: t })}
                                                    onFocus={() => setFocusedInput('confirm')}
                                                    onBlur={() => setFocusedInput(null)}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                )}

                                <Animated.View style={[styles.buttonRow, nextAnimationStyle]}>
                                    <TouchableOpacity
                                        style={styles.primaryButton}
                                        onPress={step === 3 ? handleSubmit : handleNext}
                                        onPressIn={() => handlePressIn(nextScale)}
                                        onPressOut={() => handlePressOut(nextScale)}
                                        disabled={isSubmitting}
                                    >
                                        <LinearGradient
                                            colors={step === 3 ? ['#10B981', '#059669'] : [Colors.primary, Colors.green[700]]}
                                            style={styles.gradientButton}
                                        >
                                            {isSubmitting ? (
                                                <ActivityIndicator color="#FFF" />
                                            ) : (
                                                <Text style={styles.buttonText}>{step === 3 ? 'Create Account' : 'Continue'}</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>

                                <View style={styles.footer}>
                                    <Text style={styles.footerText}>Have an account?</Text>
                                    <TouchableOpacity onPress={() => router.push('/login')}>
                                        <Text style={styles.footerLink}>Login</Text>
                                    </TouchableOpacity>
                                </View>
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
    container: { flex: 1 },
    backgroundGradient: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        justifyContent: 'space-between',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextWrapper: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    topIllustration: { alignItems: 'center', paddingVertical: 15 },
    logoBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    logoImage: {
        width: 32,
        height: 32,
    },
    wizardCard: {
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
    cardHeader: { alignItems: 'center', marginBottom: 15 },
    stepTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
    progressRow: { flexDirection: 'row', gap: 6 },
    progressDot: { width: 6, height: 6, borderRadius: 3 },
    progressDotActive: { backgroundColor: '#16A34A', width: 20 },
    progressDotInactive: { backgroundColor: '#E2E8F0' },
    progressDotCompleted: { backgroundColor: '#10B981' },
    formContent: { gap: 2 },
    inputGroup: { marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 5, marginLeft: 4 },
    inputWrapper: { position: 'relative' },
    inputIcon: { position: 'absolute', left: 16, top: 16, zIndex: 1 },
    eyeIcon: { position: 'absolute', right: 16, top: 16, zIndex: 1 },
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
        height: 50,
    },
    inputFocused: { borderColor: '#16A34A', backgroundColor: '#FFF' },
    confirmBox: { alignItems: 'center', marginBottom: 12, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 14 },
    confirmText: { fontSize: 18, fontWeight: '800', color: '#166534', marginTop: 2 },
    confirmSub: { fontSize: 12, color: '#15803D', textAlign: 'center' },
    buttonRow: { marginTop: 10 },
    primaryButton: { borderRadius: 14, overflow: 'hidden' },
    gradientButton: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
    buttonText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
    footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 15 },
    footerText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
    footerLink: { fontSize: 14, color: '#16A34A', fontWeight: '700' },
});
