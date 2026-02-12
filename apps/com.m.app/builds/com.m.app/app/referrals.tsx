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
    Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { userService } from '@/services/user.service';
import { useAlert } from '@/components/AlertContext';
import { configService } from '@/services/config.service';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '@/services/auth.service';

export default function ReferralsScreen() {
    const router = useRouter();
    const { isDark, theme } = useTheme();
    const { showSuccess, showError } = useAlert();
    const [loading, setLoading] = useState(true);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [referralSettings, setReferralSettings] = useState({ enabled: false, amount: 0 });
    const [user, setUser] = useState<any>(null);
    const [totalEarnings, setTotalEarnings] = useState(0);

    const bgColor = isDark ? '#000000' : '#FFFFFF';
    const cardBg = isDark ? '#1E1E1E' : '#F2F2F2';
    const textColor = isDark ? '#FFFFFF' : '#000000';
    const textSecondaryColor = isDark ? '#A0A0A0' : '#757575';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [referralsRes, settingsRes, userData] = await Promise.all([
                userService.getReferrals(),
                configService.getReferralSettings(),
                authService.getCurrentUser()
            ]);

            if (referralsRes.success) {
                setReferrals(referralsRes.data || []);

                // Calculate total earnings
                if (settingsRes.success && settingsRes.enabled) {
                    const earnings = (referralsRes.data || []).filter((r: any) => r.referral_bonus_claimed).length * settingsRes.amount;
                    setTotalEarnings(earnings);
                }
            }

            if (settingsRes.success) {
                setReferralSettings(settingsRes);
            }

            if (userData) {
                setUser(userData);
            }
        } catch (error: any) {
            console.error('Error loading referrals:', error);
            if (error.status !== 404) {
                showError(error.message || 'Failed to load referrals');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopyReferral = async () => {
        if (!user?.referral_code) return;
        await Clipboard.setStringAsync(user.referral_code);
        showSuccess('Referral code copied to clipboard!');
    };

    const handleShareReferral = async () => {
        if (!user?.referral_code) return;
        try {
            await Share.share({
                message: `Join me on this amazing platform! Use my referral code: ${user.referral_code} and earn rewards when you make your first transaction!`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const earned = item.referral_bonus_claimed && referralSettings.enabled;
        const pending = !item.referral_bonus_claimed;

        return (
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
                    {pending && (
                        <Text style={[styles.pendingText, { color: '#F59E0B' }]}>
                            ⏳ Pending first transaction
                        </Text>
                    )}
                </View>
                <View style={styles.earningBadge}>
                    {earned ? (
                        <>
                            <Text style={[styles.earnedAmount, { color: theme.success }]}>
                                +₦{referralSettings.amount.toLocaleString()}
                            </Text>
                            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                        </>
                    ) : (
                        <View style={[styles.statusBadge, { backgroundColor: '#F59E0B20' }]}>
                            <Text style={[styles.statusText, { color: '#F59E0B' }]}>Pending</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

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
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Reward Info Card */}
                    {referralSettings.enabled && referralSettings.amount > 0 && (
                        <LinearGradient
                            colors={[theme.primary, theme.secondary || theme.primary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.rewardCard}
                        >
                            <View style={styles.rewardHeader}>
                                <Ionicons name="gift" size={32} color="#FFF" />
                                <Text style={styles.rewardTitle}>Referral Reward</Text>
                            </View>
                            <Text style={styles.rewardAmount}>₦{referralSettings.amount.toLocaleString()}</Text>
                            <Text style={styles.rewardSubtitle}>
                                Earn this amount for each friend who completes their first transaction!
                            </Text>
                        </LinearGradient>
                    )}

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { backgroundColor: cardBg }]}>
                            <Ionicons name="people" size={24} color={theme.primary} />
                            <Text style={[styles.statValue, { color: textColor }]}>{referrals.length}</Text>
                            <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Total Referrals</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: cardBg }]}>
                            <Ionicons name="wallet" size={24} color={theme.success} />
                            <Text style={[styles.statValue, { color: textColor }]}>₦{totalEarnings.toLocaleString()}</Text>
                            <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Total Earned</Text>
                        </View>
                    </View>

                    {/* Referral Code Card */}
                    <View style={[styles.codeCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.codeLabel, { color: textSecondaryColor }]}>YOUR REFERRAL CODE</Text>
                        <View style={[styles.codeContainer, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
                            <Text style={[styles.codeText, { color: theme.primary }]}>
                                {user?.referral_code || 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                onPress={handleCopyReferral}
                            >
                                <Ionicons name="copy-outline" size={18} color="#FFF" />
                                <Text style={styles.actionButtonText}>Copy Code</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}
                                onPress={handleShareReferral}
                            >
                                <Ionicons name="share-social-outline" size={18} color={textColor} />
                                <Text style={[styles.actionButtonText, { color: textColor }]}>Share</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Referrals List */}
                    <View style={styles.listSection}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Referral History</Text>
                        <Text style={[styles.sectionSubtitle, { color: textSecondaryColor }]}>
                            {referrals.length} {referrals.length === 1 ? 'person' : 'people'} joined using your code
                        </Text>
                    </View>

                    {referrals.length === 0 ? (
                        <View style={[styles.emptyContainer, { backgroundColor: cardBg }]}>
                            <Ionicons name="people-outline" size={64} color={textSecondaryColor} opacity={0.3} />
                            <Text style={[styles.emptyText, { color: textColor }]}>
                                No referrals yet
                            </Text>
                            <Text style={[styles.emptySubText, { color: textSecondaryColor }]}>
                                Share your referral code to earn rewards!
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={referrals}
                            renderItem={renderItem}
                            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                            scrollEnabled={false}
                            contentContainerStyle={styles.listContent}
                        />
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
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
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    rewardCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        alignItems: 'center',
    },
    rewardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    rewardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    rewardAmount: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
    },
    rewardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        gap: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    codeCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
    },
    codeLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 12,
    },
    codeContainer: {
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    codeText: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    listSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    listContent: {
        gap: 12,
    },
    referralCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        gap: 12,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
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
        marginBottom: 2,
    },
    pendingText: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    earningBadge: {
        alignItems: 'flex-end',
        gap: 4,
    },
    earnedAmount: {
        fontSize: 16,
        fontWeight: '800',
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
        paddingVertical: 60,
        paddingHorizontal: 40,
        borderRadius: 24,
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
