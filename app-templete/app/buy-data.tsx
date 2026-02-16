import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { billPaymentService } from '@/services/billpayment.service';
import { useAlert } from '@/components/AlertContext';
import { useTheme } from '@/components/ThemeContext';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInDown,
  Layout
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function BuyDataScreen() {
  const router = useRouter();
  const { isDark, theme } = useTheme();

  const { showSuccess, showError } = useAlert();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState('All');

  // Contact Picker State
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [contactsLoading, setContactsLoading] = useState(false);

  // Biometric State
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);

  const brandColor = theme.primary;
  const bgColor = theme.background;
  const textColor = theme.text;
  const cardBg = theme.surface;

  const networks = [
    { id: 'mtn', name: 'MTN', color: '#FFCC00' },
    { id: 'glo', name: 'Glo', color: '#00A95C' },
    { id: 'airtel', name: 'Airtel', color: '#FF0000' },
    { id: '9mobile', name: '9mobile', color: '#00693E' },
  ];

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const enabled = await AsyncStorage.getItem('biometric_tx_enabled');
      const savedPin = await AsyncStorage.getItem('transaction_pin');

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (enabled === 'true' && savedPin && hasHardware && isEnrolled) {
        setIsBiometricEnabled(true);
        setStoredPin(savedPin);
      }
    } catch (e) {
      console.log('Error checking biometrics', e);
    }
  };

  // Logic: Plan sorting and filtering
  const getPlanSizeInMB = (dataStr: string) => {
    const cleanStr = dataStr.toUpperCase().replace(/\s/g, '');
    let size = 0;
    if (cleanStr.includes('GB')) {
      size = parseFloat(cleanStr.replace('GB', '')) * 1024;
    } else if (cleanStr.includes('MB')) {
      size = parseFloat(cleanStr.replace('MB', ''));
    } else if (cleanStr.includes('TB')) {
      size = parseFloat(cleanStr.replace('TB', '')) * 1024 * 1024;
    }
    return size;
  };

  const filteredPlans = plans.filter(plan => {
    const sizeInMB = getPlanSizeInMB(plan.data);
    let matchesFilter = true;
    switch (filterType) {
      case 'Small': matchesFilter = sizeInMB > 0 && sizeInMB < 500; break;
      case 'Medium': matchesFilter = sizeInMB >= 500 && sizeInMB <= 2560; break;
      case 'Large': matchesFilter = sizeInMB > 2560 && sizeInMB <= 10240; break;
      case 'Mega': matchesFilter = sizeInMB > 10240; break;
      default: matchesFilter = true;
    }
    return matchesFilter;
  }).sort((a, b) => {
    if (sortOrder === 'asc') return a.price - b.price;
    return b.price - a.price;
  });

  // Load plans when network changes
  useEffect(() => {
    if (selectedNetwork) loadPlans();
  }, [selectedNetwork]);

  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      const res = await billPaymentService.getDataPlans(selectedNetwork!);
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((p: any, i: number) => ({
          id: p.planid || p.plan_id || p.id || p.plan || `plan-${i}`,
          data: p.plan_name || p.data_value || p.name || 'Plan',
          validity: p.validity || p.duration || '',
          price: Number(p.price || p.amount || 0),
        }));
        setPlans(mapped);
      }
    } catch (e) {
      console.log('Error loading plans', e);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleNetworkSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNetwork(id);
    setSelectedPlan(null);
  };

  const selectContact = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      setContactsLoading(true);
      setShowContactModal(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      setContacts(data);
      setContactsLoading(false);
    } else {
      showError('Contact permission denied');
    }
  };

  const handleBuyData = async (pinOverride?: string) => {
    const transactionPin = pinOverride || pin;
    if (transactionPin.length < 4) return;
    setIsLoading(true);
    try {
      const res = await billPaymentService.purchaseData({
        network: selectedNetwork!,
        phone: phoneNumber,
        plan: selectedPlan.id.toString(),
        ported_number: true,
        pin: transactionPin,
      });
      if (res.success) {
        setShowPinModal(false);
        showSuccess('Data purchase successful!');
        router.back();
      } else {
        showError(res.message || 'Transaction failed');
      }
    } catch (e: any) {
      showError(e.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate Transaction',
        disableDeviceFallback: false,
      });

      if (result.success && storedPin) {
        setPin(storedPin);
        handleBuyData(storedPin);
      } else if (!result.success && result.error !== 'user_cancel') {
        showError('Authentication failed');
      }
    } catch (e) {
      showError('Biometric error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>Buy Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          {/* Network Selection */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>CARRIER</Text>
          <View style={styles.networkGrid}>
            {networks.map((net) => (
              <TouchableOpacity
                key={net.id}
                style={[
                  styles.netCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: selectedNetwork === net.id ? net.color : 'transparent',
                    borderWidth: 2,
                  }
                ]}
                onPress={() => handleNetworkSelect(net.id)}
              >
                <View style={[styles.netDot, { backgroundColor: net.color }]} />
                <Text style={[styles.netName, { color: textColor }]}>{net.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Phone Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>TARGET NUMBER</Text>
            <View style={[styles.inputBox, { backgroundColor: cardBg }]}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={brandColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="0801 234 5678"
                placeholderTextColor={theme.border}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
              <TouchableOpacity onPress={selectContact}>
                <Ionicons name="person-add-outline" size={20} color={brandColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Data Plans */}
          {selectedNetwork && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 0 }]}>DATA PLAN</Text>
                <TouchableOpacity onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} style={styles.sortBtn}>
                  <Ionicons name={sortOrder === 'asc' ? "arrow-up" : "arrow-down"} size={14} color={brandColor} />
                  <Text style={{ color: brandColor, fontWeight: '700', fontSize: 12 }}>Sort</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
                {['All', 'Small', 'Medium', 'Large', 'Mega'].map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => { setFilterType(f); Haptics.selectionAsync(); }}
                    style={[styles.filterChip, { backgroundColor: filterType === f ? brandColor : cardBg }]}
                  >
                    <Text style={{ color: filterType === f ? '#FFF' : theme.textSecondary, fontWeight: '700', fontSize: 12 }}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {plansLoading ? (
                <ActivityIndicator color={brandColor} style={{ marginTop: 20 }} />
              ) : (
                <View style={styles.plansGrid}>
                  {filteredPlans.length > 0 ? (
                    filteredPlans.map((plan) => (
                      <TouchableOpacity
                        key={plan.id}
                        onPress={() => { setSelectedPlan(plan); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[
                          styles.planCard,
                          {
                            backgroundColor: cardBg,
                            borderColor: selectedPlan?.id === plan.id ? brandColor : 'transparent',
                            borderWidth: 2,
                          }
                        ]}
                      >
                        <View style={styles.planHeader}>
                          <Text style={[styles.planData, { color: textColor }]}>{plan.data}</Text>
                          <View style={[styles.planTag, { backgroundColor: brandColor + '15' }]}>
                            <Text
                              style={{ color: brandColor, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}
                              numberOfLines={1}
                            >
                              {plan.validity}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.planPrice, { color: textColor }]}>₦{plan.price.toLocaleString()}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.empty}>
                      <MaterialCommunityIcons name="database-off-outline" size={60} color={theme.border} />
                      <Text style={{ color: theme.textSecondary, marginTop: 15, fontWeight: '700' }}>No matching plans</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Sticky Floating Buy Button - Appears when plan is selected */}
      {selectedPlan && (
        <SafeAreaView style={styles.safeAreaButton}>
          <Animated.View
            entering={SlideInDown.springify()}
            style={[styles.floatingButtonContainer, { backgroundColor: bgColor }]}
          >
            <View style={styles.floatingButtonContent}>
              <View style={styles.selectedPlanInfo}>
                <Text style={[styles.selectedPlanText, { color: textColor }]} numberOfLines={1}>
                  {selectedPlan.data}
                </Text>
                <Text style={[styles.selectedPlanPrice, { color: brandColor }]}>
                  ₦{selectedPlan.price.toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.floatingBtn, { backgroundColor: brandColor }]}
                onPress={() => {
                  if (!phoneNumber || !selectedPlan) return showError('Check all fields');
                  setShowPinModal(true);
                  // Auto-trigger biometrics if enabled
                  if (isBiometricEnabled) {
                    setTimeout(() => triggerBiometricAuth(), 500);
                  }
                }}
              >
                <Text style={styles.btnText}>Buy Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      )}

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPinModal(false)}>
          <Animated.View entering={SlideInDown} style={[styles.pinSheet, { backgroundColor: theme.surface }]}>
            <Text style={[styles.pinTitle, { color: textColor }]}>Authorize Transaction</Text>
            <Text style={[styles.pinSubtitle, { color: theme.textSecondary }]}>
              Confirm purchase of {selectedPlan?.data} for {phoneNumber}
            </Text>

            <View style={[styles.pinBox, { backgroundColor: cardBg }]}>
              <TextInput
                style={[styles.pinInput, { color: textColor }]}
                secureTextEntry
                maxLength={4}
                keyboardType="numeric"
                value={pin}
                onChangeText={setPin}
                autoFocus={!isBiometricEnabled}
              />
            </View>

            <View style={{ gap: 15 }}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: brandColor }]}
                onPress={() => handleBuyData()}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Pay Now</Text>}
              </TouchableOpacity>

              {isBiometricEnabled && (
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: cardBg, marginTop: 0 }]}
                  onPress={triggerBiometricAuth}
                  disabled={isLoading}
                >
                  <MaterialCommunityIcons name="fingerprint" size={24} color={brandColor} />
                  <Text style={[styles.btnText, { color: textColor, marginLeft: 10 }]}>Pay with Biometrics</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Contacts Modal */}
      <Modal visible={showContactModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <View style={[styles.contactSheet, { backgroundColor: bgColor }]}>
            <View style={styles.contactHeader}>
              <Text style={[styles.pinTitle, { color: textColor }]}>Select Contact</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.inputBox, { backgroundColor: cardBg, color: textColor, marginBottom: 20 }]}
              placeholder="Search name or number..."
              placeholderTextColor="#777"
              value={contactSearch}
              onChangeText={setContactSearch}
            />
            {contactsLoading ? (
              <ActivityIndicator color={brandColor} />
            ) : (
              <ScrollView>
                {contacts.filter(c => c.name?.toLowerCase().includes(contactSearch.toLowerCase())).map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.contactItem}
                    onPress={() => {
                      const num = c.phoneNumbers?.[0]?.number?.replace(/\D/g, '');
                      if (num) {
                        setPhoneNumber(num.startsWith('234') ? '0' + num.slice(3) : num);
                        setShowContactModal(false);
                      }
                    }}
                  >
                    <View style={[styles.contactIcon, { backgroundColor: theme.primary }]}>
                      <Text style={{ color: '#FFF' }}>{c.name?.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={{ color: textColor, fontWeight: '700' }}>{c.name}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{c.phoneNumbers?.[0]?.number}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 120 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 15 },
  networkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  netCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    gap: 10,
  },
  netDot: { width: 10, height: 10, borderRadius: 5 },
  netName: { fontWeight: '700', fontSize: 13 },
  inputSection: { marginBottom: 30 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 60,
    borderRadius: 18,
    gap: 12,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8, borderRadius: 10 },
  filterBar: { marginBottom: 20 },
  filterChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginRight: 10 },
  plansGrid: { gap: 12 },
  planCard: {
    padding: 20,
    borderRadius: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  planData: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  planTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  planPrice: { fontSize: 15, fontWeight: '700', marginTop: 10, opacity: 0.8 },
  mainBtn: {
    height: 65,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },

  // Modal Overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },

  // PIN Bottom Sheet with Native Keyboard
  pinBottomSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 25,
    paddingTop: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  pinSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pinSheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  pinSheetSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Transaction Card
  transactionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 25,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // PIN Input Section
  pinInputSection: {
    marginBottom: 20,
  },
  pinInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinDotsDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 15,
  },
  pinDotLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenPinInput: {
    position: 'absolute',
    opacity: 0.01,
    height: 1,
    width: 1,
  },
  pinHint: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Biometric Option
  biometricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 15,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Submit Button
  pinSubmitButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pinSubmitText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  // Contact Modal Styles
  contactSheet: { height: '80%', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00ADFF', justifyContent: 'center', alignItems: 'center' },
  empty: { height: 200, justifyContent: 'center', alignItems: 'center' },

  // Floating Button Styles
  safeAreaButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  floatingButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  floatingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedPlanInfo: {
    flex: 1,
  },
  selectedPlanText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  selectedPlanPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
  },

  // PIN Modal Styles (Matched to Airtime)
  pinSheet: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, paddingBottom: 50 },
  pinTitle: { fontSize: 22, fontWeight: '800' },
  pinSubtitle: { marginTop: 10, marginBottom: 30, fontSize: 14 },
  pinBox: { height: 75, borderRadius: 20, justifyContent: 'center', paddingHorizontal: 20, marginBottom: 30 },
  pinInput: { textAlign: 'center', fontSize: 32, letterSpacing: 20, fontWeight: '800' },
  confirmBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
