import { useTheme } from '@/components/ThemeContext';
import { useProfile } from '@/components/ProfileContext';
import { useAlert } from '@/components/AlertContext';
import { walletService, WalletData } from '@/services/wallet.service';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
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
    Platform,
    Dimensions,
    Image,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown,
    FadeInRight,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useTheme();
    const { profileData } = useProfile();
    const { showWarning } = useAlert();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);

    const bgColor = theme.background;
    const textColor = theme.text;
    const textSecondaryColor = theme.textSecondary;
    const cardBg = theme.surface;
    const brandColor = theme.primary;

    const balanceScale = useSharedValue(1);

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await loadWalletData();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleActionPress = (route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Features that require KYC
        const kycRequiredRoutes = ['/add-money', '/buy-airtime', '/buy-data', '/pay-bills'];

        if (kycRequiredRoutes.some(r => route.startsWith(r)) && profileData.kyc_status !== 'verified') {
            showWarning('KYC Verification Required: Please complete your verification to access this feature.');
            router.push('/kyc');
            return;
        }

        router.push(route as any);
    };

    const toggleBalance = () => {
        Haptics.selectionAsync();
        setIsBalanceHidden(!isBalanceHidden);
        balanceScale.value = withSpring(1.05, { damping: 10, stiffness: 100 }, () => {
            balanceScale.value = withSpring(1);
        });
    };

    const quickActions = [
        { icon: 'add-circle-outline', label: 'Fund', route: '/add-money', color: theme.primary, bg: theme.primary + '15' },
        { icon: 'flash-outline', label: 'Airtime', route: '/buy-airtime', color: theme.warning, bg: theme.warning + '15' },
        { icon: 'wifi-outline', label: 'Data', route: '/buy-data', color: theme.secondary, bg: theme.secondary + '15' },
        { icon: 'time-outline', label: 'History', route: '/transactions', color: theme.accent, bg: theme.accent + '15' },
    ];

    const animatedBalanceStyle = useAnimatedStyle(() => ({
        transform: [{ scale: balanceScale.value }]
    }));

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Premium Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>My Wallet</Text>
                    <View style={[styles.statusIndicator, { backgroundColor: theme.primary }]} />
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.headerActionBtn, { backgroundColor: cardBg }]}
                        onPress={() => handleActionPress('/add-money')}
                    >
                        <Ionicons name="add" size={24} color={brandColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.headerActionBtn, { backgroundColor: cardBg }]}
                        onPress={() => router.push('/(tabs)/profile')}
                    >
                        <Ionicons name="person-circle-outline" size={26} color={brandColor} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={brandColor} />
                    <Text style={[styles.loadingText, { color: textSecondaryColor }]}>Syncing your wealth...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brandColor} />
                    }
                >
                    {/* Animated Balance Card */}
                    <Animated.View entering={FadeInDown.duration(800).springify()}>
                        <View
                            style={[styles.balanceCard, { backgroundColor: brandColor }]}
                        >
                            <View style={styles.cardGlass} />
                            <View style={styles.cardContent}>
                                <View style={styles.balanceHeader}>
                                    <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                                    <TouchableOpacity onPress={toggleBalance} style={styles.eyeBtn}>
                                        <Ionicons name={isBalanceHidden ? "eye-outline" : "eye-off-outline"} size={20} color="#FFF" />
                                    </TouchableOpacity>
                                </View>

                                <Animated.Text style={[styles.balanceAmount, animatedBalanceStyle]}>
                                    {isBalanceHidden ? '₦ • • • • •' : formatCurrency(wallet?.balance || 0)}
                                </Animated.Text>

                                <View style={styles.cardInfo}>
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoBox}>
                                            <MaterialCommunityIcons name="arrow-bottom-left" size={16} color="#FFF" />
                                            <View>
                                                <Text style={styles.infoLabel}>Income</Text>
                                                <Text style={styles.infoValue}>₦0.00</Text>
                                            </View>
                                        </View>
                                        <View style={styles.infoDivider} />
                                        <View style={styles.infoBox}>
                                            <MaterialCommunityIcons name="arrow-top-right" size={16} color="#FFF" />
                                            <View>
                                                <Text style={styles.infoLabel}>Spent</Text>
                                                <Text style={styles.infoValue}>₦0.00</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Quick Services Grid */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: textColor }]}>SERVICES</Text>
                        <View style={styles.grid}>
                            {quickActions.map((action, index) => (
                                <Animated.View key={index} entering={FadeInDown.delay(index * 100).duration(600).springify()}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: cardBg }]}
                                        onPress={() => handleActionPress(action.route)}
                                    >
                                        <View style={[styles.iconCircle, { backgroundColor: action.bg }]}>
                                            <Ionicons name={action.icon as any} size={24} color={action.color} />
                                        </View>
                                        <Text style={[styles.actionLabel, { color: textColor }]}>{action.label}</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    </View>

                    {/* Recent Transactions / Empty State */}
                    <View style={styles.section}>
                        <View style={styles.row}>
                            <Text style={[styles.sectionHeader, { color: textColor }]}>RECENT ACTIVITY</Text>
                            <TouchableOpacity onPress={() => router.push('/transactions')}>
                                <Text style={[styles.seeAll, { color: brandColor }]}>View All</Text>
                            </TouchableOpacity>
                        </View>

                        <Animated.View entering={FadeInUp.delay(500).duration(800)}>
                            <View style={[styles.emptyContainer, { backgroundColor: cardBg }]}>
                                <View style={styles.illuBox}>
                                    <Image
                                        source={{ uri: 'https://images.unsplash.com/photo-1620712943543-bcc4638d9f8e?q=80&w=400&auto=format&fit=crop' }}
                                        style={styles.illustration}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={[styles.emptyTitle, { color: textColor }]}>No Activity Recorded</Text>
                                <Text style={[styles.emptySub, { color: textSecondaryColor }]}>
                                    Start using your wallet to see your transaction history and spending insights here.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.fundBtn, { backgroundColor: brandColor }]}
                                    onPress={() => handleActionPress('/add-money')}
                                >
                                    <Text style={styles.fundBtnText}>Fund</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>

                    {/* Security Tip Card */}
                    <Animated.View entering={FadeInDown.delay(800)}>
                        <View style={[styles.tipCard, { backgroundColor: theme.surface }]}>
                            <View style={styles.tipIcon}>
                                <Ionicons name="shield-checkmark" size={24} color={brandColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.tipTitle, { color: textColor }]}>Secure Storage</Text>
                                <Text style={[styles.tipDesc, { color: textSecondaryColor }]}>
                                    Your funds are protected with bank-grade encryption and multi-factor authentication.
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
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 15,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -1,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 2 }
        })
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 14, fontWeight: '700' },
    balanceCard: {
        borderRadius: 35,
        padding: 30,
        height: 220,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#00ADFF', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 },
            android: { elevation: 15 }
        })
    },
    cardGlass: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    cardContent: { flex: 1, justifyContent: 'space-between' },
    balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    eyeBtn: { padding: 5 },
    balanceAmount: { color: '#FFF', fontSize: 40, fontWeight: '900', letterSpacing: -1.5, marginVertical: 15 },
    cardInfo: { paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    infoValue: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    infoDivider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.2)' },
    section: { marginTop: 35 },
    sectionHeader: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 20, opacity: 0.6 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    actionBtn: {
        width: (width - 48 - 36) / 2, // 2 items per row with gap
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        gap: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 3 }
        })
    },
    iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    actionLabel: { fontSize: 13, fontWeight: '800' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    seeAll: { fontSize: 14, fontWeight: '800', marginBottom: 20 },
    emptyContainer: { borderRadius: 35, padding: 35, alignItems: 'center', gap: 20 },
    illuBox: { width: 150, height: 120, justifyContent: 'center', alignItems: 'center' },
    illustration: { width: '100%', height: '100%', opacity: 0.8 },
    emptyTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
    emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.7 },
    fundBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 20,
        marginTop: 10
    },
    fundBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    tipCard: { marginTop: 30, padding: 25, borderRadius: 28, flexDirection: 'row', gap: 18, alignItems: 'center' },
    tipIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    tipTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    tipDesc: { fontSize: 13, lineHeight: 18 },
});
