import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
    Switch,
    Platform,
    Dimensions,
    ActivityIndicator,
    Alert
} from 'react-native';
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
    Fingerprint,
    Info,
    Settings,
    BadgeCheck,
    CreditCard
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';


import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/auth.service';
import CustomAlert from '../../components/CustomAlert';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut, updateUser } = useAuth();

    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        type: 'success' as 'success' | 'error' | 'warning',
        title: '',
        message: ''
    });

    const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
        setAlertConfig({ type, title, message });
        setAlertVisible(true);
    };

    useEffect(() => {
        checkBiometrics();
        loadBiometricPreference();
    }, []);

    const checkBiometrics = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsBiometricSupported(compatible);
    };

    const loadBiometricPreference = async () => {
        const enabled = await SecureStore.getItemAsync('vtfree_biometric_enabled');
        setIsBiometricEnabled(enabled === 'true');
    };

    const toggleBiometric = async (value: boolean) => {
        if (value) {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Enable Biometric Login',
            });
            if (result.success) {
                await SecureStore.setItemAsync('vtfree_biometric_enabled', 'true');
                setIsBiometricEnabled(true);
                Alert.alert('Success', 'Biometric login enabled successfully.');
            }
        } else {
            await SecureStore.setItemAsync('vtfree_biometric_enabled', 'false');
            setIsBiometricEnabled(false);
        }
    };

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            showAlert('warning', 'Permission Required', 'You need to allow access to your photos to upload a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            const uriParts = uri.split('.');
            const fileType = uriParts[uriParts.length - 1];

            formData.append('image', {
                uri,
                name: `profile_${user?._id}.${fileType}`,
                type: `image/${fileType}`,
            } as any);

            const uploadResponse = await AuthService.uploadProfilePicture(formData);

            if (uploadResponse.success) {
                const updatedUser = await AuthService.updateProfile({
                    profile_picture: uploadResponse.url
                });

                if (updatedUser.success) {
                    await updateUser(updatedUser.data.user);
                    showAlert('success', 'Profile Updated', 'Your profile picture has been updated successfully.');
                }
            } else {
                showAlert('error', 'Upload Failed', uploadResponse.message || 'Failed to upload image');
            }
        } catch (error: any) {
            console.error('Image upload error:', error);
            showAlert('error', 'Upload Error', 'An error occurred while uploading your profile picture.');
        } finally {
            setIsUploading(false);
        }
    };

    const renderSettingItem = ({ icon: Icon, title, subtitle, onPress, toggle, value }: any) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            disabled={!!toggle}
            activeOpacity={0.7}
        >
            <View style={styles.settingIconBox}>
                <Icon color={Colors.primary} size={20} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{title}</Text>
                {subtitle && <Text style={styles.settingSubLabel}>{subtitle}</Text>}
            </View>
            {toggle ? (
                <Switch
                    value={value}
                    onValueChange={toggle}
                    trackColor={{ false: '#E5E7EB', true: Colors.primaryLighter }}
                    thumbColor={value ? Colors.primary : '#F3F4F6'}
                    ios_backgroundColor="#E5E7EB"
                />
            ) : (
                <ChevronRight color={Colors.gray[300]} size={18} />
            )}
        </TouchableOpacity>
    );

    const getProfileImage = () => {
        if (user?.profile_picture) {
            return { uri: user.profile_picture };
        }
        return { uri: `https://api.dicebear.com/7.x/notionists/png?seed=${user?.first_name}${user?.last_name}&backgroundColor=b6e3f4` };
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Account Profile</Text>
                <TouchableOpacity onPress={() => router.push('/settings')}>
                    <Settings color={Colors.gray[600]} size={22} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <Animated.View entering={FadeInUp.springify()} style={styles.profileCard}>
                    <LinearGradient
                        colors={[Colors.primaryLighter, '#FFFFFF']}
                        style={styles.profileCardGradient}
                    >
                        <View style={styles.avatarSection}>
                            <View style={styles.avatarWrapper}>
                                <Image
                                    source={getProfileImage()}
                                    style={styles.avatar}
                                />
                                <TouchableOpacity
                                    style={styles.cameraButton}
                                    onPress={handlePickImage}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <ActivityIndicator size="small" color={Colors.white} />
                                    ) : (
                                        <Camera color={Colors.white} size={14} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.userInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
                                <BadgeCheck color={Colors.primary} size={20} fill={Colors.primaryLighter} />
                            </View>
                            <Text style={styles.userEmail}>{user?.email}</Text>

                            <View style={styles.statsContainer}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>Standard</Text>
                                    <Text style={styles.statLabel}>Plan Type</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>Active</Text>
                                    <Text style={styles.statLabel}>Status</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Account Section */}
                <Text style={styles.sectionTitle}>Account Settings</Text>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.settingsGroup}>
                    {renderSettingItem({
                        icon: User,
                        title: 'Personal Information',
                        subtitle: 'Name, email, and phone',
                        onPress: () => router.push('/edit-profile')
                    })}
                    <View style={styles.divider} />
                    {renderSettingItem({
                        icon: Fingerprint,
                        title: 'Biometric Access',
                        subtitle: isBiometricSupported ? 'Use FaceID / Fingerprint' : 'Not supported',
                        toggle: isBiometricSupported ? toggleBiometric : null,
                        value: isBiometricEnabled
                    })}
                </Animated.View>

                {/* Support Section */}
                <Text style={styles.sectionTitle}>Support & Security</Text>
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.settingsGroup}>
                    {renderSettingItem({
                        icon: Shield,
                        title: 'Security',
                        subtitle: 'Change password & 2FA',
                        onPress: () => router.push('/settings')
                    })}
                    <View style={styles.divider} />
                    {renderSettingItem({
                        icon: HelpCircle,
                        title: 'Help Center',
                        subtitle: 'FAQ and contact support',
                        onPress: () => router.push('/support')
                    })}
                    <View style={styles.divider} />
                    {renderSettingItem({
                        icon: Info,
                        title: 'Legal & Privacy',
                        subtitle: 'Terms and conditions',
                        onPress: () => router.push('/legal')
                    })}
                </Animated.View>

                {/* Danger Zone */}
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.logoutContainer}>
                    <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.8}>
                        <LogOut color="#EF4444" size={20} />
                        <Text style={styles.logoutText}>Log Out Account</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>VTFree Version 1.0.0 (Latest)</Text>
                </Animated.View>

            </ScrollView>

            <CustomAlert
                visible={alertVisible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 54,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    profileCardGradient: {
        padding: 24,
        alignItems: 'center',
    },
    avatarSection: {
        marginBottom: 16,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    cameraButton: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: Colors.primary,
        width: 28,
        height: 28,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userInfo: {
        alignItems: 'center',
        width: '100%',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text.primary,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.gray[500],
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        padding: 12,
        width: '100%',
        justifyContent: 'space-around',
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.gray[400],
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: '80%',
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.gray[400],
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    settingsGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 14,
    },
    settingIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primaryLighter,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingContent: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    settingSubLabel: {
        fontSize: 12,
        color: Colors.gray[500],
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 54,
    },
    logoutContainer: {
        marginTop: 8,
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FEF2F2',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
    },
    versionText: {
        marginTop: 16,
        fontSize: 12,
        color: Colors.gray[400],
        fontWeight: '500',
    },
});
