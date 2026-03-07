import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { walletService } from '@/services/wallet.service';
import { useAlert } from '@/components/AlertContext';

const { width } = Dimensions.get('window');

export default function PayBillsScreen() {
  const router = useRouter();
  const { isDark, theme } = useTheme();
  const { showSuccess } = useAlert();

  const bgColor = theme.background;
  const cardBg = theme.surface;
  const textColor = theme.text;
  const textSecondaryColor = theme.textSecondary;

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Fetch wallet balance on mount
  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      setIsLoadingBalance(true);
      const response = await walletService.getWallet();
      if (response.success && response.data) {
        setWalletBalance(response.data.balance);
      }
    } catch (error) {
      console.log('Failed to fetch wallet balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const showComingSoon = () => {
    showSuccess('🚀 Coming Soon! This feature will be available shortly.');
  };

  const billCategories = [
    {
      id: 1,
      title: 'Electricity',
      icon: 'flash',
      color: theme.warning,
      route: '/bills/electricity'
    },
    {
      id: 2,
      title: 'Cable TV',
      icon: 'tv',
      color: theme.error,
      route: '/bills/tv'
    },
    {
      id: 3,
      title: 'Internet',
      icon: 'globe',
      color: theme.primary,
      route: '/bills/internet'
    },
    {
      id: 4,
      title: 'Water',
      icon: 'water',
      color: theme.secondary,
      route: '/bills/water'
    },
    {
      id: 5,
      title: 'Waste',
      icon: 'trash',
      color: theme.success,
      route: '/bills/waste'
    },
    {
      id: 6,
      title: 'Betting',
      icon: 'game-controller',
      color: theme.accent,
      route: '/bills/betting'
    },
  ];

  const recentTransactions = [
    {
      id: 1,
      title: 'DSTV Premium',
      subtitle: 'Cable TV • 1234567890',
      amount: '₦29,500',
      date: 'Today, 10:23 AM',
      status: 'success',
      icon: 'tv',
      color: theme.error
    },
    {
      id: 2,
      title: 'Ikeja Electric',
      subtitle: 'Electricity • 0987654321',
      amount: '₦5,000',
      date: 'Yesterday, 4:15 PM',
      status: 'success',
      icon: 'flash',
      color: theme.warning
    },
    {
      id: 3,
      title: 'Spectranet',
      subtitle: 'Internet • SPE-12345',
      amount: '₦12,000',
      date: 'Oct 24, 2025',
      status: 'failed',
      icon: 'globe',
      color: theme.primary
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: cardBg }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Pay Bills</Text>
        <TouchableOpacity
          style={[styles.historyButton, { backgroundColor: cardBg }]}
          onPress={() => router.push('/transactions')}
        >
          <Ionicons name="time-outline" size={20} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
          <View>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            {isLoadingBalance ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.balanceValue}>₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.topUpButton} onPress={() => router.push('/add-money')}>
            <Ionicons name="add" size={20} color={theme.primary} />
            <Text style={[styles.topUpText, { color: theme.primary }]}>Top Up</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Grid */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Select Service</Text>
        <View style={styles.gridContainer}>
          {billCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: cardBg }]}
              activeOpacity={0.7}
              onPress={showComingSoon}
            >
              <View style={[styles.iconContainer, { backgroundColor: category.color + '15' }]}>
                <Ionicons name={category.icon as any} size={24} color={category.color} />
              </View>
              <Text style={[styles.categoryTitle, { color: textColor }]}>{category.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Recent Payments</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={[styles.txItem, { backgroundColor: cardBg }]}
              activeOpacity={0.7}
            >
              <View style={[styles.txIcon, { backgroundColor: tx.color + '15' }]}>
                <Ionicons name={tx.icon as any} size={20} color={tx.color} />
              </View>
              <View style={styles.txContent}>
                <View style={styles.txTop}>
                  <Text style={[styles.txTitle, { color: textColor }]}>{tx.title}</Text>
                  <Text style={[styles.txAmount, { color: textColor }]}>{tx.amount}</Text>
                </View>
                <View style={styles.txBottom}>
                  <Text style={[styles.txSubtitle, { color: textSecondaryColor }]}>{tx.subtitle}</Text>
                  <Text style={[styles.txDate, { color: textSecondaryColor }]}>{tx.date}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    elevation: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  topUpButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topUpText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  categoryCard: {
    width: (width - 48 - 12) / 2, // (Screen width - padding - gap) / 2
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 120,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txContent: {
    flex: 1,
    gap: 4,
  },
  txTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  txSubtitle: {
    fontSize: 12,
  },
  txDate: {
    fontSize: 12,
  },
});
