import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import {
    Camera,
    User,
    Mail,
    Shield,
    Bell,
    HelpCircle,
    LogOut,
    ChevronRight,
    CheckCircle,
    BadgeCheck
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/auth.service';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, updateUser, signOut } = useAuth();

    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isUpdating, setIsUpdating] = useState(false);

    // Removed 'My Wallet' as requested
    const settings = [
        { icon: Shield, title: 'Security', subtitle: 'Password, 2FA', route: '/settings' },
        { icon: Bell, title: 'Notifications', subtitle: 'Push, Email', route: '/settings' },
        { icon: HelpCircle, title: 'Help & Support', subtitle: 'FAQ, Contact Us', route: '/support' },
    ];

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            const result = await AuthService.updateProfile({
                first_name: firstName,
                last_name: lastName,
                email: email
            });
            if (result.success) {
                await updateUser(result.data.user);
                alert('Profile updated successfully');
            } else {
                alert(result.message || 'Failed to update profile');
            }
        } catch (error: any) {
            alert(error.message || 'An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSettingPress = (route: string) => {
        router.push(route as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Avatar & Header */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.profileHeader}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: `https://api.dicebear.com/7.x/notionists/png?seed=${firstName}${lastName}&backgroundColor=b6e3f4` }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editBadge}>
                            <Camera color={Colors.white} size={14} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.nameContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            <Text style={styles.userName}>{firstName} {lastName}</Text>
                            {/* Verification Tick */}
                            {user?.email_verified && (
                                <BadgeCheck color={Colors.primary} size={20} fill={Colors.primaryLight} />
                            )}
                        </View>
                        {user?.email_verified ? (
                            <View style={styles.verifiedTag}>
                                <Text style={styles.verifiedText}>Verified</Text>
                            </View>
                        ) : (
                            <Text style={styles.userEmail}>{email}</Text>
                        )}
                    </View>
                </Animated.View>

                {/* Edit Profile Action */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.actionSection}>
                    <TouchableOpacity
                        style={styles.editProfileButton}
                        onPress={() => router.push('/edit-profile')}
                        activeOpacity={0.8}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={styles.editIconBox}>
                                <User color={Colors.primary} size={20} />
                            </View>
                            <Text style={styles.editProfileText}>Edit Profile Details</Text>
                        </View>
                        <ChevronRight color={Colors.gray[400]} size={20} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Settings */}
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>
                    <View style={styles.settingsCard}>
                        {settings.map((item, index) => (
                            <React.Fragment key={index}>
                                <TouchableOpacity
                                    style={styles.settingItem}
                                    onPress={() => handleSettingPress(item.route)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.settingIconBox}>
                                        <item.icon color={Colors.gray[600]} size={20} />
                                    </View>
                                    <View style={styles.settingContent}>
                                        <Text style={styles.settingLabel}>{item.title}</Text>
                                        <Text style={styles.settingSubLabel}>{item.subtitle}</Text>
                                    </View>
                                    <ChevronRight color={Colors.gray[400]} size={20} />
                                </TouchableOpacity>
                                {index < settings.length - 1 && <View style={styles.settingsDivider} />}
                            </React.Fragment>
                        ))}
                    </View>
                </Animated.View>

                {/* Logout */}
                <Animated.View entering={FadeInDown.delay(400).springify()} style={{ marginBottom: 40 }}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={signOut}
                        activeOpacity={0.8}
                    >
                        <LogOut color={Colors.red[500]} size={20} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>v1.0.0 • VTfree</Text>
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
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: Colors.background,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: Colors.white,
    },
    editBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.white,
    },
    nameContainer: {
        alignItems: 'center',
        gap: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    verifiedTag: {
        backgroundColor: Colors.green[50],
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.green[200],
        marginTop: 4,
    },
    verifiedText: {
        fontSize: 12,
        color: Colors.green[700],
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 14,
        color: Colors.gray[500],
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray[500],
        marginBottom: 12,
        marginLeft: 4,
    },
    actionSection: {
        marginBottom: 24,
    },
    editProfileButton: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.gray[100],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    editIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primaryLighter,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editProfileText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    settingsCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.gray[100],
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    settingIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.gray[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingContent: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    settingSubLabel: {
        fontSize: 12,
        color: Colors.gray[500],
        marginTop: 2,
    },
    settingsDivider: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginLeft: 72,
    },
    logoutButton: {
        backgroundColor: '#FEF2F2',
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    logoutText: {
        color: Colors.red[600],
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        color: Colors.gray[400],
        fontSize: 12,
    },
});
