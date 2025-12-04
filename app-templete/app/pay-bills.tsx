import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const theme = {
  primary: '#0A2540',
  accent: '#FF9F43',
  success: '#00D4AA',
  error: '#FF5B5B',
};

export default function PayBillsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#000000' : '#F9FAFB';
  const cardBgColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const textBodyColor = isDark ? '#D1D5DB' : '#6B7280';

  const billCategories = [
    {
      id: 1,
      title: 'Electricity',
      description: 'Pay electricity bills',
      icon: 'flash',
      color: '#EAB308',
      providers: ['EKEDC', 'IKEDC', 'AEDC', 'PHED', 'KEDCO', 'IBEDC'],
    },
    {
      id: 2,
      title: 'Cable TV',
      description: 'Subscribe to TV services',
      icon: 'tv',
      color: '#9333EA',
      providers: ['DSTV', 'GOTV', 'Startimes', 'Showmax'],
    },
    {
      id: 3,
      title: 'Internet',
      description: 'Pay internet bills',
      icon: 'globe',
      color: '#06B6D4',
      providers: ['Spectranet', 'Smile', 'Swift', 'Coollink'],
    },
    {
      id: 4,
      title: 'Water',
      description: 'Pay water bills',
      icon: 'water',
      color: '#0EA5E9',
      providers: ['Lagos Water', 'Abuja Water', 'Rivers Water'],
    },
    {
      id: 5,
      title: 'Waste',
      description: 'Pay waste management',
      icon: 'trash',
      color: '#10B981',
      providers: ['LAWMA', 'AEPB', 'RESWAM'],
    },
    {
      id: 6,
      title: 'Tax',
      description: 'Pay government tax',
      icon: 'receipt',
      color: '#6366F1',
      providers: ['LIRS', 'FIRS', 'State Tax'],
    },
  ];

  const recentBills = [
    {
      id: 1,
      category: 'Electricity',
      provider: 'EKEDC',
      amount: 5000,
      date: '2025-10-28',
      status: 'Paid',
    },
    {
      id: 2,
      category: 'Cable TV',
      provider: 'DSTV',
      amount: 8500,
      date: '2025-10-25',
      status: 'Paid',
    },
    {
      id: 3,
      category: 'Internet',
      provider: 'Spectranet',
      amount: 12000,
      date: '2025-10-20',
      status: 'Paid',
    },
  ];

  const handleBillCategoryPress = (category: any) => {
    // Navigate to specific bill payment screen
    console.log('Selected category:', category.title);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBgColor }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Pay Bills</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Ionicons name="time-outline" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.primary }]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₦45,500</Text>
            <Text style={styles.statLabel}>Total Paid This Month</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Bills Paid</Text>
          </View>
        </View>

        {/* Bill Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Bill Categories</Text>
          <View style={styles.categoriesGrid}>
            {billCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: cardBgColor }]}
                onPress={() => handleBillCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor: isDark
                        ? `${category.color}20`
                        : `${category.color}15`,
                    },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={26}
                    color={category.color}
                  />
                </View>
                <Text style={[styles.categoryTitle, { color: textColor }]}>
                  {category.title}
                </Text>
                <Text style={[styles.categoryDescription, { color: textBodyColor }]}>
                  {category.description}
                </Text>
                <View style={styles.providersPreview}>
                  <Text style={[styles.providersText, { color: textBodyColor }]}>
                    {category.providers.length} providers
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={textBodyColor} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Bills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Bills</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.accent }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.billsList}>
            {recentBills.map((bill) => (
              <TouchableOpacity
                key={bill.id}
                style={[styles.billCard, { backgroundColor: cardBgColor }]}
                activeOpacity={0.7}
              >
                <View style={styles.billLeft}>
                  <View
                    style={[
                      styles.billIcon,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 159, 67, 0.2)'
                          : 'rgba(255, 159, 67, 0.1)',
                      },
                    ]}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={20}
                      color={theme.accent}
                    />
                  </View>
                  <View style={styles.billInfo}>
                    <Text style={[styles.billCategory, { color: textColor }]}>
                      {bill.category}
                    </Text>
                    <Text style={[styles.billProvider, { color: textBodyColor }]}>
                      {bill.provider} • {bill.date}
                    </Text>
                  </View>
                </View>
                <View style={styles.billRight}>
                  <Text style={[styles.billAmount, { color: textColor }]}>
                    ₦{bill.amount.toLocaleString()}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${theme.success}20` }]}>
                    <Text style={[styles.statusText, { color: theme.success }]}>
                      {bill.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Saved Billers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Saved Billers</Text>
            <TouchableOpacity>
              <Ionicons name="add-circle-outline" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.savedBillersList}>
            <TouchableOpacity
              style={[styles.savedBillerCard, { backgroundColor: cardBgColor }]}
              activeOpacity={0.7}
            >
              <View style={[styles.savedBillerIcon, { backgroundColor: '#EAB30820' }]}>
                <Ionicons name="flash" size={20} color="#EAB308" />
              </View>
              <View style={styles.savedBillerInfo}>
                <Text style={[styles.savedBillerName, { color: textColor }]}>
                  EKEDC
                </Text>
                <Text style={[styles.savedBillerMeter, { color: textBodyColor }]}>
                  Meter: 1234567890
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={textBodyColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.savedBillerCard, { backgroundColor: cardBgColor }]}
              activeOpacity={0.7}
            >
              <View style={[styles.savedBillerIcon, { backgroundColor: '#9333EA20' }]}>
                <Ionicons name="tv" size={20} color="#9333EA" />
              </View>
              <View style={styles.savedBillerInfo}>
                <Text style={[styles.savedBillerName, { color: textColor }]}>
                  DSTV Premium
                </Text>
                <Text style={[styles.savedBillerMeter, { color: textBodyColor }]}>
                  Smart Card: 9876543210
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={textBodyColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? '#1C1C1E' : '#EFF6FF' }]}>
          <Ionicons 
            name="shield-checkmark" 
            size={24} 
            color={isDark ? theme.accent : '#3B82F6'} 
          />
          <Text style={[styles.infoText, { color: isDark ? textBodyColor : '#1E40AF' }]}>
            All bill payments are secure and processed instantly. Save your billers for faster payments.
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  historyButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  providersPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  providersText: {
    fontSize: 12,
  },
  billsList: {
    gap: 12,
  },
  billCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  billLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  billIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  billInfo: {
    flex: 1,
  },
  billCategory: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  billProvider: {
    fontSize: 12,
  },
  billRight: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  savedBillersList: {
    gap: 12,
  },
  savedBillerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  savedBillerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  savedBillerInfo: {
    flex: 1,
  },
  savedBillerName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  savedBillerMeter: {
    fontSize: 12,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
