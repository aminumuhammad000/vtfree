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
    TrendingUp
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
    const { signOut } = useAuth();
    const [user, setUser] = useState<any>(null);
    const [apps, setApps] = useState<any[]>([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
            const token = await AsyncStorage.getItem('vtfree_token');
            if (!token) {
                await handleSessionExpired();
                return;
            }

            // 1. Get User Info
            const userStr = await AsyncStorage.getItem('vtfree_user');
            if (userStr) {
                setUser(JSON.parse(userStr));
            } else {
                // Fallback fetch if not in storage
                const profile = await AuthService.getProfile();
                if (profile.success) setUser(profile.data.user);
            }

            // 2. Get Wallet
            const walletRes = await WalletService.getWallet();
            if (walletRes.success) {
                setWalletBalance(walletRes.data.balance || 0);
            }

            // 3. Get Apps
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

        } catch (error: any) {
            const status = error.response?.status;
            const msg = error.message?.toLowerCase() || '';
            const serverMsg = error.response?.data?.message?.toLowerCase() || '';

            // Check for various forms of auth errors
            const isAuthError =
                error.isAuthError || // Flag from axios interceptor
                status === 401 ||
                msg.includes('invalid token') ||
                msg.includes('jwt') ||
                msg.includes('unauthorized') ||
                msg.includes('session') ||
                msg.includes('no token') ||
                serverMsg.includes('invalid token') ||
                serverMsg.includes('unauthorized') ||
                serverMsg.includes('session') ||
                serverMsg.includes('no token');

            if (isAuthError) {
                await handleSessionExpired();
                return;
            } else {
                // Only log as error if it's NOT an auth error
                console.error('Dashboard load failed:', error);
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

            {/* Custom Header (No Hamburger) */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {user?.first_name || 'Creator'} 👋</Text>
                    <Text style={styles.subtitle}>Welcome back to VTfree</Text>
                </View>
                <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={styles.profileAvatar}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />}
            >
                {/* Wallet Card */}
                <LinearGradient
                    colors={[Colors.primary, Colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.walletCard}
                >
                    <View style={styles.walletInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Wallet color="rgba(255,255,255,0.8)" size={20} />
                            <Text style={styles.walletLabel}>Wallet Balance</Text>
                        </View>
                        <Text style={styles.walletAmount}>{formatCurrency(walletBalance)}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.fundButton}
                        activeOpacity={0.8}
                        onPress={() => router.push('/wallet')}
                    >
                        <Plus color={Colors.primary} size={20} />
                        <Text style={styles.fundButtonText}>Add Money</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Quick Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total Apps</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.green[600] }]}>{stats.active}</Text>
                        <Text style={styles.statLabel}>Live</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.yellow[600] }]}>{stats.building}</Text>
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
                                onPress={() => router.push({ pathname: '/app-details', params: { appId: app.app_id } })}
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
                                    <View style={[styles.statusBadge, app.status === 'live' ? styles.statusLive : styles.statusBuilding]}>
                                        <Text style={[styles.statusText, app.status === 'live' ? styles.statusTextLive : styles.statusTextBuilding]}>
                                            {app.status === 'live' ? 'Live' : 'Building'}
                                        </Text>
                                    </View>
                                </View>
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
        paddingTop: 60,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.gray[500],
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.white,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
        paddingBottom: 40,
    },
    walletCard: {
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    walletInfo: {
        flex: 1,
    },
    walletLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    walletAmount: {
        color: Colors.white,
        fontSize: 28,
        fontWeight: 'bold',
    },
    fundButton: {
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    fundButtonText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 14,
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
});
