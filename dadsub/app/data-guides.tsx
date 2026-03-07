import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

const theme = {
    primary: '#0A2540',
    accent: '#FF9F43',
    success: '#00D4AA',
    error: '#FF5B5B',
};

export default function DataGuidesScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const bgColor = isDark ? '#000000' : '#F9FAFB';
    const cardBgColor = isDark ? '#1C1C1E' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#1F2937';
    const textBodyColor = isDark ? '#D1D5DB' : '#6B7280';
    const borderColor = isDark ? '#2C2C2E' : '#E5E7EB';

    const guides = [
        {
            id: 'mtn',
            network: 'MTN',
            code: '*131*4#',
            color: '#FFCC00',
            textColor: '#000000',
            instructions: 'Dial the code to view your data balance via SMS or USSD popup.',
        },
        {
            id: 'airtel',
            network: 'Airtel',
            code: '*140#',
            color: '#FF0000',
            textColor: '#FFFFFF',
            instructions: 'Dial the code and wait for an SMS containing your data balance.',
        },
        {
            id: 'glo',
            network: 'Glo',
            code: '*127*0#',
            color: '#00A859',
            textColor: '#FFFFFF',
            instructions: 'Dial the code or send "INFO" to 127.',
        },
        {
            id: '9mobile',
            network: '9mobile',
            code: '*228#',
            color: '#006B3C',
            textColor: '#FFFFFF',
            instructions: 'Dial the code to check your data balance.',
        },
    ];

    const copyToClipboard = async (code: string, network: string) => {
        await Clipboard.setStringAsync(code);
        if (Platform.OS === 'ios') {
            // On iOS, a toast or alert is nice since there's no native toast
            Alert.alert('Copied', `${network} code copied to clipboard`);
        } else {
            // Android usually shows a toast automatically for clipboard, but let's be safe
            Alert.alert('Copied', `${network} code copied to clipboard`);
        }
    };

    const dialCode = (code: string) => {
        let phoneNumber = '';
        if (Platform.OS === 'android') {
            phoneNumber = `tel:${encodeURIComponent(code)}`;
        } else {
            phoneNumber = `tel:${code}`;
        }
        Linking.openURL(phoneNumber);
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: cardBgColor }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Data Balance Guides</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.introText, { color: textBodyColor }]}>
                    Quickly check your data balance for any network using these USSD codes.
                </Text>

                <View style={styles.guidesContainer}>
                    {guides.map((guide) => (
                        <View
                            key={guide.id}
                            style={[
                                styles.guideCard,
                                {
                                    backgroundColor: cardBgColor,
                                    borderColor: borderColor
                                }
                            ]}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.networkBadge, { backgroundColor: guide.color }]}>
                                    <Text style={[styles.networkName, { color: guide.textColor }]}>
                                        {guide.network}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.codeContainer}>
                                <Text style={[styles.codeText, { color: textColor }]}>{guide.code}</Text>
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}
                                        onPress={() => copyToClipboard(guide.code, guide.network)}
                                    >
                                        <Ionicons name="copy-outline" size={20} color={theme.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: theme.success + '20' }]}
                                        onPress={() => dialCode(guide.code)}
                                    >
                                        <Ionicons name="call-outline" size={20} color={theme.success} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={[styles.instructions, { color: textBodyColor }]}>
                                {guide.instructions}
                            </Text>
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
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    introText: {
        fontSize: 16,
        marginBottom: 24,
        lineHeight: 24,
    },
    guidesContainer: {
        gap: 16,
    },
    guideCard: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    networkBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    networkName: {
        fontSize: 14,
        fontWeight: '700',
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    codeText: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructions: {
        fontSize: 14,
        lineHeight: 20,
    },
});

