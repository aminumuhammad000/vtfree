import { useAlert } from '@/components/AlertContext';
import { useProfile } from '@/components/ProfileContext';
import { useTheme } from '@/components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const theme = {
  primary: '#00ADFF', // Snapchat Blue
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

export default function EditProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { isDark } = useTheme();
  const { showSuccess, showError } = useAlert();
  const { profileData, updateProfile } = useProfile();
  const [userData, setUserData] = useState<any>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBgColor = isDark ? theme.cardDark : theme.cardLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
  const borderColor = isDark ? '#333' : '#E5E7EB';
  const inputBgColor = isDark ? '#333' : '#F9FAFB';

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(profileData.profileImage);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Keep track of original values for reset functionality
  const [originalData, setOriginalData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    profileImage: profileData.profileImage,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadUserProfile();
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

  const loadUserProfile = async () => {
    try {
      setIsInitialLoading(true);
      const response = await userService.getProfile();
      if (response.success) {
        const user = response.data;
        setUserData(user);
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setEmail(user.email || '');
        setPhoneNumber(user.phone_number || '');
        setAddress(user.address || '');
        setCity(user.city || '');
        setState(user.state || '');

        // Set original data for reset
        setOriginalData({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email || '',
          phoneNumber: user.phone_number || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          profileImage: profileData.profileImage,
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      showError('Failed to load profile data');
      // Fallback to local storage
      const localUser = await authService.getCurrentUser();
      if (localUser) {
        setFirstName(localUser.first_name || '');
        setLastName(localUser.last_name || '');
        setEmail(localUser.email || '');
        setPhoneNumber(localUser.phone_number || '');
      }
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Check if form has changes
  const hasChanges =
    firstName !== originalData.firstName ||
    lastName !== originalData.lastName ||
    email !== originalData.email ||
    phoneNumber !== originalData.phoneNumber ||
    address !== originalData.address ||
    city !== originalData.city ||
    state !== originalData.state ||
    profileImage !== originalData.profileImage;

  // Safety timeout to reset loading state
  React.useEffect(() => {
    if (isImageLoading) {
      const timeout = setTimeout(() => {
        setIsImageLoading(false);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isImageLoading]);

  // Request permissions and pick image
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to change your profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setIsImageLoading(false); // Reset loading state if permission denied
        return;
      }

      setIsImageLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsImageLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera permissions to take a photo.',
          [{ text: 'OK' }]
        );
        setIsImageLoading(false); // Reset loading state if permission denied
        return;
      }

      setIsImageLoading(true);

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsImageLoading(false);
    }
  };

  const showImagePickerOptions = () => {
    // Don't show options if already loading
    if (isImageLoading) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Gallery', onPress: pickImageFromGallery },
        ]
      );
    }
  };

  // Debug function to force reset loading state
  const forceResetLoadingState = () => {
    setIsImageLoading(false);
    console.log('Image loading state forcefully reset');
  };

  // Reset form to original values
  const resetForm = () => {
    setFirstName(originalData.firstName);
    setLastName(originalData.lastName);
    setEmail(originalData.email);
    setPhoneNumber(originalData.phoneNumber);
    setAddress(originalData.address);
    setCity(originalData.city);
    setState(originalData.state);
    setProfileImage(originalData.profileImage);
    showSuccess('Form reset to original values');
  };

  const handleSaveProfile = async () => {
    // Validation
    if (!firstName.trim()) {
      showError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      showError('Last name is required');
      return;
    }
    if (!email.trim()) {
      showError('Email address is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Create updated profile data for API
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
      };

      // Call API to update profile
      const response = await userService.updateProfile(updateData);

      if (response.success) {
        // Update the global profile context
        updateProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phoneNumber,
          address,
          city,
          state,
          profileImage: profileImage
        });

        // Show success message
        showSuccess('Profile updated successfully!');

        // Navigate back after a short delay to show the success message
        setTimeout(() => {
          router.back();
        }, 1000);
      } else {
        showError(response.message || 'Failed to update profile');
      }

    } catch (error: any) {
      console.error('Error updating profile:', error);
      showError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Ionicons name="refresh" size={32} color={textSecondaryColor} />
        <Text style={[{ color: textSecondaryColor, marginTop: 12, fontSize: 16 }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: cardBgColor }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <View style={styles.profilePicContainer}>
              <View style={[styles.profilePic, { borderColor: theme.primary }]}>
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
                {isImageLoading && (
                  <View style={[styles.imageLoadingOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <Ionicons name="refresh" size={24} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4 }}>Loading...</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[styles.editPicButton, {
                  backgroundColor: theme.primary,
                  opacity: isImageLoading ? 0.7 : 1,
                  borderColor: bgColor
                }]}
                onPress={showImagePickerOptions}
                disabled={isImageLoading}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.changePictureButton, { opacity: isImageLoading ? 0.7 : 1 }]}
              onPress={showImagePickerOptions}
              onLongPress={forceResetLoadingState}
              disabled={isImageLoading}
            >
              <Text style={[styles.changePictureText, { color: theme.primary }]}>
                {isImageLoading ? 'Loading...' : 'Change Picture'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PERSONAL INFORMATION</Text>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>First Name</Text>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: cardBgColor,
                    color: textColor
                  }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor={textSecondaryColor}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>Last Name</Text>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: cardBgColor,
                    color: textColor
                  }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  placeholderTextColor={textSecondaryColor}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>Email Address</Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: cardBgColor,
                  color: textColor,
                  opacity: 0.7
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor={textSecondaryColor}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>Phone Number</Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: cardBgColor,
                  color: textColor,
                  opacity: 0.7
                }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number"
                placeholderTextColor={textSecondaryColor}
                keyboardType="phone-pad"
                editable={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>Address</Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: cardBgColor,
                  color: textColor
                }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address"
                placeholderTextColor={textSecondaryColor}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>City</Text>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: cardBgColor,
                    color: textColor
                  }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter city"
                  placeholderTextColor={textSecondaryColor}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>State</Text>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: cardBgColor,
                    color: textColor
                  }]}
                  value={state}
                  onChangeText={setState}
                  placeholder="Enter state"
                  placeholderTextColor={textSecondaryColor}
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, {
              backgroundColor: theme.primary,
              opacity: isLoading ? 0.7 : 1
            }]}
            onPress={handleSaveProfile}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </Animated.View>
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
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 60,
  },
  editPicButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  changePictureButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 173, 255, 0.1)',
  },
  changePictureText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
    paddingLeft: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    marginHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});