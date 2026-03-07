import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import * as Network from 'expo-network';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ConnectionIndicator = () => {
    const [isConnected, setIsConnected] = useState(true);
    const slideAnim = React.useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        const checkConnection = async () => {
            const state = await Network.getNetworkStateAsync();
            setIsConnected(state.isConnected && state.isInternetReachable);
        };

        const interval = setInterval(checkConnection, 5000);
        checkConnection();

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isConnected) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
                tension: 40
            }).start();
        } else {
            Animated.spring(slideAnim, {
                toValue: -100,
                useNativeDriver: true
            }).start();
        }
    }, [isConnected]);

    return (
        <Animated.View style={[
            styles.container,
            { transform: [{ translateY: slideAnim }] }
        ]}>
            <View style={styles.banner}>
                <MaterialCommunityIcons name="wifi-off" size={20} color="#FFF" />
                <Text style={styles.text}>No Internet Connection</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 20,
        right: 20,
        zIndex: 9999,
    },
    banner: {
        backgroundColor: '#FF3B30',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    text: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 10,
    }
});
