import React, { useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Animated,
    ActivityIndicator
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const PremiumInput = ({
    label,
    icon,
    value,
    onChangeText,
    secureTextEntry,
    placeholder,
    keyboardType = 'default',
    autoCapitalize = 'none',
    error,
    isDark
}) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(focusAnim, {
            toValue: isFocused ? 1 : 0,
            useNativeDriver: false,
            friction: 8,
            tension: 40
        }).start();
    }, [isFocused]);

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [isDark ? '#333' : '#E0E0E0', '#00ADFF']
    });

    const iconColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [isDark ? '#666' : '#999', '#00ADFF']
    });

    const handleFocus = () => {
        setIsFocused(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    return (
        <View style={styles.inputContainer}>
            {label && <Text style={[styles.label, { color: isDark ? '#AAA' : '#666' }]}>{label}</Text>}
            <Animated.View style={[
                styles.inputWrapper,
                {
                    borderColor,
                    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                    borderWidth: 1.5
                }
            ]}>
                {icon && (
                    <Animated.View style={{ paddingRight: 10 }}>
                        <MaterialCommunityIcons
                            name={icon}
                            size={22}
                            color={isFocused ? '#00ADFF' : (isDark ? '#666' : '#999')}
                        />
                    </Animated.View>
                )}
                <TextInput
                    style={[styles.input, { color: isDark ? '#FFF' : '#000' }]}
                    value={value}
                    onChangeText={(text) => {
                        onChangeText(text);
                        if (text.length > value.length) {
                            // Subtle feedback on typing
                            // Haptics.selectionAsync(); 
                        }
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={secureTextEntry}
                    placeholder={placeholder}
                    placeholderTextColor={isDark ? '#555' : '#BBB'}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                />
            </Animated.View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

export const PremiumButton = ({
    title,
    onPress,
    loading,
    disabled,
    variant = 'primary',
    style,
    brandColor = '#00ADFF'
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true
        }).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true
        }).start();
    };

    const backgroundColor = variant === 'primary' ? brandColor : 'transparent';
    const textColor = variant === 'primary' ? '#FFF' : brandColor;

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', ...style }}>
            <TouchableOpacity
                onPress={() => {
                    onPress();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[
                    styles.button,
                    { backgroundColor },
                    variant === 'outline' && { borderWidth: 2, borderColor: brandColor },
                    disabled && { opacity: 0.6 }
                ]}
            >
                {loading ? (
                    <ActivityIndicator color={textColor} />
                ) : (
                    <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 18,
        width: '100%',
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    button: {
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    }
});
