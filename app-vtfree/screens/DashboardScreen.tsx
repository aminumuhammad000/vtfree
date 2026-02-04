import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Dimensions, StatusBar } from 'react-native';
import { useRouter, useFocusEffect, Redirect } from 'expo-router';
import {
    Plus,
    Zap,
    Smartphone,
    CheckCircle,
    Clock,
    Eye,
    Bell,
    Wallet,
    TrendingUp,
    ArrowRight
} from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { AppService } from '../services/app.service';
import { WalletService } from '../services/wallet.service';
import { AuthService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { token, user: authUser, signOut } = useAuth();
    const [user, setUser] = useState<any>(authUser);
    const [apps, setApps] = useState<any[]>([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [sessionExpired, setSessionExpired] = useState(false);
    const isLoadingRef = React.useRef(false);

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        building: 0
    });

    // If session expired, immediately redirect and render nothing
    if (sessionExpired) {
        return <Redirect href="/login" />;
    }

    const handleSessionExpired = async () => {
        if (isLoadingRef.current) return; // Prevent multiple calls
        isLoadingRef.current = true;

        console.warn('Session expired - logging out...');

        // Clear everything
        await AsyncStorage.multiRemove(['vtfree_token', 'vtfree_user']);
        await signOut();
        setSessionExpired(true);
        router.replace('/login');
    };

    const loadData = async () => {
        // Prevent multiple simultaneous calls
        if (isLoadingRef.current || sessionExpired) {
            return;
        }

        isLoadingRef.current = true;

        try {
            // Ensure token exists before making API calls
            if (!token) {
                // If context loading is done and still no token, it's expired
                if (loading === false) {
                    await handleSessionExpired();
                }
                return;
            }

            // 1. Get User Info
            try {
                const userStr = await AsyncStorage.getItem('vtfree_user');
                if (userStr) {
                    setUser(JSON.parse(userStr));
                } else {
                    // Fallback fetch if not in storage
                    const profile = await AuthService.getProfile();
                    if (profile.success) setUser(profile.data.user);
                }
            } catch (e) {
                console.warn('User fetch failed:', e);
            }

            // 2. Get Wallet
            try {
                const walletRes = await WalletService.getWallet();
                if (walletRes.success) {
                    setWalletBalance(walletRes.data.balance || 0);
                }
            } catch (error: any) {
                console.error('Wallet fetch failed:', error);
                // Don't kill the whole dashboard for wallet failure
            }

            // 3. Get Apps
            try {
                const appsRes = await AppService.getMyApps();
                if (appsRes.success) {
                    const fetchedApps = appsRes.data.apps || [];
                    setApps(fetchedApps);

                    // Stats
                    setStats({
                        total: fetchedApps.length,
                        active: fetchedApps.filter((app: any) => app.status === 'live').length,
                        building: fetchedApps.filter((app: any) => app.status === 'building' || app.status === 'pending').length
                    });
                }
            } catch (e) {
                console.warn('Apps fetch failed:', e);
            }

        } catch (error: any) {
            const status = error.response?.status;
            // Global error handler if token itself is invalid
            const isAuthError = status === 401;

            if (isAuthError) {
                await handleSessionExpired();
            } else {
                console.error('Dashboard general load error:', error);
            }
        } finally {
            isLoadingRef.current = false;
            if (!sessionExpired) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    const handleRefresh = () => {
        if (!sessionExpired) {
            setRefreshing(true);
            loadData();
        }
    };

    useEffect(() => {
        if (!sessionExpired) {
            loadData();
        }
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            if (!sessionExpired && !isLoadingRef.current) {
                loadData();
            }
        }, [sessionExpired])
    );

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };


    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Premium Header */}
            <LinearGradient
                colors={['#FFFFFF', '#F9FAFB']}
                style={styles.header}
            >
                <View>
                    <Text style={styles.greeting}>
                        <Text style={styles.greetingLight}>Hello, </Text>
                        <Text style={styles.greetingBold}>{user?.first_name || 'Creator'}</Text>
                    </Text>
                    <Text style={styles.subtitle}>Your dashboard is ready</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>

                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => router.push('/profile')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[Colors.primaryLighter, '#FFFFFF']}
                            style={styles.profileAvatarWrapper}
                        >
                            {user?.profile_picture ? (
                                <Image
                                    source={{ uri: user.profile_picture }}
                                    style={styles.profileAvatar}
                                />
                            ) : (
                                <Image
                                    source={require('../assets/images/logo.png')}
                                    style={styles.profileAvatar}
                                />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />}
            >
                {/* Wallet Card */}
                {/* Wallet Card - Pressable */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => router.push('/wallet')}
                    style={styles.walletCardWrapper}
                >
                    <LinearGradient
                        colors={[Colors.primary, Colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.walletCard}
                    >
                        <View style={styles.walletInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Wallet color="#FFFFFF" size={20} />
                                <Text style={styles.walletLabel}>Wallet Balance</Text>
                            </View>
                            <Text
                                style={styles.walletAmount}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {formatCurrency(walletBalance)}
                            </Text>
                        </View>
                        <View style={styles.walletArrow}>
                            <TrendingUp color="#FFFFFF" size={24} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>


                {/* Quick Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total Apps</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.green[700] }]}>{stats.active}</Text>
                        <Text style={styles.statLabel}>Live</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.yellow[700] }]}>{stats.building}</Text>
                        <Text style={styles.statLabel}>Building</Text>
                    </View>
                </View>

                {/* Create App Banner */}
                <TouchableOpacity
                    style={styles.createBanner}
                    activeOpacity={0.9}
                    onPress={() => router.push('/create-app')}
                >
                    <LinearGradient
                        colors={[Colors.primaryLight, Colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.createBannerGradient}
                    >
                        <View style={styles.createBannerContent}>
                            <View style={styles.createIconBox}>
                                <Zap color={Colors.primary} size={24} fill={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.createBannerTitle}>Create New App</Text>
                                <Text style={styles.createBannerSubtitle}>Launch a VTU app in minutes</Text>
                            </View>
                        </View>
                        <View style={styles.arrowBox}>
                            <Plus color={Colors.white} size={24} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Recent Apps Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Applications</Text>
                    {apps.length > 0 && (
                        <TouchableOpacity onPress={() => router.push('/my-apps')}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {apps.length === 0 && !loading ? (
                    <View style={styles.emptyState}>
                        <Image
                            source={require('../assets/images/logo.png')}
                            style={[styles.emptyParams, { opacity: 0.1, tintColor: Colors.gray[400] }]}
                        />
                        <Text style={styles.emptyTitle}>No apps yet</Text>
                        <Text style={styles.emptySubtitle}>Start your journey by creating your first VTU app today.</Text>
                    </View>
                ) : (
                    <View style={styles.appsList}>
                        {apps.slice(0, 3).map((app) => (
                            <TouchableOpacity
                                key={app._id}
                                style={styles.appCard}
                                activeOpacity={0.7}
                                onPress={() => router.push({
                                    pathname: '/app-details',
                                    params: {
                                        appId: app.app_id,
                                        name: app.app_name,
                                        package: app.package_name,
                                        status: app.status,
                                        color: app.branding?.primary_color,
                                        logo: app.branding?.logo_url,
                                        type: 'Android' // Default or derive from app data if available
                                    }
                                })}
                            >
                                <View style={styles.appCardHeader}>
                                    {app.branding?.logo_url ? (
                                        <Image
                                            source={{ uri: app.branding.logo_url }}
                                            style={styles.appLogo}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={[styles.appLogoPlaceholder, { backgroundColor: app.branding?.primary_color || Colors.primary }]}>
                                            <Text style={styles.appLogoText}>{app.app_name?.charAt(0)}</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.appName} numberOfLines={1}>{app.app_name}</Text>
                                        <Text style={styles.appPackage} numberOfLines={1}>{app.package_name}</Text>
                                    </View>
                                    {(() => {
                                        const buildStatus = app.build_status_full;
                                        const isLive = buildStatus === 'completed' || app.status === 'live';
                                        const isBuilding = buildStatus === 'building';
                                        const isQueued = buildStatus === 'queued';
                                        const isFailed = buildStatus === 'failed' || app.status === 'failed';
                                        const isPending = app.status === 'pending' || !buildStatus;

                                        return (
                                            <View style={[
                                                styles.statusBadge,
                                                isLive ? styles.statusLive :
                                                    (isFailed ? styles.statusFailed :
                                                        (isPending ? styles.statusPending : styles.statusBuilding))
                                            ]}>
                                                <Text style={[
                                                    styles.statusText,
                                                    isLive ? styles.statusTextLive :
                                                        (isFailed ? styles.statusTextFailed :
                                                            (isPending ? styles.statusTextPending : styles.statusTextBuilding))
                                                ]}>
                                                    {isLive ? 'Live' : (isFailed ? 'Failed' : (isQueued ? 'Queued' : (isPending ? 'Pending' : 'Building')))}
                                                </Text>
                                            </View>
                                        );
                                    })()}
                                </View>

                                {(() => {
                                    const buildStatus = app.build_status_full;
                                    const isLive = buildStatus === 'completed' || app.status === 'live';
                                    const isBuilding = buildStatus === 'building';
                                    const isQueued = buildStatus === 'queued';
                                    const isFailed = buildStatus === 'failed' || app.status === 'failed';
                                    const isPending = app.status === 'pending';

                                    if (isBuilding || isQueued) {
                                        return (
                                            <TouchableOpacity
                                                style={styles.upgradeButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    router.push({ pathname: '/build-status', params: { appId: app.app_id } });
                                                }}
                                            >
                                                <Text style={[styles.upgradeButtonText, { color: Colors.yellow[700] }]}>View Progress</Text>
                                                <ArrowRight size={14} color={Colors.yellow[700]} />
                                            </TouchableOpacity>
                                        );
                                    }

                                    if (isFailed) {
                                        return (
                                            <TouchableOpacity
                                                style={styles.upgradeButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    router.push({ pathname: '/build-status', params: { appId: app.app_id } });
                                                }}
                                            >
                                                <Text style={[styles.upgradeButtonText, { color: Colors.red[700] }]}>Retry Build</Text>
                                                <ArrowRight size={14} color={Colors.red[700]} />
                                            </TouchableOpacity>
                                        );
                                    }

                                    return (
                                        <TouchableOpacity
                                            style={styles.upgradeButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                router.push({ pathname: '/build-app', params: { appId: app.app_id } });
                                            }}
                                        >
                                            <Text style={styles.upgradeButtonText}>Upgrade / Build</Text>
                                            <ArrowRight size={14} color={Colors.primary} />
                                        </TouchableOpacity>
                                    );
                                })()}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
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
        paddingHorizontal: 20,
        paddingTop: 54,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    greeting: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    greetingLight: {
        fontSize: 18,
        fontWeight: '400',
        color: Colors.gray[600],
    },
    greetingBold: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.gray[400],
        letterSpacing: 0.3,
    },
    profileButton: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    profileAvatarWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
    },
    profileAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        backgroundColor: Colors.gray[100],
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 120, // Increased for floating TabBar
    },
    walletCardWrapper: {
        marginBottom: 24,
        borderRadius: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
        backgroundColor: Colors.white, // backdrop
    },
    walletCard: {
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletInfo: {
        flex: 1,
    },
    walletAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    walletLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    walletArrow: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.gray[200],
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.gray[500],
        fontWeight: '500',
    },
    createBanner: {
        borderRadius: 20,
        marginBottom: 32,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    createBannerGradient: {
        borderRadius: 20,
        padding: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 20,
    },
    createBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        flex: 1,
    },
    createIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    createBannerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 4,
    },
    createBannerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },
    arrowBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    viewAllText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    appsList: {
        gap: 16,
    },
    appCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.gray[100],
    },
    appCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    appLogo: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: Colors.gray[100],
    },
    appLogoPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appLogoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.white,
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    appPackage: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusLive: {
        backgroundColor: Colors.green[100],
    },
    statusBuilding: {
        backgroundColor: Colors.yellow[100],
    },
    statusPending: {
        backgroundColor: '#FFEDD5',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextLive: {
        color: Colors.green[700],
    },
    statusTextBuilding: {
        color: Colors.yellow[700],
    },
    statusTextPending: {
        color: '#EA580C',
    },
    statusTextFailed: {
        color: Colors.red[700],
    },
    statusFailed: {
        backgroundColor: Colors.red[100],
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingTop: 12,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
    },
    upgradeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyParams: {
        width: 80,
        height: 80,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.gray[800],
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.gray[500],
        textAlign: 'center',
        maxWidth: 240,
    },
    virtualAccountCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    vaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    vaTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#166534',
    },
    vaContent: {
        gap: 12,
    },
    vaItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vaLabel: {
        fontSize: 13,
        color: '#166534',
        opacity: 0.7,
    },
    vaValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#166534',
    },
    vaAccountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    vaAccountNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#166534',
        letterSpacing: 1,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.white,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 0.5,
        borderColor: '#DCFCE7',
    },
    copyText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.primary,
    },
    vaFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#DCFCE7',
    },
    vaNote: {
        fontSize: 11,
        color: '#166534',
        opacity: 0.6,
        fontStyle: 'italic',
    },
    noAccountBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F5F3FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#EDE9FE',
    },
    noAccountText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
        flex: 1,
    },
});
