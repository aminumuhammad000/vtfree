import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Book, Headphones, Settings, Bell, Activity, Zap, TrendingUp, Shield } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();

    const quickActions = [
        { icon: Plus, title: 'Create App', route: '/create-app', color: Colors.primary },
    ];

    return (
        <View style={styles.container}>
            {/* Header Background */}
            <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.headerBackground} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Content */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good Morning,</Text>
                        <Text style={styles.username}>John Doe</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Bell color={Colors.white} size={24} />
                        <View style={styles.notificationBadge} />
                    </TouchableOpacity>
                </View>

                {/* Stats Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(79, 70, 229, 0.1)' }]}>
                            <Zap color={Colors.primary} size={24} />
                        </View>
                        <View>
                            <Text style={styles.statValue}>2</Text>
                            <Text style={styles.statLabel}>Active Apps</Text>
                        </View>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <TrendingUp color={Colors.success} size={24} />
                        </View>
                        <View>
                            <Text style={styles.statValue}>99.9%</Text>
                            <Text style={styles.statLabel}>Uptime</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* KYC Verification Section */}
                <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.kycCard}>
                    <View style={styles.kycContent}>
                        <View style={styles.kycIconContainer}>
                            <Shield color={Colors.primary} size={24} />
                        </View>
                        <View style={styles.kycTextContainer}>
                            <Text style={styles.kycTitle}>Verify Your Account</Text>
                            <Text style={styles.kycSubtitle}>Complete KYC to unlock all features</Text>
                        </View>
                        <TouchableOpacity style={styles.kycButton} onPress={() => router.push('/kyc')}>
                            <Text style={styles.kycButtonText}>Verify</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    {quickActions.map((action, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(200 + index * 100).springify()}
                            style={styles.actionWrapper}
                        >
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => router.push(action.route as any)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                                    <action.icon color={action.color} size={28} />
                                </View>
                                <Text style={styles.actionTitle}>{action.title}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Recent Activity / News */}
                <Text style={styles.sectionTitle}>System Status</Text>
                <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <Activity color={Colors.success} size={20} />
                        <Text style={styles.statusTitle}>All Systems Operational</Text>
                    </View>
                    <Text style={styles.statusText}>
                        Platform is running smoothly. No incidents reported in the last 24 hours.
                    </Text>
                </Animated.View>

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
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    greeting: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.white,
    },
    notificationButton: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 10,
        height: 10,
        backgroundColor: Colors.red[500],
        borderRadius: 5,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    statsCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 32,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.gray[200],
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
    },
    actionWrapper: {
        width: (width - 56) / 2,
    },
    actionCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    statusCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        borderLeftWidth: 4,
        borderLeftColor: Colors.success,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    statusText: {
        fontSize: 14,
        color: Colors.gray[600],
        lineHeight: 20,
    },
    kycCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: Colors.primaryLighter,
    },
    kycContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    kycIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryLighter,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    kycTextContainer: {
        flex: 1,
    },
    kycTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    kycSubtitle: {
        fontSize: 12,
        color: Colors.text.secondary,
    },
    kycButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    kycButtonText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
});
