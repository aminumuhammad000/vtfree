import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, User, Mail, Shield, Bell, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
    const router = useRouter();
    const [name, setName] = useState('John Doe');
    const [email, setEmail] = useState('john@example.com');

    const settings = [
        { icon: Shield, title: 'Security', subtitle: 'Password, 2FA' },
        { icon: Bell, title: 'Notifications', subtitle: 'Push, Email' },
        { icon: HelpCircle, title: 'Help & Support', subtitle: 'FAQ, Contact Us' },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.headerBackground} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.headerTitle}>Me</Text>

                {/* Profile Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://ui-avatars.com/api/?name=John+Doe&background=random' }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editBadge}>
                            <Camera color={Colors.white} size={16} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <User color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Mail color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.updateButton}>
                        <Text style={styles.updateButtonText}>Update Profile</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Settings List */}
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.settingsList}>
                    {settings.map((item, index) => (
                        <Animated.View key={index} entering={FadeInDown.delay(300 + index * 100).springify()}>
                            <TouchableOpacity style={styles.settingItem}>
                                <View style={[styles.settingIcon, { backgroundColor: Colors.gray[100] }]}>
                                    <item.icon color={Colors.gray[700]} size={20} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>{item.title}</Text>
                                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                                </View>
                                <ChevronRight color={Colors.gray[400]} size={20} />
                            </TouchableOpacity>
                            {index < settings.length - 1 && <View style={styles.divider} />}
                        </Animated.View>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => router.replace('/login')}
                >
                    <LogOut color={Colors.red[500]} size={20} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

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
        height: 250,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 24,
        textAlign: 'center',
    },
    profileCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 32,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 24,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: Colors.white,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 16,
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray[700],
        marginLeft: 4,
    },
    inputContainer: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 1,
    },
    input: {
        backgroundColor: Colors.gray[50],
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 48,
        fontSize: 16,
        color: Colors.text.primary,
    },
    updateButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        marginTop: 8,
        width: '100%',
        alignItems: 'center',
    },
    updateButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 16,
    },
    settingsList: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 8,
        marginBottom: 24,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    settingSubtitle: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginLeft: 72,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
    },
    logoutText: {
        color: Colors.red[500],
        fontSize: 16,
        fontWeight: '600',
    },
});
