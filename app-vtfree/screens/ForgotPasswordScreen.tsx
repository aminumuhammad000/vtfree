import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../services/auth.service';
import { Colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock, Key, ShieldCheck, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import CustomAlert from '../components/CustomAlert';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    });

    const submitScale = useSharedValue(1);
    const submitAnimationStyle = useAnimatedStyle(() => ({
        transform: [{ scale: submitScale.value }],
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
        if (alertConfig.type === 'success' && step === 'reset') {
            router.replace('/login');
        }
    };

    const handleRequestOTP = async () => {
        if (!email.trim() || !email.includes('@')) {
            showAlert('error', 'Invalid Email', 'Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        try {
            await AuthService.forgotPassword(email);
            showAlert('success', 'OTP Sent', 'Password reset code sent to your email');
            setStep('otp');
        } catch (error: any) {
            showAlert('error', 'Request Failed', error.message || 'Could not send OTP');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOTP = () => {
        if (code.length < 4) {
            showAlert('error', 'Invalid Code', 'Please enter a valid reset code');
            return;
        }
        setStep('reset');
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            showAlert('error', 'Weak Password', 'Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);
        try {
            await AuthService.resetPassword({ email, code, newPassword });
            showAlert('success', 'Success!', 'Password reset successful!');
        } catch (error: any) {
            showAlert('error', 'Reset Failed', error.message || 'Could not reset password');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 'email': return "Account Recovery";
            case 'otp': return "Verify OTP";
            case 'reset': return "New Password";
        }
    };

    const getStepSubtitle = () => {
        switch (step) {
            case 'email': return "Enter your email for reset code";
            case 'otp': return `Code sent to ${email}`;
            case 'reset': return "Set a strong new password";
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.green[700], Colors.primary]} // Rich Green theme
                style={styles.backgroundGradient}
            >
                <View style={{ height: Platform.OS === 'ios' ? 44 : 20 }} />

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                        {/* Header - Compact */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => step === 'email' ? router.back() : setStep('email')} style={styles.backButton}>
                                <ArrowLeft color="#FFF" size={24} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Recovery</Text>
                            <View style={{ width: 44 }} />
                        </View>

                        {/* Top Illustration - Compact */}
                        <View style={styles.topIllustration}>
                            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoBadge}>
                                {step === 'email' && <Key color="#FFF" size={32} />}
                                {step === 'otp' && <ShieldCheck color="#FFF" size={32} />}
                                {step === 'reset' && <Lock color="#FFF" size={32} />}
                            </Animated.View>
                        </View>

                        {/* Full Width Curved Card */}
                        <Animated.View entering={FadeInUp.delay(200).springify().damping(15)} style={styles.formCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.welcomeTitle}>{getStepTitle()}</Text>
                                <Text style={styles.welcomeSubtitle}>{getStepSubtitle()}</Text>
                            </View>

                            <View style={styles.formContent}>
                                {step === 'email' && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email Address</Text>
                                        <View style={styles.inputWrapper}>
                                            <Mail color={focusedInput === 'email' ? Colors.primary : '#94A3B8'} size={18} style={styles.inputIcon} />
                                            <TextInput
                                                style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
                                                placeholder="Enter your registered email"
                                                value={email}
                                                onChangeText={setEmail}
                                                onFocus={() => setFocusedInput('email')}
                                                onBlur={() => setFocusedInput(null)}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>
                                )}

                                {step === 'otp' && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Verification Code</Text>
                                        <View style={styles.inputWrapper}>
                                            <ShieldCheck color={focusedInput === 'otp' ? '#16A34A' : '#94A3B8'} size={18} style={styles.inputIcon} />
                                            <TextInput
                                                style={[styles.input, focusedInput === 'otp' && styles.inputFocused, { textAlign: 'center', letterSpacing: 8 }]}
                                                placeholder="••••••"
                                                value={code}
                                                onChangeText={setCode}
                                                onFocus={() => setFocusedInput('otp')}
                                                onBlur={() => setFocusedInput(null)}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                            />
                                        </View>
                                    </View>
                                )}

                                {step === 'reset' && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>New Password</Text>
                                        <View style={styles.inputWrapper}>
                                            <Lock color={focusedInput === 'pass' ? '#16A34A' : '#94A3B8'} size={18} style={styles.inputIcon} />
                                            <TextInput
                                                style={[styles.input, focusedInput === 'pass' && styles.inputFocused]}
                                                placeholder="••••••••"
                                                secureTextEntry
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                                onFocus={() => setFocusedInput('pass')}
                                                onBlur={() => setFocusedInput(null)}
                                            />
                                        </View>
                                    </View>
                                )}

                                <Animated.View style={[styles.submitButtonContainer, submitAnimationStyle]}>
                                    <TouchableOpacity
                                        style={styles.primaryButton}
                                        onPress={step === 'email' ? handleRequestOTP : step === 'otp' ? handleVerifyOTP : handleResetPassword}
                                        onPressIn={() => handlePressIn(submitScale)}
                                        onPressOut={() => handlePressOut(submitScale)}
                                        disabled={isSubmitting}
                                    >
                                        <LinearGradient
                                            colors={['#16A34A', '#15803D']}
                                            style={styles.gradientButton}
                                        >
                                            {isSubmitting ? (
                                                <ActivityIndicator color="#FFF" />
                                            ) : (
                                                <Text style={styles.buttonText}>
                                                    {step === 'email' ? 'Send Code' : step === 'otp' ? 'Verify Code' : 'Reset Password'}
                                                </Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>

                                {step === 'email' && (
                                    <TouchableOpacity style={styles.footer} onPress={() => router.back()}>
                                        <Text style={styles.footerText}>Back to Login</Text>
                                    </TouchableOpacity>
                                )}
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
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
    formCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 20,
        minHeight: height * 0.7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    cardHeader: { marginBottom: 24 },
    welcomeTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    welcomeSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    formContent: { gap: 8 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6, marginLeft: 4 },
    inputWrapper: { position: 'relative' },
    inputIcon: { position: 'absolute', left: 16, top: 17, zIndex: 1 },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingVertical: 12,
        paddingLeft: 46,
        paddingRight: 16,
        fontSize: 15,
        color: '#0F172A',
        height: 52,
    },
    inputFocused: { borderColor: '#16A34A', backgroundColor: '#FFF' },
    submitButtonContainer: {
        marginTop: 10,
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    primaryButton: { borderRadius: 16, overflow: 'hidden' },
    gradientButton: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
    footer: { alignItems: 'center', marginTop: 20 },
    footerText: { fontSize: 14, color: '#16A34A', fontWeight: '700' },
});
