import { useTheme } from '@/components/ThemeContext';
import TransactionFilter, { FilterOptions } from '@/components/TransactionFilter';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { transactionService, Transaction as ApiTransaction } from '@/services/transaction.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  name: string;
  phone: string;
  amount: string;
  status: string;
  date: string;
  bgColor: string;
  type?: string;
  transactionId?: string;
  fee?: string;
  totalAmount?: string;
}

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

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    type: [],
    dateRange: 'all',
    amountRange: 'all',
  });
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
  const cardBg = isDark ? theme.inputDark : theme.inputLight;
  const brandColor = theme.primary;

  useEffect(() => {
    if (!loading) {
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
    }
  }, [loading]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactions(1, 50);
      if (response.success && response.data && Array.isArray(response.data.transactions)) {
        const mapped = response.data.transactions.map(mapApiTransactionToLocal);
        setAllTransactions(mapped);
      } else {
        setAllTransactions([]);
      }
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      setAllTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const mapApiTransactionToLocal = (transaction: ApiTransaction): Transaction => {
    const date = new Date(transaction.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let dateString = '';
    if (date.toDateString() === today.toDateString()) {
      dateString = `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateString = `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    return {
      id: transaction._id,
      name: formatTransactionType(transaction.type),
      phone: transaction.destination_account || transaction.reference_number,
      amount: `₦${transaction.amount.toFixed(2)}`,
      status: transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1),
      date: dateString,
      bgColor: getTransactionColor(transaction.type),
      type: formatTransactionType(transaction.type),
      transactionId: transaction.reference_number,
      fee: `₦${transaction.fee.toFixed(2)}`,
      totalAmount: `₦${transaction.total_charged.toFixed(2)}`,
    };
  };

  const formatTransactionType = (type: string) =>
    type.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'airtime_topup': return '#FFCB05';
      case 'data_purchase': return '#EF4444';
      case 'bill_payment': return '#2563EB';
      case 'wallet_topup': return '#10B981';
      default: return '#6B7280';
    }
  };

  // ✅ Filter Logic
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;
    if (filters.status.length > 0) {
      filtered = filtered.filter(t => filters.status.includes(t.status));
    }
    if (filters.type.length > 0) {
      filtered = filtered.filter(t => filters.type.includes(t.type ?? ''));
    }
    return filtered;
  }, [allTransactions, filters]);

  const hasActiveFilters =
    filters.status.length > 0 || filters.type.length > 0 || filters.dateRange !== 'all' || filters.amountRange !== 'all';

  const handleFilterPress = () => setFilterVisible(true);
  const handleCloseFilter = () => setFilterVisible(false);
  const handleApplyFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setFilterVisible(false);
  };

  const openTransactionDetails = (id: string) => () => {
    setSelectedTransactionId(id);
    setDetailsModalVisible(true);
  };

  const closeTransactionDetails = () => {
    setDetailsModalVisible(false);
    setSelectedTransactionId(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: cardBg }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>History</Text>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: hasActiveFilters ? brandColor + '20' : cardBg }]}
            onPress={handleFilterPress}
          >
            <Ionicons name="filter" size={20} color={hasActiveFilters ? brandColor : textColor} />
            {hasActiveFilters && (
              <View style={[styles.filterBadge, { backgroundColor: brandColor }]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={[styles.loadingText, { color: textSecondaryColor }]}>Loading transactions...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 80 }
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brandColor} />}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(transaction => (
                <TouchableOpacity key={transaction.id} style={[styles.transactionItem, { backgroundColor: cardBg }]} onPress={openTransactionDetails(transaction.id)}>
                  <View style={[styles.transactionLogo, { backgroundColor: transaction.bgColor + '15' }]}>
                    <Ionicons
                      name={
                        transaction.type?.includes('Airtime') ? 'phone-portrait' :
                          transaction.type?.includes('Data') ? 'wifi' :
                            transaction.type?.includes('Wallet') ? 'wallet' : 'receipt'
                      }
                      size={24}
                      color={transaction.bgColor}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionName, { color: textColor }]}>{transaction.name}</Text>
                    <Text style={[styles.transactionDate, { color: textSecondaryColor }]}>{transaction.date}</Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: textColor }]}>-{transaction.amount}</Text>
                    <View style={[styles.statusBadge, {
                      backgroundColor:
                        transaction.status === 'Successful' ? '#00D166' + '15' :
                          transaction.status === 'Failed' ? '#FF5B5B' + '15' : '#FFFC00' + '15'
                    }]}>
                      <Text
                        style={[
                          styles.transactionStatus,
                          {
                            color:
                              transaction.status === 'Successful'
                                ? '#00D166'
                                : transaction.status === 'Failed'
                                  ? '#FF5B5B'
                                  : '#FFFC00', // Warning yellow
                          },
                        ]}
                      >
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: brandColor + '10' }]}>
                  <Ionicons name="receipt-outline" size={32} color={brandColor} />
                </View>
                <Text style={[styles.emptyTitle, { color: textColor }]}>No transactions found</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondaryColor }]}>
                  Try adjusting your filters to see more results
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      )}

      <TransactionFilter
        visible={filterVisible}
        onClose={handleCloseFilter}
        onApplyFilter={handleApplyFilter}
        currentFilters={filters}
      />

      <TransactionDetailsModal
        visible={detailsModalVisible}
        transactionId={selectedTransactionId}
        onClose={closeTransactionDetails}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  transactionLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 16,
    gap: 4,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
});
