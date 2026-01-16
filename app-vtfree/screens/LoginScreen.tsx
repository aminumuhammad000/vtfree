import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import CustomAlert from '../components/CustomAlert';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    });

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        setAlertConfig({ visible: true, type, title, message });
    };

    const handleAlertClose = async () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (alertConfig.type === 'success') {
            // Small delay to ensure AsyncStorage operations complete
            await new Promise(resolve => setTimeout(resolve, 100));
            // @ts-ignore
            router.replace('/(tabs)/home');
        }
    };

    const handleSubmit = async () => {
        if (!formData.email || !formData.password) {
            showAlert('error', 'Missing Fields', 'Please fill in all fields');
            return;
        }
        setIsSubmitting(true);
        try {
            await signIn(formData);
            showAlert('success', 'Welcome Back!', 'Login Successful!');
        } catch (error: any) {
            showAlert('error', 'Login Failed', error.message || 'An unknown error occurred');
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
                                    style={{ width: 64, height: 64 }}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.title}>Welcome Back!</Text>
                            <Text style={styles.subtitle}>Sign in to continue building</Text>
                        </Animated.View>

                        {/* Form Card */}
                        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.formCard}>
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
                            </View>

                            {/* Forgot Password */}
                            <TouchableOpacity style={styles.forgotPasswordButton}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryLight]}
                                    style={styles.submitButtonGradient}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Sign In</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Register Link */}
                            <View style={styles.registerContainer}>
                                <Text style={styles.registerText}>Don't have an account?</Text>
                                <TouchableOpacity onPress={() => router.push('/register')}>
                                    <Text style={styles.registerLink}>Sign Up</Text>
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
        marginBottom: 40,
    },
    logoBox: {
        width: 80,
        height: 80,
        backgroundColor: Colors.white,
        borderRadius: 20,
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
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
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
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
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
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    registerText: {
        fontSize: 14,
        color: Colors.gray[600],
    },
    registerLink: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '700',
    },
});
