import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Upload, CheckCircle, Shield, Camera } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function KYCScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft color={Colors.white} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Verify Account</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Shield color={Colors.primary} size={48} />
                    </View>
                    <Text style={styles.title}>Identity Verification</Text>
                    <Text style={styles.subtitle}>
                        We need to verify your identity to ensure the security of your account and comply with regulations. It won&apos;t take long.
                    </Text>

                    <View style={styles.stepsContainer}>
                        <View style={[styles.step, step >= 1 && styles.activeStep]}>
                            <Text style={[styles.stepText, step >= 1 && styles.activeStepText]}>1</Text>
                        </View>
                        <View style={[styles.stepLine, step >= 2 && styles.activeStepLine]} />
                        <View style={[styles.step, step >= 2 && styles.activeStep]}>
                            <Text style={[styles.stepText, step >= 2 && styles.activeStepText]}>2</Text>
                        </View>
                        <View style={[styles.stepLine, step >= 3 && styles.activeStepLine]} />
                        <View style={[styles.step, step >= 3 && styles.activeStep]}>
                            <Text style={[styles.stepText, step >= 3 && styles.activeStepText]}>3</Text>
                        </View>
                    </View>

                    {step === 1 && (
                        <View style={styles.form}>
                            <Text style={styles.sectionTitle}>Personal Information</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor={Colors.gray[400]} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Date of Birth</Text>
                                <TextInput style={styles.input} placeholder="DD/MM/YYYY" placeholderTextColor={Colors.gray[400]} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>BVN / NIN</Text>
                                <TextInput style={styles.input} placeholder="Enter your BVN or NIN" placeholderTextColor={Colors.gray[400]} keyboardType="numeric" />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={() => setStep(2)}>
                                <Text style={styles.buttonText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 2 && (
                        <View style={styles.form}>
                            <Text style={styles.sectionTitle}>Document Upload</Text>
                            <Text style={styles.description}>Please upload a clear photo of your valid government-issued ID (Passport, Driver's License, or National ID).</Text>

                            <TouchableOpacity style={styles.uploadBox}>
                                <Upload color={Colors.primary} size={32} />
                                <Text style={styles.uploadText}>Tap to upload Front of ID</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.uploadBox}>
                                <Upload color={Colors.primary} size={32} />
                                <Text style={styles.uploadText}>Tap to upload Back of ID</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={() => setStep(3)}>
                                <Text style={styles.buttonText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 3 && (
                        <View style={styles.form}>
                            <Text style={styles.sectionTitle}>Selfie Verification</Text>
                            <Text style={styles.description}>Take a selfie to match your ID photo.</Text>

                            <View style={styles.selfieContainer}>
                                <View style={styles.selfieCircle}>
                                    <Camera color={Colors.gray[400]} size={48} />
                                </View>
                            </View>

                            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                                <Text style={styles.buttonText}>Submit Verification</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.white,
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLighter,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    stepsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        width: '100%',
        paddingHorizontal: 20,
    },
    step: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.gray[200],
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeStep: {
        backgroundColor: Colors.primary,
    },
    stepText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.gray[500],
    },
    activeStepText: {
        color: Colors.white,
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: Colors.gray[200],
        marginHorizontal: 8,
    },
    activeStepLine: {
        backgroundColor: Colors.primary,
    },
    form: {
        width: '100%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.secondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.gray[50],
        borderWidth: 1,
        borderColor: Colors.border.light,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text.primary,
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginBottom: 20,
        lineHeight: 20,
    },
    uploadBox: {
        borderWidth: 2,
        borderColor: Colors.primaryLighter,
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: Colors.gray[50],
    },
    uploadText: {
        marginTop: 12,
        color: Colors.primary,
        fontWeight: '500',
    },
    selfieContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    selfieCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: Colors.gray[200],
    },
});
