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
