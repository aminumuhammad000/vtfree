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
  TouchableOpacity,
  View,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { useTheme } from '@/components/ThemeContext';
import { useProfile } from '@/components/ProfileContext';
import { useAlert } from '@/components/AlertContext';
import { authService } from '@/services/auth.service';
import { billPaymentService } from '@/services/billpayment.service';
import { userService } from '@/services/user.service';
import { WalletData, walletService } from '@/services/wallet.service';
import { notificationsService } from '@/services/notifications.service';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Layout,
  FadeIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ActionButton = ({ icon, label, onPress, color, theme }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.actionItem, animatedStyle]}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.actionIcon,
          { backgroundColor: theme.background === '#000000' ? 'rgba(255,255,255,0.05)' : theme.primary + '10' }
        ]}
      >
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </Pressable>
      <Text style={[styles.actionText, { color: theme.text }]}>{label}</Text>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { isDark, theme } = useTheme();
  const { profileData } = useProfile();
  const { } = useAlert();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const bannerScrollViewRef = useRef<any>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const loadAllData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setLoading(false);
        return;
      }

      await Promise.all([
        loadUserProfile(),
        loadWalletData(),
        loadUnreadCount(),
        loadRecentTransactions(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    const response = await userService.getProfile();
    if (response.success) setUser(response.data);
  };

  const loadWalletData = async () => {
    const response = await walletService.getWallet();
    if (response.success) setWallet(response.data);
  };

  const loadUnreadCount = async () => {
    const res = await notificationsService.getUnreadCount();
    setUnreadCount(res.count);
  };

  const loadRecentTransactions = async () => {
    try {
      // Mock or fetch actual recent transactions
      const [walletRes, transactionsRes] = await Promise.all([
        walletService.getWallet(),
        walletService.getWalletTransactions(1, 10),
      ]);
      if (walletRes.success) {
        setWallet(walletRes.data);
      }
      if (transactionsRes?.success) {
        setRecentTransactions(transactionsRes.data);
      }
    } catch (e) {
      console.log('Error loading transactions:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadAllData();
    setRefreshing(false);
  };

  const brandColor = theme.primary;
  const bgColor = theme.background;
  const textColor = theme.text;
  const cardBg = theme.surface;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const toggleBalance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBalanceHidden(!isBalanceHidden);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Animated Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={[styles.header, { backgroundColor: bgColor }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.profileBtn}
            onPress={() => router.push('/profile')}
          >
            <Image
              source={{ uri: user?.profile_picture_url || 'https://i.pravatar.cc/300?u=' + user?.email }}
              style={[styles.profileImage, { backgroundColor: theme.surface }]}
            />
            <View style={[styles.onlineBadge, { borderColor: theme.background }]} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>Good Day,</Text>
            <Text style={[styles.username, { color: textColor }]}>{user?.first_name || 'VIP User'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBox, { backgroundColor: theme.surface }]}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={textColor} />
            {unreadCount > 0 && <View style={[styles.notifDot, { borderColor: theme.background }]} />}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brandColor} />
        }
      >
        {/* Wallet Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.walletContainer}>
          <View
            style={[styles.walletCard, { backgroundColor: brandColor }]}
          >
            <View style={styles.walletHeader}>
              <View style={styles.walletLabelBox}>
                <MaterialCommunityIcons name="wallet-outline" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={styles.walletLabel}>AVAILABLE BALANCE</Text>
              </View>
              <TouchableOpacity onPress={toggleBalance} style={styles.eyeBtn}>
                <Ionicons name={isBalanceHidden ? "eye-off" : "eye"} size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.balanceText}>
              {isBalanceHidden ? "₦ • • • • •" : formatCurrency(wallet?.balance || 0)}
            </Text>

            <View style={styles.walletFooter}>
              <TouchableOpacity
                style={styles.addMoneyBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/add-money');
                }}
              >
                <Ionicons name="add" size={20} color={brandColor} />
                <Text style={[styles.addMoneyText, { color: brandColor }]}>Fund</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.refBox} onPress={() => {
                Haptics.selectionAsync();
                router.push('/referrals');
              }}>
                <Text style={styles.refText}>Ref: {user?.referral_code || '---'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Services Grid */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.servicesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Services</Text>
          </View>
          <View style={styles.servicesGrid}>
            <ActionButton
              icon="cellphone-wireless"
              label="Airtime"
              onPress={() => router.push('/buy-airtime')}
              color={theme.warning}
              theme={theme}
            />
            <ActionButton
              icon="database"
              label="Data"
              onPress={() => router.push('/buy-data')}
              color="#00ADFF"
              theme={theme}
            />
            <ActionButton
              icon="flash"
              label="Electricity"
              onPress={() => router.push('/pay-bills')}
              color="#F1C40F"
              theme={theme}
            />
            <ActionButton
              icon="television-classic"
              label="TV/Cable"
              onPress={() => router.push('/pay-bills')}
              color={theme.error}
              theme={theme}
            />
          </View>
          <View style={[styles.servicesGrid, { marginTop: 15 }]}>
            <ActionButton
              icon="school"
              label="Education"
              onPress={() => router.push('/pay-bills')}
              color={theme.accent}
              theme={theme}
            />
            <ActionButton
              icon="card-bulleted"
              label="E-PIN"
              onPress={() => router.push('/buy-airtime')}
              color={theme.secondary}
              theme={theme}
            />
            <ActionButton
              icon="history"
              label="History"
              onPress={() => router.push('/transactions')}
              color={theme.text}
              theme={theme}
            />
            <ActionButton
              icon="dots-grid"
              label="More"
              onPress={() => router.push('/more')}
              color="#666"
              theme={theme}
            />
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.activityContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={[styles.seeAll, { color: brandColor }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx, index) => (
              <Animated.View
                key={tx._id || index}
                entering={FadeIn.delay(700 + index * 100)}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  style={[styles.txCard, { backgroundColor: cardBg }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push('/transactions');
                  }}
                >
                  <View style={[styles.txIconBox, { backgroundColor: tx.type === 'credit' ? '#00D16615' : '#FF5B5B15' }]}>
                    <MaterialCommunityIcons
                      name={tx.type === 'credit' ? "arrow-bottom-left" : "arrow-top-right"}
                      size={20}
                      color={tx.type === 'credit' ? '#00D166' : '#FF5B5B'}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txTitle, { color: textColor }]}>{tx.description || tx.type}</Text>
                    <Text style={[styles.txDate, { color: theme.textSecondary }]}>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#00D166' : '#FF5B5B' }]}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
              <View style={styles.emptyIllustration}>
                <MaterialCommunityIcons name="clipboard-text-search-outline" size={60} color={theme.border} />
              </View>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recent transactions yet</Text>
              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: brandColor + '15' }]}
                onPress={() => router.push('/buy-airtime')}
              >
                <Text style={{ color: brandColor, fontWeight: '700' }}>Start Transacting</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  profileBtn: {
    position: 'relative',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  onlineBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00D166',
    borderWidth: 2,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
  },
  username: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5B5B',
    borderWidth: 1.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  walletContainer: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  walletCard: {
    padding: 24,
    borderRadius: 28,
    minHeight: 180,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  eyeBtn: {
    padding: 5,
  },
  balanceText: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  walletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addMoneyBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 15,
    gap: 5,
  },
  addMoneyText: {
    fontSize: 14,
    fontWeight: '800',
  },
  refBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  refText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  servicesContainer: {
    marginTop: 35,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    width: (width - 48 - 45) / 4,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  activityContainer: {
    marginTop: 40,
    paddingHorizontal: 24,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 24,
  },
  emptyIllustration: {
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  startBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
