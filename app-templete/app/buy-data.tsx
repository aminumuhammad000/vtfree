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
  Animated,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { billPaymentService } from '@/services/billpayment.service';
import { useAlert } from '@/components/AlertContext';
import * as Contacts from 'expo-contacts';

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

export default function BuyDataScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBgColor = isDark ? theme.inputDark : theme.inputLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
  const borderColor = isDark ? '#333' : '#E5E7EB';

  const { showSuccess, showError } = useAlert();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedNetworkIndex, setSelectedNetworkIndex] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<Array<{ id: string; data: string; validity: string; price: number }>>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState('All');

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
      case 'Small (<500MB)':
        matchesFilter = sizeInMB > 0 && sizeInMB < 500;
        break;
      case 'Medium (500MB-2.5GB)':
        matchesFilter = sizeInMB >= 500 && sizeInMB <= 2560;
        break;
      case 'Large (2.5GB-10GB)':
        matchesFilter = sizeInMB > 2560 && sizeInMB <= 10240;
        break;
      case 'Mega (10GB+)':
        matchesFilter = sizeInMB > 10240;
        break;
      default:
        matchesFilter = true;
    }

    return matchesFilter;
  }).sort((a, b) => {
    if (sortOrder === 'asc') return a.price - b.price;
    return b.price - a.price;
  });

  const networks = [
    { id: 'mtn', name: 'MTN', color: '#FFCC00', icon: 'phone-portrait' },
    { id: 'glo', name: 'Glo', color: '#00A95C', icon: 'phone-portrait' },
    { id: 'airtel', name: 'Airtel', color: '#FF0000', icon: 'phone-portrait' },
    { id: '9mobile', name: '9mobile', color: '#00693E', icon: 'phone-portrait' },
  ];

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

  // Load plans when network changes
  useEffect(() => {
    const loadPlans = async () => {
      if (!selectedNetwork) { setPlans([]); setPlansError(null); return; }
      try {
        setPlansLoading(true);
        setPlansError(null);
        const res = await billPaymentService.getDataPlans(selectedNetwork);
        if (res?.success && Array.isArray(res.data)) {
          const mapped = res.data.map((p: any, i: number) => ({
            id: String(p.planid || p.plan_id || p.id || p.plan || `plan-${i}`),
            data: p.plan_name || p.data_value || p.name || 'Plan',
            validity: p.validity || p.duration || '',
            price: Number(p.price || p.amount || 0),
          }));
          setPlans(mapped);
        } else {
          setPlans([]);
        }
      } catch (e: any) {
        setPlansError(e?.message || 'Failed to load plans');
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };
    loadPlans();
  }, [selectedNetwork]);

  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [contactsLoading, setContactsLoading] = useState(false);
  const contactModalSlide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (showContactModal) {
      Animated.spring(contactModalSlide, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        mass: 0.8,
      }).start();
    } else {
      Animated.timing(contactModalSlide, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showContactModal]);

  const selectContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        setContactsLoading(true);
        setShowContactModal(true);
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
          sort: Contacts.SortTypes.FirstName,
        });

        if (data.length > 0) {
          setContacts(data);
        } else {
          showError('No contacts found');
        }
      } else {
        showError('Permission to access contacts was denied');
      }
    } catch (e) {
      console.log(e);
      showError('Failed to access contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const name = contact.name || '';
    const phone = contact.phoneNumbers?.[0]?.number || '';
    const search = contactSearch.toLowerCase();
    return name.toLowerCase().includes(search) || phone.includes(search);
  });

  const handleSelectContact = (contact: Contacts.Contact) => {
    const phone = contact.phoneNumbers?.[0]?.number;
    if (phone) {
      // Clean phone number (remove spaces, dashes, +234, etc)
      let clean = phone.replace(/\D/g, '');
      if (clean.startsWith('234')) {
        clean = '0' + clean.slice(3);
      }
      // If it's just 10 digits (missing leading zero), add it
      if (clean.length === 10) {
        clean = '0' + clean;
      }

      setPhoneNumber(clean);
      setShowContactModal(false);
      setContactSearch('');
    } else {
      showError('This contact has no phone number');
    }
  };

  const handleInitiatePurchase = () => {
    if (!phoneNumber || !selectedNetwork || !selectedPlan) {
      showError('Please fill all required fields');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      showError('Phone number must be exactly 11 digits');
      return;
    }

    setShowPinModal(true);
  };

  const handleBuyData = async () => {
    if (!/^\d{4}$/.test(pin)) {
      showError('Enter your 4-digit transaction PIN');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    setIsLoading(true);

    try {
      const response = await billPaymentService.purchaseData({
        network: selectedNetwork!,
        phone: cleanPhone,
        plan: selectedPlan.id.toString(),
        ported_number: true,
        pin,
      });

      setShowPinModal(false);

      if (response.success) {
        showSuccess(`Data purchase successful! ${selectedPlan.data} sent to ${phoneNumber}`);
        setPhoneNumber('');
        setSelectedPlan(null);
        setSelectedNetwork(null);
        setPin('');
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        showError(response.message || 'Failed to purchase data');
      }
    } catch (error: any) {
      setShowPinModal(false);
      showError(error.message || 'Failed to purchase data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlans = selectedNetwork ? plans : [];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: cardBgColor }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Buy Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Network Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>SELECT NETWORK</Text>
            <View style={styles.networksRow}>
              {networks.map((network, idx) => (
                <TouchableOpacity
                  key={network.id}
                  style={[
                    styles.networkCircle,
                    {
                      backgroundColor: cardBgColor,
                      borderColor: selectedNetworkIndex === idx ? network.color : 'transparent',
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => {
                    setSelectedNetwork(network.id);
                    setSelectedNetworkIndex(idx);
                    setSelectedPlan(null);
                  }}
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
                onPress={selectContact}
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

          {/* Phone Number Input */}
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
              <TouchableOpacity onPress={selectContact}>
                <Ionicons name="person-add" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Data Plans Selection */}
          {/* Data Plans Selection */}
          {/* Data Plans Selection */}
          {selectedNetwork && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { marginBottom: 0, color: textSecondaryColor }]}>SELECT DATA PLAN</Text>
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  <Text style={[styles.sortButtonText, { color: textSecondaryColor }]}>Price</Text>
                  <Ionicons name={sortOrder === 'asc' ? "arrow-up" : "arrow-down"} size={12} color={textSecondaryColor} />
                </TouchableOpacity>
              </View>

              {/* Filters */}
              <View style={styles.filterContainer}>
                {/* Categories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer}>
                  {['All', 'Small (<500MB)', 'Medium (500MB-2.5GB)', 'Large (2.5GB-10GB)', 'Mega (10GB+)'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: filterType === type ? theme.primary : cardBgColor,
                          borderWidth: 1,
                          borderColor: filterType === type ? theme.primary : 'transparent'
                        }
                      ]}
                      onPress={() => setFilterType(type)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        { color: filterType === type ? '#FFF' : textSecondaryColor }
                      ]}>{type.split(' (')[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {plansLoading && <Text style={{ color: textSecondaryColor, marginBottom: 8 }}>Loading plans...</Text>}
              {plansError && <Text style={{ color: theme.error, marginBottom: 8 }}>{plansError}</Text>}

              <View style={styles.plansGrid}>
                {filteredPlans.length > 0 ? (
                  filteredPlans.map((plan, index) => (
                    <TouchableOpacity
                      key={plan.id || index}
                      style={[
                        styles.planCard,
                        {
                          backgroundColor: selectedPlan?.id === plan.id
                            ? theme.primary
                            : cardBgColor,
                        },
                      ]}
                      onPress={() => { setSelectedPlan(plan); setSelectedPlanIndex(index); }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.planData,
                          {
                            color: selectedPlan?.id === plan.id ? '#FFFFFF' : textColor,
                          },
                        ]}
                      >
                        {plan.data}
                      </Text>
                      <Text
                        style={[
                          styles.planValidity,
                          {
                            color: selectedPlan?.id === plan.id ? 'rgba(255,255,255,0.8)' : textSecondaryColor,
                          },
                        ]}
                      >
                        {plan.validity}
                      </Text>
                      <Text
                        style={[
                          styles.planPrice,
                          {
                            color: selectedPlan?.id === plan.id ? '#FFFFFF' : theme.primary,
                          },
                        ]}
                      >
                        ₦{plan.price.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noPlansContainer}>
                    <Text style={{ color: textSecondaryColor }}>No plans found</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Buy Button */}
          <TouchableOpacity
            style={[
              styles.buyButton,
              {
                backgroundColor: (!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 11 || !selectedNetwork || !selectedPlan)
                  ? (isDark ? '#333' : '#E0E0E0')
                  : theme.primary,
              },
            ]}
            onPress={handleInitiatePurchase}
            disabled={!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 11 || !selectedNetwork || !selectedPlan}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.buyButtonText,
              { color: (!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 11 || !selectedNetwork || !selectedPlan) ? textSecondaryColor : '#FFF' }
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
              Enter your 4-digit PIN to confirm purchase of {selectedPlan?.data} data for {phoneNumber}
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
              onPress={handleBuyData}
              disabled={pin.length !== 4 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[
                  styles.confirmButtonText,
                  { color: pin.length === 4 ? '#FFF' : textSecondaryColor }
                ]}>
                  Confirm & Pay ₦{selectedPlan?.price.toLocaleString()}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Contact Picker Modal */}
      <Modal
        visible={showContactModal}
        transparent={true}
        onRequestClose={() => setShowContactModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowContactModal(false)}
          />
          <Animated.View
            style={[
              styles.pinModalContent,
              {
                backgroundColor: bgColor,
                transform: [{ translateY: contactModalSlide }],
                height: '80%', // Taller for contact list
              }
            ]}
          >
            <View style={styles.handleBarContainer}>
              <View style={[styles.handleBar, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
            </View>

            <Text style={[styles.pinModalTitle, { color: textColor, marginBottom: 16 }]}>Select Contact</Text>

            <View style={[styles.searchContainer, { backgroundColor: cardBgColor, marginBottom: 16 }]}>
              <Ionicons name="search" size={20} color={textSecondaryColor} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search contacts..."
                placeholderTextColor={textSecondaryColor}
                value={contactSearch}
                onChangeText={setContactSearch}
              />
            </View>

            {contactsLoading ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact, index) => (
                    <TouchableOpacity
                      key={contact.id || index}
                      style={[styles.contactItem, { borderBottomColor: borderColor }]}
                      onPress={() => handleSelectContact(contact)}
                    >
                      <View style={[styles.contactAvatar, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>
                          {contact.name?.charAt(0) || '#'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.contactName, { color: textColor }]}>{contact.name}</Text>
                        <Text style={[styles.contactPhone, { color: textSecondaryColor }]}>
                          {contact.phoneNumbers?.[0]?.number}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ textAlign: 'center', color: textSecondaryColor, marginTop: 20 }}>
                    No contacts found
                  </Text>
                )}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Success Modal */}
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
              Data purchase has been processed successfully.
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
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  planCard: {
    width: '31%', // 3 columns
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  planData: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  planValidity: {
    fontSize: 10,
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '700',
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
  filterContainer: {
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  filterChipsContainer: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noPlansContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
