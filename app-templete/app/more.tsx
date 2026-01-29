import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  TextInput,
  Animated,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/components/AlertContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48 - 36) / 4; // 4 columns with gaps

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

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showInfo } = useAlert();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
  const cardBg = isDark ? theme.inputDark : theme.inputLight;
  const brandColor = theme.primary;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
  }, []);

  const services = [
    {
      category: 'Bills & Utilities',
      layout: 'grid',
      items: [
        { id: 1, title: 'Cable TV', icon: 'tv', color: '#9333EA', description: 'DSTV, GOTV' },
        { id: 2, title: 'Electricity', icon: 'flash', color: '#EAB308', description: 'Utility bills' },
        { id: 3, title: 'Internet', icon: 'globe', color: '#06B6D4', description: 'Data & Fiber' },
        { id: 12, title: 'Utilities', icon: 'water', color: '#0EA5E9', description: 'Water & Waste' },
      ]
    },
    {
      category: 'Financial Services',
      layout: 'list',
      items: [
        { id: 6, title: 'Insurance', icon: 'shield-checkmark', color: '#3B82F6', description: 'Health, Auto & Life Insurance' },
        { id: 8, title: 'Gift Cards', icon: 'gift', color: '#EC4899', description: 'Buy & Sell Digital Gift Cards' },
      ]
    },
    {
      category: 'Lifestyle & Education',
      layout: 'grid',
      items: [
        { id: 4, title: 'Education', icon: 'school', color: '#10B981', description: 'Exam Pins' },
        { id: 5, title: 'Betting', icon: 'football', color: '#F59E0B', description: 'Funding' },
        { id: 7, title: 'Transport', icon: 'bus', color: '#8B5CF6', description: 'Tickets' },
        { id: 11, title: 'Donations', icon: 'heart', color: '#EF4444', description: 'Charity' },
      ]
    },
    {
      category: 'Others',
      layout: 'list',
      items: [
        { id: 10, title: 'Government', icon: 'flag', color: '#6366F1', description: 'Taxes, Levies & Government Fees' },
        { id: 9, title: 'Vouchers', icon: 'card', color: '#14B8A6', description: 'Shopping Vouchers & Gift Pins' },
        { id: 13, title: 'Data Guides', icon: 'information-circle', color: '#64748B', description: 'Network Balance & Data Codes', route: '/data-guides' },
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

  const renderServiceItem = (item: any, layout: string) => {
    if (layout === 'grid') {
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.gridCard}
          activeOpacity={0.7}
          onPress={() => {
            if (item.route) {
              router.push(item.route);
            } else {
              showInfo(`${item.title} is coming soon!`);
            }
          }}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: item.color + '15' }]}>
            <Ionicons name={item.icon as any} size={24} color={item.color} />
          </View>
          <Text style={[styles.gridTitle, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.listCard, { backgroundColor: cardBg }]}
        activeOpacity={0.7}
        onPress={() => {
          if (item.route) {
            router.push(item.route);
          } else {
            showInfo(`${item.title} is coming soon!`);
          }
        }}
      >
        <View style={[styles.listIconCircle, { backgroundColor: item.color + '15' }]}>
          <Ionicons name={item.icon as any} size={22} color={item.color} />
        </View>
        <View style={styles.listInfo}>
          <Text style={[styles.listTitle, { color: textColor }]}>{item.title}</Text>
          <Text style={[styles.listDesc, { color: textSecondaryColor }]} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={textSecondaryColor} />
      </TouchableOpacity>
    );
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
          <Text style={[styles.headerTitle, { color: textColor }]}>Services</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: cardBg }]}>
          <Ionicons name="search" size={20} color={textSecondaryColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search for a service..."
            placeholderTextColor={textSecondaryColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={textSecondaryColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 }
        ]}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {filteredServices.map((category, catIndex) => (
            <View key={catIndex} style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: textSecondaryColor }]}>
                {category.category.toUpperCase()}
              </Text>
              <View style={category.layout === 'grid' ? styles.gridContainer : styles.listContainer}>
                {category.items.map((item) => renderServiceItem(item, category.layout))}
              </View>
            </View>
          ))}

          {filteredServices.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={cardBg} />
              <Text style={[styles.emptyText, { color: textSecondaryColor }]}>
                No services found for "{searchQuery}"
              </Text>
            </View>
          )}

          <View style={[styles.footer, { backgroundColor: cardBg }]}>
            <Ionicons name="sparkles" size={24} color={brandColor} />
            <Text style={[styles.footerText, { color: textColor }]}>
              More services coming soon
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    gap: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  categorySection: {
    marginTop: 24,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 16,
    paddingLeft: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: COLUMN_WIDTH,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  gridIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  listIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  listDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    marginTop: 40,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
