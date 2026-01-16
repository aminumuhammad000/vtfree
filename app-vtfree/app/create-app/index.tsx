import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert, ActivityIndicator, Linking, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager, Image, Modal, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { AppService } from '../../services/app.service';
import * as ImagePicker from 'expo-image-picker';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- DATA ---
const PRICING = {
    PLATFORM_ANDROID: 10000, PLATFORM_IOS: 100000, PLATFORM_WEB: 20000,
    PUBLISH_PLAY_STORE: 40000, PUBLISH_APP_STORE: 50000, CUSTOM_DOMAIN: 35000,
    FEAT_AIRTIME: 3000, FEAT_DATA: 5000, FEAT_BILLS: 5000, FEAT_EDUCATION: 3000, FEAT_GIFTCARD: 15000,
};

const FEATURES_LIST = [
    { id: 'airtime', name: 'Airtime Top-up', icon: 'phone-portrait-outline', desc: 'Auto airtime vending', price: PRICING.FEAT_AIRTIME },
    { id: 'data', name: 'Data Bundles', icon: 'wifi-outline', desc: 'SME, CG & Direct Data', price: PRICING.FEAT_DATA },
    { id: 'bills', name: 'Bill Payment', icon: 'bulb-outline', desc: 'Electricity & TV Subs', price: PRICING.FEAT_BILLS },
    { id: 'education', name: 'Exam Pins', icon: 'school-outline', desc: 'WAEC, NECO Scratch Cards', price: PRICING.FEAT_EDUCATION },
    { id: 'giftcard', name: 'Gift Cards', icon: 'gift-outline', desc: 'Buy & Sell Global Cards', price: PRICING.FEAT_GIFTCARD },
];

const STEPS = [
    { id: 1, title: 'Identity' }, { id: 2, title: 'Company' }, { id: 3, title: 'Features' },
    { id: 4, title: 'Platforms' }, { id: 5, title: 'Admin' }, { id: 6, title: 'Review' }
];

const BUILD_STEPS = [
    { id: 1, label: 'Initializing Server Environment...', duration: 2000 },
    { id: 2, label: 'Allocating Database Resources...', duration: 2500 },
    { id: 3, label: 'Applying Custom Theme & Branding...', duration: 3000 },
    { id: 4, label: 'Configuring Admin Panel Credentials...', duration: 2000 },
    { id: 5, label: 'Compiling Android APK...', duration: 4000 },
    { id: 6, label: 'Finalizing Build & Deployment...', duration: 2000 },
];

const MATERIAL_COLORS = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#009688', '#4caf50', '#8bc34a', '#ffeb3b', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b', '#000000', '#ffffff', '#10b981', '#fbbf24', '#0f172a'];

export default function CreateAppScreen() {
    const router = useRouter();
    const scrollRef = useRef<ScrollView>(null);
    const [viewState, setViewState] = useState<'wizard' | 'payment_success' | 'building' | 'complete'>('wizard');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Build Anim
    const [currentBuildStep, setCurrentBuildStep] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Inputs
    const [appName, setAppName] = useState('');
    const [packageName, setPackageName] = useState('');
    const [appLogo, setAppLogo] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState('#10b981');
    const [secondaryColor, setSecondaryColor] = useState('#34d399');

    // Picker
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'primary' | 'secondary'>('primary');
    const [tempColor, setTempColor] = useState('#000000');

    // Steps 2-5
    const [companyName, setCompanyName] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [platforms, setPlatforms] = useState({ android: false, ios: false, web: false });
    const [publishOptions, setPublishOptions] = useState({ playStore: false, appStore: false, customDomain: false, domainName: '' });
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');

    // Auto-Logic
    useEffect(() => { if (appName) setPackageName(`com.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}.vtu`); }, [appName]);
    useEffect(() => { if (!adminEmail && companyEmail) setAdminEmail(companyEmail); }, [companyEmail]);

    // Handlers
    const pickImage = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
        if (!r.canceled) setAppLogo(r.assets[0].uri);
    };

    const toggleFeature = (id: string) => {
        if (selectedFeatures.includes(id)) setSelectedFeatures(selectedFeatures.filter(f => f !== id));
        else setSelectedFeatures([...selectedFeatures, id]);
    };

    const calculateTotal = () => {
        let total = 0;
        FEATURES_LIST.forEach(f => { if (selectedFeatures.includes(f.id)) total += f.price; });
        if (platforms.android) total += PRICING.PLATFORM_ANDROID;
        if (platforms.ios) total += PRICING.PLATFORM_IOS;
        if (platforms.web) total += PRICING.PLATFORM_WEB;
        if (platforms.android && publishOptions.playStore) total += PRICING.PUBLISH_PLAY_STORE;
        if (platforms.ios && publishOptions.appStore) total += PRICING.PUBLISH_APP_STORE;
        if (platforms.web && publishOptions.customDomain) total += PRICING.CUSTOM_DOMAIN;
        return total;
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            const payload = {
                app_name: appName, package_name: packageName, platforms,
                branding: { primary_color: primaryColor, secondary_color: secondaryColor, logo_url: appLogo },
                company: { name: companyName, email: companyEmail, phone: companyPhone, address: companyAddress },
                services: selectedFeatures, admin_credentials: { email: adminEmail, password: adminPassword },
                payment_method: paymentMethod, publishing: publishOptions
            };
            const res = await AppService.createApp(payload);
            if (res.payment_required) await Linking.openURL(res.payment_url);
            setViewState('payment_success');
        } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    const startBuild = () => { setViewState('building'); runSim(0); };
    const runSim = (idx: number) => {
        if (idx >= BUILD_STEPS.length) { setTimeout(() => setViewState('complete'), 1000); return; }
        setCurrentBuildStep(idx + 1);
        Animated.timing(progressAnim, { toValue: (idx + 1) / BUILD_STEPS.length, duration: BUILD_STEPS[idx].duration, useNativeDriver: false, easing: Easing.linear }).start();
        setTimeout(() => runSim(idx + 1), BUILD_STEPS[idx].duration);
    };

    // --- UI COMPONENTS ---
    const InputField = ({ label, icon, ...props }: any) => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.inputWrapper}>
                {icon && <Ionicons name={icon} size={20} color="#94a3b8" style={{ marginRight: 10 }} />}
                <TextInput style={styles.textInput} placeholderTextColor="#cbd5e1" {...props} />
            </View>
        </View>
    );

    // Header with Gradient
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <LinearGradient colors={[Colors.primary, '#10b981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Create New App</Text>
                        <Text style={styles.headerStep}>Step {step} of 6 • {STEPS[step - 1].title}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>TOTAL EST.</Text>
                        <Text style={styles.priceAmount}>₦{calculateTotal().toLocaleString()}</Text>
                    </View>
                </View>
                {/* Progress Bar in Header */}
                <View style={styles.progressTrackHeader}>
                    <View style={[styles.progressFillHeader, { width: `${(step / 6) * 100}%` }]} />
                </View>
            </LinearGradient>
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Identity & Branding</Text>
            <Text style={styles.cardSub}>Set your app's unique identity.</Text>

            <TouchableOpacity style={styles.logoBox} onPress={pickImage}>
                {appLogo ? <Image source={{ uri: appLogo }} style={styles.logoImg} /> : <View style={styles.logoPlaceholder}><Ionicons name="camera" size={32} color="#cbd5e1" /><Text style={styles.logoText}>Upload Logo</Text></View>}
            </TouchableOpacity>

            <InputField label="App Name" icon="layers-outline" value={appName} onChangeText={setAppName} placeholder="e.g. My VTU Pro" />
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Package Name</Text><View style={[styles.inputWrapper, { backgroundColor: '#f1f5f9' }]}><Ionicons name="code-slash" size={20} color="#94a3b8" style={{ marginRight: 10 }} /><Text style={{ color: '#64748b' }}>{packageName || 'com.example.app'}</Text></View></View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Theme Colors</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={[styles.colorTrigger, { borderColor: primaryColor }]} onPress={() => { setPickerTarget('primary'); setTempColor(primaryColor); setPickerVisible(true) }}>
                    <View style={[styles.colorSwatch, { backgroundColor: primaryColor }]} />
                    <View><Text style={styles.colorLabel}>Primary</Text><Text style={styles.colorHex}>{primaryColor}</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.colorTrigger, { borderColor: secondaryColor }]} onPress={() => { setPickerTarget('secondary'); setTempColor(secondaryColor); setPickerVisible(true) }}>
                    <View style={[styles.colorSwatch, { backgroundColor: secondaryColor }]} />
                    <View><Text style={styles.colorLabel}>Secondary</Text><Text style={styles.colorHex}>{secondaryColor}</Text></View>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Company Details</Text>
            <Text style={styles.cardSub}>Business information for your app.</Text>
            <InputField label="Company Name" icon="business-outline" value={companyName} onChangeText={setCompanyName} placeholder="Business Name" />
            <InputField label="Support Email" icon="mail-outline" value={companyEmail} onChangeText={setCompanyEmail} keyboardType="email-address" placeholder="support@domain.com" />
            <InputField label="Phone Number" icon="call-outline" value={companyPhone} onChangeText={setCompanyPhone} keyboardType="phone-pad" placeholder="+234..." />
            <InputField label="Address" icon="location-outline" value={companyAddress} onChangeText={setCompanyAddress} multiline placeholder="Full Address" />
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.stepHeader}>Select Features</Text>
            <View style={styles.featureGrid}>
                {FEATURES_LIST.map(f => (
                    <TouchableOpacity key={f.id} style={[styles.featCard, selectedFeatures.includes(f.id) && styles.featCardActive]} onPress={() => toggleFeature(f.id)}>
                        <View style={[styles.featIcon, selectedFeatures.includes(f.id) ? { backgroundColor: Colors.primary } : { backgroundColor: '#f1f5f9' }]}>
                            <Ionicons name={f.icon as any} size={24} color={selectedFeatures.includes(f.id) ? '#fff' : '#64748b'} />
                        </View>
                        <Text style={styles.featTitle}>{f.name}</Text>
                        <Text style={styles.featPrice}>+{f.price.toLocaleString()}</Text>
                        {selectedFeatures.includes(f.id) && <View style={styles.checkBadge}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.stepHeader}>Platforms & Publishing</Text>
            <View style={styles.platCard}>
                <View style={styles.platHeader}>
                    <View style={styles.platIcon}><Ionicons name="logo-android" size={24} color="#16a34a" /></View>
                    <View style={{ flex: 1 }}><Text style={styles.platTitle}>Android App</Text><Text style={styles.platPrice}>₦{PRICING.PLATFORM_ANDROID.toLocaleString()}</Text></View>
                    <Switch value={platforms.android} onValueChange={v => setPlatforms({ ...platforms, android: v })} trackColor={{ true: Colors.primary }} />
                </View>
                {platforms.android && (
                    <View style={styles.platOpt}>
                        <View style={{ flex: 1 }}><Text style={styles.optTitle}>Publish to Play Store</Text><Text style={styles.optPrice}>+₦{PRICING.PUBLISH_PLAY_STORE.toLocaleString()}</Text></View>
                        <Switch value={publishOptions.playStore} onValueChange={v => setPublishOptions({ ...publishOptions, playStore: v })} trackColor={{ true: Colors.primary }} />
                    </View>
                )}
            </View>
            <View style={styles.platCard}>
                <View style={styles.platHeader}>
                    <View style={styles.platIcon}><Ionicons name="logo-apple" size={24} color="#0f172a" /></View>
                    <View style={{ flex: 1 }}><Text style={styles.platTitle}>iOS App</Text><Text style={styles.platPrice}>₦{PRICING.PLATFORM_IOS.toLocaleString()}</Text></View>
                    <Switch value={platforms.ios} onValueChange={v => setPlatforms({ ...platforms, ios: v })} trackColor={{ true: Colors.primary }} />
                </View>
                {platforms.ios && (
                    <View style={styles.platOpt}>
                        <View style={{ flex: 1 }}><Text style={styles.optTitle}>Publish to App Store</Text><Text style={styles.optPrice}>+₦{PRICING.PUBLISH_APP_STORE.toLocaleString()}</Text></View>
                        <Switch value={publishOptions.appStore} onValueChange={v => setPublishOptions({ ...publishOptions, appStore: v })} trackColor={{ true: Colors.primary }} />
                    </View>
                )}
            </View>
            <View style={styles.platCard}>
                <View style={styles.platHeader}>
                    <View style={styles.platIcon}><Ionicons name="globe" size={24} color="#3b82f6" /></View>
                    <View style={{ flex: 1 }}><Text style={styles.platTitle}>Web Portal</Text><Text style={styles.platPrice}>₦{PRICING.PLATFORM_WEB.toLocaleString()}</Text></View>
                    <Switch value={platforms.web} onValueChange={v => setPlatforms({ ...platforms, web: v })} trackColor={{ true: Colors.primary }} />
                </View>
                {platforms.web && (
                    <View style={styles.platOpt}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <View style={{ flex: 1 }}><Text style={styles.optTitle}>Use Custom Domain</Text><Text style={styles.optPrice}>+₦{PRICING.CUSTOM_DOMAIN.toLocaleString()}</Text></View>
                            <Switch value={publishOptions.customDomain} onValueChange={v => setPublishOptions({ ...publishOptions, customDomain: v })} trackColor={{ true: Colors.primary }} />
                        </View>
                        {publishOptions.customDomain && <TextInput style={styles.subInput} placeholder="www.yourdomain.com" value={publishOptions.domainName} onChangeText={v => setPublishOptions({ ...publishOptions, domainName: v })} />}
                    </View>
                )}
            </View>
        </View>
    );

    const renderStep5 = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Admin Setup</Text>
            <Text style={styles.cardSub}>Create the login credentials for your app's powerful admin dashboard.</Text>
            <InputField label="Admin Email" icon="shield-checkmark-outline" value={adminEmail} onChangeText={setAdminEmail} autoCapitalize="none" placeholder="admin@app.com" />
            <InputField label="Set Password" icon="lock-closed-outline" value={adminPassword} onChangeText={setAdminPassword} secureTextEntry placeholder="******" />
        </View>
    );

    const renderStep6 = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Review & Checkout</Text>
            <View style={styles.reviewHeader}>
                <Image source={appLogo ? { uri: appLogo } : {}} style={styles.reviewLogo} />
                <View>
                    <Text style={styles.reviewName}>{appName || 'Untitled App'}</Text>
                    <Text style={styles.reviewPkg}>{packageName}</Text>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                        <View style={[styles.reviewDot, { backgroundColor: primaryColor }]} /><View style={[styles.reviewDot, { backgroundColor: secondaryColor }]} />
                    </View>
                </View>
            </View>

            <View style={styles.reviewSection}>
                <Text style={styles.reviewSecTitle}>Company</Text>
                <Text style={styles.reviewText}>{companyName}</Text>
                <Text style={styles.reviewText}>{companyEmail}</Text>
            </View>

            <View style={styles.reviewSection}>
                <Text style={styles.reviewSecTitle}>Configuration</Text>
                {platforms.android && <View style={styles.reviewRow}><Text style={styles.reviewItem}>Android App</Text><Text style={styles.reviewPrice}>₦{PRICING.PLATFORM_ANDROID.toLocaleString()}</Text></View>}
                {platforms.ios && <View style={styles.reviewRow}><Text style={styles.reviewItem}>iOS App</Text><Text style={styles.reviewPrice}>₦{PRICING.PLATFORM_IOS.toLocaleString()}</Text></View>}
                {selectedFeatures.map(f => (<View key={f} style={styles.reviewRow}><Text style={styles.reviewItem}>{FEATURES_LIST.find(x => x.id === f)?.name}</Text><Text style={styles.reviewPrice}>Included</Text></View>))}
            </View>

            <View style={styles.totalBlock}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.totalTitle}>TOTAL TO PAY</Text>
                    <Text style={styles.totalValue}>₦{calculateTotal().toLocaleString()}</Text>
                </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 20 }]}>Payment Method</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity onPress={() => setPaymentMethod('wallet')} style={[styles.payMethod, paymentMethod === 'wallet' && styles.payMethodActive]}>
                    <Ionicons name="wallet" size={20} color={paymentMethod === 'wallet' ? Colors.primary : '#64748b'} />
                    <Text style={[styles.payMethodText, paymentMethod === 'wallet' && { color: Colors.primary }]}>Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPaymentMethod('card')} style={[styles.payMethod, paymentMethod === 'card' && styles.payMethodActive]}>
                    <Ionicons name="card" size={20} color={paymentMethod === 'card' ? Colors.primary : '#64748b'} />
                    <Text style={[styles.payMethodText, paymentMethod === 'card' && { color: Colors.primary }]}>Paystack</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (viewState === 'payment_success') return (
        <SafeAreaView style={styles.centerView}>
            <View style={[styles.successIcon, { backgroundColor: '#dcfce7' }]}><Ionicons name="checkmark" size={60} color="#16a34a" /></View>
            <Text style={styles.stateTitle}>Order Confirmed!</Text>
            <Text style={styles.stateSub}>Your payment was successful. We are ready to build "{appName}".</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={startBuild}>
                <Text style={styles.actionBtnText}>Start Build Process</Text>
                <Ionicons name="hammer" size={20} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );

    // Building view with dark gradient
    if (viewState === 'building') return (
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.buildView}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.buildHead}><ActivityIndicator color="#fff" /><Text style={styles.buildTitle}>Building Your App...</Text></View>
                <View style={styles.terminal}>
                    <View style={styles.termHeader}><View style={styles.termDots}><View style={[styles.dot, { backgroundColor: '#ef4444' }]} /><View style={[styles.dot, { backgroundColor: '#facc15' }]} /><View style={[styles.dot, { backgroundColor: '#22c55e' }]} /></View><Text style={styles.termTitle}>build_log.txt</Text></View>
                    <ScrollView style={styles.termBody}>
                        {BUILD_STEPS.map((s, i) => (
                            <View key={s.id} style={[styles.logLine, { opacity: i < currentBuildStep ? 1 : 0.4 }]}>
                                <Ionicons name={i < currentBuildStep ? "checkmark-circle" : "ellipse-outline"} size={14} color={i < currentBuildStep ? "#22c55e" : "#94a3b8"} />
                                <Text style={[styles.logText, i === currentBuildStep - 1 && { color: '#38bdf8' }]}>{s.label}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
                <View style={styles.progContainer}>
                    <View style={styles.progBar}><Animated.View style={{ height: '100%', backgroundColor: Colors.primary, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} /></View>
                    <Text style={styles.progText}>{Math.round((currentBuildStep / BUILD_STEPS.length) * 100)}% Complete</Text>
                </View>
                <Text style={styles.waitMsg}>Estimated time: ~20 mins (Simulated)</Text>
            </SafeAreaView>
        </LinearGradient>
    );

    if (viewState === 'complete') return (
        <SafeAreaView style={styles.centerView}>
            <View style={[styles.successIcon, { backgroundColor: Colors.primary }]}><Ionicons name="rocket" size={50} color="#fff" /></View>
            <Text style={styles.stateTitle}>Deployment Complete!</Text>
            <Text style={styles.stateSub}>Your app is now live. Check your email for login details.</Text>
            <View style={styles.infoBox}>
                <View style={styles.infoLine}><Text style={styles.infoLbl}>Admin URL:</Text><Text style={styles.infoVal}>admin.{packageName}.com</Text></View>
                <View style={styles.infoLine}><Text style={styles.infoLbl}>Username:</Text><Text style={styles.infoVal}>{adminEmail}</Text></View>
                <View style={styles.infoLine}><Text style={styles.infoLbl}>Status:</Text><Text style={{ color: '#16a34a', fontWeight: '700' }}>Live</Text></View>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/home')}><Text style={styles.actionBtnText}>Go to Dashboard</Text></TouchableOpacity>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.mainContainer}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                {renderHeader()}
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} ref={scrollRef}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                    {step === 5 && renderStep5()}
                    {step === 6 && renderStep6()}
                </ScrollView>
                <View style={styles.footer}>
                    {step > 1 && <TouchableOpacity style={styles.backButton} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setStep(step - 1) }}><Text style={styles.backText}>Back</Text></TouchableOpacity>}
                    <TouchableOpacity style={styles.nextButton} onPress={step === 6 ? handleCreate : () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setStep(step + 1) }}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>{step === 6 ? 'Pay & Create' : 'Next Step'}</Text>}
                        {!loading && step < 6 && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                    </TouchableOpacity>
                </View>

                {/* Color Modal */}
                <Modal visible={pickerVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerCard}>
                            <Text style={styles.pickerTitle}>Select Color</Text>
                            <View style={[styles.pickerPreview, { backgroundColor: tempColor }]} />
                            <TextInput style={styles.pickerInput} value={tempColor} onChangeText={setTempColor} placeholder="#000000" maxLength={7} />
                            <View style={styles.pickerGrid}>{MATERIAL_COLORS.map(c => <TouchableOpacity key={c} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c }} onPress={() => setTempColor(c)} />)}</View>
                            <TouchableOpacity style={styles.pickerBtn} onPress={() => { if (pickerTarget === 'primary') setPrimaryColor(tempColor); else setSecondaryColor(tempColor); setPickerVisible(false) }}><Text style={styles.pickerBtnText}>Select Color</Text></TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
    centerView: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 24 },
    buildView: { flex: 1, padding: 20 },

    // Header
    headerContainer: { backgroundColor: Colors.primary, paddingBottom: 0, overflow: 'hidden' }, // Removed padding to let gradient fill
    headerGradient: { padding: 16, paddingTop: 10, paddingBottom: 2 },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backBtn: { padding: 4, marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    headerStep: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    priceContainer: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
    priceLabel: { fontSize: 8, color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 0.5 },
    priceAmount: { fontSize: 14, fontWeight: '800', color: '#fff' },
    progressTrackHeader: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' },
    progressFillHeader: { height: '100%', backgroundColor: '#fff' },

    // Form
    card: { backgroundColor: '#fff', margin: 20, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    cardSub: { fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 20 },

    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, height: 52 },
    textInput: { flex: 1, fontSize: 16, color: '#0f172a', height: '100%' },

    logoBox: { alignSelf: 'center', marginVertical: 10, marginBottom: 20 },
    logoPlaceholder: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    logoImg: { width: 100, height: 100, borderRadius: 24 },
    logoText: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '600' },

    colorTrigger: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
    colorSwatch: { width: 36, height: 36, borderRadius: 10, marginRight: 12 },
    colorLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
    colorHex: { fontSize: 13, color: '#0f172a', fontWeight: '700' },

    // Features
    sectionContainer: { padding: 20 },
    stepHeader: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 20, marginLeft: 4 },
    featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    featCard: { width: '47%', backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05 },
    featCardActive: { borderColor: Colors.primary, backgroundColor: '#f0f9ff' },
    featIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    featTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
    featPrice: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    checkBadge: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

    // Platforms
    platCard: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
    platHeader: { flexDirection: 'row', alignItems: 'center', padding: 18 },
    platIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    platTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    platPrice: { fontSize: 14, color: '#64748b' },
    platOpt: { borderTopWidth: 1, borderColor: '#f1f5f9', padding: 18, backgroundColor: '#f8fafc' },
    optTitle: { fontSize: 14, color: '#334155' },
    optPrice: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    subInput: { marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, width: '100%' },

    // Review
    reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    reviewLogo: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#f1f5f9', marginRight: 16 },
    reviewName: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    reviewPkg: { fontSize: 14, color: '#64748b' },
    reviewDot: { width: 16, height: 16, borderRadius: 8, marginRight: 6 },

    reviewSection: { marginBottom: 24 },
    reviewSecTitle: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 },
    reviewText: { fontSize: 15, color: '#334155', lineHeight: 22 },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    reviewItem: { fontSize: 15, color: '#334155' },
    reviewPrice: { fontSize: 15, fontWeight: '700', color: '#0f172a' },

    totalBlock: { backgroundColor: '#0f172a', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    totalTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
    totalValue: { color: '#fff', fontSize: 22, fontWeight: '800' },

    payMethod: { flex: 1, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, gap: 8 },
    payMethodActive: { borderColor: Colors.primary, backgroundColor: '#f0f9ff' },
    payMethodText: { fontWeight: '600', color: '#64748b', fontSize: 15 },

    // Build/Success
    successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    stateTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
    stateSub: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
    actionBtn: { backgroundColor: Colors.primary, paddingVertical: 18, paddingHorizontal: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 4 },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    buildHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40, marginTop: 40 },
    buildTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
    terminal: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderWidth: 1, borderColor: '#334155', borderRadius: 16, height: 340, overflow: 'hidden', marginBottom: 30 },
    termHeader: { backgroundColor: '#334155', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    termDots: { flexDirection: 'row', gap: 8 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    termTitle: { color: '#94a3b8', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    termBody: { padding: 20 },
    logLine: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'center' },
    logText: { color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14 },
    progContainer: { alignItems: 'center' },
    progBar: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
    progText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    waitMsg: { color: '#94a3b8', textAlign: 'center', marginTop: 30, fontSize: 14 },

    infoBox: { backgroundColor: '#f8fafc', width: '100%', padding: 24, borderRadius: 20, marginBottom: 30 },
    infoLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    infoLbl: { color: '#64748b', fontWeight: '500' },
    infoVal: { color: '#0f172a', fontWeight: '700' },

    // Footer
    footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', gap: 12 },
    nextButton: { flex: 1, backgroundColor: Colors.primary, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 2 },
    nextText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    backButton: { width: 80, height: 56, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    backText: { color: '#64748b', fontWeight: '600' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
    pickerCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
    pickerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
    pickerPreview: { width: 80, height: 80, borderRadius: 40, marginBottom: 20, borderWidth: 4, borderColor: '#f1f5f9' },
    pickerInput: { fontSize: 18, fontWeight: '700', textAlign: 'center', borderBottomWidth: 2, borderColor: '#e2e8f0', width: 120, marginBottom: 24 },
    pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 24 },
    pickerBtn: { width: '100%', padding: 16, backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center' },
    pickerBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
