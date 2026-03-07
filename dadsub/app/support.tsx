import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';

export default function SupportScreen() {
    const router = useRouter();
    const { isDark } = useTheme();

    const theme = {
        primary: '#00ADFF',
        backgroundLight: '#FFFFFF',
        backgroundDark: '#000000',
        cardLight: '#F2F2F2',
        cardDark: '#1E1E1E',
        textLight: '#000000',
        textDark: '#FFFFFF',
        textSecondaryLight: '#757575',
        textSecondaryDark: '#A0A0A0',
    };

    const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
    const cardBg = isDark ? theme.cardDark : theme.cardLight;
    const textColor = isDark ? theme.textDark : theme.textLight;
    const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;

    const supportContacts = [
        {
            title: 'Email Support',
            description: 'Send us an email',
            icon: 'mail',
            color: '#EA4335',
            action: () => Linking.openURL('mailto:support@vtfree.com')
        },
        {
            title: 'WhatsApp Support',
            description: 'Chat with us on WhatsApp',
            icon: 'logo-whatsapp',
            color: '#25D366',
            action: () => Linking.openURL('https://wa.me/2348000000000') // Replace with actual number
        },
        {
            title: 'Phone Support',
            description: 'Call our customer care',
            icon: 'call',
            color: '#00ADFF',
            action: () => Linking.openURL('tel:+2348000000000') // Replace with actual number
        }
    ];

    const faqs = [
        {
            question: 'How do I fund my wallet?',
            answer: 'You can fund your wallet via bank transfer to your dedicated account number displayed on the home screen.'
        },
        {
            question: 'What if my transaction fails?',
            answer: 'If a transaction fails, your money will be automatically refunded to your wallet. If not, please contact support.'
        },
        {
            question: 'How do I upgrade my account?',
            answer: 'Complete your KYC verification in the Security section to upgrade your account limits.'
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <View style={[styles.header, { backgroundColor: bgColor }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: cardBg }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={20} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={[styles.section, { backgroundColor: cardBg }]}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Contact Us</Text>
                    <Text style={[styles.sectionSubtitle, { color: textSecondaryColor }]}>
                        We are here to help you 24/7
                    </Text>

                    <View style={styles.contactGrid}>
                        {supportContacts.map((contact, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.contactCard, { backgroundColor: isDark ? '#333' : '#FFFFFF' }]}
                                onPress={contact.action}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: contact.color + '15' }]}>
                                    <Ionicons name={contact.icon as any} size={24} color={contact.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.contactTitle, { color: textColor }]}>{contact.title}</Text>
                                    <Text style={[styles.contactDesc, { color: textSecondaryColor }]}>{contact.description}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: cardBg }]}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Frequently Asked Questions</Text>

                    {faqs.map((faq, index) => (
                        <View key={index} style={[styles.faqItem, index !== faqs.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#E5E7EB' }]}>
                            <Text style={[styles.faqQuestion, { color: textColor }]}>{faq.question}</Text>
                            <Text style={[styles.faqAnswer, { color: textSecondaryColor }]}>{faq.answer}</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    section: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    contactGrid: {
        gap: 12,
    },
    contactCard: {
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    contactDesc: {
        fontSize: 12,
    },
    faqItem: {
        paddingVertical: 16,
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    faqAnswer: {
        fontSize: 14,
        lineHeight: 20,
    },
});
