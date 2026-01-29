import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { userService } from '@/services/user.service';
import { useAlert } from '@/components/AlertContext';

export default function ReferralsScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const { showError } = useAlert();
    const [loading, setLoading] = useState(true);
    const [referrals, setReferrals] = useState<any[]>([]);

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

    useEffect(() => {
        loadReferrals();
    }, []);

    const loadReferrals = async () => {
        try {
            setLoading(true);
            const response = await userService.getReferrals();
            if (response.success) {
                setReferrals(response.data || []);
            }
        } catch (error: any) {
            console.error('Error loading referrals:', error);
            // Don't show error if it's just empty or 404 for no referrals
            if (error.status !== 404) {
                showError(error.message || 'Failed to load referrals');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.referralCard, { backgroundColor: cardBg }]}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                    {item.first_name?.[0]?.toUpperCase() || 'U'}
                </Text>
            </View>
            <View style={styles.referralInfo}>
                <Text style={[styles.referralName, { color: textColor }]}>
                    {item.first_name} {item.last_name}
                </Text>
                <Text style={[styles.referralDate, { color: textSecondaryColor }]}>
                    Joined: {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.kyc_status === 'verified' ? '#00D16620' : '#F59E0B20' }]}>
                <Text style={[styles.statusText, { color: item.kyc_status === 'verified' ? '#00D166' : '#F59E0B' }]}>
                    {item.kyc_status === 'verified' ? 'Active' : 'Pending'}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: bgColor }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: cardBg }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={20} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>My Referrals</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={referrals}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={textSecondaryColor} />
                            <Text style={[styles.emptyText, { color: textSecondaryColor }]}>
                                You haven't invited anyone yet.
                            </Text>
                            <Text style={[styles.emptySubText, { color: textSecondaryColor }]}>
                                Share your referral code to earn rewards!
                            </Text>
                        </View>
                    }
                />
            )}
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 24,
        paddingBottom: 40,
    },
    referralCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
    },
    referralInfo: {
        flex: 1,
    },
    referralName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    referralDate: {
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        textAlign: 'center',
        maxWidth: '80%',
    },
});
