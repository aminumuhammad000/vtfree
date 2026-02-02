import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Download, Globe, Monitor, Rocket, Smartphone, ArrowLeft, Lock, Copy, Eye, EyeOff, Wallet } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withRepeat,
    Easing,
    FadeInDown,
    FadeInRight,
    useAnimatedProps,
    interpolate
} from 'react-native-reanimated';
import { AppService } from '../services/app.service';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function BuildStatusScreen() {
    const router = useRouter();
    const { adminCredentials, appId } = useLocalSearchParams();
    const [progress, setProgress] = useState(0);
    const [currentPhase, setCurrentPhase] = useState(0);
    const [parsedCredentials, setParsedCredentials] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [currentStage, setCurrentStage] = useState('Fetching status...');
    const [isBuildFailed, setIsBuildFailed] = useState(false);
    const [buildError, setBuildError] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<string>('loading');
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        if (adminCredentials) {
            try {
                setParsedCredentials(JSON.parse(adminCredentials as string));
            } catch (e) {
                console.error('Failed to parse admin credentials', e);
            }
        }
    }, [adminCredentials]);

    const phases = [
        { label: 'Initializing build environment', duration: 15 },
        { label: 'Setting up branding and assets', duration: 20 },
        { label: 'Configuring VTU services', duration: 25 },
        { label: 'Building Android app', duration: 30 },
        { label: 'Building web application', duration: 35 },
        { label: 'Setting up admin panel', duration: 40 },
        { label: 'Running tests', duration: 50 },
        { label: 'Finalizing build', duration: 60 },
        { label: 'Packaging files', duration: 80 },
        { label: 'Build complete!', duration: 100 }
    ];

    // Animation values
    const progressValue = useSharedValue(0);
    const rotation = useSharedValue(0);
    const scale = useSharedValue(0);
    const completeScale = useSharedValue(0);

    useEffect(() => {
        // Start initial animations
        scale.value = withSpring(1, { damping: 12 });
        rotation.value = withRepeat(withTiming(360, { duration: 2000, easing: Easing.linear }), -1);

        let interval: any;

        const checkStatus = async () => {
            if (!appId) return;
            try {
                const response = await AppService.getBuildStatus(appId as string);
                if (response.success) {
                    const data = response.data;
                    setProgress(data.progress || 0);
                    setCurrentStage(data.stage || 'Processing...');
                    setPaymentStatus(data.payment_status || 'paid');

                    if (data.status === 'live' || data.status === 'completed') {
                        setProgress(100);
                        clearInterval(interval);
                    } else if (data.status === 'failed') {
                        setIsBuildFailed(true);
                        setBuildError(data.error || 'Unknown build error');
                        clearInterval(interval);
                    }
                }
            } catch (error) {
                console.error('Error fetching build status:', error);
            }
        };

        // Poll every 3 seconds
        checkStatus();
        interval = setInterval(checkStatus, 3000);

        return () => clearInterval(interval);
    }, [appId]);

    useEffect(() => {
        progressValue.value = withTiming(progress, { duration: 150 });

        const phase = phases.findIndex(p => progress < p.duration);
        setCurrentPhase(phase === -1 ? phases.length - 1 : Math.max(0, phase - 1));

        if (progress === 100) {
            completeScale.value = withSpring(1, { damping: 12 });
        }
    }, [progress]);

    const isComplete = progress === 100;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    const animatedCircleProps = useAnimatedProps(() => {
        const strokeDashoffset = circumference - (progressValue.value / 100) * circumference;
        return {
            strokeDashoffset,
        };
    });

    const rotationStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    const scaleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const completeStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: completeScale.value }, { rotate: `${interpolate(completeScale.value, [0, 1], [-180, 0])}deg` }],
        };
    });

    const progressBarStyle = useAnimatedStyle(() => {
        return {
            width: `${progressValue.value}%`,
        };
    });

    const handlePayAndStart = async () => {
        if (!appId) return;
        try {
            setIsPaying(true);
            const response = await AppService.payAndStartBuild(appId as string);
            if (response.success) {
                setPaymentStatus('paid');
                // Status will be updated by the next poll
            } else {
                Alert.alert('Payment Failed', response.message || 'Please check your balance.');
            }
        } catch (error: any) {
            console.error('Pay and start build error:', error);
            Alert.alert('Error', error.message || 'An error occurred while processing payment.');
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Build Status</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Build Status Icon */}
                <Animated.View style={[styles.statusIconContainer, scaleStyle]}>
                    {isComplete ? (
                        <Animated.View style={[styles.completeIcon, completeStyle]}>
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryLight]}
                                style={styles.completeGradient}
                            >
                                <CheckCircle color={Colors.white} size={64} />
                            </LinearGradient>
                        </Animated.View>
                    ) : paymentStatus === 'loading' ? (
                        <View style={styles.buildingIcon}>
                            <ActivityIndicator color={Colors.primary} size="large" />
                        </View>
                    ) : paymentStatus === 'pending' ? (
                        <View style={styles.pausedIconContainer}>
                            <LinearGradient
                                colors={[Colors.gray[100], Colors.gray[200]]}
                                style={styles.pausedGradient}
                            >
                                <Wallet color={Colors.primary} size={64} />
                            </LinearGradient>
                            <View style={styles.pausedBadge}>
                                <Lock color={Colors.white} size={16} />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.buildingIcon}>
                            <Animated.View style={[styles.spinnerContainer, rotationStyle]}>
                                <Svg width={100} height={100} viewBox="0 0 100 100">
                                    <Defs>
                                        <SvgGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <Stop offset="0%" stopColor={Colors.primary} />
                                            <Stop offset="100%" stopColor={Colors.primaryLight} />
                                        </SvgGradient>
                                    </Defs>
                                    <Circle
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        stroke={Colors.primaryLighter}
                                        strokeWidth="8"
                                        fill="none"
                                    />
                                    <AnimatedCircle
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        stroke="url(#grad)"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={circumference}
                                        strokeLinecap="round"
                                        animatedProps={animatedCircleProps}
                                    />
                                </Svg>
                            </Animated.View>
                            <View style={styles.rocketContainer}>
                                <Rocket color={Colors.primary} size={48} />
                            </View>
                        </View>
                    )}

                    <Text style={styles.statusTitle}>
                        {isBuildFailed ? 'Build Failed' : (isComplete ? 'Build Complete!' : (paymentStatus === 'pending' ? 'Payment Required' : 'Building Your App'))}
                    </Text>
                    <Text style={[styles.statusSubtitle, isBuildFailed && { color: '#EF4444' }]}>
                        {isBuildFailed ? buildError : (isComplete ? 'Your app is ready to download and deploy' : (paymentStatus === 'pending' ? 'Fund your wallet to start building' : currentStage))}
                    </Text>
                </Animated.View>

                {/* Pending Payment Action */}
                {paymentStatus === 'pending' && (
                    <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, { borderColor: Colors.primary, borderWidth: 1 }]}>
                        <View style={styles.pendingHeader}>
                            <Wallet color={Colors.primary} size={24} />
                            <Text style={styles.pendingTitle}>Start Automation</Text>
                        </View>
                        <Text style={styles.pendingDesc}>
                            Your app details are saved. Fund your wallet and click below to initiate the automated build & deployment process.
                        </Text>
                        <TouchableOpacity
                            style={[styles.payButton, isPaying && { opacity: 0.7 }]}
                            onPress={handlePayAndStart}
                            disabled={isPaying}
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryLight]}
                                style={styles.payButtonGradient}
                            >
                                {isPaying ? (
                                    <ActivityIndicator color={Colors.white} />
                                ) : (
                                    <>
                                        <Rocket color={Colors.white} size={20} />
                                        <Text style={styles.payButtonText}>Pay & Start Build</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Progress Bar */}
                <Animated.View entering={FadeInDown.delay(300)} style={[styles.card, paymentStatus === 'pending' && { opacity: 0.6 }]}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.cardLabel}>Progress</Text>
                        <Text style={styles.progressText}>{paymentStatus === 'pending' ? '0' : progress}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <Animated.View style={[styles.progressBarFill, paymentStatus === 'pending' ? { width: '0%' } : progressBarStyle]}>
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryLight]}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        </Animated.View>
                    </View>
                    {!isComplete && (
                        <Text style={styles.etaText}>
                            {paymentStatus === 'pending'
                                ? 'Build will start immediately after payment'
                                : `Estimated time remaining: ${Math.max(1, Math.ceil((100 - progress) / 20))} minutes`}
                        </Text>
                    )}
                </Animated.View>

                {/* Build Phases */}
                <Animated.View entering={FadeInDown.delay(500)} style={styles.card}>
                    <Text style={styles.cardTitle}>Build Phases</Text>
                    <View style={styles.phasesList}>
                        {phases.slice(0, -1).map((phase, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInRight.delay(600 + index * 50)}
                                style={[
                                    styles.phaseItem,
                                    index < currentPhase && styles.phaseCompleted,
                                    index === currentPhase && styles.phaseCurrent,
                                    index > currentPhase && styles.phasePending
                                ]}
                            >
                                <View style={[
                                    styles.phaseIcon,
                                    index < currentPhase && styles.phaseIconCompleted,
                                    index === currentPhase && styles.phaseIconCurrent,
                                    index > currentPhase && styles.phaseIconPending
                                ]}>
                                    {index < currentPhase ? (
                                        <CheckCircle color={Colors.white} size={16} />
                                    ) : index === currentPhase ? (
                                        <Animated.View style={rotationStyle}>
                                            <View style={styles.phaseSpinner} />
                                        </Animated.View>
                                    ) : (
                                        <Text style={styles.phaseNumber}>{index + 1}</Text>
                                    )}
                                </View>
                                <Text style={[
                                    styles.phaseLabel,
                                    index <= currentPhase ? styles.textPrimary : styles.textGray
                                ]}>
                                    {phase.label}
                                </Text>
                            </Animated.View>
                        ))}
                    </View>
                </Animated.View>

                {/* Download Links */}
                {isComplete && (
                    <Animated.View entering={FadeInDown.delay(300)} style={styles.downloadsSection}>

                        {/* Admin Credentials Card */}
                        {parsedCredentials && (
                            <View style={styles.credentialsCard}>
                                <View style={styles.credentialsHeader}>
                                    <Lock color={Colors.white} size={20} />
                                    <Text style={styles.credentialsTitle}>Admin Access Credentials</Text>
                                </View>
                                <View style={styles.credentialsContent}>
                                    <Text style={styles.credentialsWarning}>Save these details! You won't see them again.</Text>

                                    <View style={styles.credentialRow}>
                                        <Text style={styles.credentialLabel}>Login URL:</Text>
                                        <Text selectable style={styles.credentialValue}>{parsedCredentials.login_url}</Text>
                                    </View>

                                    <View style={styles.credentialRow}>
                                        <Text style={styles.credentialLabel}>Email:</Text>
                                        <Text selectable style={styles.credentialValue}>{parsedCredentials.email}</Text>
                                    </View>

                                    <View style={styles.credentialRow}>
                                        <Text style={styles.credentialLabel}>Password:</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <Text selectable style={[styles.credentialValue, { flex: 1 }]}>
                                                {showPassword ? parsedCredentials.password : '••••••••••••'}
                                            </Text>
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                                {showPassword ? <EyeOff size={18} color={Colors.primary} /> : <Eye size={18} color={Colors.primary} />}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        <Text style={styles.downloadsTitle}>Download Your App</Text>

                        <TouchableOpacity style={styles.downloadCard} activeOpacity={0.8}>
                            <View style={[styles.downloadIcon, { backgroundColor: Colors.primary }]}>
                                <Smartphone color={Colors.white} size={24} />
                            </View>
                            <View style={styles.downloadInfo}>
                                <Text style={styles.downloadName}>Android App (APK)</Text>
                                <Text style={styles.downloadDesc}>Download for Android devices</Text>
                            </View>
                            <Download color={Colors.primary} size={24} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.downloadCard, { borderColor: Colors.primaryLight }]} activeOpacity={0.8}>
                            <View style={[styles.downloadIcon, { backgroundColor: Colors.primaryLight }]}>
                                <Globe color={Colors.white} size={24} />
                            </View>
                            <View style={styles.downloadInfo}>
                                <Text style={styles.downloadName}>Web Application</Text>
                                <Text style={styles.downloadDesc}>https://yourapp.vtfree.app</Text>
                            </View>
                            <Download color={Colors.primaryLight} size={24} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.downloadCard} activeOpacity={0.8}>
                            <View style={[styles.downloadIcon, { backgroundColor: Colors.primary }]}>
                                <Monitor color={Colors.white} size={24} />
                            </View>
                            <View style={styles.downloadInfo}>
                                <Text style={styles.downloadName}>Admin Panel</Text>
                                <Text style={styles.downloadDesc}>https://admin.yourapp.vtfree.app</Text>
                            </View>
                            <Download color={Colors.primary} size={24} />
                        </TouchableOpacity>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.dashboardButton}
                                onPress={() => router.push('/dashboard')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryLight]}
                                    style={styles.dashboardButtonGradient}
                                >
                                    <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.buildAnotherButton}
                                onPress={() => router.push('/create-app')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buildAnotherText}>Build Another</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.nextStepsCard}>
                            <Text style={styles.nextStepsTitle}>Next Steps</Text>
                            {[
                                'Test your app thoroughly before distributing',
                                'Set up your payment gateway credentials',
                                'Configure your VTU API keys in the admin panel',
                                'Share your app with customers'
                            ].map((step, i) => (
                                <View key={i} style={styles.stepItem}>
                                    <CheckCircle color={Colors.primary} size={20} />
                                    <Text style={styles.stepText}>{step}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 48,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    statusIconContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    buildingIcon: {
        width: 128,
        height: 128,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    spinnerContainer: {
        position: 'absolute',
        width: 100,
        height: 100,
    },
    rocketContainer: {
        width: 128,
        height: 128,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderRadius: 64,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    completeIcon: {
        width: 128,
        height: 128,
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    completeGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    statusSubtitle: {
        fontSize: 16,
        color: Colors.gray[600],
        textAlign: 'center',
    },
    pausedIconContainer: {
        width: 128,
        height: 128,
        marginBottom: 24,
        position: 'relative',
    },
    pausedGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 64,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    pausedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.white,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardLabel: {
        fontSize: 16,
        color: Colors.gray[700],
        fontWeight: '500',
    },
    progressText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 12,
        backgroundColor: Colors.gray[200],
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    etaText: {
        textAlign: 'center',
        color: Colors.gray[500],
        fontSize: 14,
        marginTop: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 16,
    },
    phasesList: {
        gap: 12,
    },
    phaseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
    },
    phaseCompleted: {
        backgroundColor: Colors.primaryLighter,
    },
    phaseCurrent: {
        backgroundColor: '#FEFCE8', // yellow-50 equivalent
    },
    phasePending: {
        backgroundColor: Colors.gray[50],
    },
    phaseIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseIconCompleted: {
        backgroundColor: Colors.primary,
    },
    phaseIconCurrent: {
        backgroundColor: Colors.yellow[500],
    },
    phaseIconPending: {
        backgroundColor: Colors.gray[300],
    },
    phaseSpinner: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Colors.white,
        borderTopColor: 'transparent',
    },
    phaseNumber: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600',
    },
    phaseLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    textPrimary: {
        color: Colors.text.primary,
    },
    textGray: {
        color: Colors.gray[500],
    },
    downloadsSection: {
        gap: 16,
    },
    downloadsTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.text.primary,
        textAlign: 'center',
        marginBottom: 16,
    },
    downloadCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    downloadIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadInfo: {
        flex: 1,
    },
    downloadName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    downloadDesc: {
        fontSize: 12,
        color: Colors.gray[600],
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    dashboardButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    dashboardButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dashboardButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    buildAnotherButton: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buildAnotherText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    nextStepsCard: {
        backgroundColor: Colors.primaryLighter,
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
    },
    nextStepsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 12,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: Colors.gray[700],
        lineHeight: 20,
    },
    pendingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    pendingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
    },
    pendingDesc: {
        fontSize: 14,
        color: Colors.gray[600],
        marginBottom: 20,
        lineHeight: 20,
    },
    payButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    payButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    payButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    credentialsCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.primary,
        marginBottom: 8,
    },
    credentialsHeader: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
    },
    credentialsTitle: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    credentialsContent: {
        padding: 16,
        gap: 12,
    },
    credentialsWarning: {
        fontSize: 12,
        color: Colors.red[500],
        fontWeight: '600',
        marginBottom: 4,
    },
    credentialRow: {
        gap: 4,
    },
    credentialLabel: {
        fontSize: 12,
        color: Colors.gray[500],
        fontWeight: '500',
    },
    credentialValue: {
        fontSize: 16,
        color: Colors.text.primary,
        fontWeight: '600',
    },
});
