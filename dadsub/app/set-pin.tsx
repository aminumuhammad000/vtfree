import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { useAlert } from '@/components/AlertContext';
import { userService } from '@/services/user.service';

export default function SetPinScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState({
    pin: false,
    confirm: false,
  });

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
    inputBgLight: '#F8F9FA',
    inputBgDark: '#2C2C2C',
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBg = isDark ? theme.cardDark : theme.cardLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
  const inputBg = isDark ? theme.inputBgDark : theme.inputBgLight;

  const toggleShowPin = (field: 'pin' | 'confirm') => {
    setShowPin(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSetPin = async () => {
    if (!/^[0-9]{4}$/.test(pin)) {
      showError('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      showError('PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await userService.setTransactionPin(pin);
      if (res?.success) {
        showSuccess('Transaction PIN set successfully');
        router.back();
      } else {
        showError(res?.message || 'Failed to set PIN');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.headerTitle, { color: textColor }]}>Set Transaction PIN</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]}
        >
          <View style={[styles.infoCard, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="lock-closed" size={24} color={theme.primary} />
            <Text style={[styles.infoText, { color: textColor }]}>
              Set a 4-digit PIN to secure your transactions. You&apos;ll need this for airtime, data, and transfers.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>Enter 4-digit PIN</Text>
            <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={pin}
                onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry={!showPin.pin}
                placeholder="••••"
                placeholderTextColor={textSecondaryColor}
              />
              <TouchableOpacity onPress={() => toggleShowPin('pin')} style={styles.eyeIcon}>
                <Ionicons name={showPin.pin ? "eye-off" : "eye"} size={20} color={textSecondaryColor} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>Confirm PIN</Text>
            <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={confirmPin}
                onChangeText={(t) => setConfirmPin(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry={!showPin.confirm}
                placeholder="••••"
                placeholderTextColor={textSecondaryColor}
              />
              <TouchableOpacity onPress={() => toggleShowPin('confirm')} style={styles.eyeIcon}>
                <Ionicons name={showPin.confirm ? "eye-off" : "eye"} size={20} color={textSecondaryColor} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSetPin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Set PIN</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    height: '100%',
    letterSpacing: 4,
  },
  eyeIcon: {
    padding: 8,
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    shadowColor: '#00ADFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
