import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, LayoutAnimation, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, CheckCircle, Phone, BadgeCheck, ChevronRight } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, FadeOutLeft, SlideInRight, SlideOutLeft, LinearTransition } from 'react-native-reanimated';
import CustomAlert from '../components/CustomAlert';

const { width, height } = Dimensions.get('window');

// Types
type Step = 1 | 2 | 3;

export default function RegisterScreen() {
    const router = useRouter();
    const { signUp } = useAuth();

    // State
    const [step, setStep] = useState<Step>(1);
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [formData, setFormData] = useState({
        fullName: '',
        phone_number: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Alert State
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

    // Validation
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
        if (formData.password !== formData.confirmPassword) {
            showAlert('error', 'Mismatch', 'Passwords do not match');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setDirection('forward');
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setDirection('forward');
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setDirection('backward');
            setStep(prev => (prev - 1) as Step);
        } else {
            router.back();
        }
    };

    const handleSubmit = async () => {
        if (!acceptedTerms) {
            showAlert('error', 'Terms Required', 'Please accept the Terms of Service to continue');
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
            showAlert('success', 'Account Created', 'Welcome to VTFree! Your account has been created successfully.');
        } catch (error: any) {
            console.error(error);
            showAlert('error', 'Registration Failed', error.message || 'Could not create account. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return "Personal Info";
            case 2: return "Security";
            case 3: return "Review & Confirm";
        }
    };

    const passwordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    };

    const strength = passwordStrength(formData.password);

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.backgroundGradient}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    {/* Header with Back Button */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <ArrowLeft color={Colors.white} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Logo & Title Section */}
                        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoContainer}>
                            <View style={styles.logoBox}>
                                {/* Placeholder for Logo if image not available, or use icon */}
                                <User color={Colors.primary} size={32} />
                            </View>
                            <Text style={styles.screenTitle}>Create Account</Text>
                            <Text style={styles.screenSubtitle}>Sign up to get started</Text>
                        </Animated.View>

                        {/* White Wizard Card */}
                        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.wizardCard}>
                            {/* Progress Indicators inside Card */}
                            <View style={styles.progressContainer}>
                                {[1, 2, 3].map((i) => (
                                    <View key={i} style={[styles.progressDot, step >= i ? styles.progressDotActive : styles.progressDotInactive]} />
                                ))}
                            </View>

                            <Text style={styles.stepTitle}>{getStepTitle()}</Text>

                            {/* Step Content Area */}
                            <View style={styles.stepContentContainer}>
                                <Animated.View
                                    key={`step-${step}`}
                                    entering={direction === 'forward' ? SlideInRight.springify() : FadeInRight.springify()}
                                    exiting={direction === 'forward' ? SlideOutLeft.springify() : FadeOutLeft.springify()}
                                    style={styles.stepWrapper}
                                >
                                    {step === 1 && (
                                        <View>
                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Full Name</Text>
                                                <View style={styles.inputContainer}>
                                                    <User color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="John Doe"
                                                        placeholderTextColor={Colors.gray[400]}
                                                        value={formData.fullName}
                                                        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Phone Number</Text>
                                                <View style={styles.inputContainer}>
                                                    <Phone color={Colors.gray[400]} size={20} style={styles.inputIcon} />
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
                                        </View>
                                    )}

                                    {step === 2 && (
                                        <View>
                                            <View style={styles.formGroup}>
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
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Password</Text>
                                                <View style={styles.inputContainer}>
                                                    <Lock color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                                                    <TextInput
                                                        style={[styles.input, { paddingRight: 50 }]}
                                                        placeholder="••••••••"
                                                        placeholderTextColor={Colors.gray[400]}
                                                        value={formData.password}
                                                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                                                        secureTextEntry={!showPassword}
                                                        autoCapitalize="none"
                                                    />
                                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                                        {showPassword ? <EyeOff size={20} color={Colors.gray[400]} /> : <Eye size={20} color={Colors.gray[400]} />}
                                                    </TouchableOpacity>
                                                </View>
                                                {formData.password.length > 0 && (
                                                    <View style={styles.strengthContainer}>
                                                        <View style={styles.strengthBars}>
                                                            {[...Array(4)].map((_, i) => (
                                                                <View key={i} style={[
                                                                    styles.strengthBar,
                                                                    { backgroundColor: i < strength ? (strength <= 1 ? Colors.red[500] : strength <= 2 ? Colors.yellow[500] : Colors.green[500]) : Colors.gray[200] }
                                                                ]} />
                                                            ))}
                                                        </View>
                                                        <Text style={styles.strengthText}>
                                                            {strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength <= 3 ? 'Good' : 'Strong'}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Confirm Password</Text>
                                                <View style={styles.inputContainer}>
                                                    <Lock color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                                                    <TextInput
                                                        style={[styles.input, { paddingRight: 50 }]}
                                                        placeholder="••••••••"
                                                        placeholderTextColor={Colors.gray[400]}
                                                        value={formData.confirmPassword}
                                                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                                                        secureTextEntry={!showConfirmPassword}
                                                        autoCapitalize="none"
                                                    />
                                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                                        {showConfirmPassword ? <EyeOff size={20} color={Colors.gray[400]} /> : <Eye size={20} color={Colors.gray[400]} />}
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    )}

                                    {step === 3 && (
                                        <View>
                                            <View style={styles.summaryContainer}>
                                                <View style={styles.summaryRow}>
                                                    <Text style={styles.summaryLabel}>Full Name</Text>
                                                    <Text style={styles.summaryValue}>{formData.fullName}</Text>
                                                </View>
                                                <View style={styles.summaryDivider} />
                                                <View style={styles.summaryRow}>
                                                    <Text style={styles.summaryLabel}>Phone</Text>
                                                    <Text style={styles.summaryValue}>{formData.phone_number}</Text>
                                                </View>
                                                <View style={styles.summaryDivider} />
                                                <View style={styles.summaryRow}>
                                                    <Text style={styles.summaryLabel}>Email</Text>
                                                    <Text style={styles.summaryValue}>{formData.email}</Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.termsContainer}
                                                onPress={() => setAcceptedTerms(!acceptedTerms)}
                                            >
                                                <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
                                                    {acceptedTerms && <CheckCircle size={14} color={Colors.white} />}
                                                </View>
                                                <Text style={styles.termsText}>
                                                    I accept the <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Terms of Service</Text>.
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </Animated.View>
                            </View>

                            {/* Actions */}
                            <View style={styles.actionContainer}>
                                {step < 3 ? (
                                    <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
                                        <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.gradientButton}>
                                            <Text style={styles.buttonText}>Continue</Text>
                                            <ChevronRight color={Colors.white} size={20} />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.createButton, isSubmitting && { opacity: 0.7 }]}
                                        onPress={handleSubmit}
                                        disabled={isSubmitting}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient colors={[Colors.green[600] || '#10B981', Colors.green[500] || '#34D399']} style={styles.gradientButton}>
                                            {isSubmitting ? (
                                                <ActivityIndicator color={Colors.white} />
                                            ) : (
                                                <>
                                                    <Text style={styles.buttonText}>Create Account</Text>
                                                    <BadgeCheck color={Colors.white} size={20} />
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.loginContainer}>
                                    <Text style={styles.loginText}>Already have an account? </Text>
                                    <TouchableOpacity onPress={() => router.push('/login')}>
                                        <Text style={styles.loginLink}>Sign In</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    </ScrollView>
                    <CustomAlert
                        visible={alertConfig.visible}
                        type={alertConfig.type}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        onClose={handleAlertClose}
                    />
                </KeyboardAvoidingView>
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
        paddingTop: 60,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    logoBox: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 4,
    },
    screenSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
    },
    wizardCard: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 32,
        paddingHorizontal: 24,
        paddingBottom: 40,
        minHeight: height * 0.6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    progressDotActive: {
        backgroundColor: Colors.primary,
        width: 24,
    },
    progressDotInactive: {
        backgroundColor: Colors.gray[200],
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 24,
        textAlign: 'center',
    },
    stepContentContainer: {
        marginBottom: 32,
        overflow: 'hidden', // Contain animations
    },
    stepWrapper: {
        minHeight: 200, // Prevent layout jumps
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray[700],
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        top: 14,
        left: 14,
        zIndex: 1,
    },
    input: {
        backgroundColor: Colors.gray[50],
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 16,
        paddingVertical: 14,
        paddingLeft: 46,
        paddingRight: 16,
        fontSize: 16,
        color: Colors.text.primary,
        height: 52,
    },
    eyeIcon: {
        position: 'absolute',
        right: 14,
        top: 14,
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
        color: Colors.gray[500],
        alignSelf: 'flex-end',
    },
    summaryContainer: {
        backgroundColor: Colors.gray[50],
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.gray[500],
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: Colors.gray[200],
        marginVertical: 4,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: 4,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: Colors.primary,
    },
    termsText: {
        flex: 1,
        fontSize: 14,
        color: Colors.gray[600],
        lineHeight: 20,
    },
    actionContainer: {
        marginTop: 'auto',
    },
    nextButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    createButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: Colors.green[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: Colors.gray[400],
        fontSize: 14,
    },
    loginLink: {
        color: Colors.secondary || '#FBBF24',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
