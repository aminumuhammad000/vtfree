import React, { useRef, useState, useEffect } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import { appService } from "../services/api";
import { Config } from "../constants/Config";
import { PremiumBackground } from "../components/PremiumBackground";
import { PremiumButton } from "../components/PremiumUI";
import { useTheme } from "../components/ThemeContext";

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'cellphone-wireless',
    title: 'Instant Airtime',
    description: 'Easily and quickly recharge any mobile network in seconds.',
  },
  {
    id: '2',
    icon: 'database-check',
    title: 'Data Bundles',
    description: 'Get the best prices on a wide range of data plans for all networks.',
  },
  {
    id: '3',
    icon: 'flash-circle',
    title: 'Utility Bills',
    description: 'Conveniently pay your electricity, TV, and other bills in one place.',
  },
];

const WelcomeScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef();
  const router = useRouter();
  const [branding, setBranding] = useState(null);
  const { isDark } = useTheme();

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

  const brandColor = branding?.primary_color || "#00ADFF";
  const textColor = isDark ? "#FFF" : "#000";

  return (
    <PremiumBackground isDark={isDark} brandColor={brandColor}>
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.duration(1000)} style={styles.header}>
          <Image
            source={branding?.logo_url ? { uri: branding.logo_url } : require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.brandName, { color: textColor }]}>
            {branding?.app_display_name || 'DadSub'}
          </Text>
        </Animated.View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.slider}
        >
          {slides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              <Animated.View entering={ZoomIn.delay(300 + index * 100).springify()} style={styles.iconContainer}>
                <View style={[styles.iconBlob, { backgroundColor: brandColor + '15' }]}>
                  <MaterialCommunityIcons name={slide.icon} size={80} color={brandColor} />
                </View>
              </Animated.View>
              <Animated.Text entering={FadeInDown.delay(400 + index * 100)} style={[styles.title, { color: textColor }]}>
                {slide.title}
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(500 + index * 100)} style={[styles.description, { color: isDark ? '#AAA' : '#666' }]}>
                {slide.description}
              </Animated.Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex ? { backgroundColor: brandColor, width: 24 } : { backgroundColor: isDark ? '#333' : '#DDD' },
                ]}
              />
            ))}
          </View>

          <PremiumButton
            title="Get Started"
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.push('/signup');
            }}
            brandColor={brandColor}
          />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/login');
            }}
          >
            <Text style={[styles.loginText, { color: brandColor }]}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PremiumBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  slider: {
    flex: 1,
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconBlob: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  footer: {
    padding: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    width: 6,
  },
  loginBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default WelcomeScreen;
