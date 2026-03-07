import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeContext';

const { width, height } = Dimensions.get('window');

const Blob = ({ size, color, initialX, initialY, duration, delay }) => {
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        tx.value = withDelay(delay, withRepeat(withTiming(Math.random() * 150 - 75, { duration }), -1, true));
        ty.value = withDelay(delay, withRepeat(withTiming(Math.random() * 150 - 75, { duration }), -1, true));
        scale.value = withDelay(delay, withRepeat(withTiming(1.3, { duration: duration * 0.8 }), -1, true));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: scale.value }
        ]
    }));

    return (
        <Animated.View style={[
            styles.blob,
            {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                left: initialX,
                top: initialY,
                opacity: 0.12
            },
            animatedStyle
        ]} />
    );
};

export const PremiumBackground = ({ children, isDark: propIsDark, brandColor: propBrandColor }) => {
    const { isDark: themeIsDark, theme } = useTheme();
    const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;
    const brandColor = propBrandColor || theme.primary;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
            <View style={StyleSheet.absoluteFill}>
                <Blob
                    size={width * 1.2}
                    color={brandColor}
                    initialX={-width * 0.4}
                    initialY={-height * 0.2}
                    duration={15000}
                    delay={0}
                />
                <Blob
                    size={width * 0.9}
                    color={isDark ? '#333' : '#F0F0F0'}
                    initialX={width * 0.4}
                    initialY={height * 0.2}
                    duration={18000}
                    delay={2000}
                />
                <Blob
                    size={width * 1.1}
                    color={brandColor}
                    initialX={width * 0.0}
                    initialY={height * 0.6}
                    duration={20000}
                    delay={4000}
                />
            </View>
            <LinearGradient
                colors={[
                    isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
                    isDark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.92)'
                ]}
                style={StyleSheet.absoluteFill}
            />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    blob: {
        position: 'absolute',
    }
});
