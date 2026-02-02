import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Smartphone, Zap, Shield, TrendingUp, ArrowRight, Check } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    withSpring,
    withTiming,
    FadeInDown,
    FadeIn,
    SharedValue
} from 'react-native-reanimated';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Welcome to VTfree',
        description: 'The easiest way to build and launch your own VTU mobile application.',
        image: require('../assets/images/logo.png'),
        type: 'image'
    },
    {
        id: '2',
        title: 'No Coding Required',
        description: 'Create professional apps in minutes with our intuitive app builder.',
        icon: Zap,
        type: 'icon'
    },
    {
        id: '3',
        title: 'Monetize Your Traffic',
        description: 'Start earning immediately with built-in payment gateways and VTU services.',
        icon: TrendingUp,
        type: 'icon'
    },
    {
        id: '4',
        title: 'Secure & Reliable',
        description: 'Bank-grade security for you and your customers. 99.9% uptime guaranteed.',
        icon: Shield,
        type: 'icon'
    }
];

const SlideItem = ({ item, index, scrollX }: { item: any, index: number, scrollX: SharedValue<number> }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
        ];

        const scale = interpolate(
            scrollX.value,
            inputRange,
            [0.5, 1, 0.5],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.5, 1, 0.5],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale }],
            opacity,
        };
    });

    return (
        <View style={styles.slide}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
                <View style={styles.iconCircle}>
                    {item.type === 'image' ? (
                        <Image
                            source={item.image}
                            style={styles.slideImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <item.icon color={Colors.primary} size={64} />
                    )}
                </View>
            </Animated.View>
            <Animated.View
                entering={FadeInDown.delay(300).springify()}
                style={styles.textContainer}
            >
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </Animated.View>
        </View>
    );
};

const Paginator = ({ data, scrollX }: { data: any[], scrollX: SharedValue<number> }) => {
    return (
        <View style={styles.paginatorContainer}>
            {data.map((_, i) => {
                const animatedDotStyle = useAnimatedStyle(() => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const widthDot = interpolate(
                        scrollX.value,
                        inputRange,
                        [10, 20, 10],
                        Extrapolation.CLAMP
                    );
                    const opacity = interpolate(
                        scrollX.value,
                        inputRange,
                        [0.5, 1, 0.5],
                        Extrapolation.CLAMP
                    );
                    return {
                        width: widthDot,
                        opacity,
                    };
                });

                return (
                    <Animated.View
                        key={i.toString()}
                        style={[styles.dot, animatedDotStyle]}
                    />
                );
            })}
        </View>
    );
};

export default function OnboardingScreen() {
    const router = useRouter();
    const { completeOnboarding } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useSharedValue(0);
    const slidesRef = useRef<FlatList>(null);

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    const scrollToNext = async () => {
        if (currentIndex < slides.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            await completeOnboarding();
            router.push('/login');
        }
    };

    const skip = async () => {
        await completeOnboarding();
        router.push('/login');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.primary, Colors.primaryLight]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={skip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <Animated.FlatList
                data={slides}
                renderItem={({ item, index }) => <SlideItem item={item} index={index} scrollX={scrollX} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                keyExtractor={(item) => item.id}
                onScroll={scrollHandler}
                scrollEventThrottle={32}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
                ref={slidesRef}
            />

            <View style={styles.footer}>
                <Paginator data={slides} scrollX={scrollX} />

                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={scrollToNext}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[Colors.white, '#f0f0f0']}
                        style={styles.nextButtonGradient}
                    >
                        {currentIndex === slides.length - 1 ? (
                            <Text style={styles.getStartedText}>Get Started</Text>
                        ) : (
                            <ArrowRight color={Colors.primary} size={24} />
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    skipButton: {
        padding: 10,
    },
    skipText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16,
        fontWeight: '600',
    },
    slide: {
        width,
        alignItems: 'center',
        padding: 20,
    },
    imageContainer: {
        flex: 0.6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    slideImage: {
        width: 80,
        height: 80,
    },
    textContainer: {
        flex: 0.4,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.white,
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        height: 140,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    paginatorContainer: {
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.white,
        marginHorizontal: 8,
    },
    nextButton: {
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    nextButtonGradient: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    getStartedText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },
});
