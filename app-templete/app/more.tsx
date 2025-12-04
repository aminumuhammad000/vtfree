import React from 'react';
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

export default function MoreScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#000000' : '#F9FAFB';
  const cardBgColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const textBodyColor = isDark ? '#D1D5DB' : '#6B7280';

  const services = [
    {
      id: 1,
      title: 'Cable TV',
      description: 'Subscribe to DSTV, GOTV, Startimes',
      icon: 'tv-outline',
      color: '#9333EA',
    },
    {
      id: 2,
      title: 'Electricity',
      description: 'Pay electricity bills easily',
      icon: 'flash-outline',
      color: '#EAB308',
    },
    {
      id: 3,
      title: 'Internet',
      description: 'Subscribe to internet plans',
      icon: 'globe-outline',
      color: '#06B6D4',
    },
    {
      id: 4,
      title: 'Education',
      description: 'Buy exam pins & scratch cards',
      icon: 'school-outline',
      color: '#10B981',
    },
    {
      id: 5,
      title: 'Betting',
      description: 'Fund betting wallets',
      icon: 'football-outline',
      color: '#F59E0B',
    },
    {
      id: 6,
      title: 'Insurance',
      description: 'Pay insurance premiums',
      icon: 'shield-checkmark-outline',
      color: '#3B82F6',
    },
    {
      id: 7,
      title: 'Transport',
      description: 'Book tickets & pay transport',
      icon: 'bus-outline',
      color: '#8B5CF6',
    },
    {
      id: 8,
      title: 'Gift Cards',
      description: 'Buy digital gift cards',
      icon: 'gift-outline',
      color: '#EC4899',
    },
    {
      id: 9,
      title: 'Vouchers',
      description: 'Purchase vouchers & pins',
      icon: 'card-outline',
      color: '#14B8A6',
    },
    {
      id: 10,
      title: 'Government',
      description: 'Pay government fees',
      icon: 'flag-outline',
      color: '#6366F1',
    },
    {
      id: 11,
      title: 'Donations',
      description: 'Make charitable donations',
      icon: 'heart-outline',
      color: '#EF4444',
    },
    {
      id: 12,
      title: 'Utilities',
      description: 'Water, waste & other utilities',
      icon: 'water-outline',
      color: '#0EA5E9',
    },
  ];

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
        <Text style={[styles.headerTitle, { color: textColor }]}>More Services</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Services Grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, { backgroundColor: cardBgColor }]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.serviceIcon,
                  {
                    backgroundColor: isDark
                      ? `${service.color}20`
                      : `${service.color}15`,
                  },
                ]}
              >
                <Ionicons
                  name={service.icon as any}
                  size={24}
                  color={service.color}
                />
              </View>
              <Text style={[styles.serviceTitle, { color: textColor }]}>
                {service.title}
              </Text>
              <Text style={[styles.serviceDescription, { color: textBodyColor }]}>
                {service.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming Soon Section */}
        <View style={[styles.comingSoonSection, { backgroundColor: cardBgColor }]}>
          <Ionicons name="rocket-outline" size={40} color={theme.accent} />
          <Text style={[styles.comingSoonTitle, { color: textColor }]}>
            More Services Coming Soon
          </Text>
          <Text style={[styles.comingSoonText, { color: textBodyColor }]}>
            We're constantly adding new services to make your life easier
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceCard: {
    width: '30%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  comingSoonSection: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
