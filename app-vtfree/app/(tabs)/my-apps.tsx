import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Rocket, Globe, Smartphone, Monitor } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppService } from '../../services/app.service';

export default function MyAppsScreen() {
    const router = useRouter();

    const [apps, setApps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        try {
            const response = await AppService.getMyApps();
            if (response.success) {
                setApps(response.data.apps.map((app: any) => ({
                    id: app.app_id,
                    name: app.app_name,
                    package: app.package_name,
                    // Map statuses specifically
                    status: (app.status === 'active' || app.status === 'live' || app.build_status_full === 'completed') ? 'Live' :
                        (app.status === 'failed' || app.build_status_full === 'failed') ? 'Failed' :
                            (app.build_status_full === 'queued') ? 'Queued' : 'Building',
                    rawStatus: app.status,
                    platforms: app.platforms,
                    logo: app.branding?.logo_url || null,
                    color: app.branding?.primary_color || Colors.primary
                })));
            }
        } catch (error: any) {
            // Only log non-auth errors (auth errors are expected when not logged in)
            if (!error?.isAuthError) {
                console.error('Apps fetch failed:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <TouchableOpacity
                style={styles.appCard}
                activeOpacity={0.9}
                onPress={() => router.push({
                    pathname: '/app-details',
                    params: { appId: item.id }
                })}
            >
                {/* Header / Banner area */}
                <View style={[styles.cardHeader, { backgroundColor: `${item.color}15` }]}>
                    <View style={[styles.statusTag,
                    item.status === 'Live' ? styles.statusLive : (item.status === 'Failed' ? styles.statusFailed : styles.statusBuilding)
                    ]}>
                        <View style={[styles.statusDot,
                        item.status === 'Live' ? { backgroundColor: Colors.green[500] } :
                            (item.status === 'Failed' ? { backgroundColor: Colors.red[500] } : { backgroundColor: Colors.yellow[500] })
                        ]} />
                        <Text style={[styles.statusText,
                        item.status === 'Live' ? { color: Colors.green[700] } :
                            (item.status === 'Failed' ? { color: Colors.red[700] } : { color: Colors.yellow[700] })
                        ]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    {/* App Icon */}
                    <View style={styles.iconContainer}>
                        {item.logo ? (
                            <Image source={{ uri: item.logo }} style={styles.appIconImage} />
                        ) : (
                            <View style={[styles.appIconPlaceholder, { backgroundColor: item.color }]}>
                                <Text style={styles.appIconInitial}>{item.name.charAt(0)}</Text>
                            </View>
                        )}
                    </View>

                    {/* App Details */}
                    <View style={styles.detailsContainer}>
                        <Text style={styles.appName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.appPackage} numberOfLines={1}>{item.package}</Text>

                        {/* Platform Icons */}
                        <View style={styles.platformsRow}>
                            {item.platforms?.android && (
                                <View style={styles.platformIcon}><Smartphone size={12} color={Colors.gray[500]} /></View>
                            )}
                            {item.platforms?.ios && (
                                <View style={styles.platformIcon}><Smartphone size={12} color={Colors.gray[500]} /></View>
                            )}
                            {item.platforms?.web && (
                                <View style={styles.platformIcon}><Monitor size={12} color={Colors.gray[500]} /></View>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.arrowButton, { backgroundColor: `${item.color}20` }]}>
                        <Plus size={18} color={item.color} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* Metaverse / Cartoonish Header */}
            <LinearGradient
                colors={[Colors.primary, '#4ADE80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>My Apps</Text>
                        <Text style={styles.headerSubtitle}>Manage your deployed universe</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        activeOpacity={0.8}
                        onPress={() => router.push('/create-app')}
                    >
                        <Plus color={Colors.primary} size={24} strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                {/* Decorative Elements */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
            </LinearGradient>

            <View style={styles.contentContainer}>
                <FlatList
                    data={apps}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        !isLoading ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconCircle}>
                                    <Rocket size={40} color={Colors.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>No apps yet!</Text>
                                <Text style={styles.emptyText}>Start your journey by launching your first app globally.</Text>
                                <TouchableOpacity
                                    style={styles.emptyButton}
                                    onPress={() => router.push('/create-app')}
                                >
                                    <Text style={styles.emptyButtonText}>Create New App</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.gray[50], // Slightly off-white for better contrast
    },
    header: {
        height: 180,
        paddingTop: 60,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        position: 'relative',
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.white,
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
        fontWeight: '500',
    },
    addButton: {
        width: 48,
        height: 48,
        backgroundColor: Colors.white,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    circle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.1)',
        top: -50,
        right: -50,
    },
    circle2: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        bottom: -20,
        left: 20,
    },
    contentContainer: {
        flex: 1,
        marginTop: -30, // Pull up to overlap header slightly
        paddingHorizontal: 20,
    },
    listContent: {
        paddingBottom: 100,
        paddingTop: 10,
    },
    appCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
    },
    cardHeader: {
        height: 48,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    statusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusLive: {
        backgroundColor: Colors.green[100],
    },
    statusBuilding: {
        backgroundColor: Colors.yellow[100],
    },
    statusFailed: {
        backgroundColor: Colors.red[100],
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardContent: {
        padding: 20,
        paddingTop: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 16,
    },
    appIconImage: {
        width: 64,
        height: 64,
        borderRadius: 18,
    },
    appIconPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appIconInitial: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.white,
    },
    detailsContainer: {
        flex: 1,
    },
    appName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    appPackage: {
        fontSize: 12,
        color: Colors.gray[500],
        marginBottom: 8,
    },
    platformsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    platformIcon: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLighter,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.gray[500],
        textAlign: 'center',
        maxWidth: 260,
        marginBottom: 24,
        lineHeight: 20,
    },
    emptyButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    emptyButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
