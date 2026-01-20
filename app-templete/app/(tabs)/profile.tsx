import { useProfile } from '@/components/ProfileContext';
import { useTheme } from '@/components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { walletService } from '@/services/wallet.service';
import { useAuth } from '@/context/AuthContext';
import * as Clipboard from 'expo-clipboard';

// Helper to generate DiceBear Avatar URL
const getAvatarUrl = (seed: string) => {
  return `https://api.dicebear.com/9.x/micah/png?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

export default function ProfileScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { profileData, getFullName } = useProfile();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    loadAllData();
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

  const handleCopyReferral = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
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

  const theme = {
    primary: '#0A2540',
    accent: '#FF9F43',
    backgroundLight: '#F3F4F6', // Softer gray
    backgroundDark: '#111921',
    textHeadings: '#1E293B',
    textBody: '#64748B',
    cardLight: '#FFFFFF',
    cardDark: '#1F2937',
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBg = isDark ? theme.cardDark : theme.cardLight;
  const textColor = isDark ? '#FFFFFF' : theme.textHeadings;
  const textBodyColor = isDark ? '#9CA3AF' : theme.textBody;

  // Use email or name as seed for consistent avatar
  const avatarSeed = user?.email || user?.first_name || 'default';
  const avatarUrl = getAvatarUrl(avatarSeed);

  const menuItems = [
    { icon: 'person', label: 'Personal Information', route: '/edit-profile', color: '#3B82F6' },
    { icon: 'shield-checkmark', label: 'Security & Privacy', route: '/security', color: '#10B981' },
    { icon: 'notifications', label: 'Notifications', route: '/notifications-settings', color: '#F59E0B' },
    { icon: 'help-buoy', label: 'Help & Support', route: '/help-support', color: '#6366F1' },
    { icon: 'information-circle', label: 'About App', route: '/about', color: '#8B5CF6' },
  ];

  const handleMenuItemPress = (route: string) => {
    if (route) router.push(route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Curved Header Background */}
      <View style={[styles.headerBackground, { backgroundColor: isDark ? theme.cardDark : theme.primary }]} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Header Title */}
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Card (Floating) */}
        <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profileData?.profileImage || avatarUrl }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarBadge} onPress={() => router.push('/edit-profile')}>
              <Ionicons name="pencil" size={12} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.userName, { color: textColor }]}>
            {profileData ? getFullName() : (user ? `${user.first_name} ${user.last_name}` : 'Welcome!')}
          </Text>
          <Text style={[styles.userEmail, { color: textBodyColor }]}>
            {profileData?.email || user?.email || 'Sign in to access profile'}
          </Text>

          {user?.referral_code && (
            <TouchableOpacity style={styles.referralChip} onPress={() => handleCopyReferral(user.referral_code)}>
              <Text style={styles.referralText}>Ref: {user.referral_code}</Text>
              <Ionicons name="copy-outline" size={12} color={theme.accent} />
            </TouchableOpacity>
          )}

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={[styles.statItem, { backgroundColor: isDark ? '#374151' : '#F1F5F9' }]}>
              <Text style={[styles.statLabel, { color: textBodyColor }]}>Wallet</Text>
              <Text style={[styles.statValue, { color: theme.primary }]}>₦{wallet?.balance?.toLocaleString() || '0'}</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: isDark ? '#374151' : '#F1F5F9' }]}>
              <Text style={[styles.statLabel, { color: textBodyColor }]}>Status</Text>
              <Text style={[styles.statValue, { color: user?.kyc_status === 'verified' ? '#10B981' : '#F59E0B' }]}>
                {user?.kyc_status ? user.kyc_status.toUpperCase() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          <Text style={[styles.sectionTitle, { color: textBodyColor }]}>Account Settings</Text>
          <View style={[styles.menuList, { backgroundColor: cardBg }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, index !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#F1F5F9' }]}
                activeOpacity={0.7}
                onPress={() => handleMenuItemPress(item.route)}
              >
                <View style={[styles.iconBox, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[styles.menuLabel, { color: textColor }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={textBodyColor} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Admin Section */}
        {['owner', 'admin'].includes(profileData?.role || user?.role) && (
          <View style={styles.menuContainer}>
            <Text style={[styles.sectionTitle, { color: textBodyColor }]}>Admin Panel</Text>
            <View style={[styles.menuList, { backgroundColor: cardBg }]}>
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#F1F5F9' }]}
                onPress={() => router.push('/admin-users')}
              >
                <View style={[styles.iconBox, { backgroundColor: '#EF444420' }]}>
                  <Ionicons name="people" size={20} color="#EF4444" />
                </View>
                <Text style={[styles.menuLabel, { color: textColor }]}>Manage Users</Text>
                <Ionicons name="chevron-forward" size={18} color={textBodyColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin-notifications')}
              >
                <View style={[styles.iconBox, { backgroundColor: '#EF444420' }]}>
                  <Ionicons name="megaphone" size={20} color="#EF4444" />
                </View>
                <Text style={[styles.menuLabel, { color: textColor }]}>Broadcasts</Text>
                <Ionicons name="chevron-forward" size={18} color={textBodyColor} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: textBodyColor }]}>v1.0.0 • Made with VTFree</Text>
        <View style={{ height: 40 }} />
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
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    marginTop: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFF',
    backgroundColor: '#E2E8F0',
  },
  editAvatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#0A2540',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  referralChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 67, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
  },
  referralText: {
    fontSize: 12,
    color: '#FF9F43',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  statItem: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  menuContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuList: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    fontWeight: '500',
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
  },
});
import { useTheme } from '@/components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { walletService } from '@/services/wallet.service';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { profileData, getFullName } = useProfile();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    loadAllData();
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
      // Fallback to local storage
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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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

  const theme = {
    primary: '#0A2540',
    accent: '#FF9F43',
    backgroundLight: '#F8F9FA',
    backgroundDark: '#111921',
    textHeadings: '#1E293B',
    textBody: '#475569',
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const textColor = isDark ? '#FFFFFF' : theme.textHeadings;
  const textBodyColor = isDark ? '#9CA3AF' : theme.textBody;
  const cardBg = isDark ? '#1F2937' : '#F3F4F6';

  const menuItems = [
    { icon: 'person-outline', label: 'Personal Information', route: '/edit-profile' },
    { icon: 'lock-closed-outline', label: 'Security', route: '/security' },
    { icon: 'notifications-outline', label: 'Notifications', route: '/notifications-settings' },
    { icon: 'help-circle-outline', label: 'Help & Support', route: '/help-support' },
    { icon: 'information-circle-outline', label: 'About', route: '/about' },
  ];

  const handleMenuItemPress = (route: string) => {
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: textBodyColor }]}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
            <View style={styles.profilePic}>
              <Image
                source={{ uri: profileData?.profileImage || user?.profile_image || 'https://via.placeholder.com/150' }}
                style={styles.profileImage}
              />
            </View>
            <Text style={[styles.profileName, { color: textColor }]}>
              {profileData ? getFullName() : (user ? `${user.first_name} ${user.last_name}` : 'Loading...')}
            </Text>
            <Text style={[styles.profileEmail, { color: textBodyColor }]}>
              {profileData?.email || user?.email || ''}
            </Text>
            {user?.phone_number && (
              <Text style={[styles.profilePhone, { color: textBodyColor }]}>
                {user.phone_number}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/edit-profile')}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: cardBg }]}
                activeOpacity={0.7}
                onPress={() => handleMenuItemPress(item.route)}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon as any} size={24} color={isDark ? '#FFFFFF' : theme.primary} />
                  <Text style={[styles.menuItemLabel, { color: textColor }]}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={textBodyColor} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Admin Panel - Only for Owners/Admins */}
          {['owner', 'admin'].includes(profileData?.role || user?.role) && (
            <View style={styles.menuSection}>
              <Text style={[styles.sectionHeader, { color: textBodyColor, paddingHorizontal: 16, marginBottom: 8 }]}>Admin Panel</Text>
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: cardBg }]}
                activeOpacity={0.7}
                onPress={() => router.push('/admin-users')}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="people-outline" size={24} color={isDark ? '#FFFFFF' : theme.primary} />
                  <Text style={[styles.menuItemLabel, { color: textColor }]}>Manage Users</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={textBodyColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: cardBg, marginTop: 12 }]}
                activeOpacity={0.7}
                onPress={() => router.push('/admin-notifications')}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="notifications-circle-outline" size={24} color={isDark ? '#FFFFFF' : theme.primary} />
                  <Text style={[styles.menuItemLabel, { color: textColor }]}>Send Broadcast</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={textBodyColor} />
              </TouchableOpacity>
            </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#EF4444' }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          {/* Account Stats */}
          <View style={[styles.statsCard, { backgroundColor: cardBg }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: textColor }]}>₦{wallet?.balance?.toLocaleString() || '0'}</Text>
              <Text style={[styles.statLabel, { color: textBodyColor }]}>Wallet Balance</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: textBodyColor }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: textColor }]}>{user?.kyc_status || 'Not Started'}</Text>
              <Text style={[styles.statLabel, { color: textBodyColor }]}>KYC Status</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  settingsBtn: {
    padding: 8,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    marginBottom: 16,
  },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    opacity: 0.2,
  },
});
