import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Shield, FileText, Lock } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function LegalScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ChevronLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Legal & Privacy</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
                    onPress={() => setActiveTab('privacy')}
                    activeOpacity={0.8}
                >
                    <Lock size={16} color={activeTab === 'privacy' ? Colors.primary : Colors.gray[500]} />
                    <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>Privacy Policy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
                    onPress={() => setActiveTab('terms')}
                    activeOpacity={0.8}
                >
                    <FileText size={16} color={activeTab === 'terms' ? Colors.primary : Colors.gray[500]} />
                    <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>Terms of Service</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {activeTab === 'privacy' ? <PrivacyContent /> : <TermsContent />}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const PrivacyContent = () => (
    <View>
        <Text style={styles.lastUpdated}>Last Updated: February 2, 2026</Text>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.paragraph}>
                Welcome to VTFree ("we," "our," or "us"). We comprise a team committed to protecting your personal data and your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and app-building services.
            </Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            <Text style={styles.paragraph}>
                We collect information that you provide directly to us when you register, create an app, or communicate with us. This includes:
            </Text>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Personal Information: Name, email address, phone number, and business details.</Text>
            </View>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>App Data: Information required to generate your VTU applications, including logos, color schemes, and pricing configurations.</Text>
            </View>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Financial Information: Transaction history and wallet balances. We do not store full credit card numbers; payments are processed by secure third-party gateways.</Text>
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
            <Text style={styles.paragraph}>
                We use the information we collect to:
            </Text>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Provide, maintain, and improve our services.</Text>
            </View>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Process transactions and send related information.</Text>
            </View>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Generate and deploy your mobile applications.</Text>
            </View>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Send you technical notices, updates, security alerts, and support messages.</Text>
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Security</Text>
            <Text style={styles.paragraph}>
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
            </Text>
        </View>
    </View>
);

const TermsContent = () => (
    <View>
        <Text style={styles.lastUpdated}>Last Updated: February 2, 2026</Text>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
                By accessing or using the VTFree platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. App Generation Services</Text>
            <Text style={styles.paragraph}>
                VTFree provides tools to generate white-label VTU (Virtual Top Up) applications. You acknowledge that:
            </Text>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>You are responsible for the content and branding you upload.</Text>
            </View>
            <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Apps generated are subject to the policies of the respective app stores (Google Play Store, Apple App Store) if you choose to publish them.</Text>
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
            <Text style={styles.paragraph}>
                You agree not to use the platform for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction, including but not limited to copyright laws.
            </Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Payments and Billing</Text>
            <Text style={styles.paragraph}>
                Certain features of the Service may be subject to fees. All fees are non-refundable except as required by law. You agree to provide current, complete, and accurate purchase and account information for all purchases made via our service.
            </Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Termination</Text>
            <Text style={styles.paragraph}>
                We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
                In no event shall VTFree, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: Colors.background,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    activeTab: {
        backgroundColor: Colors.primary + '10', // 10% opacity
        borderColor: Colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray[500],
    },
    activeTabText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 8,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    lastUpdated: {
        fontSize: 12,
        color: Colors.gray[400],
        marginBottom: 20,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 14,
        color: Colors.text.secondary,
        lineHeight: 22,
        marginBottom: 8,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 8,
    },
    bullet: {
        fontSize: 14,
        color: Colors.primary,
        marginRight: 8,
        lineHeight: 22,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        color: Colors.text.secondary,
        lineHeight: 22,
    },
});
