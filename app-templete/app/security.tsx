import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { useAlert } from '@/components/AlertContext';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SecurityScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { showSuccess, showInfo, showError } = useAlert();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricTxEnabled, setBiometricTxEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);

  // PIN Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const bioLogin = await AsyncStorage.getItem('biometric_enabled');
      const bioTx = await AsyncStorage.getItem('biometric_tx_enabled');

      setBiometricEnabled(bioLogin === 'true');
      setBiometricTxEnabled(bioTx === 'true');
    } catch (e) {
      console.log('Error loading security settings', e);
    }
  };

  const theme = {
    primary: '#00ADFF',
    backgroundLight: '#FFFFFF',
    backgroundDark: '#000000',
    cardLight: '#F2F2F2',
    cardDark: '#1E1E1E',
    textLight: '#000000',
    textDark: '#FFFFFF',
    textSecondaryLight: '#757575',
    textSecondaryDark: '#A0A0A0',
    success: '#00D166',
    error: '#FF5B5B',
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBg = isDark ? theme.cardDark : theme.cardLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;

  const handleToggleTwoFactor = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'Would you like to set up 2FA to secure your account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: () => {
              setTwoFactorEnabled(true);
              showSuccess('Two-factor authentication enabled');
            }
          },
        ]
      );
    } else {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable 2FA? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setTwoFactorEnabled(false);
              showSuccess('Two-factor authentication disabled');
            }
          },
        ]
      );
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Not Supported',
          'Biometric authentication is not available or not set up on this device.'
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: value ? 'Verify to enable Biometric Login' : 'Verify to disable Biometric Login',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setBiometricEnabled(value);
        await AsyncStorage.setItem('biometric_enabled', value.toString());
        showSuccess(`Biometric login ${value ? 'enabled' : 'disabled'} successfully`);
      } else {
        Alert.alert('Authentication Failed', 'We could not verify your identity.');
      }
    } catch (error) {
      console.error('Biometric error:', error);
      Alert.alert('Error', 'An unexpected error occurred during authentication.');
    }
  };

  const handleToggleBiometricTx = async (value: boolean) => {
    if (value) {
      // Enable: Check hardware -> Open PIN modal
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return showError('Biometrics not supported on this device');
      }
      setShowPinModal(true);
    } else {
      // Disable: Clear storage
      setBiometricTxEnabled(false);
      await AsyncStorage.removeItem('biometric_tx_enabled');
      await AsyncStorage.removeItem('transaction_pin');
      showSuccess('Transaction biometrics disabled');
    }
  };

  const saveTransactionPin = async () => {
    if (pin.length !== 4) return showError('Enter 4-digit PIN');

    // Authenticate user to confirm ownership before saving
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to Enable',
    });

    if (result.success) {
      try {
        await AsyncStorage.setItem('biometric_tx_enabled', 'true');
        await AsyncStorage.setItem('transaction_pin', pin);
        setBiometricTxEnabled(true);
        setShowPinModal(false);
        setPin('');
        showSuccess('Biometrics enabled for transactions');
      } catch (e) {
        showError('Failed to save settings');
      }
    } else {
      showError('Authentication failed');
    }
  };

  const handleSignOutAllDevices = () => {
    Alert.alert(
      'Sign Out All Devices',
      'Are you sure you want to sign out from all devices including this one?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            showSuccess('Signed out from all devices');
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: cardBg }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Security & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Verification</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/kyc')}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="id-card" size={20} color={theme.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: textColor }]}>KYC Verification</Text>
                <Text style={[styles.settingDescription, { color: textSecondaryColor }]}>
                  Complete your identity verification
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Authentication</Text>

          <View style={[styles.settingItem, { borderBottomColor: isDark ? '#333' : '#E5E7EB' }]}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: textColor }]}>Two-Factor Auth</Text>
                <Text style={[styles.settingDescription, { color: textSecondaryColor }]}>
                  Add extra security to your account
                </Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggleTwoFactor}
              trackColor={{ false: isDark ? '#333' : '#E5E7EB', true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: isDark ? '#333' : '#E5E7EB' }]}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="finger-print" size={20} color={theme.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: textColor }]}>Biometric Login</Text>
                <Text style={[styles.settingDescription, { color: textSecondaryColor }]}>
                  Use FaceID or Fingerprint to login
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: isDark ? '#333' : '#E5E7EB', true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="wallet-outline" size={20} color={theme.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: textColor }]}>Transaction Biometrics</Text>
                <Text style={[styles.settingDescription, { color: textSecondaryColor }]}>
                  Use Biometrics for purchases
                </Text>
              </View>
            </View>
            <Switch
              value={biometricTxEnabled}
              onValueChange={handleToggleBiometricTx}
              trackColor={{ false: isDark ? '#333' : '#E5E7EB', true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Activity</Text>

          <View style={[styles.settingItem, { borderBottomColor: isDark ? '#333' : '#E5E7EB' }]}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="notifications" size={20} color={theme.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: textColor }]}>Login Alerts</Text>
                <Text style={[styles.settingDescription, { color: textSecondaryColor }]}>
                  Get notified of new sign-ins
                </Text>
              </View>
            </View>
            <Switch
              value={loginNotifications}
              onValueChange={setLoginNotifications}
              trackColor={{ false: isDark ? '#333' : '#E5E7EB', true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleSignOutAllDevices}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: theme.error + '15' }]}>
                <Ionicons name="log-out" size={20} color={theme.error} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.error }]}>Sign Out All Devices</Text>
                <Text style={[styles.settingDescription, { color: textSecondaryColor }]}>
                  Log out from all active sessions
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.primary + '10' }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: textColor }]}>
            To change your Password or Transaction PIN, please use the dedicated options in your Profile menu.
          </Text>
        </View>

      </ScrollView>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.pinModal, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.pinTitle, { color: textColor }]}>Enter Transaction PIN</Text>
            <Text style={[styles.pinSubtitle, { color: textSecondaryColor }]}>
              Enter your 4-digit PIN to enable biometric transactions.
            </Text>

            <TextInput
              style={[styles.pinInput, { color: textColor, backgroundColor: isDark ? '#333' : '#F2F2F2' }]}
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
              placeholder="0000"
              placeholderTextColor={textSecondaryColor}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: isDark ? '#333' : '#F2F2F2' }]}
                onPress={() => {
                  setShowPinModal(false);
                  setPin('');
                }}
              >
                <Text style={{ color: textColor }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={saveTransactionPin}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Enable</Text>
              </TouchableOpacity>
            </View>
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
  },
  content: {
    padding: 24,
  },
  section: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  pinModal: {
    borderRadius: 20,
    padding: 24,
  },
  pinTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pinSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  pinInput: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});