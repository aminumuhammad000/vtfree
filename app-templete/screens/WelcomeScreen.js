import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { appService } from "../services/api";

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'phone-iphone',
    title: 'Instant Airtime Top-Up',
    description: 'Easily and quickly recharge any mobile network.',
  },
  {
    id: '2',
    icon: 'signal-cellular-alt',
    title: 'Affordable Data Bundles',
    description: 'Get the best prices on a wide range of data plans.',
  },
  {
    id: '3',
    icon: 'receipt',
    title: 'Pay Bills Seamlessly',
    description: 'Conveniently pay your electricity, TV, and other bills in one place.',
  },
];

import { Config } from "../constants/Config";

const WelcomeScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef();
  const router = useRouter();
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

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentIndex(index);
  };

  const scrollToNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current.scrollTo({ x: width * (currentIndex + 1), animated: true });
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Default theme colors
  const theme = {
    primary: "#0A2540",
    accent: "#FF9F43",
    background: "#fff",
    text: "#1E293B",
    textSecondary: "#475569",
  };

  const brandColor = branding?.primary_color || theme.primary;
  const accentColor = branding?.secondary_color || theme.accent;
  const bgColor = branding?.background_color || theme.background;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={branding?.logo_url ? { uri: branding.logo_url } : require("../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={[styles.logoText, { color: theme.text }]}>
            {branding?.app_display_name || 'VTFree App'}
          </Text>
        </View>
      </View>

      {/* Slider */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.slider}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: '#F0F9FF' }]}>
                <MaterialIcons name={slide.icon} size={80} color={brandColor} />
              </View>
            </View>
            <Text style={[styles.title, { color: brandColor }]}>{slide.title}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex ? { backgroundColor: brandColor, width: 32 } : { backgroundColor: '#CBD5E1' },
            ]}
          />
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.trustText, { color: theme.textSecondary }]}>Trusted & Secure with Minimal Fees.</Text>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: brandColor }]}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: brandColor }]}
          onPress={() => router.push('/login')}
        >
          <Text style={[styles.secondaryButtonText, { color: brandColor }]}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 96,
    height: 96,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    fontFamily: 'Inter-Bold',
  },
  slider: {
    flex: 1,
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  trustText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;
