import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings as SettingsIcon, User, Bell, Shield, LogOut, ChevronRight } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [notifications, setNotifications] = React.useState(true);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Account</Text>
                    <View style={styles.card}>
                        <View style={styles.userRow}>
                            <View style={styles.userAvatar}>
                                <Text style={styles.userInitials}>
                                    {(user?.first_name?.[0] || 'U').toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
                                <Text style={styles.userEmail}>{user?.email}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/profile')}>
                            <User color={Colors.gray[600]} size={20} />
                            <Text style={styles.menuText}>Edit Profile</Text>
                            <ChevronRight color={Colors.gray[400]} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Preferences</Text>
                    <View style={styles.card}>
                        <View style={styles.menuItem}>
                            <Bell color={Colors.gray[600]} size={20} />
                            <Text style={styles.menuText}>Push Notifications</Text>
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: Colors.gray[200], true: Colors.primary }}
                                thumbColor={Colors.white}
                            />
                        </View>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.menuItem}>
                            <Shield color={Colors.gray[600]} size={20} />
                            <Text style={styles.menuText}>Security</Text>
                            <ChevronRight color={Colors.gray[400]} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                    <LogOut color={Colors.red[500]} size={20} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 48,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    backButton: {
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
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray[500],
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 4, // Padding wrapper for items
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    userInitials: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.gray[500],
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
        color: Colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginLeft: 56, // Indent for icon
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    logoutText: {
        color: Colors.red[500],
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    versionText: {
        textAlign: 'center',
        color: Colors.gray[400],
        fontSize: 12,
        marginBottom: 40,
    },
});
