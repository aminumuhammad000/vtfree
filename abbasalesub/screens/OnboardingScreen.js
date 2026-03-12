import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Platform,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { appService } from "../services/api";

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    icon: 'phone-iphone',
    title: 'Instant Airtime Top-Up',
    description: 'Easily and quickly recharge any mobile network.',
  },
  {
    id: 2,
    icon: 'signal-cellular-alt',
    title: 'Affordable Data Bundles',
    description: 'Get the best prices on a wide range of data plans.',
  },
  {
    id: 3,
    icon: 'receipt',
    title: 'Pay Bills Seamlessly',
    description: 'Conveniently pay your electricity, TV, and other bills in one place.',
  },
];

import { Config } from "../constants/Config";

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const [branding, setBranding] = useState(null);

  // Fetch branding
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await appService.getPublicDetails(Config.APP_ID);
        if (response.data.success) {
          setBranding(response.data.data.app.branding);
        }
      } catch (error) {
        console.log('Failed to fetch branding:', error);
      }
    };
    fetchBranding();
  }, []);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Navigate to login or home screen
      navigation.navigate('Login');
    }
  };

  // Default theme colors
  const theme = {
    primary: "#1E40AF",
    accent: "#3B82F6",
    background: "#111418",
    text: "#FFFFFF",
    textSecondary: "#9dabb8",
  };

  const brandColor = branding?.primary_color || theme.primary;
  const accentColor = branding?.secondary_color || theme.accent;
  const bgColor = branding?.background_color || theme.background;
  // If background is light, use dark text, else light text
  const isLightBg = bgColor === '#F8F9FA' || bgColor === '#FFFFFF' || bgColor === '#fff';
  const textColor = isLightBg ? '#1E293B' : '#FFFFFF';
  const textSecondaryColor = isLightBg ? '#475569' : '#9dabb8';

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        <MaterialIcons name={item.icon} size={96} color={brandColor} />
      </View>
      <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
      <Text style={[styles.description, { color: textSecondaryColor }]}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={branding?.logo_url ? { uri: branding.logo_url } : require('../assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={[styles.logoText, { color: textColor }]}>
            {branding?.app_display_name || 'AbbaSalehSub'}
          </Text>
        </View>
      </View>

      <View style={styles.carouselContainer}>
        <Animated.FlatList
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id.toString()}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />

        <View style={styles.pagination}>
          {onboardingData.map((_, i) => (
            <View
              key={i}
              style={[
                styles.paginationDot,
                currentIndex === i ? { backgroundColor: brandColor, width: 32 } : { backgroundColor: '#3c4753' },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.trustText, { color: textSecondaryColor }]}>Trusted & Secure with Minimal Fees.</Text>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: brandColor }]}
          onPress={scrollTo}
        >
          <Text style={styles.primaryButtonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.secondaryButtonText, { color: textColor }]}>Log In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111418',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 50 : 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    width: width,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 192,
    height: 192,
    borderRadius: 100,
    backgroundColor: 'rgba(10, 51, 92, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  description: {
    color: '#9dabb8',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3c4753',
    marginHorizontal: 4,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  trustText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
  },
  primaryButton: {
    backgroundColor: '#34d399',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#0a335c',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
});

export default OnboardingScreen;
