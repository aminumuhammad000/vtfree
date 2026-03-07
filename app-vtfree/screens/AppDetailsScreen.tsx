import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Image, Linking, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Download,
    Settings,
    Globe,
    Smartphone,
    Edit3,
    CheckCircle,
    Clock,
    AlertTriangle,
    Share2,
    BarChart2,
    Box,
    Copy,
    Rocket,
    RotateCcw
} from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { AppService } from '../services/app.service';

export default function AppDetailsScreen() {
    const router = useRouter();
    const { appId } = useLocalSearchParams();
    const [app, setApp] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const scrollY = new Animated.Value(0);

    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchDetails();
    }, [appId]);

    const fetchDetails = async () => {
        if (!appId) return;
        try {
            const response = await AppService.getAppDetails(appId as string);
            if (response.success) {
                setApp(response.data.app);
            }
        } catch (error) {
            console.error('Error fetching app details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Precise Status Logic
    const buildStatus = app?.build_status_full; // queued, building, completed, failed
    const isFailed = buildStatus === 'failed' || app?.status === 'failed';
    const isPending = app?.status === 'pending';
    const isBuilding = buildStatus === 'building';
    const isQueued = buildStatus === 'queued';

    // An app is only live if it's explicitly completed and not in a failed/pending state
    const isLive = (buildStatus === 'completed' || app?.status === 'live') && !isFailed && !isPending;

    const handleDownload = async (platform: 'android' | 'web' | 'ios') => {
        if (!isLive) {
            let title = 'Not Ready';
            let msg = 'The app build is not yet available for download.';

            if (isPending) {
                title = 'Payment Pending';
                msg = 'Please complete the build process to generate download links.';
            } else if (isBuilding) {
                title = 'Building';
                msg = 'Your app is still being built. Please wait.';
            } else if (isQueued) {
                title = 'Queued';
                msg = 'Your app is in the build queue and will start shortly.';
            } else if (isFailed) {
                title = 'Build Failed';
                msg = 'The last build attempt failed. Please check the build status for more details.';
            }

            Alert.alert(title, msg);
            return;
        }

        const link = app?.download_links?.[platform];
        if (link) {
            Linking.openURL(link);
        } else {
            Alert.alert('Missing Link', 'Download link not found. Please try rebuilding.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!app) {
        return (
            <View style={styles.loadingContainer}>
                <Text>App not found</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Animated Header Background */}
            <View style={styles.headerBgContainer}>
                <LinearGradient
                    colors={[app.branding?.primary_color || Colors.primary, Colors.background]}
                    style={styles.headerGradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </View>

            {/* Custom Nav Bar */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.navTitle} numberOfLines={1}>{app.app_name}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/edit-app', params: { appId: app.app_id } })} style={styles.navButton}>
                    <Edit3 color={Colors.text.primary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* App Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.iconWrapper}>
                        {app.branding?.logo_url ? (
                            <Image source={{ uri: app.branding.logo_url }} style={styles.appIcon} />
                        ) : (
                            <View style={[styles.appIconPlaceholder, { backgroundColor: app.branding?.primary_color || Colors.primary }]}>
                                <Text style={styles.appIconText}>{app.app_name.charAt(0)}</Text>
                            </View>
                        )}
                        <View style={styles.platformBadgeRow}>
                            {app.platforms?.android && <View style={styles.miniBadge}><Smartphone size={10} color={Colors.white} /></View>}
                            {app.platforms?.web && <View style={styles.miniBadge}><Globe size={10} color={Colors.white} /></View>}
                        </View>
                    </View>

                    <Text style={styles.heroTitle}>{app.app_name}</Text>
                    <Text style={styles.heroPackage}>{app.package_name}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: Colors.gray[600], fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace' }} selectable>ID: {app.app_id}</Text>
                        <TouchableOpacity onPress={() => Alert.alert('Copied', app.app_id)}>
                            <Copy size={12} color={Colors.gray[600]} />
                        </TouchableOpacity>
                    </View>

                    <View style={[
                        styles.statusPill,
                        isLive ? styles.statusLive : (isFailed ? styles.statusFailed : (isPending ? styles.statusPending : styles.statusBuilding))
                    ]}>
                        {isLive ? <CheckCircle size={14} color={Colors.green[700]} /> : (isFailed ? <AlertTriangle size={14} color={Colors.red[700]} /> : <Clock size={14} color={isPending ? '#EA580C' : Colors.yellow[700]} />)}
                        <Text style={[styles.statusText, isLive ? styles.textLive : (isFailed ? styles.textFailed : (isPending ? styles.textPending : styles.textBuilding))]}>
                            {isLive ? 'Live & Active' : (isFailed ? 'Build Failed' : (isPending ? 'Pending' : (isQueued ? 'Queued' : 'Building')))}
                        </Text>
                    </View>
                </View>

                {/* Main Actions Grid */}
                <View style={styles.gridContainer}>
                    {/* Android Download Card */}
                    {app.platforms?.android && (
                        <TouchableOpacity
                            style={[
                                styles.actionCard,
                                styles.primaryCard,
                                !isLive && { opacity: 0.5, backgroundColor: Colors.gray[400] }
                            ]}
                            onPress={() => handleDownload('android')}
                            activeOpacity={0.9}
                            disabled={!isLive}
                        >
                            <View style={styles.cardIconCircle}>
                                <Download color={Colors.white} size={24} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitleWhite}>Download APK</Text>
                                <Text style={styles.cardSubWhite}>{isLive ? 'Android App v1.0.0' : 'Not yet built'}</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Web Download Card */}
                    {app.platforms?.web && (
                        <TouchableOpacity
                            style={[
                                styles.actionCard,
                                styles.primaryCard,
                                { backgroundColor: Colors.accent },
                                !isLive && { opacity: 0.5, backgroundColor: Colors.gray[400] }
                            ]}
                            onPress={() => handleDownload('web')}
                            activeOpacity={0.9}
                            disabled={!isLive}
                        >
                            <View style={styles.cardIconCircle}>
                                <Globe color={Colors.white} size={24} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitleWhite}>Web App Assets</Text>
                                <Text style={styles.cardSubWhite}>{isLive ? 'Download Source Zip' : 'Not yet built'}</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* View Progress / Retry / Analytics Card */}
                    {(isBuilding || isQueued) ? (
                        <TouchableOpacity
                            style={[styles.actionCard, { borderColor: Colors.yellow[500], borderWidth: 1 }]}
                            onPress={() => router.push({ pathname: '/build-status', params: { appId: app.app_id } })}
                        >
                            <View style={[styles.cardIconBg, { backgroundColor: Colors.yellow[100] }]}>
                                <Rocket color={Colors.yellow[700]} size={24} />
                            </View>
                            <Text style={styles.cardTitle}>View Progress</Text>
                            <Text style={styles.cardSub}>Track building</Text>
                        </TouchableOpacity>
                    ) : isFailed ? (
                        <TouchableOpacity
                            style={[styles.actionCard, { borderColor: Colors.red[500], borderWidth: 1 }]}
                            onPress={() => router.push({ pathname: '/build-status', params: { appId: app.app_id } })}
                        >
                            <View style={[styles.cardIconBg, { backgroundColor: Colors.red[100] }]}>
                                <RotateCcw color={Colors.red[700]} size={24} />
                            </View>
                            <Text style={styles.cardTitle}>Retry Build</Text>
                            <Text style={styles.cardSub}>Fix build errors</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                            <View style={[styles.cardIconBg, { backgroundColor: Colors.primaryLighter }]}>
                                <BarChart2 color={Colors.primary} size={24} />
                            </View>
                            <Text style={styles.cardTitle}>Analytics</Text>
                            <Text style={styles.cardSub}>0 Users</Text>
                        </TouchableOpacity>
                    )}

                    {/* Edit / Config Card */}
                    <TouchableOpacity
                        style={[styles.actionCard, (isBuilding || isQueued) && { opacity: 0.5 }]}
                        activeOpacity={0.7}
                        disabled={isBuilding || isQueued}
                        onPress={() => router.push({ pathname: '/edit-app', params: { appId: app.app_id } })}
                    >
                        <View style={[styles.cardIconBg, { backgroundColor: Colors.gray[100] }]}>
                            <Settings color={Colors.gray[700]} size={24} />
                        </View>
                        <Text style={styles.cardTitle}>Configuration</Text>
                        <Text style={styles.cardSub}>{(isBuilding || isQueued) ? 'Wait for build' : 'Manage app'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Information Sections */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionHeader}>Build Details</Text>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Version</Text>
                            <Text style={styles.infoValue}>1.0.0</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>SDK</Text>
                            <Text style={styles.infoValue}>33</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Size</Text>
                            <Text style={styles.infoValue}>~15 MB</Text>
                        </View>
                    </View>
                </View>

                {/* Admin Details Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionHeader}>Admin Details</Text>
                    <View style={styles.adminInfoRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>App ID</Text>
                            <Text style={styles.infoValueSelectable} selectable>{app.app_id}</Text>
                        </View>
                        <TouchableOpacity onPress={() => {
                            Alert.alert('Copied', `App ID ${app.app_id} copied to clipboard`);
                            // Clipboard.setString(app.app_id); // Requires expo-clipboard
                        }}>
                            <Copy size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.helperText}>Use this ID to login to your Admin Panel manually.</Text>
                </View>

                {/* Services List */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionHeader}>Active Services</Text>
                    <View style={styles.servicesGrid}>
                        {(app.services || []).map((service: string, index: number) => (
                            <View key={index} style={styles.serviceTag}>
                                <Box size={14} color={Colors.gray[600]} />
                                <Text style={styles.serviceText}>{service}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBgContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        zIndex: -1,
    },
    headerGradient: {
        flex: 1,
        opacity: 0.15,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    navButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
        backdropFilter: 'blur(10px)',
    },
    navTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    iconWrapper: {
        position: 'relative',
        marginBottom: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    appIcon: {
        width: 100,
        height: 100,
        borderRadius: 24,
    },
    appIconPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appIconText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: Colors.white,
    },
    platformBadgeRow: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        flexDirection: 'row',
        gap: 4,
    },
    miniBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.text.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
        textAlign: 'center',
    },
    heroPackage: {
        fontSize: 14,
        color: Colors.gray[500],
        marginBottom: 12,
        textAlign: 'center',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusLive: {
        backgroundColor: Colors.green[50],
        borderColor: Colors.green[200],
    },
    statusBuilding: {
        backgroundColor: Colors.yellow[50],
        borderColor: Colors.yellow[200],
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    textLive: { color: Colors.green[700] },
    textBuilding: { color: Colors.yellow[700] },
    statusFailed: {
        backgroundColor: Colors.red[50],
        borderColor: Colors.red[200],
    },
    textFailed: { color: Colors.red[700] },
    statusPending: {
        backgroundColor: '#FFEDD5',
        borderColor: '#FED7AA',
    },
    textPending: { color: '#EA580C' },

    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 16,
        width: '48%', // Roughly half minus gap
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        minHeight: 140,
        justifyContent: 'space-between',
    },
    primaryCard: {
        width: '100%',
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 16,
        minHeight: 100,
    },
    cardIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitleWhite: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.white,
    },
    cardSubWhite: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    cardIconBg: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    cardSub: {
        fontSize: 12,
        color: Colors.gray[500],
    },

    infoSection: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoItem: {
        alignItems: 'center',
        flex: 1,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.gray[200],
    },
    infoLabel: {
        fontSize: 12,
        color: Colors.gray[500],
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    infoValueSelectable: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        fontFamily: 'monospace', // Make it look like code
    },
    adminInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.gray[50],
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    helperText: {
        fontSize: 12,
        color: Colors.gray[500],
        marginTop: 8,
    },

    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    serviceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Colors.gray[50],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.gray[100],
    },
    serviceText: {
        fontSize: 14,
        color: Colors.gray[700],
        fontWeight: '500',
    },
});
