import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export const Logo = ({ size = 48, color = 'white' }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <MaterialIcons name="phone-iphone" size={size * 0.7} color={color} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    backgroundColor: '#0a335c',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Logo;
