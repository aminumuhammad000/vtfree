import { useProfile } from '@/components/ProfileContext';
import { useTheme } from '@/components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { walletService } from '@/services/wallet.service';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/components/AlertContext';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

// Helper to generate DiceBear Avatar URL
const getAvatarUrl = (seed: string) => {
  return `https://api.dicebear.com/9.x/micah/png?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

export default function ProfileScreen() {
  const { isDark, theme } = useTheme();
  const router = useRouter();
  const { profileData, getFullName } = useProfile();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadAllData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserProfile(),
        loadWalletData(),
      ]);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await userService.getProfile();
      if (response.success) {
        setUser(response.data);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      const userData = await authService.getCurrentUser();
      setUser(userData);
    }
  };

  const loadWalletData = async () => {
    try {
      const response = await walletService.getWallet();
      if (response.success) {
        setWallet(response.data);
      }
    } catch (error: any) {
      console.error('Error loading wallet:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const { showSuccess } = useAlert();

  const handleCopyReferral = async (code: string) => {
    await Clipboard.setStringAsync(code);
    showSuccess('Referral code copied to clipboard!');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  }

  const bgColor = theme.background;
  const cardBg = theme.surface;
  const textColor = theme.text;
  const textSecondaryColor = theme.textSecondary;

  // Use email or name as seed for consistent avatar
  const avatarSeed = profileData?.email || profileData?.first_name || 'default';
  const avatarUrl = getAvatarUrl(avatarSeed);

  const menuItems = [
    { icon: 'person', label: 'Personal Information', route: '/edit-profile', color: theme.primary },
    { icon: 'shield-checkmark', label: 'Identity (KYC)', route: '/kyc', color: '#10B981' },
    { icon: 'lock-closed', label: 'Change PIN', route: '/set-pin', color: '#F59E0B' },
    { icon: 'key', label: 'Change Password', route: '/change-password', color: '#EF4444' },
    { icon: 'people', label: 'My Referrals', route: '/referrals', color: '#8B5CF6' },
    { icon: 'shield-checkmark', label: 'Security & Privacy', route: '/security', color: theme.success },
    { icon: 'help-buoy', label: 'Help & Support', route: '/support', color: '#F59E0B' },
    { icon: 'information-circle', label: 'About App', route: '/about', color: '#64748B' },
  ];

  const handleMenuItemPress = (route: string) => {
    if (route) router.push(route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header Title */}
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: cardBg }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>My Profile</Text>
            <TouchableOpacity
              style={[styles.settingsBtn, { backgroundColor: cardBg }]}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profileData?.profileImage || avatarUrl }}
                style={styles.avatar}
              />
              <TouchableOpacity style={[styles.editAvatarBadge, { backgroundColor: theme.primary, borderColor: bgColor }]} onPress={() => router.push('/edit-profile')}>
                <Ionicons name="pencil" size={12} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: textColor }]}>
                {profileData ? getFullName() : (user ? `${user.first_name} ${user.last_name}` : 'Welcome!')}
              </Text>
              <Text style={[styles.userEmail, { color: textSecondaryColor }]}>
                {profileData?.email || user?.email || 'Sign in to access profile'}
              </Text>

              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={[styles.editProfileButton, { backgroundColor: theme.primary + '15' }]}
                  onPress={() => router.push('/edit-profile')}
                >
                  <Text style={[styles.editProfileText, { color: theme.primary }]}>Edit Profile</Text>
                  <Ionicons name="pencil" size={14} color={theme.primary} />
                </TouchableOpacity>

                {profileData?.kyc_status === 'verified' && (
                  <View style={[styles.kycChip, { backgroundColor: theme.success + '15' }]}>
                    <Ionicons name="shield-checkmark" size={12} color={theme.success} />
                    <Text style={[styles.kycText, { color: theme.success, marginLeft: 4 }]}>Verified</Text>
                  </View>
                )}

                {user?.referral_code && (
                  <TouchableOpacity style={[styles.referralChip, { backgroundColor: cardBg }]} onPress={() => handleCopyReferral(user.referral_code)}>
                    <Text style={[styles.referralText, { color: textSecondaryColor }]}>Ref: {user.referral_code}</Text>
                    <Ionicons name="copy-outline" size={12} color={textSecondaryColor} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={[styles.statItem, { backgroundColor: theme.primary }]}
              activeOpacity={0.9}
              onPress={() => router.push('/wallet')}
            >
              <View style={styles.statIconContainer}>
                <Ionicons name="wallet" size={18} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>WALLET</Text>
                <Text style={[styles.statValue, { color: '#FFF' }]} numberOfLines={1} adjustsFontSizeToFit>
                  ₦{wallet?.balance?.toLocaleString() || '0'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statItem, { backgroundColor: cardBg, borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }]}
              activeOpacity={0.9}
              onPress={() => router.push('/kyc')}
            >
              <View style={[styles.statIconContainer, { backgroundColor: profileData?.kyc_status === 'verified' ? theme.success + '20' : '#F59E0B20' }]}>
                <Ionicons
                  name={profileData?.kyc_status === 'verified' ? "checkmark-circle" : "alert-circle"}
                  size={18}
                  color={profileData?.kyc_status === 'verified' ? theme.success : '#F59E0B'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statLabel, { color: textSecondaryColor }]} numberOfLines={1}>KYC STATUS</Text>
                <Text style={[styles.statValue, { color: profileData?.kyc_status === 'verified' ? theme.success : '#F59E0B' }]} numberOfLines={1}>
                  {profileData?.kyc_status?.toUpperCase() || 'NOT VERIFIED'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Menu Section */}
          <View style={styles.menuContainer}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>ACCOUNT SETTINGS</Text>
            <View style={styles.menuList}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, { backgroundColor: cardBg }]}
                  activeOpacity={0.7}
                  onPress={() => handleMenuItemPress(item.route)}
                >
                  <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.menuLabel, { color: textColor }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={textSecondaryColor} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Admin Section */}
          {['owner', 'admin'].includes(profileData?.role || user?.role) && (
            <View style={styles.menuContainer}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>ADMIN PANEL</Text>
              <View style={styles.menuList}>
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: cardBg }]}
                  onPress={() => router.push('/admin-users')}
                >
                  <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                    <Ionicons name="people" size={20} color="#EF4444" />
                  </View>
                  <Text style={[styles.menuLabel, { color: textColor }]}>Manage Users</Text>
                  <Ionicons name="chevron-forward" size={16} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: cardBg }]}
                  onPress={() => router.push('/admin-notifications')}
                >
                  <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                    <Ionicons name="megaphone" size={20} color="#EF4444" />
                  </View>
                  <Text style={[styles.menuLabel, { color: textColor }]}>Broadcasts</Text>
                  <Ionicons name="chevron-forward" size={16} color={textSecondaryColor} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: '#FF5B5B15' }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: textSecondaryColor }]}>v1.0.0 • Made with VTFree</Text>
          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 16,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
  },
  referralChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  referralText: {
    fontSize: 12,
    fontWeight: '700',
  },
  kycChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  kycText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 80,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    marginBottom: 2,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    flexWrap: 'wrap',
  },
  menuContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
    paddingLeft: 4,
  },
  menuList: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutBtn: {
    marginHorizontal: 24,
    marginTop: 8,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF5B5B',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    fontWeight: '500',
  },
});
