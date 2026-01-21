import { useTheme } from '@/components/ThemeContext';
import { authService } from '@/services/auth.service';
import { billPaymentService } from '@/services/billpayment.service';
import { userService } from '@/services/user.service';
import { WalletData, walletService } from '@/services/wallet.service';
import { notificationsService } from '@/services/notifications.service';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'airtime' | 'data'>('airtime');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [selectedAirtimeIndex, setSelectedAirtimeIndex] = useState<number | null>(null);
  const [selectedDataIndex, setSelectedDataIndex] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pinPrompted, setPinPrompted] = useState(false);
  const scrollViewRef = useRef<any>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerCount = 3;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loading]);

  // Load data when screen comes into focus (e.g., after login)
  useFocusEffect(
    useCallback(() => {
      checkAuthAndLoadData();
    }, [])
  );

  const checkAuthAndLoadData = async () => {
    try {
      // Check if user is authenticated before loading data
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        await loadAllData();
      } else {
        // No token, just load cached user data
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setLoading(false);
      }
    } catch (error) {
      console.log('Auth check error:', error);
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserProfile(),
        loadWalletData(),
        loadDashPlans(),
        loadUnreadCount(),
      ]);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        return;
      }

      const response = await userService.getProfile();
      if (response.success) {
        setUser(response.data);
        if (!pinPrompted && !response.data?.transaction_pin) {
          setPinPrompted(true);
          Alert.alert(
            'Set Transaction PIN',
            'For your security, please set your 4-digit transaction PIN to proceed with purchases.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Set PIN', onPress: () => router.push('/security') }
            ]
          );
        }
      }
    } catch (error: any) {
      console.log('Error loading profile:', error);
      const userData = await authService.getCurrentUser();
      setUser(userData);
    }
  };

  const loadWalletData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setWallet(null);
        return;
      }

      const response = await walletService.getWallet();
      if (response.success && response.data) {
        setWallet(response.data);
      } else {
        setWallet(null);
      }
    } catch (error: any) {
      console.log('Error loading wallet:', error);
      setWallet(null);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const res = await notificationsService.getUnreadCount();
      setUnreadCount(res.count);
    } catch (error) {
      console.log('Error loading unread count:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Auto-scroll banners every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % bannerCount;
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: nextIndex * (width - 48 + 12), // width - padding + margin
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const theme = {
    primary: "#00ADFF", // Snapchat Blue
    backgroundLight: "#FFFFFF",
    backgroundDark: "#000000",
    inputLight: "#F2F2F2",
    inputDark: "#1E1E1E",
    textLight: "#000000",
    textDark: "#FFFFFF",
    textSecondaryLight: "#757575",
    textSecondaryDark: "#A0A0A0",
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
  const cardBg = isDark ? theme.inputDark : theme.inputLight;
  const brandColor = theme.primary;

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Dashboard data plans (fetched)
  const [dashPlans, setDashPlans] = useState<Array<{ label: string; price: number; duration: string }>>([]);
  const [dashPlansLoading, setDashPlansLoading] = useState(false);
  const [dashPlansError, setDashPlansError] = useState<string | null>(null);

  const loadDashPlans = async () => {
    try {
      setDashPlansLoading(true);
      setDashPlansError(null);
      const res = await billPaymentService.getDataPlans();
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((p: any) => ({
          label: p.plan_name || p.data_value || p.name || 'Plan',
          price: Number(p.price || p.amount || 0),
          duration: p.validity || p.duration || '',
        })).slice(0, 6);
        setDashPlans(mapped);
      } else {
        setDashPlans([]);
      }
    } catch (e: any) {
      setDashPlansError(e?.message || 'Failed to load plans');
      setDashPlans([]);
    } finally {
      setDashPlansLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.profilePic}
            onPress={() => router.push('/profile')}
          >
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.welcomeText, { color: textColor }]}>{user?.first_name || 'Guest'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: cardBg }]}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications" size={20} color={textColor} />
            {unreadCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: cardBg, marginLeft: 12 }]}
            onPress={() => router.push('/more')}
          >
            <Ionicons name="search" size={20} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={[styles.loadingText, { color: textSecondaryColor }]}>Loading your world...</Text>
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
              tintColor={brandColor}
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Wallet Balance Card */}
            <View style={styles.balanceCardContainer}>
              <View style={[styles.balanceCard, { backgroundColor: brandColor }]}>
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
                  <TouchableOpacity
                    style={styles.hideButton}
                    onPress={() => setIsBalanceHidden(!isBalanceHidden)}
                  >
                    <Ionicons
                      name={isBalanceHidden ? "eye" : "eye-off"}
                      size={18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.balanceAmount}>
                  {isBalanceHidden ? '₦••••••' : formatCurrency(wallet?.balance || 0)}
                </Text>
                <View style={styles.balanceActions}>
                  <TouchableOpacity
                    style={styles.addMoneyBtn}
                    onPress={() => router.push('/add-money')}
                  >
                    <Ionicons name="add-circle" size={20} color={brandColor} />
                    <Text style={[styles.addMoneyText, { color: brandColor }]}>Add Money</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.historyBtn}
                    onPress={() => router.push('/transactions')}
                  >
                    <Text style={styles.historyText}>View History</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/buy-airtime')}
              >
                <View style={[styles.actionIcon, { backgroundColor: cardBg }]}>
                  <Ionicons name="phone-portrait" size={24} color={brandColor} />
                </View>
                <Text style={[styles.actionText, { color: textColor }]}>Airtime</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/buy-data')}
              >
                <View style={[styles.actionIcon, { backgroundColor: cardBg }]}>
                  <Ionicons name="wifi" size={24} color={brandColor} />
                </View>
                <Text style={[styles.actionText, { color: textColor }]}>Data</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/pay-bills')}
              >
                <View style={[styles.actionIcon, { backgroundColor: cardBg }]}>
                  <Ionicons name="flash" size={24} color={brandColor} />
                </View>
                <Text style={[styles.actionText, { color: textColor }]}>Bills</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/more')}
              >
                <View style={[styles.actionIcon, { backgroundColor: cardBg }]}>
                  <Ionicons name="apps" size={24} color={brandColor} />
                </View>
                <Text style={[styles.actionText, { color: textColor }]}>More</Text>
              </TouchableOpacity>
            </View>

            {/* Promotional Banners */}
            <View style={styles.bannersSection}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={width - 48 + 12}
                decelerationRate="fast"
                snapToAlignment="start"
                contentContainerStyle={{ paddingHorizontal: 24 }}
                style={styles.bannersScroll}
              >
                {/* Banner 1 */}
                <View style={[styles.bannerCard, { backgroundColor: '#FFFC00' }]}>
                  <View style={styles.bannerIconContainer}>
                    <Ionicons name="flash" size={20} color="#000" />
                  </View>
                  <View style={styles.bannerContent}>
                    <Text style={[styles.bannerTitle, { color: '#000' }]}>Snap Deal! ⚡</Text>
                    <Text style={[styles.bannerSubtitle, { color: '#000' }]}>10% bonus on data today.</Text>
                  </View>
                </View>

                {/* Banner 2 */}
                <View style={[styles.bannerCard, { backgroundColor: brandColor }]}>
                  <View style={styles.bannerIconContainer}>
                    <Ionicons name="people" size={20} color="#FFF" />
                  </View>
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>Refer & Earn 💰</Text>
                    <Text style={styles.bannerSubtitle}>Get ₦500 per friend.</Text>
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Recent Transactions */}
            <View style={styles.transactionsSection}>
              <View style={styles.transactionsHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Activity</Text>
                <TouchableOpacity onPress={() => router.push('/transactions')}>
                  <Text style={[styles.seeAllText, { color: brandColor }]}>See All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.transactionList}>
                <TouchableOpacity
                  style={[styles.transactionCard, { backgroundColor: cardBg }]}
                  onPress={() => router.push('/transactions')}
                >
                  <View style={[styles.transactionIconCircle, { backgroundColor: brandColor + '20' }]}>
                    <Ionicons name="phone-portrait" size={20} color={brandColor} />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionTitle, { color: textColor }]}>Airtime Purchase</Text>
                    <Text style={[styles.transactionDate, { color: textSecondaryColor }]}>Today, 12:45 PM</Text>
                  </View>
                  <Text style={[styles.amountText, { color: '#FF4B4B' }]}>-₦1,000</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.transactionCard, { backgroundColor: cardBg }]}
                  onPress={() => router.push('/transactions')}
                >
                  <View style={[styles.transactionIconCircle, { backgroundColor: '#00D1FF20' }]}>
                    <Ionicons name="wallet" size={20} color="#00D1FF" />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionTitle, { color: textColor }]}>Wallet Funding</Text>
                    <Text style={[styles.transactionDate, { color: textSecondaryColor }]}>Yesterday, 09:20 AM</Text>
                  </View>
                  <Text style={[styles.amountText, { color: '#00D166' }]}>+₦5,000</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
          <View style={{ height: 40 }} />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#00ADFF',
    padding: 2,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4B4B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  balanceCardContainer: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#00ADFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hideButton: {
    padding: 4,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -1,
  },
  balanceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addMoneyBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  addMoneyText: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  historyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
    opacity: 0.9,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 32,
  },
  actionItem: {
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bannersSection: {
    marginTop: 32,
  },
  bannersScroll: {
    // Removed paddingLeft to use contentContainerStyle
  },
  bannerCard: {
    width: width - 48,
    height: 72,
    borderRadius: 16,
    marginRight: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  transactionsSection: {
    paddingHorizontal: 24,
    marginTop: 40,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
  },
  transactionList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  transactionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});
