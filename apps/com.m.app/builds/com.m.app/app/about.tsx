import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';

export default function AboutScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

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
  };

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBg = isDark ? theme.cardDark : theme.cardLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;

  const developerInfo = {
    name: 'AmeeTech',
    email: 'aminuamee@yahoo.com',
    website: 'https://www.ameetech.org.ng',
  };

  const legalLinks = [
    {
      title: 'Terms of Service',
      icon: 'document-text',
      url: 'https://ibdata.com.ng/terms'
    },
    {
      title: 'Privacy Policy',
      icon: 'shield-checkmark',
      url: 'https://ibdata.com.ng/privacy'
    },
    {
      title: 'License Agreement',
      icon: 'document',
      url: 'https://ibdata.com.ng/license'
    }
  ];

  const socialLinks = [
    {
      title: 'Twitter',
      icon: 'logo-twitter',
      url: 'https://twitter.com/vtuapp',
      color: '#1DA1F2'
    },
    {
      title: 'Facebook',
      icon: 'logo-facebook',
      url: 'https://facebook.com/vtuapp',
      color: '#4267B2'
    },
    {
      title: 'Instagram',
      icon: 'logo-instagram',
      url: 'https://instagram.com/vtuapp',
      color: '#E1306C'
    },
    {
      title: 'LinkedIn',
      icon: 'logo-linkedin',
      url: 'https://linkedin.com/company/vtuapp',
      color: '#0077B5'
    }
  ];

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
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
        <Text style={[styles.headerTitle, { color: textColor }]}>About App</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Developer Section */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Developer Information</Text>

          <View style={styles.devContainer}>
            <View style={[styles.devIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="code-slash" size={24} color={theme.primary} />
            </View>
            <View style={styles.devInfo}>
              <Text style={[styles.devName, { color: textColor }]}>{developerInfo.name}</Text>
              <Text style={[styles.devSubtext, { color: textSecondaryColor }]}>
                Building digital solutions
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleLinkPress(`mailto:${developerInfo.email}`)}
          >
            <Ionicons name="mail-outline" size={20} color={textSecondaryColor} />
            <Text style={[styles.contactText, { color: textColor }]}>{developerInfo.email}</Text>
            <Ionicons name="open-outline" size={16} color={textSecondaryColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleLinkPress(developerInfo.website)}
          >
            <Ionicons name="globe-outline" size={20} color={textSecondaryColor} />
            <Text style={[styles.contactText, { color: textColor }]}>Visit Website</Text>
            <Ionicons name="open-outline" size={16} color={textSecondaryColor} />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Legal</Text>

          {legalLinks.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.listItem,
                index !== legalLinks.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#E5E7EB' }
              ]}
              onPress={() => handleLinkPress(link.url)}
            >
              <View style={styles.listIconContainer}>
                <Ionicons name={link.icon as any} size={20} color={textColor} />
              </View>
              <Text style={[styles.listText, { color: textColor }]}>{link.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={textSecondaryColor} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Follow Us Section */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Follow Us</Text>

          <View style={styles.socialGrid}>
            {socialLinks.map((social, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.socialButton, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}
                onPress={() => handleLinkPress(social.url)}
              >
                <Ionicons name={social.icon as any} size={24} color={social.color} />
                <Text style={[styles.socialLabel, { color: textColor }]}>{social.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: textSecondaryColor }]}>Version 1.0.0</Text>
          <Text style={[styles.copyrightText, { color: textSecondaryColor }]}>© 2024 VTU App</Text>
        </View>

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
    fontWeight: '700',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
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
  devContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  devIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  devInfo: {
    flex: 1,
  },
  devName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  devSubtext: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB', // This will need to be dynamic if strict dark mode support for divider is needed, but usually fine
    opacity: 0.1,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  listIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialButton: {
    width: '48%', // Approx half width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
  },
});