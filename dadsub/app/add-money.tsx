import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
  Pressable,
  Image,
  Share,
  Alert,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { vtpayService, VTPayAccount } from '@/services/vtpay.service';
import { useAlert } from '@/components/AlertContext';
import { useTheme } from '@/components/ThemeContext';
import { useProfile } from '@/components/ProfileContext';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Layout
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const BANKS = [
  {
    id: 'palmpay',
    name: 'PalmPay',
    logo: '', // Logo handled by icon
    color: '#6f33cf',
    icon: 'wallet',
    description: 'Instant funding via PalmPay virtual account. Fast and reliable.'
  }
];

export default function AddMoneyScreen() {
  const router = useRouter();
  const { isDark, theme } = useTheme();
  const { profileData, refreshProfile } = useProfile();
  const { showSuccess, showError, showInfo, showWarning } = useAlert();

  const [virtualAccounts, setVirtualAccounts] = useState<VTPayAccount[]>([]);
  const [gateway, setGateway] = useState<string>('vtstack');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [showBVNModal, setShowBVNModal] = useState(false);
  const [bvnInput, setBvnInput] = useState('');
  const [isSubmittingBVN, setIsSubmittingBVN] = useState(false);

  const bgColor = theme.background;
  const textColor = theme.text;
  const textSecondaryColor = theme.textSecondary;
  const cardBg = theme.surface;
  const brandColor = theme.primary;

  const modalScale = useSharedValue(0);

  useEffect(() => {
    loadVirtualAccounts();
  }, []);

  const loadVirtualAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await vtpayService.getVirtualAccounts();
      if (res.success) {
        setVirtualAccounts(res.data);
        if (res.gateway) {
          setGateway(res.gateway);
        }
      }
    } catch (error: any) {
      console.error('Error loading accounts:', error);
      Alert.alert(
        'Unable to Load Accounts',
        error.message || 'Could not fetch your virtual accounts.',
        [
          { text: 'Retry', onPress: () => loadVirtualAccounts() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const closeBankModal = () => {
    setShowBankModal(false);
    setSelectedBankId(null);
  };

  const confirmGenerateAccount = (bank: any) => {
    setSelectedBankId(bank.id);
    Haptics.selectionAsync();
  };

  const handleGenerateAccount = async (bankType: string) => {
    // REMOVED: kyc_status !== 'verified' check as per user request
    // Users can now generate virtual accounts even if not verified, but MUST have BVN

    const currentBVN = profileData.bvn || bvnInput;

    if (!currentBVN) {
      closeBankModal();
      setShowBVNModal(true);
      return;
    }

    if (currentBVN.length !== 11) {
      showError('Please provide a valid 11-digit BVN.');
      return;
    }

    try {
      closeBankModal();
      setShowBVNModal(false);
      setIsGenerating(true);
      setGenerationStep('Validating identity...');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      await new Promise(resolve => setTimeout(resolve, 800));
      setGenerationStep('Contacting PalmPay...');

      // bankType is ignored by backend, but we pass it compliant with interface
      // We also pass the BVN in case it's not yet saved in the user's profile on the backend
      const res = await vtpayService.createVirtualAccount({
        bankType: 'palmpay',
        bvn: currentBVN
      });

      await new Promise(resolve => setTimeout(resolve, 800));
      setGenerationStep('Securing Account Details...');

      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess(`Great! Your PalmPay account has been linked to your wallet.`);
        loadVirtualAccounts();
        refreshProfile();
        setBvnInput(''); // Reset input
      } else {
        showError(res.message || 'Failed to create account. Please try again.');
      }
    } catch (error: any) {
      console.error('Generation Error:', error);
      showError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const shareAccountDetails = (account: VTPayAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = `Fund my wallet via Bank Transfer:\n\nBank: ${account.bankName}\nAccount: ${account.accountNumber}\nName: ${account.accountName}`;
    Share.share({ message });
  };

  const openBankModal = () => {
    // Check if user already has PalmPay (or any VTStack account)
    const hasAccount = virtualAccounts.some(acc =>
      acc.bankName.toLowerCase().includes('palmpay') ||
      acc.metadata?.bankType === 'palmpay'
    );

    if (hasAccount) {
      showInfo('You already have a generated account.');
      return;
    }

    setSelectedBankId('palmpay');
    setShowBankModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    modalScale.value = withSpring(1);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: cardBg }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>Add Money</Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: cardBg }]}
          onPress={loadVirtualAccounts}
        >
          <Ionicons name="refresh" size={20} color={brandColor} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600).springify()}>
          <View style={styles.heroSection}>
            <Text style={[styles.heroText, { color: textColor }]}>Fund Wallet</Text>
            <Text style={[styles.heroSub, { color: textSecondaryColor }]}>
              Receive instant transfers into any of your dedicated bank accounts below.
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator color={brandColor} size="large" />
              <Text style={[styles.loadingTxt, { color: textSecondaryColor }]}>Loading your accounts...</Text>
            </View>
          ) : virtualAccounts.length > 0 ? (
            <View style={styles.accountList}>
              {virtualAccounts.map((account, index) => {
                // Find bank config for color/icon
                const bankId = account.metadata?.bankType || account.bankName.toLowerCase();
                const bankConfig = BANKS.find(b => b.id === bankId) || BANKS.find(b => b.name.toLowerCase() === account.bankName.toLowerCase()) || BANKS[0];
                const bankColor = bankConfig?.color || brandColor;

                return (
                  <Animated.View
                    key={account.id}
                    entering={FadeInUp.delay(index * 100).springify()}
                  >
                    <View style={[styles.accountCard, { backgroundColor: cardBg, borderColor: bankColor + '30' }]}>
                      {/* Decorative Background Element */}
                      <View style={[styles.cardDecor, { backgroundColor: bankColor }]} />

                      <View style={styles.cardHeader}>
                        <View style={styles.bankIdentity}>
                          <View style={[styles.bankIconCircle, { backgroundColor: bankColor + '15', width: 40, height: 40 }]}>
                            <MaterialCommunityIcons name={bankConfig?.icon as any || 'bank'} size={20} color={bankColor} />
                          </View>
                          <View>
                            <Text style={[styles.bankNameHeader, { color: textColor }]}>{account.bankName}</Text>
                            <Text style={[styles.accountLabelSmall, { color: textSecondaryColor }]}>Savings Account</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[styles.shareBtn, { backgroundColor: theme.background }]}
                          onPress={() => shareAccountDetails(account)}
                        >
                          <Ionicons name="share-social" size={18} color={textColor} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.accountMain}>
                        <Text style={[styles.accountLabel, { color: textSecondaryColor, marginBottom: 4 }]}>ACCOUNT NUMBER</Text>
                        <View style={styles.numberRow}>
                          <Text style={[styles.accountNum, { color: textColor }]}>
                            {account.accountNumber.match(/.{1,4}/g)?.join(' ')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardFooter}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.accountLabel, { color: textSecondaryColor, marginBottom: 2 }]}>BENEFICIARY</Text>
                          <Text
                            style={[styles.accountName, { color: textColor }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {account.accountName}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.copyBtn, { backgroundColor: bankColor }]}
                          onPress={() => copyToClipboard(account.accountNumber, 'Account Number')}
                        >
                          <Ionicons name="copy" size={14} color="#FFF" />
                          <Text style={styles.copyBtnText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}

              {virtualAccounts.length < BANKS.length && (
                <TouchableOpacity style={styles.addMoreBtn} onPress={openBankModal}>
                  <View style={[styles.addMoreIcon, { backgroundColor: brandColor + '15' }]}>
                    <Ionicons name="add" size={24} color={brandColor} />
                  </View>
                  <Text style={[styles.addMoreText, { color: textColor }]}>Generate another bank account</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Animated.View
              entering={ZoomIn.duration(500)}
              style={[styles.emptyContainer, { backgroundColor: cardBg }]}
            >
              <View style={styles.emptyContent}>
                <View style={[styles.emptyIconBox, { backgroundColor: brandColor + '10' }]}>
                  <MaterialCommunityIcons
                    name="bank-plus"
                    size={60}
                    color={brandColor}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: textColor }]}>Ready to Fund?</Text>
                <Text style={[styles.emptyDesc, { color: textSecondaryColor }]}>
                  Generate a professional virtual account unique to you and receive payments instantly from across Nigeria.
                </Text>
                <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: brandColor }]} onPress={openBankModal}>
                  <Text style={styles.ctaBtnText}>Generate My Account</Text>
                  <Ionicons name="flash" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          <View style={[styles.hintCard, { backgroundColor: brandColor + '08' }]}>
            <View style={[styles.hintIcon, { backgroundColor: brandColor }]}>
              <Ionicons name="bulb-outline" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hintTitle, { color: textColor }]}>Quick Tip</Text>
              <Text style={[styles.hintDesc, { color: textColor, opacity: 0.7 }]}>
                All bank transfers are processed automatically. Please ensure you use the exact account details shown above.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Modal visible={showBankModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={closeBankModal} />
          <Animated.View
            entering={SlideInDown.duration(400).springify()}
            style={[styles.modalBox, { backgroundColor: theme.surface, maxHeight: '85%' }]}
          >
            <View style={styles.modalIndi} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Choose Your Bank</Text>
                <Text style={[styles.modalSub, { color: textSecondaryColor }]}>Select your preferred bank provider for virtual account generation.</Text>
              </View>

              <View style={styles.bankGrid}>
                {BANKS.map((bank) => (
                  <TouchableOpacity
                    key={bank.id}
                    style={[
                      styles.bankGridItem,
                      { backgroundColor: cardBg },
                      selectedBankId === bank.id && { borderColor: brandColor, borderWidth: 2, backgroundColor: brandColor + '10' }
                    ]}
                    onPress={() => confirmGenerateAccount(bank)}
                  >
                    <View style={[
                      styles.bankIconCircle,
                      { backgroundColor: selectedBankId === bank.id ? brandColor : (isDark ? '#222' : '#F5F5F5'), width: 64, height: 64, borderRadius: 32 }
                    ]}>
                      <MaterialCommunityIcons
                        name={bank.icon as any}
                        size={32}
                        color={selectedBankId === bank.id ? '#FFF' : brandColor}
                      />
                    </View>
                    <Text style={[styles.bankGridName, { color: selectedBankId === bank.id ? brandColor : textColor }]}>{bank.name}</Text>
                    <View style={[styles.recBadge, { backgroundColor: theme.primary + '20', position: 'absolute', top: 5, right: 5, marginLeft: 0 }]}>
                      <Text style={[styles.recBadgeText, { color: theme.primary, fontSize: 8 }]}>NEW</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedBankId && (
                <View style={[styles.bankDetailBox, { backgroundColor: theme.background }]}>
                  <Text style={[styles.bankDetailTitle, { color: textColor }]}>
                    {BANKS.find(b => b.id === selectedBankId)?.name}
                  </Text>
                  <Text style={[styles.bankDetailDesc, { color: textSecondaryColor }]}>
                    {BANKS.find(b => b.id === selectedBankId)?.description}
                  </Text>

                  <TouchableOpacity
                    style={[styles.modalGenerateBtn, { backgroundColor: brandColor }]}
                    onPress={() => handleGenerateAccount(selectedBankId!)}
                  >
                    <Text style={styles.modalGenerateText}>Generate Account</Text>
                    <Ionicons name="flash" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              {!selectedBankId && (
                <Text style={[styles.modalHint, { color: textSecondaryColor }]}>Select to proceed</Text>
              )}

              {/* Removed complex completed state check as openBankModal handles it */}

              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: cardBg }]} onPress={closeBankModal}>
                <Text style={[styles.closeBtnText, { color: textColor }]}>Maybe Later</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {isGenerating && (
        <View style={[styles.genOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <Animated.View entering={ZoomIn.duration(400)} style={[styles.genContent, { backgroundColor: theme.surface }]}>
            <ActivityIndicator color={brandColor} size="large" />
            <View style={styles.genTextContainer}>
              <Text style={[styles.genTxt, { color: textColor }]}>{generationStep}</Text>
              <Text style={[styles.genSub, { color: textSecondaryColor }]}>Please do not close this screen</Text>
            </View>
          </Animated.View>
        </View>
      )}

      <Modal visible={showBVNModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowBVNModal(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
              <View style={styles.modalIndi} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Verification Required</Text>
                <Text style={[styles.modalSub, { color: textSecondaryColor }]}>
                  To generate a virtual account, you need to provide your 11-digit BVN as per CBN regulations.
                </Text>
              </View>

              <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="finger-print" size={20} color={brandColor} style={{ marginRight: 12 }} />
                <TextInput
                  style={[styles.modalInput, { color: textColor }]}
                  placeholder="Enter 11-digit BVN"
                  placeholderTextColor={textSecondaryColor}
                  value={bvnInput}
                  onChangeText={setBvnInput}
                  keyboardType="numeric"
                  maxLength={11}
                />
              </View>

              <TouchableOpacity
                style={[styles.modalGenerateBtn, { backgroundColor: brandColor, marginTop: 20 }]}
                onPress={() => handleGenerateAccount('palmpay')}
              >
                <Text style={styles.modalGenerateText}>Verify & Generate</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: cardBg, marginTop: 15 }]}
                onPress={() => setShowBVNModal(false)}
              >
                <Text style={[styles.closeBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 60 },
  heroSection: { marginTop: 15, marginBottom: 35 },
  heroText: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5 },
  heroSub: { fontSize: 15, marginTop: 12, lineHeight: 24, opacity: 0.8 },
  loadingWrapper: { paddingVertical: 50, alignItems: 'center' },
  loadingTxt: { marginTop: 15, fontWeight: '700', fontSize: 13 },
  accountList: { gap: 20 },
  accountCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 5,
  },
  cardDecor: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.05,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  bankIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankNameHeader: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  accountLabelSmall: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.7,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountMain: {
    marginBottom: 24,
    paddingLeft: 4,
  },
  accountLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.5,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountNum: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
    width: '90%',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  copyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderRadius: 25, borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(0,173,255,0.2)', marginTop: 10 },
  addMoreIcon: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  addMoreText: { fontSize: 15, fontWeight: '700' },
  emptyContainer: { borderRadius: 40, padding: 30, alignItems: 'center' },
  emptyContent: { alignItems: 'center', gap: 15 },
  emptyIconBox: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  emptyIllustration: { width: 60, height: 60 },
  emptyTitle: { fontSize: 24, fontWeight: '900' },
  emptyDesc: { textAlign: 'center', fontSize: 14, lineHeight: 22, opacity: 0.7 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 25, paddingVertical: 18, borderRadius: 20, marginTop: 10 },
  ctaBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  hintCard: { flexDirection: 'row', gap: 15, padding: 20, borderRadius: 25, marginTop: 40 },
  hintIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  hintTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  hintDesc: { fontSize: 13, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalDismiss: { ...StyleSheet.absoluteFillObject },
  modalBox: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalIndi: { width: 40, height: 5, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  modalSub: { fontSize: 14, lineHeight: 22 },
  bankOptions: { gap: 12 },
  bankRow: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, gap: 15 },
  bankLogoImage: { width: 28, height: 28 },
  bankRowName: { fontSize: 16, fontWeight: '800' },
  bankRowDesc: { fontSize: 12, opacity: 0.7 },
  recBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
  recBadgeText: { fontSize: 10, fontWeight: '900' },
  completedState: { alignItems: 'center', paddingVertical: 30, gap: 15 },
  completedText: { fontSize: 16, fontWeight: '700' },
  closeBtn: { padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 20 },
  closeBtnText: { fontSize: 15, fontWeight: '700', opacity: 0.6 },
  genOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 40 },
  genContent: { width: '100%', padding: 40, borderRadius: 35, alignItems: 'center', gap: 20 },
  genTextContainer: { alignItems: 'center', gap: 8 },
  genTxt: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  genSub: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
  bankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  bankGridItem: {
    width: (width - 48 - 24) / 3, // padding: 24 each side, gap: 12
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bankGridName: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  bankDetailBox: {
    padding: 20,
    borderRadius: 25,
    marginTop: 10,
    gap: 12,
  },
  bankDetailTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  bankDetailDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    gap: 10,
    marginTop: 10,
  },
  modalGenerateText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  modalHint: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 60,
    borderRadius: 15,
    marginBottom: 10,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  }
});