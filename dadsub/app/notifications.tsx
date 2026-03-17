import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeContext';
import { notificationsService, Notification } from '@/services/notifications.service';

const getIconForType = (type: string): { icon: string; color: string } => {
  switch (type) {
    case 'transaction': return { icon: 'receipt', color: '#10B981' };
    case 'promotion': return { icon: 'gift', color: '#8B5CF6' };
    case 'alert': return { icon: 'alert-circle', color: '#EF4444' };
    case 'system':
    default: return { icon: 'information-circle', color: '#00ADFF' };
  }
};

const timeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { isDark, theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bgColor = isDark ? '#111921' : '#F8F9FA';
  const textColor = isDark ? '#FFFFFF' : '#1E293B';
  const textBodyColor = isDark ? '#9CA3AF' : '#475569';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const unreadBg = isDark ? '#1a2a3a' : '#F0F9FF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const loadNotifications = useCallback(async () => {
    try {
      setError(null);
      const response = await notificationsService.getNotifications(1, 50);
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (err: any) {
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={[styles.markAllText, { color: theme.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: textBodyColor }]}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={[styles.errorIcon, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="warning-outline" size={32} color="#EF4444" />
          </View>
          <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={() => { setLoading(true); loadNotifications(); }}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="notifications-off-outline" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: textColor }]}>No Notifications</Text>
          <Text style={[styles.emptySubtitle, { color: textBodyColor }]}>
            You're all caught up! We'll notify you when something new happens.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          <View style={styles.notificationsList}>
            {notifications.map((notification) => {
              const { icon, color } = getIconForType(notification.type);
              return (
                <TouchableOpacity
                  key={notification._id}
                  style={[
                    styles.notificationItem,
                    {
                      backgroundColor: !notification.is_read ? unreadBg : cardBg,
                      borderColor: !notification.is_read ? theme.primary + '30' : borderColor,
                    }
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleMarkAsRead(notification._id)}
                >
                  <View style={[styles.notificationIcon, { backgroundColor: `${color}20` }]}>
                    <Ionicons name={icon as any} size={24} color={color} />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[styles.notificationTitle, { color: textColor }]} numberOfLines={1}>
                        {notification.title}
                      </Text>
                      {!notification.is_read && (
                        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                      )}
                    </View>
                    <Text style={[styles.notificationMessage, { color: textBodyColor }]} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <View style={styles.notificationMeta}>
                      <View style={[styles.typeBadge, { backgroundColor: color + '15' }]}>
                        <Text style={[styles.typeText, { color }]}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </Text>
                      </View>
                      <Text style={[styles.notificationTime, { color: textBodyColor }]}>
                        {timeAgo(notification.created_at)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, width: 40 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  markAllBtn: { padding: 8, width: 80, alignItems: 'flex-end' },
  markAllText: { fontSize: 13, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
  errorIcon: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  errorText: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  retryBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  retryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  notificationsList: { paddingHorizontal: 16, marginTop: 12, gap: 10 },
  notificationItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
  },
  notificationIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  notificationContent: { flex: 1 },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8, flexShrink: 0 },
  notificationMessage: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  notificationMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '700' },
  notificationTime: { fontSize: 12 },
});
