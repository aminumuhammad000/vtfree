import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {
    Menu,
    X,
    Plus,
    Settings,
    FileText,
    Headphones,
    Smartphone,
    CheckCircle,
    Clock,
    Eye,
    TrendingUp,
    Zap,
    Home,
} from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const stats = [
        { icon: Smartphone, label: 'Total Apps', value: '3', color: Colors.primary },
        { icon: CheckCircle, label: 'Active', value: '2', color: Colors.primaryLight },
        { icon: Clock, label: 'Building', value: '1', color: Colors.yellow[500] },
        { icon: TrendingUp, label: 'This Month', value: '+2', color: Colors.primary },
    ];

    const apps = [
        {
            id: '1',
            name: 'My VTU App',
            status: 'ready',
            icon: '📱',
            buildProgress: 100,
            createdAt: '2 days ago',
            services: ['Airtime', 'Data', 'Cable TV'],
        },
        {
            id: '2',
            name: 'QuickRecharge',
            status: 'building',
            icon: '⚡',
            buildProgress: 67,
            createdAt: '5 hours ago',
            services: ['Airtime', 'Data', 'Electricity'],
        },
        {
            id: '3',
            name: 'VTU Pro',
            status: 'ready',
            icon: '🚀',
            buildProgress: 100,
            createdAt: '1 week ago',
            services: ['All Services'],
        },
    ];

    const menuItems = [
        { icon: Home, label: 'Dashboard', page: 'Dashboard' as const },
        { icon: FileText, label: 'Documentation', page: 'Documentation' as const },
        { icon: Settings, label: 'Settings', page: 'Settings' as const },
        { icon: Headphones, label: 'Support', page: 'Support' as const },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => setSidebarOpen(!sidebarOpen)} style={styles.menuButton}>
                        <Menu color={Colors.gray[700]} size={24} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                        <Text style={styles.headerSubtitle}>Manage your VTU apps</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => router.push('/create-app')}
                    style={styles.newAppButton}
                    activeOpacity={0.8}
                >
                    <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.newAppGradient}>
                        <Plus color={Colors.white} size={20} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <View key={index} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                                <stat.icon color={stat.color} size={24} />
                            </View>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                            <Text style={styles.statValue}>{stat.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Quick Action */}
                <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.actionCard}>
                    <View>
                        <Text style={styles.actionTitle}>Ready to build your app?</Text>
                        <Text style={styles.actionSubtitle}>Create a custom VTU app in just a few minutes</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/create-app')}
                            style={styles.actionButton}
                            activeOpacity={0.8}
                        >
                            <Zap color={Colors.primary} size={20} />
                            <Text style={styles.actionButtonText}>Start Building</Text>
                        </TouchableOpacity>
                    </View>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={{ width: 80, height: 80, opacity: 0.3, tintColor: Colors.white }}
                        resizeMode="contain"
                    />
                </LinearGradient>

                {/* Apps List */}
                <View style={styles.appsSection}>
                    <View style={styles.appsSectionHeader}>
                        <Text style={styles.appsSectionTitle}>Your Apps</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.appsList}>
                        {apps.map((app) => (
                            <View key={app.id} style={styles.appCard}>
                                <View style={styles.appHeader}>
                                    <Text style={styles.appIcon}>{app.icon}</Text>
                                    <View style={styles.appInfo}>
                                        <Text style={styles.appName}>{app.name}</Text>
                                        <Text style={styles.appDate}>{app.createdAt}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, app.status === 'ready' ? styles.statusReady : styles.statusBuilding]}>
                                        {app.status === 'ready' ? (
                                            <CheckCircle color={Colors.green[700]} size={16} />
                                        ) : (
                                            <Clock color={Colors.yellow[700]} size={16} />
                                        )}
                                        <Text style={app.status === 'ready' ? styles.statusReadyText : styles.statusBuildingText}>
                                            {app.status}
                                        </Text>
                                    </View>
                                </View>

                                {/* Build Progress */}
                                {app.status === 'building' && (
                                    <View style={styles.progressSection}>
                                        <View style={styles.progressHeader}>
                                            <Text style={styles.progressLabel}>Build Progress</Text>
                                            <Text style={styles.progressValue}>{app.buildProgress}%</Text>
                                        </View>
                                        <View style={styles.progressBar}>
                                            <View style={[styles.progressFill, { width: `${app.buildProgress}%` }]} />
                                        </View>
                                    </View>
                                )}

                                {/* Services */}
                                <View style={styles.servicesContainer}>
                                    {app.services.map((service, i) => (
                                        <View key={i} style={styles.serviceChip}>
                                            <Text style={styles.serviceChipText}>{service}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Actions */}
                                <TouchableOpacity
                                    style={styles.viewDetailsButton}
                                    onPress={() => router.push({ pathname: '/app-details', params: { appId: app.id } })}
                                    activeOpacity={0.8}
                                >
                                    <Eye color={Colors.white} size={18} />
                                    <Text style={styles.viewDetailsText}>View Details</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Floating Help Button */}
            <TouchableOpacity
                style={styles.helpButton}
                onPress={() => router.push('/support')}
                activeOpacity={0.8}
            >
                <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.helpButtonGradient}>
                    <Headphones color={Colors.white} size={24} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 48,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: Colors.gray[600],
    },
    newAppButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    newAppGradient: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        width: (width - 44) / 2,
        borderWidth: 1,
        borderColor: Colors.gray[100],
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.gray[600],
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    actionCard: {
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.white,
        marginBottom: 8,
    },
    actionSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 16,
    },
    actionButton: {
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    appsSection: {
        marginBottom: 80,
    },
    appsSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    appsSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    viewAllText: {
        fontSize: 14,
        color: Colors.primary,
    },
    appsList: {
        gap: 16,
    },
    appCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.gray[100],
    },
    appHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    appIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    appDate: {
        fontSize: 12,
        color: Colors.gray[600],
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusReady: {
        backgroundColor: Colors.green[100],
    },
    statusBuilding: {
        backgroundColor: Colors.yellow[100],
    },
    statusReadyText: {
        fontSize: 12,
        color: Colors.green[700],
        fontWeight: '500',
    },
    statusBuildingText: {
        fontSize: 12,
        color: Colors.yellow[700],
        fontWeight: '500',
    },
    progressSection: {
        marginBottom: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        color: Colors.gray[600],
    },
    progressValue: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
    },
    progressBar: {
        height: 8,
        backgroundColor: Colors.gray[200],
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
    },
    servicesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    serviceChip: {
        backgroundColor: Colors.primaryLighter,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    serviceChipText: {
        fontSize: 12,
        color: Colors.primary,
    },
    viewDetailsButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    viewDetailsText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.white,
    },
    helpButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        overflow: 'hidden',
    },
    helpButtonGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
