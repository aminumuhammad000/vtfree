import { useAlert } from '@/components/AlertContext';
import { authService } from '@/services/auth.service';
import { payrantService, VirtualAccountResponse } from '@/services/payrant.service';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

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

export default function AddMoneyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showSuccess, showError, showInfo } = useAlert();

  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccountResponse[]>([]);
  const [isLoadingVirtualAccount, setIsLoadingVirtualAccount] = useState(true);
  const [isCreatingVirtualAccount, setIsCreatingVirtualAccount] = useState(false);

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
  }, [isLoadingVirtualAccount]);

  useEffect(() => {
    loadVirtualAccounts();
  }, []);

  const loadVirtualAccounts = useCallback(async () => {
    try {
      setIsLoadingVirtualAccount(true);
      const response = await payrantService.getVirtualAccount();

      if (Array.isArray(response)) {
        setVirtualAccounts(response);
      } else if (response && 'exists' in response && !response.exists) {
        setVirtualAccounts([]);
      } else {
        setVirtualAccounts([]);
      }
    } catch (error: any) {
      console.error('Error loading virtual accounts:', error);
      setVirtualAccounts([]);
    } finally {
      setIsLoadingVirtualAccount(false);
    }
  }, []);

  const handleCreateVirtualAccount = async (recreate: boolean = false) => {
    try {
      setIsCreatingVirtualAccount(true);
      showInfo('Generating your virtual account...');

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
        recreate,
      };

      await payrantService.createVirtualAccount(accountData);
      showSuccess('Virtual account generated successfully!');

      // Reload accounts
      setTimeout(() => {
        loadVirtualAccounts();
      }, 2000);
    } catch (error: any) {
      showError(error.message || 'Failed to generate virtual account');
    } finally {
      setIsCreatingVirtualAccount(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    showInfo(`${label} copied!`);
  };

  const shareAccountDetails = (account: VirtualAccountResponse) => {
    const message = `My ${account.bank_name || 'Bank'} Account Details:\n\n` +
      `Account Number: ${account.account_number}\n` +
      `Account Name: ${account.account_name}\n` +
      `Bank: ${account.bank_name || 'Bank'}`;

    try {
      Share.share({ message, title: 'My Account Details' });
    } catch (error) {
      showError('Failed to share details');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: cardBg }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Add Money</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoadingVirtualAccount ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={[styles.loadingText, { color: textSecondaryColor }]}>Fetching account details...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Bank Transfer</Text>
              <Text style={[styles.sectionSubtitle, { color: textSecondaryColor }]}>
                Transfer money to any of your dedicated accounts below to fund your wallet instantly.
              </Text>
            </View>

            {virtualAccounts.length > 0 ? (
              <View style={styles.accountList}>
                {virtualAccounts.map((account, index) => (
                  <View key={index} style={[styles.accountCard, { backgroundColor: cardBg }]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.bankLogo, { backgroundColor: index === 0 ? brandColor : index === 1 ? '#FFFC00' : '#00D166' }]}>
                        <Ionicons name="business" size={24} color={index === 1 ? "#000" : "#FFF"} />
                      </View>
                      <View style={styles.bankInfo}>
                        <Text style={[styles.bankName, { color: textColor }]}>{account.bank_name || 'Bank'}</Text>
                        <Text style={[styles.accountName, { color: textSecondaryColor }]}>{account.account_name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => shareAccountDetails(account)}
                      >
                        <Ionicons name="share-outline" size={20} color={brandColor} />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.numberContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Text style={[styles.accountNumber, { color: textColor }]}>{account.account_number}</Text>
                      <TouchableOpacity
                        style={[styles.copyBtn, { backgroundColor: brandColor }]}
                        onPress={() => copyToClipboard(account.account_number, 'Account number')}
                      >
                        <Text style={styles.copyBtnText}>Copy</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: '#00D166' }]} />
                        <Text style={[styles.statusText, { color: '#00D166' }]}>Active & Instant</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            'Refresh Account',
                            'Do you want to regenerate this virtual account?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Regenerate', onPress: () => handleCreateVirtualAccount(true) }
                            ]
                          );
                        }}
                      >
                        <Text style={[styles.refreshText, { color: brandColor }]}>Refresh</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {virtualAccounts.length < 3 && (
                  <TouchableOpacity
                    style={[styles.addAnotherBtn, { borderColor: brandColor }]}
                    onPress={() => handleCreateVirtualAccount()}
                    disabled={isCreatingVirtualAccount}
                  >
                    {isCreatingVirtualAccount ? (
                      <ActivityIndicator color={brandColor} />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={24} color={brandColor} />
                        <Text style={[styles.addAnotherText, { color: brandColor }]}>Generate Another Bank Account</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: brandColor + '15' }]}>
                  <Ionicons name="wallet-outline" size={40} color={brandColor} />
                </View>
                <Text style={[styles.emptyTitle, { color: textColor }]}>No Virtual Account Yet</Text>
                <Text style={[styles.emptyDesc, { color: textSecondaryColor }]}>
                  Generate a dedicated virtual account to receive instant payments from any bank.
                </Text>
                <TouchableOpacity
                  style={[styles.generateBtn, { backgroundColor: brandColor }]}
                  onPress={() => handleCreateVirtualAccount()}
                  disabled={isCreatingVirtualAccount}
                >
                  {isCreatingVirtualAccount ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={20} color="#FFF" />
                      <Text style={styles.generateBtnText}>Generate Account</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.tipBox, { backgroundColor: brandColor + '10' }]}>
              <Ionicons name="information-circle" size={20} color={brandColor} />
              <Text style={[styles.tipText, { color: textColor }]}>
                Funds transferred to any of these accounts will reflect in your wallet within seconds.
              </Text>
            </View>

          </Animated.View>
        </ScrollView>
      )}
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
    paddingBottom: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    lineHeight: 20,
  },
  accountList: {
    gap: 16,
  },
  accountCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bankLogo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '800',
  },
  accountName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  accountNumber: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  copyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  copyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 12,
    marginTop: 8,
  },
  addAnotherText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    gap: 16,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 8,
    marginTop: 8,
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tipBox: {
    marginTop: 32,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});