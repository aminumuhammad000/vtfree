import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSpring, withSequence, withDelay } from 'react-native-reanimated';
import Colors from '../constants/Colors';

export default function FloatingChatButton() {
    const router = useRouter();
    const scale = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        // Pop in animation
        scale.value = withSpring(1, { damping: 10 });

        // Gentle float animation
        translateY.value = withRepeat(
            withSequence(
                withSpring(-5, { damping: 100 }),
                withSpring(5, { damping: 100 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { translateY: translateY.value }
            ]
        };
    });

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={() => router.push('/chat')}
            >
                <MessageCircle color={Colors.white} size={28} fill={Colors.white} />
            </TouchableOpacity>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>1</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100, // Above the tab bar
        right: 20,
        zIndex: 9999, // Ensure it's above everything
    },
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: 0,
        backgroundColor: Colors.red[500],
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
});
