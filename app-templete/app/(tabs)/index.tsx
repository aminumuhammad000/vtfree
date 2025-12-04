import { useTheme } from '@/components/ThemeContext';
import { authService } from '@/services/auth.service';
import { billPaymentService } from '@/services/billpayment.service';
import { Transaction, transactionService } from '@/services/transaction.service';
import { userService } from '@/services/user.service';
import { WalletData, walletService } from '@/services/wallet.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pinPrompted, setPinPrompted] = useState(false);

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
        loadTransactions(),
        loadDashPlans(),
      ]);
    } catch (error: any) {
      console.error('Error loading data:', error);
      // Don't show intrusive alert, just log error
      // User can still use the app with cached/default data
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Check authentication before making request
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('Failed to load profile from server, using cached data');
        const userData = await authService.getCurrentUser();
        setUser(userData);
        return;
      }

      const response = await userService.getProfile();
      if (response.success) {
        setUser(response.data);
        // Prompt to set PIN if not set (legacy/new users)
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
      // Fallback to local storage
      const userData = await authService.getCurrentUser();
      setUser(userData);
    }
  };

  const loadWalletData = async () => {
    try {
      // Check authentication before making request
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

  const loadTransactions = async () => {
    try {
      // Check authentication before making request
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setTransactions([]);
        return;
      }

      const response = await transactionService.getTransactions(1, 5);
      if (response.success && response.data) {
        // Backend returns transactions directly in data array
        const transactionsArray = Array.isArray(response.data) ? response.data : [];
        setTransactions(transactionsArray.slice(0, 5)); // Only show first 5 on home
      } else {
        setTransactions([]);
      }
    } catch (error: any) {
      console.log('Error loading transactions:', error);
      setTransactions([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

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

  const airtimeAmounts = ['₦100', '₦200', '₦500', '₦1000', '₦2000', '₦5000'];
  
  const dataPlans = [
  ];

  // Dashboard data plans (fetched)
  const [dashPlans, setDashPlans] = useState<Array<{ label: string; price: number; duration: string }>>([]);
  const [dashPlansLoading, setDashPlansLoading] = useState(false);
  const [dashPlansError, setDashPlansError] = useState<string | null>(null);

  const loadDashPlans = async () => {
    try {
      setDashPlansLoading(true);
      setDashPlansError(null);
      const res = await billPaymentService.getDataPlans(); // no network => fetch all
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'airtime_topup':
        return 'phone-portrait';
      case 'data_purchase':
        return 'wifi';
      case 'bill_payment':
        return 'receipt';
      case 'wallet_topup':
        return 'wallet';
      default:
        return 'card';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'airtime_topup':
        return '#FFCB05';
      case 'data_purchase':
        return '#EF4444';
      case 'bill_payment':
        return '#2563EB';
      case 'wallet_topup':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const formatTransactionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const operators = ['MTN', 'Airtel', 'Glo', '9mobile', 'DSTV', 'GoTV'];

  const handleQuickProceed = () => {
    if (selectedTab !== 'airtime') {
      Alert.alert('Info', 'Quick Top-up proceed currently supports Airtime.');
      return;
    }
    const amountLabel = selectedAirtimeIndex !== null ? airtimeAmounts[selectedAirtimeIndex] : '';
    const amount = amountLabel.replace(/[^\d]/g, '');
    if (!phoneNumber || !amount) {
      Alert.alert('Missing info', 'Enter phone number and select an amount.');
      return;
    }
    router.push({
      pathname: '/buy-airtime',
      params: { phone: phoneNumber, amount },
    } as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <View style={styles.headerLeft}>
          <View style={styles.profilePic}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
              style={styles.profileImage}
            />
          </View>
          <Text style={[styles.welcomeText, { color: textColor }]}>Welcome, {user?.first_name || 'Guest'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationBtn}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={textColor} />
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
        {/* Wallet Balance Card */}
        <View style={styles.balanceCardContainer}>
          <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <TouchableOpacity 
                style={styles.hideButton}
                onPress={() => setIsBalanceHidden(!isBalanceHidden)}
              >
                <Ionicons 
                  name={isBalanceHidden ? "eye-outline" : "eye-off-outline"} 
                  size={16} 
                  color="#D1D5DB" 
                />
                <Text style={styles.hideText}>{isBalanceHidden ? 'Show' : 'Hide'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>
              {isBalanceHidden ? '₦••••••' : formatCurrency(wallet?.balance || 0)}
            </Text>
            <TouchableOpacity 
              style={[styles.addMoneyBtn, { backgroundColor: theme.accent }]}
              onPress={() => router.push('/add-money')}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addMoneyText}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/buy-airtime')}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(10, 37, 64, 0.3)' : 'rgba(10, 37, 64, 0.2)' }]}>
              <Ionicons name="phone-portrait-outline" size={24} color={isDark ? '#FFFFFF' : theme.primary} />
            </View>
            <Text style={[styles.actionText, { color: textBodyColor }]}>Buy Airtime</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/buy-data')}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(10, 37, 64, 0.3)' : 'rgba(10, 37, 64, 0.2)' }]}>
              <Ionicons name="wifi-outline" size={24} color={isDark ? '#FFFFFF' : theme.primary} />
            </View>
            <Text style={[styles.actionText, { color: textBodyColor }]}>Buy Data</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/pay-bills')}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(10, 37, 64, 0.3)' : 'rgba(10, 37, 64, 0.2)' }]}>
              <Ionicons name="receipt-outline" size={24} color={isDark ? '#FFFFFF' : theme.primary} />
            </View>
            <Text style={[styles.actionText, { color: textBodyColor }]}>Pay Bills</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/more')}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? 'rgba(10, 37, 64, 0.3)' : 'rgba(10, 37, 64, 0.2)' }]}>
              <Ionicons name="grid-outline" size={24} color={isDark ? '#FFFFFF' : theme.primary} />
            </View>
            <Text style={[styles.actionText, { color: textBodyColor }]}>More</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Top-up Form */}
        <View style={styles.topupSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Top-up</Text>
          
          {/* Tabs */}
          <View style={[styles.tabs, { borderBottomColor: isDark ? '#374151' : '#E5E7EB' }]}>
            <TouchableOpacity
              style={[
                styles.tab, 
                selectedTab === 'airtime' && { 
                  borderBottomColor: isDark ? theme.accent : theme.primary 
                }
              ]}
              onPress={() => setSelectedTab('airtime')}
            >
              <Text style={[styles.tabText, selectedTab === 'airtime' && { color: isDark ? '#FFFFFF' : theme.primary }]}>
                Airtime
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab, 
                selectedTab === 'data' && { 
                  borderBottomColor: isDark ? theme.accent : theme.primary 
                }
              ]}
              onPress={() => setSelectedTab('data')}
            >
              <Text style={[styles.tabText, selectedTab === 'data' && { color: isDark ? '#FFFFFF' : theme.primary }]}>
                Data
              </Text>
            </TouchableOpacity>
          </View>

          {/* Phone Input */}
          <View style={styles.formContainer}>
            <View style={[styles.inputContainer, { backgroundColor: cardBg }]}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Phone Number"
                placeholderTextColor={textBodyColor}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <Ionicons name="call-outline" size={20} color={textBodyColor} style={styles.inputIcon} />
            </View>

            {/* Amount Buttons */}
            <View style={styles.amountGrid}>
              {selectedTab === 'airtime' ? (
                airtimeAmounts.map((amount, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.amountBtn, 
                      { 
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        backgroundColor: selectedAirtimeIndex === index 
                          ? (isDark ? theme.accent : theme.primary)
                          : 'transparent'
                      }
                    ]}
                    onPress={() => setSelectedAirtimeIndex(index)}
                  >
                    <Text style={[
                      styles.amountText, 
                      { 
                        color: selectedAirtimeIndex === index 
                          ? '#FFFFFF' 
                          : textColor 
                      }
                    ]}>
                      {amount}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                (dashPlans.length ? dashPlans : []).map((plan, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dataPlanBtn, 
                      { 
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        backgroundColor: selectedDataIndex === index 
                          ? (isDark ? theme.accent : theme.primary)
                          : 'transparent'
                      }
                    ]}
                    onPress={() => setSelectedDataIndex(index)}
                  >
                    <Text style={[
                      styles.planLabel, 
                      { 
                        color: selectedDataIndex === index 
                          ? '#FFFFFF' 
                          : textColor 
                      }
                    ]}>
                      {plan.label}
                    </Text>
                    <Text style={[
                      styles.planPrice, 
                      { 
                        color: selectedDataIndex === index 
                          ? '#FFFFFF' 
                          : theme.accent 
                      }
                    ]}>
                      ₦{Number(plan.price || 0).toLocaleString()}
                    </Text>
                    <Text style={[
                      styles.planDuration, 
                      { 
                        color: selectedDataIndex === index 
                          ? '#F3F4F6' 
                          : textBodyColor 
                      }
                    ]}>
                      {plan.duration}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Proceed Button */}
            <TouchableOpacity 
              style={[styles.proceedBtn, { backgroundColor: theme.primary }]}
              onPress={handleQuickProceed}
            > 
              <Text style={styles.proceedText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={{ color: isDark ? theme.accent : theme.primary, fontSize: 14, fontWeight: '500' }}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <View key={transaction._id} style={[styles.transactionItem, { backgroundColor: cardBg }]}>
                  <View style={[styles.transactionLogo, { backgroundColor: getTransactionColor(transaction.type) }]}>
                    <Ionicons name={getTransactionIcon(transaction.type)} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionName, { color: textColor }]}>
                      {formatTransactionType(transaction.type)}
                    </Text>
                    <Text style={[styles.transactionPhone, { color: textBodyColor }]}>
                      {transaction.destination_account || transaction.reference_number}
                    </Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: textColor }]}>
                      -{formatCurrency(transaction.total_charged)}
                    </Text>
                    <Text style={[
                      styles.transactionStatus,
                      { color: transaction.status === 'successful' ? '#10B981' : transaction.status === 'failed' ? '#EF4444' : '#F59E0B' }
                    ]}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={textBodyColor} />
                <Text style={[styles.emptyStateText, { color: textBodyColor }]}>No transactions yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing */}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  notificationBtn: {
    padding: 8,
  },
  balanceCardContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  balanceCard: {
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  hideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hideText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
  },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  addMoneyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  topupSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 32,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0A2540',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputIcon: {
    marginLeft: 8,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountBtn: {
    width: '30%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dataPlanBtn: {
    width: '30%',
    minHeight: 80,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  planDuration: {
    fontSize: 11,
  },
  proceedBtn: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  proceedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  recentSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 16,
  },
  transactionLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionPhone: {
    fontSize: 14,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 14,
  },
  operatorsSection: {
    marginTop: 32,
  },
  operatorsList: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  operatorItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  operatorText: {
    fontSize: 12,
    fontWeight: '600',
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
