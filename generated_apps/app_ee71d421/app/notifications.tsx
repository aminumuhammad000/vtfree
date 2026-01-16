import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  const notifications = [
    {
      id: 1,
      title: 'Transaction Successful',
      message: 'Your airtime purchase of ₦500 was successful',
      time: '2 minutes ago',
      icon: 'checkmark-circle',
      iconColor: '#10B981',
      unread: true,
    },
    {
      id: 2,
      title: 'Wallet Funded',
      message: 'Your wallet has been credited with ₦10,000',
      time: '1 hour ago',
      icon: 'wallet',
      iconColor: '#FF9F43',
      unread: true,
    },
    {
      id: 3,
      title: 'Payment Failed',
      message: 'Your DSTV subscription payment failed. Please try again',
      time: '3 hours ago',
      icon: 'close-circle',
      iconColor: '#EF4444',
      unread: false,
    },
    {
      id: 4,
      title: 'New Promotion',
      message: 'Get 20% bonus on all data purchases this weekend!',
      time: 'Yesterday',
      icon: 'gift',
      iconColor: '#8B5CF6',
      unread: false,
    },
    {
      id: 5,
      title: 'Transaction Successful',
      message: 'You purchased 5GB data for ₦1,500',
      time: '2 days ago',
      icon: 'checkmark-circle',
      iconColor: '#10B981',
      unread: false,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Notifications</Text>
        <TouchableOpacity style={styles.markAllBtn}>
          <Text style={[styles.markAllText, { color: theme.accent }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.notificationsList}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                { backgroundColor: notification.unread ? (isDark ? '#1F2937' : '#F0F9FF') : cardBg }
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.notificationIcon, { backgroundColor: `${notification.iconColor}20` }]}>
                <Ionicons name={notification.icon as any} size={24} color={notification.iconColor} />
              </View>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={[styles.notificationTitle, { color: textColor }]}>
                    {notification.title}
                  </Text>
                  {notification.unread && (
                    <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />
                  )}
                </View>
                <Text style={[styles.notificationMessage, { color: textBodyColor }]} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={[styles.notificationTime, { color: textBodyColor }]}>
                  {notification.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  markAllBtn: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationsList: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
});
