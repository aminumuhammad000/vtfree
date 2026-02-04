import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeIn } from 'react-native-reanimated';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

interface CustomAlertProps {
    visible: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    onClose: () => void;
    showCancel?: boolean;
    confirmText?: string;
    onConfirm?: () => void;
}

export default function CustomAlert({
    visible,
    type,
    title,
    message,
    onClose,
    showCancel,
    confirmText,
    onConfirm
}: CustomAlertProps) {
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, { damping: 15 });
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            scale.value = 0.8;
            opacity.value = 0;
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle color={Colors.white} size={32} />;
            case 'error':
                return <XCircle color={Colors.white} size={32} />;
            case 'warning':
                return <AlertCircle color={Colors.white} size={32} />;
            default:
                return <CheckCircle color={Colors.white} size={32} />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success':
                return [Colors.green[500], Colors.green[600]];
            case 'error':
                return [Colors.red[500], Colors.red[700]];
            case 'warning':
                return [Colors.yellow[500], Colors.yellow[700]];
            default:
                return [Colors.primary, Colors.primaryLight];
        }
    };

    return (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, animatedStyle]}>
                    <View style={styles.iconWrapper}>
                        <LinearGradient
                            colors={getColors() as [string, string]}
                            style={styles.iconCircle}
                        >
                            {getIcon()}
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {showCancel && (
                            <TouchableOpacity onPress={onClose} style={[styles.button, { flex: 1, backgroundColor: Colors.gray[100] }]} activeOpacity={0.8}>
                                <Text style={[styles.buttonText, { color: Colors.gray[700] }]}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={onConfirm || onClose}
                            style={[styles.button, showCancel && { flex: 1 }]}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={type === 'error' ? [Colors.red[500], Colors.red[600]] : [Colors.primary, Colors.primaryLight]}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>{confirmText || 'OK'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    iconWrapper: {
        marginBottom: 16,
        marginTop: -48,
        padding: 4,
        backgroundColor: 'white',
        borderRadius: 40,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
