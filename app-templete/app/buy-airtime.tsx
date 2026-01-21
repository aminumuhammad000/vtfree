import { useAlert } from '@/components/AlertContext';
import { billPaymentService } from '@/services/billpayment.service';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const theme = {
  primary: '#00ADFF', // Snapchat Blue
  backgroundLight: '#FFFFFF',
  backgroundDark: '#000000',
  inputLight: "#F2F2F2",
  inputDark: "#1E1E1E",
  textLight: "#000000",
  textDark: "#FFFFFF",
  textSecondaryLight: "#757575",
  textSecondaryDark: "#A0A0A0",
  success: '#00D166',
  error: '#FF5B5B',
};

export default function BuyAirtimeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; amount?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBgColor = isDark ? theme.inputDark : theme.inputLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
  const borderColor = isDark ? '#333' : '#E5E7EB';

  const { showSuccess, showError, showInfo } = useAlert();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedNetworkIndex, setSelectedNetworkIndex] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');

  const [networks, setNetworks] = useState<Array<{ id: string; name: string; color: string; icon: string }>>([
    { id: 'mtn', name: 'MTN', color: '#FFCC00', icon: 'phone-portrait' },
    { id: 'glo', name: 'Glo', color: '#00A95C', icon: 'phone-portrait' },
    { id: 'airtel', name: 'Airtel', color: '#FF0000', icon: 'phone-portrait' },
    { id: '9mobile', name: '9mobile', color: '#00693E', icon: 'phone-portrait' },
  ]);
  const [netLoading, setNetLoading] = useState(false);
  const [netError, setNetError] = useState<string | null>(null);

  const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000, 10000];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pinModalSlide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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

  useEffect(() => {
    if (showPinModal) {
      Animated.spring(pinModalSlide, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        mass: 0.8,
      }).start();
    } else {
      Animated.timing(pinModalSlide, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showPinModal]);

  useEffect(() => {
    if (params?.phone && typeof params.phone === 'string') {
      setPhoneNumber(params.phone);
    }
    if (params?.amount && typeof params.amount === 'string') {
      const amt = Number(params.amount);
      if (!Number.isNaN(amt) && amt > 0) {
        setSelectedAmount(amt);
      }
    }
  }, [params]);

  useEffect(() => {
    const loadNetworks = async () => {
      try {
        setNetLoading(true);
        setNetError(null);
        const res = await billPaymentService.getNetworks();
        if (res?.success && Array.isArray(res.data)) {
          const mapped = res.data.map((n: any, i: number) => {
            const baseId = (n.network_code || n.network_id || n.network || n.name || '')
              .toString()
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '-');
            const id = baseId || `net-${i}`;

            let color = '#0A2540';
            const networkName = (n.name || n.network || n.network_code || '').toLowerCase();
            if (networkName.includes('mtn')) color = '#FFCC00';
            else if (networkName.includes('glo')) color = '#00A95C';
            else if (networkName.includes('airtel')) color = '#FF0000';
            else if (networkName.includes('9mobile') || networkName.includes('etisalat')) color = '#00693E';

            return {
              id,
              name: n.name || n.network || n.network_code || 'Network',
              color,
              icon: 'phone-portrait',
            };
          });
          if (mapped.length) setNetworks(mapped);
        }
      } catch (e: any) {
        setNetError(e?.message || 'Failed to load networks');
      } finally {
        setNetLoading(false);
      }
    };
    loadNetworks();
  }, []);

  const handleInitiatePurchase = () => {
    if (!phoneNumber || !selectedNetwork || (!selectedAmount && !customAmount)) {
      showError('Please fill all required fields');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      showError('Phone number must be exactly 11 digits');
      return;
    }

    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount < 50) {
      showError('Minimum airtime amount is ₦50');
      return;
    }

    if (amount > 50000) {
      showError('Maximum airtime amount is ₦50,000');
      return;
    }

    setShowPinModal(true);
  };

  const handleBuyAirtime = async () => {
    if (!/^\d{4}$/.test(pin)) {
      showError('Enter your 4-digit transaction PIN');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const amount = selectedAmount || parseFloat(customAmount);

    setIsLoading(true);

    try {
      const response = await billPaymentService.purchaseAirtime({
        network: selectedNetwork!,
        phone: cleanPhone,
        amount: amount,
        airtime_type: 'VTU',
        ported_number: true,
        pin,
      });

      setShowPinModal(false);

      if (response.success) {
        showSuccess(`Airtime purchase successful! ₦${amount} sent to ${phoneNumber}`);
        setPhoneNumber('');
        setSelectedAmount(null);
        setCustomAmount('');
        setSelectedNetwork(null);
        setPin('');
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        showError(response.message || 'Failed to purchase airtime');
      }
    } catch (error: any) {
      setShowPinModal(false);
      showError(error.message || 'Failed to purchase airtime. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: cardBgColor }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Buy Airtime</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>SELECT NETWORK</Text>
            {netLoading && <Text style={{ color: textSecondaryColor, marginBottom: 8 }}>Loading networks...</Text>}
            {netError && <Text style={{ color: theme.error, marginBottom: 8 }}>{netError}</Text>}
            <View style={styles.networksRow}>
              {networks.map((network, idx) => (
                <TouchableOpacity
                  key={network.id || idx}
                  style={[
                    styles.networkCircle,
                    {
                      backgroundColor: cardBgColor,
                      borderColor: selectedNetworkIndex === idx ? network.color : 'transparent',
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => { setSelectedNetwork(network.id); setSelectedNetworkIndex(idx); }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.networkIconCircle,
                      {
                        backgroundColor: `${network.color}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={network.icon as any}
                      size={20}
                      color={network.color}
                    />
                  </View>
                  {selectedNetworkIndex === idx && (
                    <View style={[styles.checkMarkCircle, { backgroundColor: network.color }]}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.networkLabel, { color: textColor }]}>
              {selectedNetwork ? networks.find(n => n.id === selectedNetwork)?.name : 'Select Provider'}
            </Text>
          </View>

          {/* Recent Beneficiaries */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>RECENT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.beneficiariesContainer}>
              {[
                { name: 'Mom', phone: '08012345678', avatar: 'person' },
                { name: 'John', phone: '09087654321', avatar: 'person' },
                { name: 'Work', phone: '07011223344', avatar: 'briefcase' },
              ].map((beneficiary, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.beneficiaryCard, { backgroundColor: cardBgColor }]}
                  onPress={() => setPhoneNumber(beneficiary.phone)}
                >
                  <View style={[styles.beneficiaryAvatar, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name={beneficiary.avatar as any} size={16} color={theme.primary} />
                  </View>
                  <View>
                    <Text style={[styles.beneficiaryName, { color: textColor }]} numberOfLines={1}>{beneficiary.name}</Text>
                    <Text style={[styles.beneficiaryPhone, { color: textSecondaryColor }]}>{beneficiary.phone}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.beneficiaryCard, { backgroundColor: cardBgColor, borderStyle: 'dashed', borderWidth: 1, borderColor: textSecondaryColor + '40' }]}
                onPress={() => { /* Open contacts */ }}
              >
                <View style={[styles.beneficiaryAvatar, { backgroundColor: textSecondaryColor + '15' }]}>
                  <Ionicons name="people" size={16} color={textSecondaryColor} />
                </View>
                <View>
                  <Text style={[styles.beneficiaryName, { color: textColor }]}>Contacts</Text>
                  <Text style={[styles.beneficiaryPhone, { color: textSecondaryColor }]}>Select</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PHONE NUMBER</Text>
            <View style={[styles.inputContainer, { backgroundColor: cardBgColor }]}>
              <Ionicons name="call" size={20} color={textSecondaryColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Enter phone number"
                placeholderTextColor={textSecondaryColor}
                value={phoneNumber}
                onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, '').slice(0, 11))}
                keyboardType="phone-pad"
                maxLength={11}
              />
              <TouchableOpacity onPress={() => { /* Open contacts */ }}>
                <Ionicons name="person-add" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>AMOUNT</Text>
            <View style={styles.amountsGrid}>
              {quickAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountCard,
                    {
                      backgroundColor: selectedAmount === amount ? theme.primary : cardBgColor,
                    },
                  ]}
                  onPress={() => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.amountText,
                      { color: selectedAmount === amount ? '#FFFFFF' : textColor },
                    ]}
                  >
                    ₦{amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.inputContainer, { backgroundColor: cardBgColor, marginTop: 12 }]}>
              <Text style={[styles.currencySymbol, { color: textSecondaryColor }]}>₦</Text>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Enter custom amount"
                placeholderTextColor={textSecondaryColor}
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text);
                  setSelectedAmount(null);
                }}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.helperText, { color: textSecondaryColor }]}>
              Min: ₦50 • Max: ₦50,000
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.buyButton,
              {
                backgroundColor: (!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 11 || !selectedNetwork || (!selectedAmount && !customAmount))
                  ? (isDark ? '#333' : '#E0E0E0')
                  : theme.primary,
              },
            ]}
            onPress={handleInitiatePurchase}
            disabled={!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 11 || !selectedNetwork || (!selectedAmount && !customAmount)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.buyButtonText,
              { color: (!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 11 || !selectedNetwork || (!selectedAmount && !customAmount)) ? textSecondaryColor : '#FFF' }
            ]}>
              Continue
            </Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        transparent={true}
        onRequestClose={() => setShowPinModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowPinModal(false)}
          />
          <Animated.View
            style={[
              styles.pinModalContent,
              {
                backgroundColor: bgColor,
                transform: [{ translateY: pinModalSlide }]
              }
            ]}
          >
            <View style={styles.handleBarContainer}>
              <View style={[styles.handleBar, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
            </View>

            <Text style={[styles.pinModalTitle, { color: textColor }]}>Confirm Transaction</Text>
            <Text style={[styles.pinModalSubtitle, { color: textSecondaryColor }]}>
              Enter your 4-digit PIN to confirm purchase of ₦{selectedAmount || customAmount} airtime for {phoneNumber}
            </Text>

            <View style={[styles.pinInputContainer, { backgroundColor: cardBgColor }]}>
              <TextInput
                style={[styles.pinInput, { color: textColor }]}
                placeholder="••••"
                placeholderTextColor={textSecondaryColor}
                value={pin}
                onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                autoFocus={true}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: pin.length === 4 ? theme.primary : (isDark ? '#333' : '#E0E0E0') }
              ]}
              onPress={handleBuyAirtime}
              disabled={pin.length !== 4 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[
                  styles.confirmButtonText,
                  { color: pin.length === 4 ? '#FFF' : textSecondaryColor }
                ]}>
                  Confirm & Pay
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.successModalBackdrop}>
          <View style={[styles.successModalCard, { backgroundColor: bgColor }]}>
            <View style={[styles.successIconContainer, { backgroundColor: theme.success + '20' }]}>
              <Ionicons name="checkmark" size={40} color={theme.success} />
            </View>

            <Text style={[styles.successTitle, { color: textColor }]}>
              Successful!
            </Text>
            <Text style={[styles.successMessage, { color: textSecondaryColor }]}>
              Airtime purchase has been processed successfully.
            </Text>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 16,
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
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
    paddingLeft: 4,
  },
  networksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  networkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  networkIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkCircle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  networkLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  beneficiariesContainer: {
    gap: 12,
    paddingRight: 24,
  },
  beneficiaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingRight: 16,
    borderRadius: 16,
    gap: 10,
    minWidth: 120,
  },
  beneficiaryAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beneficiaryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  beneficiaryPhone: {
    fontSize: 10,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 60,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amountCard: {
    width: '22%', // Fits 4 items per row with gap
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    marginTop: 12,
    paddingLeft: 4,
    fontWeight: '500',
  },
  buyButton: {
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  pinModalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  handleBarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  pinModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  pinModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  pinInputContainer: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  pinInput: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
  },
  confirmButton: {
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  successModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalCard: {
    width: '100%',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});
