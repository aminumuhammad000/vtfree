import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/components/AlertContext';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  Layout,
  FadeIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function MoreScreen() {
  const { isDark, theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showInfo } = useAlert();
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = theme.background;
  const textColor = theme.text;
  const cardBg = theme.surface;
  const brandColor = theme.primary;
  const secondaryColor = theme.secondary;
  const accentColor = theme.accent;
  const warningColor = theme.warning;
  const errorColor = theme.error;
  const successColor = theme.success;

  const services = [
    {
      category: 'Bills & Utilities',
      items: [
        { id: 1, title: 'Cable TV', icon: 'television-classic', color: theme.error, description: 'DSTV, GOTV' },
        { id: 2, title: 'Electricity', icon: 'flash-outline', color: theme.warning, description: 'Utility bills' },
        { id: 3, title: 'Internet', icon: 'wifi', color: theme.primary, description: 'Data & Fiber' },
        { id: 12, title: 'Utilities', icon: 'water-outline', color: theme.secondary, description: 'Water & Waste' },
      ]
    },
    {
      category: 'Financial Services',
      items: [
        { id: 6, title: 'Insurance', icon: 'shield-check-outline', color: theme.primary, description: 'Health & Auto' },
        { id: 8, title: 'Gift Cards', icon: 'gift-outline', color: theme.accent, description: 'Buy & Sell' },
        { id: 14, title: 'Nano Loans', icon: 'cash-fast', color: theme.success, description: 'Quick credit' },
      ]
    },
    {
      category: 'Lifestyle & Education',
      items: [
        { id: 4, title: 'Education', icon: 'school-outline', color: theme.success, description: 'Exam Pins' },
        { id: 5, title: 'Betting', icon: 'trophy-outline', color: theme.warning, description: 'Funding' },
        { id: 7, title: 'Transport', icon: 'bus-side', color: theme.accent, description: 'Tickets' },
        { id: 11, title: 'Donations', icon: 'heart-outline', color: theme.error, description: 'Charity' },
      ]
    },
    {
      category: 'Others',
      items: [
        { id: 10, title: 'Government', icon: 'flag-outline', color: theme.primary, description: 'Taxes & Levies' },
        { id: 9, title: 'Vouchers', icon: 'ticket-outline', color: theme.secondary, description: 'Shopping' },
        { id: 13, title: 'Data Guides', icon: 'book-open-outline', color: theme.textSecondary, description: 'Network codes', route: '/data-guides' },
      ]
    }
  ];

  const filteredServices = services.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  const handlePress = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (item.route) {
      router.push(item.route);
    } else {
      showInfo(`${item.title} is coming soon!`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Services</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/support')}>
            <Ionicons name="help-circle-outline" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: cardBg }]}>
          <Ionicons name="search" size={20} color={isDark ? "#444" : "#BBB"} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search services..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 100 }]}
      >
        {filteredServices.map((category, idx) => (
          <Animated.View
            key={category.category}
            entering={FadeInDown.delay(idx * 100).springify()}
            layout={Layout.springify()}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{category.category}</Text>
            <View style={styles.grid}>
              {category.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, { backgroundColor: cardBg }]}
                  onPress={() => handlePress(item)}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>{item.title}</Text>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={1}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.border} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}

        {filteredServices.length === 0 && (
          <Animated.View entering={FadeIn} style={styles.empty}>
            <MaterialCommunityIcons name="toy-brick-search-outline" size={80} color={theme.border} />
            <Text style={{ color: theme.textSecondary, marginTop: 20, fontSize: 16, fontWeight: '600' }}>No services found</Text>
          </Animated.View>
        )}

        <View style={[styles.promoCard, { backgroundColor: brandColor }]}>
          <View>
            <Text style={styles.promoTitle}>Invite Friends</Text>
            <Text style={styles.promoSubtitle}>Earn ₦500 on every signup</Text>
          </View>
          <TouchableOpacity style={styles.promoBtn}>
            <Text style={{ color: brandColor, fontWeight: '800', fontSize: 12 }}>Invite</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 15 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  iconBtn: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderRadius: 18,
    paddingHorizontal: 15,
    gap: 12
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  scrollBody: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, textTransform: 'uppercase' },
  grid: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 22,
    gap: 15
  },
  iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  cardDesc: { fontSize: 12, fontWeight: '500' },
  empty: { height: 300, justifyContent: 'center', alignItems: 'center' },
  promoCard: {
    marginTop: 20,
    padding: 25,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  promoTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  promoSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, fontWeight: '600' },
  promoBtn: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }
});
