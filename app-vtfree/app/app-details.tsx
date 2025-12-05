import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, Globe, Smartphone, Play, Plus, ChevronRight } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppService } from '../services/app.service';

export default function AppDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Determine color - handle both string and array from params
    const colorParam = Array.isArray(params.color) ? params.color[0] : params.color;
    const appColor = colorParam || Colors.primary;

    const [appData, setAppData] = React.useState({
        name: params.name || 'VTfree App',
        package: params.package || 'com.vtfree.app',
        version: '1.0.0',
        status: params.status || 'Building',
        type: params.type || 'Android',
        icon: params.type === 'Web' ? Globe : Smartphone,
        color: appColor,
        admins: [] as any[]
    });

    React.useEffect(() => {
        if (params.appId) {
            fetchAppDetails(params.appId as string);
        }
    }, [params.appId]);

    const fetchAppDetails = async (id: string) => {
        try {
            const response = await AppService.getAppDetails(id);
            if (response.success) {
                const app = response.data.app;
                setAppData(prev => ({
                    ...prev,
                    name: app.app_name,
                    package: app.package_name,
                    status: app.status === 'active' ? 'Live' : 'Building',
                    color: app.branding?.primary_color || Colors.primary,
                    // Mock admins for now as the API might not return them in this endpoint yet
                    // or we need a separate endpoint for app admins
                    admins: [
                        { id: 1, name: 'Owner', role: 'Super Admin', status: 'Active' }
                    ]
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const platforms = [
        { name: 'Website', icon: Globe, active: appData.type === 'Web' || appData.type === 'All', status: 'Live' },
        { name: 'Android', icon: Smartphone, active: appData.type === 'Android' || appData.type === 'All', status: 'Live' },
        { name: 'iOS', icon: Smartphone, active: appData.type === 'iOS' || appData.type === 'All', status: 'Not Active' },
    ];

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out my app ${appData.name}! Download it here: https://vtfree.com/download/${appData.package}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

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
                            <appData.icon color={appData.color} size={40} />
                        </View>
                        <View style={styles.appInfo}>
                            <Text style={styles.appName}>{appData.name}</Text>
                            <Text style={styles.appPackage}>{appData.package}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: appData.status === 'Live' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                                <Text style={[styles.statusText, { color: appData.status === 'Live' ? Colors.success : Colors.warning }]}>
                                    {appData.status}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.primaryButton}>
                        <Play color={Colors.white} size={20} />
                        <Text style={styles.primaryButtonText}>Open Dashboard</Text>
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
                            <Text style={[styles.platformStatus, { color: platform.active ? Colors.success : Colors.gray[400] }]}>
                                {platform.active ? '✓ Active' : 'Not Purchased'}
                            </Text>
                        </Animated.View>
                    ))}
                </View>

                {/* Admin Management */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Admin Management</Text>
                    <TouchableOpacity style={styles.addAdminButton}>
                        <Plus color={Colors.primary} size={20} />
                        <Text style={styles.addAdminText}>Add New</Text>
                    </TouchableOpacity>
                </View>

                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.adminCard}>
                    {appData.admins.map((admin, index) => (
                        <View key={admin.id}>
                            <TouchableOpacity style={styles.adminItem}>
                                <View style={styles.adminAvatar}>
                                    <Text style={styles.adminInitials}>{admin.name.substring(0, 2).toUpperCase()}</Text>
                                </View>
                                <View style={styles.adminInfo}>
                                    <Text style={styles.adminName}>{admin.name}</Text>
                                    <Text style={styles.adminRole}>{admin.role}</Text>
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
                <Text style={styles.sectionTitle}>App Branding</Text>
                <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.configCard}>
                    <TouchableOpacity style={styles.configItem}>
                        <View style={styles.configIcon}>
                            <Smartphone color={Colors.primary} size={20} />
                        </View>
                        <Text style={styles.configText}>App Icon & Logo</Text>
                        <ChevronRight color={Colors.gray[400]} size={20} />
                    </TouchableOpacity>
                    <View style={styles.configDivider} />
                    <TouchableOpacity style={styles.configItem}>
                        <View style={styles.configIcon}>
                            <Globe color={Colors.secondary} size={20} />
                        </View>
                        <Text style={styles.configText}>Colors & Theme</Text>
                        <ChevronRight color={Colors.gray[400]} size={20} />
                    </TouchableOpacity>
                </Animated.View>

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
    configCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 8,
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
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
});
