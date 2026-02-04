import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Linking, Alert, Image, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, Globe, Smartphone, Play, Plus, ChevronRight, Copy, Settings, Lock, Edit, Download, Laptop, Rocket, RefreshCw, ArrowRight } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppService } from '../services/app.service';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../services/api';

import { BuildProgressModal } from '../components/BuildProgressModal';

export default function AppDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { token } = useAuth(); // Get token

    const [isBuilding, setIsBuilding] = React.useState(false);

    // Build Progress State
    const [showBuildModal, setShowBuildModal] = React.useState(false);
    const [buildStage, setBuildStage] = React.useState('Initializing...');
    const [buildProgress, setBuildProgress] = React.useState(0);
    const [buildStatus, setBuildStatus] = React.useState<'not_started' | 'building' | 'completed' | 'failed'>('not_started');
    const [apkLink, setApkLink] = React.useState<string | undefined>(undefined);
    const [driveLink, setDriveLink] = React.useState<string | undefined>(undefined);

    const pollingRef = React.useRef<any>(null);

    // Determine color - handle both string and array from params
    const colorParam = Array.isArray(params.color) ? params.color[0] : params.color;
    const appColor = colorParam || Colors.primary;

    const initialStatus = typeof params.status === 'string'
        ? (params.status.charAt(0).toUpperCase() + params.status.slice(1))
        : 'Building';

    const [appData, setAppData] = React.useState({
        name: params.name || 'VTfree App',
        package: params.package || 'com.vtfree.app',
        version: '1.0.0',
        status: initialStatus,
        type: params.type || 'Android',
        icon: params.type === 'Web' ? Globe : Smartphone,
        logo: params.logo as string | null,
        color: appColor,
        admins: [] as any[]
    });

    // Admin adding functionality removed as per request


    const [showBuildConfirm, setShowBuildConfirm] = React.useState(false);

    const [prices, setPrices] = React.useState<any>(null);

    // Socket State
    const [socket, setSocket] = React.useState<any>(null);

    React.useEffect(() => {
        if (params.appId) {
            fetchAppDetails(params.appId as string);
            setupSocket(params.appId as string);
        }
        fetchPrices();

        return () => {
            if (socket) {
                socket.emit('leave_app', params.appId);
                socket.disconnect();
            }
        };
    }, [params.appId]);

    const setupSocket = (appId: string) => {
        // Dynamic import to avoid issues if package missing (though we installed it)
        const { io } = require('socket.io-client');
        import('../services/api').then(({ SOCKET_URL }) => {
            const newSocket = io(SOCKET_URL);

            newSocket.on('connect', () => {
                console.log('Socket Connected');
                newSocket.emit('join_app', appId);
            });

            newSocket.on('build_update', (data: any) => {
                console.log('Socket Update:', data);

                // Update Progress Modal State
                if (data.progress !== undefined) setBuildProgress(data.progress);
                if (data.stage) setBuildStage(data.stage);

                // Update Local App Data Status
                if (data.status) {
                    let displayStatus = 'Building';
                    if (data.status === 'active' || data.status === 'live') displayStatus = 'Live';
                    else if (data.status === 'pending') displayStatus = 'Pending';
                    else if (data.status === 'failed') displayStatus = 'Failed';
                    else if (data.status === 'queued') displayStatus = 'Queued';

                    setAppData(prev => ({ ...prev, status: displayStatus }));
                }

                // Handle Completion/Failure logic for Modal
                if (data.status === 'live' || data.status === 'completed') {
                    setBuildStatus('completed');
                    if (data.download_links) {
                        setApkLink(data.download_links.android);
                        setDriveLink(data.download_links.android);
                    }
                    // Refresh details to ensure consistency
                    fetchAppDetails(appId);
                } else if (data.status === 'failed') {
                    setBuildStatus('failed');
                } else if (data.status === 'building') {
                    setBuildStatus('building');
                }
            });

            setSocket(newSocket);
        });
    };

    const fetchPrices = async () => {
        try {
            const res = await AppService.getAppPrices();
            if (res.success) {
                setPrices(res.data);
            }
        } catch (e) {
            console.error('Failed to fetch prices', e);
        }
    };

    const fetchAppDetails = async (id: string) => {
        try {
            const response = await AppService.getAppDetails(id);
            if (response.success) {
                const app = response.data.app;
                let displayStatus = 'Building';
                if (app.status === 'active' || app.status === 'live') displayStatus = 'Live';
                else if (app.status === 'pending') displayStatus = 'Pending';
                else if (app.status === 'failed') displayStatus = 'Failed';
                else if (app.status === 'queued') displayStatus = 'Queued';

                // Map Admins properly
                const formattedAdmins = (response.data.admins || []).map((admin: any) => ({
                    id: admin._id,
                    name: admin.first_name ? `${admin.first_name} ${admin.last_name || ''}` : (admin.email?.split('@')[0] || 'Unknown'), // Use name or username part of email
                    email: admin.email,
                    role: admin.role.charAt(0).toUpperCase() + admin.role.slice(1),
                    status: admin.status.charAt(0).toUpperCase() + admin.status.slice(1),
                    app_id: admin.app_id || params.appId // fallback but backend should provide it
                }));

                setAppData(prev => ({
                    ...prev,
                    name: app.app_name,
                    package: app.package_name,
                    version: app.version || '1.0.0',
                    status: displayStatus,
                    color: app.branding?.primary_color || Colors.primary,
                    logo: app.branding?.logo_url || null,
                    admins: formattedAdmins.length > 0 ? formattedAdmins : [
                        { id: 'default', name: 'Owner', role: 'Super Admin', status: 'Active' }
                    ]
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpgrade = () => {
        router.push({
            pathname: '/build-app',
            params: { appId: params.appId }
        });
    };

    const handleBuildApk = async () => {
        // If app is already building, go to status
        if (appData.status === 'Building' || appData.status === 'Queued') {
            router.push({
                pathname: '/build-status',
                params: { appId: params.appId }
            });
            return;
        }

        // Otherwise show confirmation before navigation
        setShowBuildConfirm(true);
    };

    const proceedToBuild = () => {
        setShowBuildConfirm(false);
        router.push({
            pathname: '/build-app',
            params: { appId: params.appId }
        });
    };

    const handleCloseModal = () => {
        setShowBuildModal(false);
    };

    const handleDownloadSource = () => {
        const downloadUrl = `${BASE_URL}/vtfree/apps/${params.appId}/download?token=${token}`;
        Linking.openURL(downloadUrl);
    };

    const handleDownloadApk = () => {
        const downloadUrl = `${BASE_URL}/vtfree/apps/${params.appId}/apk?token=${token}`;
        Linking.openURL(downloadUrl);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out my app ${appData.name}! Download it here: https://vtfree.com/download/${appData.package}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const platforms = [
        { name: 'Website', icon: Globe, active: appData.type === 'Web' || appData.type === 'All', status: 'Live' },
        { name: 'Android', icon: Smartphone, active: appData.type === 'Android' || appData.type === 'All', status: 'Live' },
    ];

    const isDownloadDisabled = appData.status !== 'Live';

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft color={Colors.white} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>App Management</Text>
                    <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                        <Share2 color={Colors.white} size={24} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* App Header Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.appCard}>
                    <View style={styles.appHeaderRow}>
                        <View style={[styles.appIcon, { backgroundColor: `${appData.color}20` }]}>
                            {appData.logo ? (
                                <Image source={{ uri: appData.logo }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                            ) : (
                                <appData.icon color={appData.color} size={32} />
                            )}
                        </View>
                        <View style={styles.appInfo}>
                            <Text style={styles.appName}>{appData.name}</Text>
                            <Text style={styles.appPackage}>{appData.package}</Text>
                            {/* APP ID DISPLAY */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' }}>
                                <Text style={{ color: Colors.gray[600], fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' }} selectable>ID: {params.appId}</Text>
                                <Copy size={12} color={Colors.gray[500]} />
                            </View>

                            <View style={[styles.statusBadge, { backgroundColor: appData.status === 'Live' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                                <Text style={[styles.statusText, { color: appData.status === 'Live' ? Colors.success : Colors.warning }]}>
                                    {appData.status}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryButton, appData.status !== 'Live' && { backgroundColor: Colors.gray[300], opacity: 0.7 }]}
                        disabled={appData.status !== 'Live'}
                        onPress={() => {
                            // Link to Dashboard logic here if needed
                        }}
                    >
                        <Play color={Colors.white} size={20} />
                        <Text style={styles.primaryButtonText}>
                            {appData.status === 'Live' ? 'Open Dashboard' : 'Dashboard Unavailable'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Platform Availability */}
                <Text style={styles.sectionTitle}>Available Platforms</Text>
                <View style={styles.platformsGrid}>
                    {platforms.map((platform, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(200 + (index * 100)).springify()}
                            style={[styles.platformCard, !platform.active && styles.platformCardInactive]}
                        >
                            <View style={[styles.platformIcon, { backgroundColor: platform.active ? Colors.primaryLighter : Colors.gray[100] }]}>
                                <platform.icon color={platform.active ? Colors.primary : Colors.gray[400]} size={24} />
                            </View>
                            <Text style={[styles.platformName, !platform.active && { color: Colors.gray[400] }]}>{platform.name}</Text>
                            <Text style={[styles.platformStatus, { color: (platform.active && appData.status !== 'Pending') ? Colors.success : Colors.gray[400] }]}>
                                {platform.active ? (appData.status === 'Pending' ? 'Pending Payment' : '✓ Active') : 'Not Purchased'}
                            </Text>
                        </Animated.View>
                    ))}
                </View>

                {/* Admin Management */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Admin Management</Text>
                </View>

                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.adminCard}>
                    {appData.admins.map((admin, index) => (
                        <View key={admin.id}>
                            <TouchableOpacity style={styles.adminItem}>
                                <View style={styles.adminAvatar}>
                                    <Text style={styles.adminInitials}>{admin.name ? admin.name.substring(0, 2).toUpperCase() : 'AD'}</Text>
                                </View>
                                <View style={styles.adminInfo}>
                                    <Text style={styles.adminName}>{admin.name || 'Admin'}</Text>
                                    <Text style={styles.adminRole}>{admin.email}</Text>
                                    {admin.app_id && <Text style={{ fontSize: 10, color: Colors.gray[400], marginTop: 2 }}>App Code: {admin.app_id}</Text>}
                                </View>
                                <View style={styles.adminStatus}>
                                    <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                                    <Text style={styles.adminStatusText}>{admin.status}</Text>
                                </View>
                                <ChevronRight color={Colors.gray[400]} size={20} />
                            </TouchableOpacity>
                            {index !== appData.admins.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </Animated.View>

                {/* Branding Settings */}
                {/* App Configuration & Updates - NEW SECTION */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>App Configuration</Text>
                </View>

                <Animated.View entering={FadeInDown.delay(500).springify()}>
                    <TouchableOpacity
                        style={styles.mainConfigCard}
                        onPress={() => router.push({ pathname: '/edit-app', params: { appId: params.appId } })}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[Colors.white, '#F0FDF4']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.mainConfigGradient}
                        >
                            <View style={[styles.configIconLarge, { backgroundColor: Colors.primaryLighter }]}>
                                <Edit color={Colors.primary} size={28} />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.mainConfigTitle}>Edit App Details</Text>
                                <Text style={styles.mainConfigSubtitle}>
                                    Modify your app name, colors, styles, logo and other settings.
                                </Text>
                            </View>

                            <View style={styles.arrowContainer}>
                                <ArrowRight color={Colors.primary} size={20} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Developer Zone */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Developer Zone</Text>
                </View>

                <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.devCard}>

                    {/* Primary Action Section */}
                    <View style={styles.devSection}>
                        <Text style={styles.devSectionTitle}>Actions</Text>

                        {appData.version !== '2.0.0' && appData.status !== 'Pending' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: Colors.secondary }]}
                                onPress={handleUpgrade}
                                disabled={isBuilding}
                            >
                                <Rocket color={Colors.white} size={20} />
                                <View>
                                    <Text style={styles.actionButtonText}>Upgrade to v2.0.0</Text>
                                    <Text style={styles.actionButtonSubtext}>Get latest features & fixes</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                {
                                    backgroundColor: appData.status === 'Pending' ? Colors.warning :
                                        (appData.status === 'Failed' ? Colors.red[600] : Colors.primary)
                                }
                            ]}
                            onPress={handleBuildApk}
                            disabled={isBuilding}
                        >
                            {appData.status === 'Pending' ? <Lock color={Colors.white} size={24} /> :
                                (appData.status === 'Failed' ? <RefreshCw color={Colors.white} size={24} /> :
                                    <Play color={Colors.white} size={24} />)}

                            <View>
                                <Text style={styles.actionButtonText}>
                                    {appData.status === 'Pending' ? 'Complete Payment' :
                                        (appData.status === 'Failed' ? 'Retry Build' :
                                            (isBuilding ? 'Building in Progress...' : 'Start New Build'))}
                                </Text>
                                <Text style={styles.actionButtonSubtext}>
                                    {appData.status === 'Pending' ? 'Unlock full access' :
                                        (appData.status === 'Failed' ? 'Fix build issues' :
                                            'Generate new APK & Web Bundle')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    {/* Downloads Section */}
                    <View style={styles.devSection}>
                        <Text style={styles.devSectionTitle}>Downloads</Text>
                        <View style={styles.downloadGrid}>
                            <TouchableOpacity
                                style={[styles.downloadButton, isDownloadDisabled && styles.disabledButton]}
                                onPress={handleDownloadApk}
                                disabled={isDownloadDisabled}
                            >
                                <View style={[styles.downloadIcon, { backgroundColor: Colors.green[100] }]}>
                                    {isDownloadDisabled ? <Lock color={Colors.green[600]} size={20} /> : <Smartphone color={Colors.green[600]} size={20} />}
                                </View>
                                <Text style={styles.downloadText}>Android APK</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.downloadButton, isDownloadDisabled && styles.disabledButton]}
                                onPress={handleDownloadSource}
                                disabled={isDownloadDisabled}
                            >
                                <View style={[styles.downloadIcon, { backgroundColor: Colors.gray[100] }]}>
                                    {isDownloadDisabled ? <Lock color={Colors.gray[600]} size={20} /> : <Laptop color={Colors.gray[600]} size={20} />}
                                </View>
                                <Text style={styles.downloadText}>Web Bundle</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <BuildProgressModal
                visible={showBuildModal}
                stage={buildStage}
                progress={buildProgress}
                status={buildStatus}
                onClose={handleCloseModal}
                apkUrl={apkLink}
                driveLink={driveLink}
            />



            {/* Build Confirmation Modal */}
            <Modal
                visible={showBuildConfirm}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBuildConfirm(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.confirmIconContainer}>
                            <Rocket color={Colors.white} size={32} />
                        </View>

                        <Text style={styles.confirmTitle}>Start New Build?</Text>
                        <Text style={styles.confirmMessage}>
                            You are about to start a new build process.
                            {appData.status === 'Pending' ? ' This requires payment.' : ' This may incur a fee if upgrading or rebuilding.'}
                        </Text>

                        <View style={styles.confirmStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Current Version</Text>
                                <Text style={styles.statValue}>{appData.version}</Text>
                            </View>
                            <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: Colors.gray[200], paddingLeft: 15 }]}>
                                <Text style={styles.statLabel}>Target</Text>
                                <Text style={styles.statValue}>{appData.type}</Text>
                            </View>
                        </View>

                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowBuildConfirm(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={proceedToBuild}
                            >
                                <Text style={styles.confirmButtonText}>Continue</Text>
                                <ArrowRight color={Colors.white} size={16} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    shareButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.white,
    },
    content: {
        padding: 20,
    },
    appCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 32,
    },
    appHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    appIcon: {
        width: 64,
        height: 64,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    appPackage: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    primaryButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
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
        marginBottom: 16,
    },
    platformsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    platformCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    platformCardInactive: {
        backgroundColor: Colors.gray[50],
        elevation: 0,
    },
    platformIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    platformName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
        textAlign: 'center',
    },
    platformStatus: {
        fontSize: 11,
        fontWeight: '500',
    },
    addAdminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addAdminText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    adminCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 32,
    },
    adminItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    adminAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primaryLighter,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    adminInitials: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    adminInfo: {
        flex: 1,
    },
    adminName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    adminRole: {
        fontSize: 12,
        color: Colors.text.secondary,
    },
    adminStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginRight: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    adminStatusText: {
        fontSize: 12,
        color: Colors.gray[600],
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginVertical: 8,
    },
    mainConfigCard: {
        marginBottom: 32,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    mainConfigGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        gap: 16,
    },
    configIconLarge: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.primaryLighter,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainConfigTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    mainConfigSubtitle: {
        fontSize: 13,
        color: Colors.gray[500],
        lineHeight: 18,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    modalCloseText: {
        fontSize: 24,
        color: Colors.gray[400],
        lineHeight: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        backgroundColor: Colors.gray[50],
        borderWidth: 1,
        borderColor: Colors.border.light,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: Colors.text.primary,
    },
    modalButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    modalButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Confirmation Modal Styles
    confirmIconContainer: {
        alignSelf: 'center',
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    confirmMessage: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    confirmStats: {
        flexDirection: 'row',
        backgroundColor: Colors.gray[50],
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: Colors.gray[500],
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
    },
    cancelButtonText: {
        color: Colors.gray[600],
        fontWeight: '600',
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    confirmButtonText: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    configCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 8,
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 32,
    },
    configItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    configIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.gray[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    configText: {
        flex: 1,
        fontSize: 16,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    configDivider: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginLeft: 72,
    },
    devCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 32,
    },
    devSection: {
        marginBottom: 16,
    },
    devSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray[500],
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 16,
        marginBottom: 12,
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    actionButtonSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    downloadGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    downloadButton: {
        flex: 1,
        backgroundColor: Colors.gray[50],
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.gray[100],
    },
    downloadIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    downloadText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        textAlign: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
});
