import { useAlert } from '@/components/AlertContext';
import { userService } from '@/services/user.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

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

export default function SecurityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showSuccess, showError } = useAlert();

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBgColor = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : theme.textHeadings;
  const textBodyColor = isDark ? '#9CA3AF' : theme.textBody;
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const inputBgColor = isDark ? '#374151' : '#F9FAFB';

  // Security settings state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Transaction PIN change state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await userService.updatePassword(currentPassword, newPassword);
      if (res?.success) {
        showSuccess('Password changed successfully!');
      } else {
        showError(res?.message || 'Failed to change password');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = (error as any)?.message || 'Failed to change password. Please try again.';
      showError(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdatePin = async () => {
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      showError('PIN must be exactly 4 digits');
      return;
    }
    if (currentPin === newPin) {
      showError('New PIN must be different from current PIN');
      return;
    }

    setIsUpdatingPin(true);
    try {
      const res = await userService.updateTransactionPin(currentPin, newPin);
      if (res?.success) {
        showSuccess('Transaction PIN updated successfully');
        setCurrentPin('');
        setNewPin('');
      } else {
        showError(res?.message || 'Failed to update transaction PIN');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to update transaction PIN');
    } finally {
      setIsUpdatingPin(false);
    }
  };

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

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Change Password Section */}
        <View style={[styles.section, { backgroundColor: cardBgColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Change Password</Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textBodyColor }]}>Current Password</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: inputBgColor, 
                borderColor: borderColor,
                color: textColor 
              }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={textBodyColor}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textBodyColor }]}>New Password</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: inputBgColor, 
                borderColor: borderColor,
                color: textColor 
              }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={textBodyColor}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textBodyColor }]}>Confirm New Password</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: inputBgColor, 
                borderColor: borderColor,
                color: textColor 
              }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={textBodyColor}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.changePasswordButton, { 
              backgroundColor: theme.primary,
              opacity: isChangingPassword ? 0.7 : 1 
            }]}
            onPress={handleChangePassword}
            disabled={isChangingPassword}
          >
            <Text style={styles.changePasswordButtonText}>
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Text>
          </TouchableOpacity>

          {/* Two-Factor Authentication */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: textColor }]}>Two-Factor Authentication</Text>
                <Text style={[styles.settingDescription, { color: textBodyColor }]}>Add an extra layer of security to your account</Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggleTwoFactor}
              trackColor={{ false: borderColor, true: theme.primary }}
              thumbColor={twoFactorEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="finger-print" size={24} color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: textColor }]}>Biometric Login</Text>
                <Text style={[styles.settingDescription, { color: textBodyColor }]}> 
                  Use fingerprint or face recognition to sign in
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: borderColor, true: theme.primary }}
              thumbColor={biometricEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: textColor }]}>Login Notifications</Text>
                <Text style={[styles.settingDescription, { color: textBodyColor }]}>
                  Get notified when someone logs into your account
                </Text>
              </View>
            </View>
            <Switch
              value={loginNotifications}
              onValueChange={setLoginNotifications}
              trackColor={{ false: borderColor, true: theme.primary }}
              thumbColor={loginNotifications ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Session Management */}
        <View style={[styles.section, { backgroundColor: cardBgColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Session Management</Text>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionInfo}>
              <Ionicons name="phone-portrait" size={24} color={theme.primary} />
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, { color: textColor }]}>Active Sessions</Text>
                <Text style={[styles.actionDescription, { color: textBodyColor }]}>
                  Manage devices logged into your account
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textBodyColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionInfo}>
              <Ionicons name="log-out" size={24} color={theme.error} />
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, { color: theme.error }]}>Sign Out All Devices</Text>
                <Text style={[styles.actionDescription, { color: textBodyColor }]}>
                  Sign out from all devices except this one
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textBodyColor} />
          </TouchableOpacity>
        </View>

        {/* Update Transaction PIN */}
        <View style={[styles.section, { backgroundColor: cardBgColor }]}> 
          <Text style={[styles.sectionTitle, { color: textColor }]}>Update Transaction PIN</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textBodyColor }]}>Current PIN</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: inputBgColor,
                borderColor: borderColor,
                color: textColor
              }]}
              value={currentPin}
              onChangeText={setCurrentPin}
              placeholder="Enter current 4-digit PIN"
              placeholderTextColor={textBodyColor}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textBodyColor }]}>New PIN</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: inputBgColor,
                borderColor: borderColor,
                color: textColor
              }]}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="Enter new 4-digit PIN"
              placeholderTextColor={textBodyColor}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.changePasswordButton, {
              backgroundColor: theme.primary,
              opacity: isUpdatingPin ? 0.7 : 1
            }]}
            onPress={handleUpdatePin}
            disabled={isUpdatingPin}
          >
            <Text style={styles.changePasswordButtonText}>
              {isUpdatingPin ? 'Updating PIN...' : 'Update PIN'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  changePasswordButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  changePasswordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
  },
});