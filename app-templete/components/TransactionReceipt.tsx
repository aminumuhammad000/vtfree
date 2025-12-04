import { useTheme } from '@/components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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

interface TransactionReceiptProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

const theme = {
  primary: '#0A2540',
  accent: '#FF9F43',
  success: '#00D4AA',
  error: '#FF5B5B',
  backgroundLight: '#F8F9FA',
  backgroundDark: '#111921',
  textHeadings: '#1E293B',
  textBody: '#475569',
};

export default function TransactionReceipt({ visible, transaction, onClose }: TransactionReceiptProps) {
  const { isDark } = useTheme();

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBgColor = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : theme.textHeadings;
  const textBodyColor = isDark ? '#9CA3AF' : theme.textBody;
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  if (!transaction) return null;

  const handleShare = async () => {
    try {
      const receiptText = `
Transaction Receipt
------------------
Service: ${transaction.name}
Phone: ${transaction.phone}
Amount: ${transaction.amount}
Status: ${transaction.status}
Date: ${transaction.date}
Transaction ID: ${transaction.transactionId || `TXN${transaction.id}${Date.now()}`}
Fee: ${transaction.fee || '₦0.00'}
Total: ${transaction.totalAmount || transaction.amount}

Thank you for using our service!
      `.trim();

      const result = await Share.share({
        message: receiptText,
        title: 'Transaction Receipt',
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Receipt shared successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return theme.success;
      case 'failed':
        return theme.error;
      case 'pending':
        return theme.accent;
      default:
        return textBodyColor;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Transaction Receipt</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Receipt Card */}
          <View style={[styles.receiptCard, { backgroundColor: cardBgColor, borderColor }]}>
            {/* Status Icon */}
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusIcon, 
                { backgroundColor: getStatusColor(transaction.status) + '20' }
              ]}>
                <Ionicons 
                  name={getStatusIcon(transaction.status) as any} 
                  size={48} 
                  color={getStatusColor(transaction.status)} 
                />
              </View>
              <Text style={[
                styles.statusText, 
                { color: getStatusColor(transaction.status) }
              ]}>
                {transaction.status}
              </Text>
            </View>

            {/* Transaction Details */}
            <View style={styles.detailsContainer}>
              <View style={[styles.detailRow, { borderBottomColor: borderColor }]}>
                <Text style={[styles.detailLabel, { color: textBodyColor }]}>Service</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{transaction.name}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: borderColor }]}>
                <Text style={[styles.detailLabel, { color: textBodyColor }]}>Phone Number</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{transaction.phone}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: borderColor }]}>
                <Text style={[styles.detailLabel, { color: textBodyColor }]}>Amount</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{transaction.amount}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: borderColor }]}>
                <Text style={[styles.detailLabel, { color: textBodyColor }]}>Transaction Fee</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {transaction.fee || '₦0.00'}
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: borderColor }]}>
                <Text style={[styles.detailLabel, { color: textBodyColor }]}>Total Amount</Text>
                <Text style={[styles.detailValue, styles.totalAmount, { color: textColor }]}>
                  {transaction.totalAmount || transaction.amount}
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: borderColor }]}>
                <Text style={[styles.detailLabel, { color: textBodyColor }]}>Date & Time</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{transaction.date}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: textBodyColor }]}>Transaction ID</Text>
                <Text style={[styles.detailValue, styles.transactionId, { color: theme.primary }]}>
                  {transaction.transactionId || `TXN${transaction.id}${Date.now().toString().slice(-6)}`}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: borderColor }]}>
              <Text style={[styles.footerText, { color: textBodyColor }]}>
                Thank you for using our service!
              </Text>
              <Text style={[styles.footerSubtext, { color: textBodyColor }]}>
                Keep this receipt for your records
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Share Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton, { borderColor }]}
              onPress={onClose}
            >
              <Ionicons name="close-outline" size={20} color={textColor} />
              <Text style={[styles.actionButtonText, { color: textColor }]}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  receiptCard: {
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsContainer: {
    paddingHorizontal: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  transactionId: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    marginTop: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});