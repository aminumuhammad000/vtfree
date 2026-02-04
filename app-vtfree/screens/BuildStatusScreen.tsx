import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Download, Globe, Monitor, Rocket, Smartphone, ArrowLeft, Lock, Copy, Eye, EyeOff, Wallet, CreditCard, Check, XCircle, RotateCcw } from 'lucide-react-native';
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
    const [isRetrying, setIsRetrying] = useState(false);

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

    const [estimatedFinishAt, setEstimatedFinishAt] = useState<string | null>(null);

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
                    setEstimatedFinishAt(data.estimated_finish_at || null);

                    if (data.status === 'live' || data.status === 'completed') {
                        setProgress(100);
                        setIsBuildFailed(false);
                        clearInterval(interval);
                    } else if (data.status === 'failed') {
                        setIsBuildFailed(true);
                        setBuildError(data.error || 'Build encountered an error. Please try again or contact support.');
                        clearInterval(interval);
                    } else {
                        setIsBuildFailed(false);
                        setBuildError('');
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

    const [showVerifyPaymentModal, setShowVerifyPaymentModal] = useState(false);
    const [paymentVerificationData, setPaymentVerificationData] = useState<{ reference: string, payload: any } | null>(null);

    const handlePayAndStart = async () => {
        if (!appId) return;
        try {
            setIsPaying(true);
            const response = await AppService.payAndStartBuild(appId as string);
            if (response.success) {
                // If the message says already paid, show info
                if (response.message && response.message.includes('already paid')) {
                    Alert.alert('Info', response.message);
                }

                if (response.payment_required) {
                    if (response.payment_url) {
                        try {
                            const WebBrowser = require('expo-web-browser');
                            await WebBrowser.openBrowserAsync(response.payment_url);
                            setPaymentVerificationData({ reference: response.reference, payload: { appId } });
                            setShowVerifyPaymentModal(true);
                        } catch (e) {
                            Alert.alert("Payment Link", "Please visit: " + response.payment_url);
                        }
                    }
                } else {
                    setPaymentStatus('paid');
                }
            } else {
                Alert.alert('Payment Failed', response.message || 'Please check your balance.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred.');
        } finally {
            setIsPaying(false);
        }
    };

    const handleRetry = async () => {
        if (!appId) return;
        try {
            setIsRetrying(true);
            const response = await AppService.buildApp(appId as string);
            if (response.success) {
                setIsBuildFailed(false);
                setBuildError('');
                setProgress(0);
                setCurrentStage('Queued for rebuild...');
                // Restart polling by triggering a re-render or just let the effect handle it if appId hasn't changed
                // (In this case, we might need to manually restart the interval if we cleared it)
                router.replace({ pathname: '/build-status', params: { appId, adminCredentials } });
            } else {
                Alert.alert('Retry Failed', response.message || 'Could not restart build.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred.');
        } finally {
            setIsRetrying(false);
        }
    };

    const verifyPayment = async (reference: string) => {
        try {
            const response = await AppService.getBuildStatus(appId as string);
            if (response.success && response.data.payment_status === 'paid') {
                setPaymentStatus('paid');
                setShowVerifyPaymentModal(false);
                Alert.alert("Success", "Payment verified! Building started.");
            } else {
                Alert.alert("Verification", "Payment not yet confirmed. Please try again in a moment.");
            }
        } catch (error) {
            console.error(error);
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
                    ) : isBuildFailed ? (
                        <View style={styles.completeIcon}>
                            <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                style={styles.completeGradient}
                            >
                                <XCircle color={Colors.white} size={64} />
                            </LinearGradient>
                        </View>
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

                {/* Build Failed Retry Action */}
                {isBuildFailed && (
                    <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, { borderColor: '#EF4444', borderWidth: 1 }]}>
                        <View style={styles.pendingHeader}>
                            <XCircle color="#EF4444" size={24} />
                            <Text style={[styles.pendingTitle, { color: '#EF4444' }]}>Build Encountered an Error</Text>
                        </View>
                        <Text style={styles.pendingDesc}>
                            Something went wrong while building your app. You can try restarting the build process.
                        </Text>
                        <TouchableOpacity
                            style={[styles.payButton, isRetrying && { opacity: 0.7 }]}
                            onPress={handleRetry}
                            disabled={isRetrying}
                        >
                            <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                style={styles.payButtonGradient}
                            >
                                {isRetrying ? (
                                    <ActivityIndicator color={Colors.white} />
                                ) : (
                                    <>
                                        <RotateCcw color={Colors.white} size={20} />
                                        <Text style={styles.payButtonText}>Retry Build</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Pending Payment Action */}
                {paymentStatus === 'pending' && !isBuildFailed && (
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
                <Animated.View entering={FadeInDown.delay(300)} style={[styles.card, (paymentStatus === 'pending' || isBuildFailed) && { opacity: 0.6 }]}>
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
                    {!isComplete && !isBuildFailed && (
                        <Text style={styles.etaText}>
                            {paymentStatus === 'pending'
                                ? 'Build will start immediately after payment'
                                : (estimatedFinishAt
                                    ? `Estimated time remaining: ${Math.max(1, Math.ceil((new Date(estimatedFinishAt).getTime() - Date.now()) / 60000))} minutes`
                                    : 'Calculating remaining time...')
                            }
                            {estimatedFinishAt && new Date(estimatedFinishAt).getTime() < Date.now() && !isComplete && (
                                "\n(Almost done, just wrapping up...)"
                            )}
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
                                    index === currentPhase && !isBuildFailed && styles.phaseCurrent,
                                    (index > currentPhase || (index === currentPhase && isBuildFailed)) && styles.phasePending
                                ]}
                            >
                                <View style={[
                                    styles.phaseIcon,
                                    index < currentPhase && styles.phaseIconCompleted,
                                    index === currentPhase && !isBuildFailed && styles.phaseIconCurrent,
                                    (index > currentPhase || (index === currentPhase && isBuildFailed)) && styles.phaseIconPending
                                ]}>
                                    {index < currentPhase ? (
                                        <CheckCircle color={Colors.white} size={16} />
                                    ) : index === currentPhase && !isBuildFailed ? (
                                        <Animated.View style={rotationStyle}>
                                            <View style={styles.phaseSpinner} />
                                        </Animated.View>
                                    ) : index === currentPhase && isBuildFailed ? (
                                        <XCircle color={Colors.red[500]} size={16} />
                                    ) : (
                                        <Text style={styles.phaseNumber}>{index + 1}</Text>
                                    )}
                                </View>
                                <Text style={[
                                    styles.phaseLabel,
                                    index <= currentPhase ? (isBuildFailed && index === currentPhase ? { color: Colors.red[500] } : styles.textPrimary) : styles.textGray
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
                        {parsedCredentials && (
                            <View style={styles.credentialsCard}>
                                <View style={styles.credentialsHeader}>
                                    <Lock color={Colors.white} size={20} />
                                    <Text style={styles.credentialsTitle}>Admin Access Credentials</Text>
                                </View>
                                <View style={styles.credentialsContent}>
                                    <Text style={styles.credentialsWarning}>Save these details! You won't see them again.</Text>
                                    <View style={styles.credentialRow}><Text style={styles.credentialLabel}>Login URL:</Text><Text selectable style={styles.credentialValue}>{parsedCredentials.login_url}</Text></View>
                                    <View style={styles.credentialRow}><Text style={styles.credentialLabel}>Email:</Text><Text selectable style={styles.credentialValue}>{parsedCredentials.email}</Text></View>
                                    <View style={styles.credentialRow}><Text style={styles.credentialLabel}>Password:</Text><View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><Text selectable style={[styles.credentialValue, { flex: 1 }]}>{showPassword ? parsedCredentials.password : '••••••••••••'}</Text><TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>{showPassword ? <EyeOff size={18} color={Colors.primary} /> : <Eye size={18} color={Colors.primary} />}</TouchableOpacity></View></View>
                                </View>
                            </View>
                        )}
                        <Text style={styles.downloadsTitle}>Download Your App</Text>
                        <TouchableOpacity style={styles.downloadCard} activeOpacity={0.8}>
                            <View style={[styles.downloadIcon, { backgroundColor: Colors.primary }]}><Smartphone color={Colors.white} size={24} /></View>
                            <View style={styles.downloadInfo}><Text style={styles.downloadName}>Android App (APK)</Text><Text style={styles.downloadDesc}>Download for Android devices</Text></View>
                            <Download color={Colors.primary} size={24} />
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </ScrollView>

            <Modal visible={showVerifyPaymentModal} transparent animationType="fade" onRequestClose={() => setShowVerifyPaymentModal(false)}>
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInRight} style={styles.modernAlertContainer}>
                        <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.modernAlertHeader}>
                            <View style={styles.alertIconContainer}><CreditCard color="#fff" size={32} /></View>
                            <Text style={styles.modernAlertTitle}>Payment Confirmation</Text>
                            <Text style={styles.modernAlertSubtitle}>Please complete payment in the browser</Text>
                        </LinearGradient>
                        <View style={styles.modernAlertContent}><Text style={styles.modernAlertMessage}>We've opened a secure payment page for you. Once you've completed the transaction, click the button below to verify and start your build.</Text></View>
                        <View style={styles.modernAlertActions}>
                            <TouchableOpacity style={styles.alertCancelButton} onPress={() => { setShowVerifyPaymentModal(false); setIsPaying(false); }}><Text style={styles.alertCancelText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.alertFundButton} onPress={() => { if (paymentVerificationData) verifyPayment(paymentVerificationData.reference); }}>
                                <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.alertFundGradient}><Check color="#fff" size={18} /><Text style={styles.alertFundText}>I Have Paid</Text></LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 48, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.text.primary },
    content: { flex: 1 },
    scrollContent: { padding: 24 },
    statusIconContainer: { alignItems: 'center', marginBottom: 32 },
    buildingIcon: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    spinnerContainer: { position: 'absolute', width: 100, height: 100 },
    rocketContainer: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, borderRadius: 64, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    completeIcon: { width: 128, height: 128, marginBottom: 24, elevation: 10, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
    completeGradient: { width: '100%', height: '100%', borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
    pausedIconContainer: { width: 128, height: 128, marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
    pausedGradient: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
    pausedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.white },
    statusTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 8, textAlign: 'center' },
    statusSubtitle: { fontSize: 16, color: Colors.gray[600], textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
    card: { backgroundColor: Colors.white, borderRadius: 16, padding: 24, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    pendingTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text.primary },
    pendingDesc: { fontSize: 14, color: Colors.gray[600], lineHeight: 20, marginBottom: 20 },
    payButton: { borderRadius: 12, overflow: 'hidden' },
    payButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
    payButtonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray[500], textTransform: 'uppercase', letterSpacing: 1 },
    progressText: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
    progressBarBg: { height: 12, backgroundColor: Colors.gray[100], borderRadius: 6, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 6 },
    etaText: { fontSize: 14, color: Colors.gray[500], marginTop: 12, textAlign: 'center' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 20 },
    phasesList: { gap: 16 },
    phaseItem: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 12, borderRadius: 12 },
    phaseIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    phaseIconCompleted: { backgroundColor: Colors.primary },
    phaseIconCurrent: { backgroundColor: Colors.primaryLighter, borderWidth: 1, borderColor: Colors.primary },
    phaseIconPending: { backgroundColor: Colors.gray[100] },
    phaseSpinner: { width: 16, height: 16, borderRadius: 8, borderLeftWidth: 2, borderTopWidth: 2, borderColor: Colors.primary },
    phaseNumber: { fontSize: 14, fontWeight: 'bold', color: Colors.gray[400] },
    phaseLabel: { fontSize: 15, fontWeight: '500' },
    textPrimary: { color: Colors.text.primary },
    textGray: { color: Colors.gray[400] },
    phaseCompleted: { backgroundColor: Colors.primaryLighter },
    phaseCurrent: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.primary },
    phasePending: { backgroundColor: 'transparent' },
    downloadsSection: { gap: 16 },
    downloadsTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text.primary, marginTop: 12, marginBottom: 8 },
    downloadCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.gray[200], gap: 16 },
    downloadIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    downloadInfo: { flex: 1 },
    downloadName: { fontSize: 16, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 2 },
    downloadDesc: { fontSize: 12, color: Colors.gray[500] },
    credentialsCard: { backgroundColor: Colors.primary, borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
    credentialsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: 'rgba(0,0,0,0.1)' },
    credentialsTitle: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
    credentialsContent: { padding: 16, gap: 12 },
    credentialsWarning: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 },
    credentialRow: { gap: 4 },
    credentialLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
    credentialValue: { color: Colors.white, fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modernAlertContainer: { backgroundColor: Colors.white, borderRadius: 24, width: '100%', maxWidth: 400, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    modernAlertHeader: { padding: 24, alignItems: 'center' },
    alertIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    modernAlertTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.white, marginBottom: 8 },
    modernAlertSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' },
    modernAlertContent: { padding: 24 },
    modernAlertMessage: { fontSize: 14, color: Colors.gray[600], textAlign: 'center', lineHeight: 20 },
    modernAlertActions: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
    alertCancelButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: Colors.gray[100], alignItems: 'center' },
    alertCancelText: { fontSize: 16, fontWeight: '600', color: Colors.gray[700] },
    alertFundButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    alertFundGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
    alertFundText: { fontSize: 16, fontWeight: 'bold', color: Colors.white },
});
