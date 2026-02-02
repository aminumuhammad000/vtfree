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
  View,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
  const router = useRouter();
  const { isDark, theme } = useTheme();
  const { showSuccess, showError } = useAlert();
  const { profileData, updateProfile, refreshProfile } = useProfile();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const bgColor = theme.background;
  const cardBgColor = theme.surface;
  const textColor = theme.text;
  const textSecondaryColor = theme.textSecondary;
  const borderColor = theme.border;
  const inputBgColor = theme.surface;

  // Form state
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(profileData.profileImage);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Keep track of original values for reset functionality
  const [originalData, setOriginalData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
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
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setEmail(user.email || '');
        setPhoneNumber(user.phone_number || '');
        setAddress(user.address || '');
        setCity(user.city || '');
        setState(user.state || '');

        const data = {
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone_number: user.phone_number || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          profileImage: user.profile_picture_url || user.avatar || profileData.profileImage,
        };
        setOriginalData(data);
        setProfileImage(data.profileImage);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      showError('Failed to load profile data');
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

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to change your profile picture.');
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

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
      console.error('Error picking image:', error);
    } finally {
      setIsImageLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take a photo.');
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
    } finally {
      setIsImageLoading(false);
    }
  };

  const showImagePickerOptions = () => {
    if (isImageLoading) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Gallery'], cancelButtonIndex: 0 },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          else if (buttonIndex === 2) pickImageFromGallery();
        }
      );
    } else {
      Alert.alert('Select Profile Picture', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImageFromGallery },
      ]);
    }
  };

  const handleSaveProfile = async () => {
    if (!first_name.trim() || !last_name.trim() || !email.trim()) {
      showError('First name, Last name and Email are required');
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
      };

      const response = await userService.updateProfile(updateData);
      if (response.success) {
        updateProfile({
          ...profileData,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          address,
          city,
          state,
          profileImage
        });
        showSuccess('Profile updated successfully!');
        await refreshProfile();
        setTimeout(() => router.back(), 1000);
      } else {
        showError(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: cardBgColor }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.profileSection}>
            <View style={styles.profilePicContainer}>
              <View style={[styles.profilePic, { borderColor: theme.primary }]}>
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                {isImageLoading && <ActivityIndicator style={styles.imageLoadingOverlay} color="#FFF" />}
              </View>
              <TouchableOpacity style={[styles.editPicButton, { backgroundColor: theme.primary, borderColor: bgColor }]} onPress={showImagePickerOptions}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.changePictureButton} onPress={showImagePickerOptions}>
              <Text style={[styles.changePictureText, { color: theme.primary }]}>Change Picture</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PERSONAL INFORMATION</Text>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>First Name</Text>
                <TextInput style={[styles.textInput, { backgroundColor: cardBgColor, color: textColor }]} value={first_name} onChangeText={setFirstName} />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>Last Name</Text>
                <TextInput style={[styles.textInput, { backgroundColor: cardBgColor, color: textColor }]} value={last_name} onChangeText={setLastName} />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>Email Address</Text>
              <TextInput style={[styles.textInput, { backgroundColor: cardBgColor, color: textColor, opacity: 0.7 }]} value={email} editable={false} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>Phone Number</Text>
              <TextInput style={[styles.textInput, { backgroundColor: cardBgColor, color: textColor, opacity: 0.7 }]} value={phone_number} editable={false} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>Address</Text>
              <TextInput style={[styles.textInput, { backgroundColor: cardBgColor, color: textColor }]} value={address} onChangeText={setAddress} />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>City</Text>
                <TextInput style={[styles.textInput, { backgroundColor: cardBgColor, color: textColor }]} value={city} onChangeText={setCity} />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>State</Text>
                <TextInput style={[styles.textInput, { backgroundColor: cardBgColor, color: textColor }]} value={state} onChangeText={setState} />
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary, opacity: isLoading ? 0.7 : 1 }]} onPress={handleSaveProfile} disabled={isLoading}>
            <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
          <View style={{ height: 50 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 20 },
  profileSection: { alignItems: 'center', marginBottom: 32 },
  profilePicContainer: { position: 'relative', marginBottom: 16 },
  profilePic: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', borderWidth: 4 },
  profileImage: { width: '100%', height: '100%' },
  imageLoadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  editPicButton: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  changePictureButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(0, 173, 255, 0.1)' },
  changePictureText: { fontSize: 14, fontWeight: '700' },
  formSection: { paddingHorizontal: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 16, paddingLeft: 4 },
  inputContainer: { marginBottom: 16 },
  inputRow: { flexDirection: 'row' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  textInput: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, fontWeight: '500' },
  saveButton: { marginHorizontal: 24, paddingVertical: 20, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});