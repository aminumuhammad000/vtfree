import { useAlert } from '@/components/AlertContext';
import { authService } from '@/services/auth.service';
import { paymentService } from '@/services/payment.service';
import { payrantService, VirtualAccountResponse } from '@/services/payrant.service';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';

// Constants
const THEME = {
  primary: '#0A2540',
  accent: '#FF9F43',
  success: '#00D4AA',
  error: '#FF5B5B',
  dark: {
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    textMuted: '#D1D5DB',
    border: '#374151'
  },
  light: {
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#1F2937',
    textMuted: '#6B7280',
    border: '#E5E7EB'
  }
};

// Types
type PaymentMethod = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
};

type QuickAmount = {
  amount: number;
  label: string;
};

export default function AddMoneyScreen() {
  // Hooks
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showSuccess, showError, showInfo } = useAlert();

  // State
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('payrant');
  const [userName, setUserName] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccountResponse | null>(null);
  const [isLoadingVirtualAccount, setIsLoadingVirtualAccount] = useState(true);
  const [isCreatingVirtualAccount, setIsCreatingVirtualAccount] = useState(false);

  // Theme colors
  const theme = isDark ? THEME.dark : THEME.light;
  const quickAmounts: QuickAmount[] = [
    { amount: 1000, label: '₦1,000' },
    { amount: 2000, label: '₦2,000' },
    { amount: 5000, label: '₦5,000' },
    { amount: 10000, label: '₦10,000' },
    { amount: 20000, label: '₦20,000' },
    { amount: 50000, label: '₦50,000' }
  ];

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'virtual',
      name: 'Virtual Account',
      description: 'Your dedicated account number',
      icon: 'wallet-outline',
      color: '#06B6D4',
    },
    {
      id: 'payrant',
      name: 'Payrant Checkout',
      description: 'Quick checkout (Recommended)',
      icon: 'flash-outline',
      color: '#10B981',
    },
    {
      id: 'monnify',
      name: 'Card/Bank Transfer',
      description: 'Pay with card or bank',
      icon: 'card-outline',
      color: '#8B5CF6',
    },
  ];

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toUpperCase();
          setUserName(fullName || 'USER');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
    loadVirtualAccount();
  }, []);

  const loadVirtualAccount = useCallback(async () => {
    try {
      setIsLoadingVirtualAccount(true);
      
      const response = await payrantService.getVirtualAccount();
      console.log('📥 [AddMoney] Virtual account response:', response);
      
      if (!response || (typeof response === 'object' && 'exists' in response && !response.exists)) {
        console.log('ℹ️ [AddMoney] No virtual account found - will show create button');
        setVirtualAccount(null);
        setIsLoadingVirtualAccount(false);
        return;
      }
      
      const responseData = (response as any)?.data?.data || response;
      
      if (responseData && 'account_number' in responseData) {
        const va = responseData as VirtualAccountResponse;
        const formattedAccount = formatVirtualAccount(va);
        console.log('✅ [AddMoney] Virtual account loaded:', formattedAccount);
        setVirtualAccount(formattedAccount);
      } else {
        console.warn('⚠️ [AddMoney] Unexpected response format:', response);
        setVirtualAccount(null);
      }
    } catch (error: any) {
      console.error('❌ [AddMoney] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setVirtualAccount(null);
      showError('Failed to load virtual account. Please try again.');
    } finally {
      setIsLoadingVirtualAccount(false);
    }
  }, [showError]);

  // Format virtual account data
  const formatVirtualAccount = (va: any) => {
    // Handle nested data structure from API
    const accountData = va?.data?.data || va?.data || va;
    const bankName = 'PALMPAY';
    return {
      account_number: accountData.account_number || accountData.virtualAccountNo,
      account_name: accountData.account_name || accountData.virtualAccountName || accountData.customerName,
      bank_name: bankName || accountData.bank_name,
      account_reference: accountData.account_reference || accountData.reference,
      status: accountData.status || 'active',
      provider: accountData.provider || 'payrant',
      customerName: accountData.customerName || accountData.account_name,
      virtualAccountName: accountData.virtualAccountName || accountData.account_name,
      virtualAccountNo: accountData.virtualAccountNo || accountData.account_number,
      isActive: (accountData.status || 'active').toLowerCase() === 'active',
      reference: accountData.account_reference || accountData.reference
    };
  };

  // Handle virtual account creation
  const handleCreateVirtualAccount = async () => {
    try {
      setIsCreatingVirtualAccount(true);
      showInfo('Creating your virtual account. This may take a moment...');

      const user = await authService.getCurrentUser();
      if (!user) {
        showError('Please login again to continue');
        return;
      }

      const accountReference = `${user._id}-${Date.now().toString(36)}`;
      const accountData = {
        documentType: 'nin',
        documentNumber: user.phone_number,
        virtualAccountName: `${user.first_name} ${user.last_name}`,
        customerName: `${user.first_name} ${user.last_name}`,
        email: user.email,
        accountReference,
      };

      console.log('📤 Creating virtual account with data:', accountData);

      // Retry logic
      let retryCount = 0;
      const maxRetries = 2;
      let lastError: any = null;

      while (retryCount <= maxRetries) {
        try {
          const response = await payrantService.createVirtualAccount(accountData);
          const formattedAccount = formatVirtualAccount(response);
          
          console.log('✅ Virtual account created:', formattedAccount);
          setVirtualAccount(formattedAccount);
          showSuccess('Virtual account created successfully!');
          
          // Reload virtual account after short delay to ensure backend is updated
          setTimeout(() => {
            loadVirtualAccount();
          }, 2000);
          
          return;
        } catch (error: any) {
          lastError = error;
          retryCount++;
          
          if (retryCount <= maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError || new Error('Failed to create virtual account');
    } catch (error: any) {
      console.error('❌ Error creating virtual account:', error);
      
      let errorMessage = 'Failed to create virtual account';
      if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    } finally {
      setIsCreatingVirtualAccount(false);
    }
  };

  // Handle payment
  const handleAddMoney = async () => {
    if (!amount || !selectedMethod) {
      showError('Please enter amount and select payment method');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (amountNum < 100) {
      showError('Minimum amount is ₦100');
      return;
    }

    if (amountNum > 1000000) {
      showError('Maximum amount is ₦1,000,000');
      return;
    }

    if (selectedMethod === 'virtual') {
      showInfo('Transfer to the virtual account above to fund your wallet');
      return;
    }

    setIsLoading(true);

    try {
      showInfo(`Initializing ${selectedMethod} payment...`);
      
      const response = await paymentService.initiatePayment({
        amount: amountNum,
        gateway: selectedMethod as "payrant" | "monnify" | "apystack",
      });

      if (response.success) {
        const checkoutUrl = response.data.payment?.checkoutUrl;
        const paymentReference = response.data.transaction?.reference;

        if (!checkoutUrl) {
          throw new Error('Invalid payment URL');
        }

        console.log(`💳 Opening ${selectedMethod} checkout:`, checkoutUrl);
        const result = await WebBrowser.openBrowserAsync(checkoutUrl);

        if (result.type === 'cancel' || result.type === 'dismiss') {
          await verifyPaymentStatus(paymentReference);
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      showError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify payment status
  const verifyPaymentStatus = async (reference: string) => {
    try {
      showInfo('Verifying payment status...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const verifyResponse = await paymentService.verifyPayment(reference);
      
      if (verifyResponse.success && verifyResponse.data.status === 'paid') {
        showSuccess('Payment successful! Your wallet has been credited.');
        setTimeout(() => router.replace('/(tabs)'), 1500);
      } else if (verifyResponse.data.status === 'pending') {
        showInfo('Payment is being processed. We will notify you once confirmed.');
        setTimeout(() => router.back(), 2000);
      } else {
        showError('Payment was not completed. Please try again.');
      }
    } catch (verifyError: any) {
      console.error('Verification error:', verifyError);
      showInfo('We are verifying your payment. Please check your wallet in a few moments.');
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showInfo(`${label} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy:', error);
      showError('Failed to copy to clipboard');
    }
  };

  // Share account details
  const shareAccountDetails = async () => {
    if (!virtualAccount) return;
    
    const message = `My ${virtualAccount.bank_name} Account Details:\n\n` +
                   `Account Number: ${virtualAccount.account_number}\n` +
                   `Account Name: ${virtualAccount.account_name}\n` +
                   `Bank: ${virtualAccount.bank_name || 'PALMPAY'}`;

    try {
      await Share.share({
        message,
        title: 'My Account Details'
      });
    } catch (error) {
      console.error('Error sharing:', error);
      showError('Failed to share account details');
    }
  };

  // Format amount with commas
  const formatAmount = (value: string) => {
    const num = value.replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Handle amount input
  const handleAmountChange = (text: string) => {
    const formatted = formatAmount(text);
    setAmount(formatted);
  };

  // Render loading state
  if (isLoadingVirtualAccount) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading your account information...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Money</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Virtual Account Section */}
        {isLoadingVirtualAccount ? (
          <View style={[styles.loadingContainer, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={THEME.accent} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading your account information...
            </Text>
          </View>
        ) : virtualAccount?.account_number ? (
          <View style={[styles.atmCard, { backgroundColor: THEME.primary }]}>
            <View style={styles.atmCardHeader}>
              <View style={styles.atmCardChip}>
                <Ionicons name="card" size={28} color="#FFD700" />
              </View>
              <Text style={styles.atmCardBank}>
                {virtualAccount.bank_name || 'PALMPAY'}
              </Text>
            </View>

            <View style={styles.atmAccountSection}>
              <Text style={styles.atmLabel}>ACCOUNT NUMBER</Text>
              <View style={styles.atmAccountNumberRow}>
                <Text style={styles.atmAccountNumber}>
                  {virtualAccount.account_number}
                </Text>
                <TouchableOpacity 
                  style={styles.atmCopyButton}
                  onPress={() => copyToClipboard(virtualAccount.account_number, 'Account number')}
                >
                  <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.atmBankSection}>
              <Text style={styles.atmLabel}>ACCOUNT NAME</Text>
              <Text style={styles.atmAccountName}>
                {virtualAccount.account_name}
              </Text>
            </View>

            <View style={styles.atmCardFooter}>
              <View style={styles.atmStatusBadge}>
                <Ionicons 
                  name={virtualAccount.status === 'active' ? "checkmark-circle" : "alert-circle"} 
                  size={14} 
                  color={virtualAccount.status === 'active' ? "#00D4AA" : "#FF5B5B"} 
                />
                <Text style={[
                  styles.atmStatusText,
                  { color: virtualAccount.status === 'active' ? "#00D4AA" : "#FF5B5B" }
                ]}>
                  {virtualAccount.status ? virtualAccount.status.toUpperCase() : 'ACTIVE'}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.atmShareButton}
                onPress={shareAccountDetails}
              >
                <Ionicons name="share-social" size={16} color="#FFFFFF" />
                <Text style={styles.atmShareText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.noAccountCard, { backgroundColor: theme.card }]}>
            <Ionicons 
              name="wallet-outline" 
              size={64} 
              color={theme.textMuted} 
              style={styles.noAccountIcon}
            />
            <Text style={[styles.noAccountTitle, { color: theme.text }]}>
              No Virtual Account
            </Text>
            <Text style={[styles.noAccountText, { color: theme.textMuted }]}>
              Create a virtual account to receive instant deposits
            </Text>
            <TouchableOpacity
              style={[styles.createAccountButton, { backgroundColor: THEME.accent }]}
              onPress={handleCreateVirtualAccount}
              disabled={isCreatingVirtualAccount}
            >
              {isCreatingVirtualAccount ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.createAccountButtonText}>Creating...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.createAccountButtonText}>Generate Virtual Account</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Amount Input */}
        <View style={[styles.amountSection, { backgroundColor: theme.card }]}>
          <Text style={[styles.amountLabel, { color: theme.text }]}>Enter Amount (₦)</Text>
          <View style={styles.amountInputContainer}>
            <Text style={[styles.currencySymbol, { color: theme.text }]}>₦</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
              selectionColor={THEME.accent}
            />
          </View>

          <View style={styles.quickAmounts}>
            {quickAmounts.map((item) => (
              <TouchableOpacity
                key={item.amount}
                style={[
                  styles.quickAmountButton,
                  { 
                    backgroundColor: theme.background,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => setAmount(item.amount.toString())}
              >
                <Text style={[styles.quickAmountText, { color: theme.text }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Payment Method
          </Text>
          <View style={styles.paymentMethodsList}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: selectedMethod === method.id ? method.color : theme.border,
                  },
                ]}
                onPress={() => setSelectedMethod(method.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.paymentMethodIcon,
                    { backgroundColor: `${method.color}20` },
                  ]}
                >
                  <Ionicons
                    name={method.icon as any}
                    size={24}
                    color={method.color}
                  />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={[styles.paymentMethodName, { color: theme.text }]}>
                    {method.name}
                  </Text>
                  <Text style={[styles.paymentMethodDescription, { color: theme.textMuted }]}>
                    {method.description}
                  </Text>
                </View>
                {selectedMethod === method.id && (
                  <View style={[styles.checkMark, { backgroundColor: method.color }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Money Button */}
        <TouchableOpacity
          style={[
            styles.addMoneyButton,
            { 
              backgroundColor: THEME.accent,
              opacity: (!amount || isLoading) ? 0.7 : 1
            }
          ]}
          onPress={handleAddMoney}
          disabled={!amount || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.addMoneyButtonText}>
              Add ₦{amount || '0.00'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <View style={[styles.infoBox, { backgroundColor: `${THEME.accent}15` }]}>
          <Ionicons 
            name="information-circle" 
            size={20} 
            color={THEME.accent} 
            style={styles.infoIcon}
          />
          <Text style={[styles.infoText, { color: theme.text }]}>
            {selectedMethod === 'virtual' 
              ? 'Transfer to your virtual account to fund your wallet instantly'
              : 'Complete the payment to add money to your wallet'}
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
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // Virtual Account Card Styles
  atmCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  atmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  atmCardChip: {
    width: 40,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  atmCardBank: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.9,
  },
  atmAccountSection: {
    marginBottom: 20,
  },
  atmLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  atmAccountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  atmAccountNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
  },
  atmBankSection: {
    marginBottom: 24,
  },
  atmAccountName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  atmCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  atmStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  atmStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  atmCopyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 12,
  },
  atmShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  atmShareText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  // No Account Card
  noAccountCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noAccountIcon: {
    marginBottom: 12,
    opacity: 0.8,
  },
  noAccountTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  noAccountText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Amount Section
  amountSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
    padding: 0,
    height: 40,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 8,
  },
  quickAmountButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Payment Methods
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  paymentMethodsList: {
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentMethodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentMethodDescription: {
    fontSize: 13,
    opacity: 0.8,
  },
  checkMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Add Money Button
  addMoneyButton: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addMoneyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Info Box
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});