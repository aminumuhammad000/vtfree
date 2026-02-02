import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import Colors from '../constants/Colors';
import { Home, Grid, User, Wallet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const [dimensions, setDimensions] = React.useState({ height: 0, width: 0 });
    const buttonWidth = dimensions.width / state.routes.length;

    const onTabbarLayout = (e: LayoutChangeEvent) => {
        setDimensions({
            height: e.nativeEvent.layout.height,
            width: e.nativeEvent.layout.width,
        });
    };

    const tabPositionX = useSharedValue(0);

    useEffect(() => {
        if (dimensions.width > 0) {
            tabPositionX.value = withSpring(buttonWidth * state.index, {
                damping: 20,
                stiffness: 150,
            });
        }
    }, [state.index, dimensions.width]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: tabPositionX.value }],
            width: buttonWidth,
        };
    });

    const getIcon = (label: string, isFocused: boolean) => {
        const color = isFocused ? Colors.white : Colors.gray[400];
        const size = isFocused ? 20 : 22; // Slightly smaller if labeled

        switch (label) {
            case 'Home':
                return <Home color={color} size={size} strokeWidth={isFocused ? 2.5 : 2} />;
            case 'My Apps':
                return <Grid color={color} size={size} strokeWidth={isFocused ? 2.5 : 2} />;
            case 'Wallet':
                return <Wallet color={color} size={size} strokeWidth={isFocused ? 2.5 : 2} />;
            case 'Me':
                return <User color={color} size={size} strokeWidth={isFocused ? 2.5 : 2} />;
            default:
                return <Home color={color} size={size} strokeWidth={isFocused ? 2.5 : 2} />;
        }
    };

    return (
        <View style={styles.container}>
            <View onLayout={onTabbarLayout} style={styles.tabBar}>
                {/* Active Indicator Background */}
                <Animated.View style={[styles.activeIndicatorContainer, animatedStyle]}>
                    <LinearGradient
                        colors={[Colors.primary, '#10B981'] as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.activeIndicator}
                    />
                </Animated.View>

                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.name}
                            onPress={onPress}
                            style={styles.tabBarItem}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconWrapper}>
                                {getIcon(label as string, isFocused)}
                                {isFocused && (
                                    <Animated.View
                                        entering={FadeIn.duration(200)}
                                        exiting={FadeOut.duration(200)}
                                        style={styles.labelWrapper}
                                    >
                                        <Text
                                            style={[
                                                styles.tabLabel,
                                                { color: Colors.white }
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {label as string}
                                        </Text>
                                    </Animated.View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 34 : 24,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        height: 72,
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',

        // Sophisticated shadow
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,

        // Glassy border
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
    },
    tabBarItem: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapper: {
        flexDirection: 'column', // Text moved to below icon
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    labelWrapper: {
        marginTop: 2, // Spacing between icon and text
    },
    tabLabel: {
        fontSize: 10, // Much smaller font
        fontWeight: '800',
        letterSpacing: 0.1,
        textTransform: 'uppercase', // Professional look
    },
    activeIndicatorContainer: {
        position: 'absolute',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeIndicator: {
        width: '82%', // Slightly tighter indicator
        height: 58,
        borderRadius: 29,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
    },
});
