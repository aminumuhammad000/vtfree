import { useTheme } from '@/components/ThemeContext';
import { userService } from '@/services/user.service';
import { WalletData, walletService } from '@/services/wallet.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Platform,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const theme = {
    primary: "#00ADFF", // Snapchat Blue
    backgroundLight: "#FFFFFF",
    backgroundDark: "#000000",
    inputLight: "#F2F2F2",
    inputDark: "#1E1E1E",
    textLight: "#000000",
    textDark: "#FFFFFF",
    textSecondaryLight: "#757575",
    textSecondaryDark: "#A0A0A0",
};

export default function WalletScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);

    const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
    const textColor = isDark ? theme.textDark : theme.textLight;
    const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
    const cardBg = isDark ? theme.inputDark : theme.inputLight;
    const brandColor = theme.primary;

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (!loading) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [loading]);

    useFocusEffect(
        useCallback(() => {
            loadWalletData();
        }, [])
    );

    const loadWalletData = async () => {
        try {
            const response = await walletService.getWallet();
            if (response.success && response.data) {
                setWallet(response.data);
            }
        } catch (error: any) {
            console.error('Error loading wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadWalletData();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const quickActions = [
        { icon: 'add-circle', label: 'Add Money', route: '/add-money', color: brandColor },
        { icon: 'phone-portrait', label: 'Airtime', route: '/buy-airtime', color: '#FFFC00' },
        { icon: 'wifi', label: 'Data', route: '/buy-data', color: '#00D166' },
        { icon: 'receipt', label: 'History', route: '/transactions', color: '#9333EA' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: bgColor }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: cardBg }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={20} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>My Wallet</Text>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: cardBg }]}
                        onPress={() => router.push('/add-money')}
                    >
                        <Ionicons name="add" size={22} color={textColor} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={brandColor} />
                    <Text style={[styles.loadingText, { color: textSecondaryColor }]}>Syncing wallet...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: Math.max(insets.bottom, 24) + 80 }
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={brandColor}
                        />
                    }
                >
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                        {/* Balance Card - Snapchat Style */}
                        <View style={styles.balanceCardContainer}>
                            <View style={[styles.balanceCard, { backgroundColor: brandColor }]}>
                                <View style={styles.balanceHeader}>
                                    <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
                                    <TouchableOpacity
                                        style={styles.hideButton}
                                        onPress={() => setIsBalanceHidden(!isBalanceHidden)}
                                    >
                                        <Ionicons
                                            name={isBalanceHidden ? "eye" : "eye-off"}
                                            size={18}
                                            color="#FFFFFF"
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.balanceAmount}>
                                    {isBalanceHidden ? '₦••••••' : formatCurrency(wallet?.balance || 0)}
                                </Text>

                                <View style={styles.cardStats}>
                                    <View style={styles.statItem}>
                                        <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                            <Ionicons name="arrow-down" size={14} color="#FFFFFF" />
                                        </View>
                                        <View>
                                            <Text style={styles.statLabel}>Income</Text>
                                            <Text style={styles.statValue}>{formatCurrency(0)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                            <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
                                        </View>
                                        <View>
                                            <Text style={styles.statLabel}>Spent</Text>
                                            <Text style={styles.statValue}>{formatCurrency(0)}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Quick Actions Grid */}
                        <View style={styles.actionsSection}>
                            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>QUICK ACTIONS</Text>
                            <View style={styles.actionsGrid}>
                                {quickActions.map((action, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.actionCard}
                                        onPress={() => router.push(action.route as any)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.actionIconCircle, { backgroundColor: cardBg }]}>
                                            <Ionicons name={action.icon as any} size={22} color={action.color} />
                                        </View>
                                        <Text style={[styles.actionLabel, { color: textColor }]}>{action.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Recent Activity */}
                        <View style={styles.transactionsSection}>
                            <View style={styles.transactionsHeader}>
                                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>RECENT ACTIVITY</Text>
                                <TouchableOpacity onPress={() => router.push('/transactions')}>
                                    <Text style={[styles.seeAllText, { color: brandColor }]}>See All</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
                                <View style={[styles.emptyIconCircle, { backgroundColor: brandColor + '10' }]}>
                                    <Ionicons name="receipt-outline" size={32} color={brandColor} />
                                </View>
                                <Text style={[styles.emptyStateText, { color: textColor }]}>No transactions yet</Text>
                                <Text style={[styles.emptyStateSubtext, { color: textSecondaryColor }]}>
                                    Your recent activities will appear here.
                                </Text>
                            </View>
                        </View>

                    </Animated.View>
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
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        letterSpacing: -0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        fontWeight: '600',
    },
    balanceCardContainer: {
        marginTop: 8,
    },
    balanceCard: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#00ADFF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    hideButton: {
        padding: 4,
    },
    balanceAmount: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: '700',
        marginBottom: 24,
        letterSpacing: -1,
    },
    cardStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    actionsSection: {
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 16,
        paddingLeft: 4,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    actionCard: {
        alignItems: 'center',
        gap: 8,
    },
    actionIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    transactionsSection: {
        marginTop: 32,
    },
    transactionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 16,
    },
    emptyState: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyStateSubtext: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 18,
    },
});
