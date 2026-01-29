import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';

const { width } = Dimensions.get('window');

export default function PayBillsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const theme = {
    primary: '#00ADFF',
    backgroundLight: '#FFFFFF',
    backgroundDark: '#000000',
    cardLight: '#F2F2F2',
    cardDark: '#1E1E1E',
    textLight: '#000000',
    textDark: '#FFFFFF',
    textSecondaryLight: '#757575',
    textSecondaryDark: '#A0A0A0',
    success: '#00D166',
    warning: '#F59E0B',
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBg = isDark ? theme.cardDark : theme.cardLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;

  const billCategories = [
    {
      id: 1,
      title: 'Electricity',
      icon: 'flash',
      color: '#EAB308',
      route: '/bills/electricity'
    },
    {
      id: 2,
      title: 'Cable TV',
      icon: 'tv',
      color: '#9333EA',
      route: '/bills/tv'
    },
    {
      id: 3,
      title: 'Internet',
      icon: 'globe',
      color: '#06B6D4',
      route: '/bills/internet'
    },
    {
      id: 4,
      title: 'Water',
      icon: 'water',
      color: '#0EA5E9',
      route: '/bills/water'
    },
    {
      id: 5,
      title: 'Waste',
      icon: 'trash',
      color: '#10B981',
      route: '/bills/waste'
    },
    {
      id: 6,
      title: 'Betting',
      icon: 'game-controller',
      color: '#F43F5E',
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
      color: '#9333EA'
    },
    {
      id: 2,
      title: 'Ikeja Electric',
      subtitle: 'Electricity • 0987654321',
      amount: '₦5,000',
      date: 'Yesterday, 4:15 PM',
      status: 'success',
      icon: 'flash',
      color: '#EAB308'
    },
    {
      id: 3,
      title: 'Spectranet',
      subtitle: 'Internet • SPE-12345',
      amount: '₦12,000',
      date: 'Oct 24, 2025',
      status: 'failed',
      icon: 'globe',
      color: '#06B6D4'
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
            <Text style={styles.balanceValue}>₦50,000.00</Text>
          </View>
          <TouchableOpacity style={styles.topUpButton}>
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
              onPress={() => console.log('Navigate to', category.route)}
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
    shadowColor: '#00ADFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
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
