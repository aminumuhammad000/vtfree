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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { billPaymentService } from '@/services/billpayment.service';
import { useAlert } from '@/components/AlertContext';
import { useTheme } from '@/components/ThemeContext';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInDown,
  Layout
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function BuyAirtimeScreen() {
  const router = useRouter();
  const { isDark, theme } = useTheme();

  const { showSuccess, showError } = useAlert();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');

  // Contact Picker State
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [contactsLoading, setContactsLoading] = useState(false);

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

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const handleNetworkSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNetwork(id);
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

  const handleBuyAirtime = async () => {
    if (pin.length < 4) return;
    setIsLoading(true);
    try {
      const amount = selectedAmount || parseFloat(customAmount);
      const res = await billPaymentService.purchaseAirtime({
        network: selectedNetwork!,
        phone: phoneNumber,
        amount,
        airtime_type: 'VTU',
        ported_number: true,
        pin,
      });

      if (res.success) {
        setShowPinModal(false);
        showSuccess('Airtime purchase successful!');
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

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>Buy Airtime</Text>
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

          {/* Amount Selection */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>QUICK AMOUNT</Text>
            <View style={styles.networkGrid}>
              {quickAmounts.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.netCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: selectedAmount === amt ? brandColor : 'transparent',
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.netName, { color: textColor }]}>₦{amt.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 20 }]}>OR ENTER AMOUNT</Text>
            <View style={[styles.inputBox, { backgroundColor: cardBg }]}>
              <Text style={{ color: brandColor, fontWeight: '800', fontSize: 18 }}>₦</Text>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Enter custom amount"
                placeholderTextColor={theme.border}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={(t) => {
                  setCustomAmount(t);
                  setSelectedAmount(null);
                }}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: brandColor, marginTop: 30 }]}
            onPress={() => {
              if (!phoneNumber || !selectedNetwork || (!selectedAmount && !customAmount)) {
                return showError('Check all fields');
              }
              setShowPinModal(true);
            }}
          >
            <Text style={styles.btnText}>Proceed to Payment</Text>
            <Ionicons name="shield-checkmark" size={20} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPinModal(false)}>
          <Animated.View entering={SlideInDown} style={[styles.pinSheet, { backgroundColor: theme.surface }]}>
            <Text style={[styles.pinTitle, { color: textColor }]}>Authorize Transaction</Text>
            <Text style={[styles.pinSubtitle, { color: theme.textSecondary }]}>
              Confirm ₦{(selectedAmount || parseFloat(customAmount || '0')).toLocaleString()} airtime for {phoneNumber}
            </Text>

            <View style={[styles.pinBox, { backgroundColor: cardBg }]}>
              <TextInput
                style={[styles.pinInput, { color: textColor }]}
                secureTextEntry
                maxLength={4}
                keyboardType="numeric"
                value={pin}
                onChangeText={setPin}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: brandColor }]}
              onPress={handleBuyAirtime}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Pay Now</Text>}
            </TouchableOpacity>
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
  scrollContent: { padding: 20, paddingBottom: 100 },
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
  mainBtn: {
    height: 65,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pinSheet: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, paddingBottom: 50 },
  pinTitle: { fontSize: 22, fontWeight: '800' },
  pinSubtitle: { marginTop: 10, marginBottom: 30, fontSize: 14 },
  pinBox: { height: 75, borderRadius: 20, justifyContent: 'center', paddingHorizontal: 20, marginBottom: 30 },
  pinInput: { textAlign: 'center', fontSize: 32, letterSpacing: 20, fontWeight: '800' },
  confirmBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  contactSheet: { height: '80%', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00ADFF', justifyContent: 'center', alignItems: 'center' },
});
