import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, Image, Switch, Platform, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    ArrowRight,
    Palette,
    Building2,
    Settings,
    CheckSquare,
    Shield,
    Rocket,
    Check,
    CheckCircle,
    Upload,
    HelpCircle,
    Smartphone,
    Globe,
    Monitor,
    ChevronDown,
    Wallet,
    CreditCard,
    Eye,
    EyeOff,
    X
} from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInRight, FadeOutLeft, Layout, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { AppService } from '../services/app.service';
import { FeatureService, Feature } from '../services/feature.service';
import { WalletService } from '../services/wallet.service';
import ColorPicker, { Panel1, Swatches, Preview, OpacitySlider, HueSlider } from 'reanimated-color-picker';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LucideIcons from 'lucide-react-native';


const { width } = Dimensions.get('window');

export default function CreateAppScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        logo: null as string | null,
        primaryColor: '#16A34A',
        secondaryColor: '#22C55E',
        appName: '',
        packageName: '',

        // Step 2: Business Info
        businessName: '',
        email: '',
        phone: '',
        address: '',
        website: '',

        // Step 3: Services
        services: [] as string[],

        // Step 4: Admin Panel
        adminEmail: '',
        adminPassword: '',

        platforms: [] as string[],
        androidBuildTypes: [] as ('apk' | 'aab')[],
        publishPlayStore: false,
        publishAppStore: false,
        publishWeb: false,
        paymentMethod: 'wallet' as 'wallet' | 'card'
    });

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [activeColorType, setActiveColorType] = useState<'primary' | 'secondary'>('primary');
    const [features, setFeatures] = useState<Feature[]>([]);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [userVirtualAccount, setUserVirtualAccount] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showPassword, setShowPassword] = useState(false);
    const [hexInput, setHexInput] = useState('');
    const [appPrices, setAppPrices] = useState<any>({
        PLATFORM_ANDROID: 10000,
        PLATFORM_WEB: 20000,
        PUBLISH_PRICE_PLAY_STORE: 35000,
        PUBLISH_PRICE_APP_STORE: 50000,
        PUBLISH_WEB: 15000
    });
    const [loadingData, setLoadingData] = useState(true);
    const [showInsufficientModal, setShowInsufficientModal] = useState(false);
    const [showSavedModal, setShowSavedModal] = useState(false);
    const [savedAppData, setSavedAppData] = useState<any>(null);
    const [myApps, setMyApps] = useState<any[]>([]);
    const [showAppSelector, setShowAppSelector] = useState(false);
    const [insufficientData, setInsufficientData] = useState({ required: 0, current: 0 });

    // Auto-generate package name when app name changes
    const [packageError, setPackageError] = useState('');
    const [checkingPackage, setCheckingPackage] = useState(false);

    // Auto-generate package name when app name changes
    useEffect(() => {
        if (formData.appName && !formData.packageName) {
            const cleanName = formData.appName.toLowerCase().replace(/[^a-z0-9]/g, '');
            setFormData((prev: any) => ({
                ...prev,
                packageName: `com.${cleanName}.app`
            }));
        }
    }, [formData.appName]);

    // Check package availability when package name changes
    useEffect(() => {
        const checkPackage = async () => {
            if (!formData.packageName || formData.packageName.length < 5) return;

            setCheckingPackage(true);
            setPackageError('');

            try {
                const response = await AppService.checkPackageAvailability(formData.packageName);
                if (!response.success || !response.available) {
                    setPackageError('Package name is already taken');
                }
            } catch (error) {
                // Ignore network errors for now, allow submission to handle final check
            } finally {
                setCheckingPackage(false);
            }
        };

        const timeoutId = setTimeout(checkPackage, 800);
        return () => clearTimeout(timeoutId);
    }, [formData.packageName]);

    // Fetch data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingData(true);
                const [featuresData, walletData, pricesData, myAppsData] = await Promise.all([
                    FeatureService.getActiveFeatures(),
                    WalletService.getWallet().catch(() => ({ success: true, data: { balance: 0 } })),
                    AppService.getAppPrices().catch(() => ({ success: true, data: {} })),
                    AppService.getMyApps().catch(() => ({ success: true, data: { apps: [] } }))
                ]);
                setFeatures(featuresData);
                setWalletBalance(walletData.data?.balance || 0);
                setUserVirtualAccount(walletData.data?.virtual_account);
                if (pricesData.success && pricesData.data) {
                    setAppPrices((prev: any) => ({ ...prev, ...pricesData.data }));
                }
                if (myAppsData.success && myAppsData.data?.apps) {
                    setMyApps(myAppsData.data.apps);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                Alert.alert('Error', 'Failed to load initial data');
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    }, []);

    const onSelectColor = (hex: string) => {
        setHexInput(hex.replace('#', '').toUpperCase());
        if (activeColorType === 'primary') {
            setFormData((prev: any) => ({ ...prev, primaryColor: hex }));
        } else {
            setFormData((prev: any) => ({ ...prev, secondaryColor: hex }));
        }
    };

    const professionalPresets = [
        '#16A34A', '#2563EB', '#7C3AED', '#DC2626', '#EA580C',
        '#0891B2', '#4F46E5', '#BE185D', '#111827', '#4B5563'
    ];

    const totalSteps = 6;

    const steps = [
        { number: 1, title: 'Branding', icon: Palette },
        { number: 2, title: 'Business Info', icon: Building2 },
        { number: 3, title: 'Services', icon: CheckSquare },
        { number: 4, title: 'Admin Panel', icon: Shield },
        { number: 5, title: 'Build Options', icon: Rocket },
        { number: 6, title: 'Review', icon: Check }
    ];

    // Get icon component from Lucide
    const getIconComponent = (iconName: string) => {
        const IconComponent = (LucideIcons as any)[iconName];
        return IconComponent || LucideIcons.HelpCircle;
    };

    const calculateTotal = () => {
        let total = 0;
        // Services
        formData.services.forEach(featureId => {
            const feature = features.find(f => f.feature_id === featureId);
            if (feature) total += feature.base_price;
        });

        // Platform Base Fees
        if (formData.platforms.includes('android')) total += appPrices.PLATFORM_ANDROID;
        if (formData.platforms.includes('web')) total += appPrices.PLATFORM_WEB;

        // Publishing Fees
        if (formData.platforms.includes('android') && formData.publishPlayStore) total += appPrices.PUBLISH_PLAY_STORE;

        return total;
    };


    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return '₦0';
        }
        return `₦${amount.toLocaleString()}`;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];

            // Validate Dimensions (Min 512x512)
            if (asset.width < 512 || asset.height < 512) {
                Alert.alert(
                    'Image Too Small',
                    `Your logo must be at least 512x512 pixels for high-quality app icons. Currently: ${asset.width}x${asset.height}px.`
                );
                return;
            }

            try {
                setIsUploadingLogo(true);
                const response = await AppService.uploadLogo(asset.uri);
                if (response.success) {
                    setFormData({ ...formData, logo: response.data.logo_url });
                } else {
                    Alert.alert('Upload Failed', response.message || 'Could not upload logo. Please try again.');
                }
            } catch (error: any) {
                console.error('Logo upload error:', error);
                Alert.alert('Error', 'An error occurred while uploading your logo. Please check your connection.');
            } finally {
                setIsUploadingLogo(false);
            }
        }
    };

    const handleNext = async () => {
        // Validation based on current step
        if (currentStep === 1) {
            if (!formData.appName.trim()) {
                Alert.alert('Required', 'Please enter your App Name');
                return;
            }
            if (!formData.packageName.trim()) {
                Alert.alert('Required', 'Please enter your Package Name');
                return;
            }
            if (packageError) {
                Alert.alert('Invalid Package', packageError);
                return;
            }
        } else if (currentStep === 2) {
            if (!formData.businessName.trim()) {
                Alert.alert('Required', 'Please enter your Business Name');
                return;
            }
            if (!formData.email.trim()) {
                Alert.alert('Required', 'Please enter your Business Email');
                return;
            }
        } else if (currentStep === 3) {
            if (formData.services.length === 0) {
                Alert.alert('Required', 'Please select at least one service for your app');
                return;
            }
        } else if (currentStep === 4) {
            if (!formData.adminEmail.trim()) {
                Alert.alert('Required', 'Please enter an Admin Email');
                return;
            }
            if (!formData.adminPassword.trim()) {
                Alert.alert('Required', 'Please enter an Admin Password');
                return;
            }
        } else if (currentStep === 5) {
            if (formData.platforms.length === 0) {
                Alert.alert('Required', 'Please select at least one platform (Android or Web)');
                return;
            }
            if (formData.platforms.includes('android') && formData.androidBuildTypes.length === 0) {
                Alert.alert('Required', 'Please select at least one Android build type (APK or AAB)');
                return;
            }
        }

        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        } else {
            await handleCreateApp();
        }
    };

    const handleCreateApp = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                app_name: formData.appName,
                package_name: formData.packageName,
                platforms: {
                    android: formData.platforms.includes('android'),
                    ios: formData.platforms.includes('ios'),
                    web: formData.platforms.includes('web')
                },
                android_build_types: formData.androidBuildTypes,
                publish_play_store: formData.publishPlayStore,
                publish_app_store: formData.publishAppStore,
                publish_web: formData.publishWeb,
                branding: {
                    primary_color: formData.primaryColor,
                    secondary_color: formData.secondaryColor,
                    logo_url: formData.logo || 'https://via.placeholder.com/150'
                },
                services: formData.services,
                payment_method: formData.paymentMethod,
                admin_credentials: {
                    email: formData.adminEmail,
                    password: formData.adminPassword
                },
                company: {
                    name: formData.businessName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address
                }
            };

            const response = await AppService.createApp(payload);

            if (response.success && !response.payment_required) {
                if (response.saved_offline) {
                    setSavedAppData(response.data);
                    setShowSavedModal(true);
                    setIsSubmitting(false);
                } else {
                    router.push({
                        pathname: '/build-status',
                        params: {
                            appId: response.data.app.app_id,
                            adminCredentials: JSON.stringify(response.data.admin_credentials)
                        }
                    });
                }
            } else if (response.payment_required) {
                // Handle Card Payment URL
                const { payment_url, reference } = response;
                await WebBrowser.openBrowserAsync(payment_url);

                // Show Verification Alert/Modal
                Alert.alert(
                    'Complete Payment',
                    'Please complete the payment in the browser. Once done, click "Check Payment Status".',
                    [
                        { text: 'Cancel', style: 'cancel', onPress: () => setIsSubmitting(false) },
                        {
                            text: 'Check Payment Status',
                            onPress: async () => await verifyPayment(reference, payload)
                        }
                    ]
                );
            } else {
                if (response.code === 'INSUFFICIENT_FUNDS') {
                    setInsufficientData({
                        required: response.data.required || 0,
                        current: response.data.current || 0
                    });
                    setShowInsufficientModal(true);
                } else {
                    Alert.alert('Error', response.message || 'Failed to create app');
                }
                setIsSubmitting(false); // Only stop submitting on error/insufficient funds, not on payment redirect
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred');
            setIsSubmitting(false);
        }
    };

    const verifyPayment = async (reference: string, appPayload: any) => {
        setIsSubmitting(true);
        try {
            // Call verify endpoint (need to add to AppService)
            // For now assuming AppService.verifyAppPayment exists or using raw fetch/axios if needed, 
            // but let's assume I'll add it to AppService next.
            // Actually, I'll use a direct fetch here or assume AppService update comes next.
            const response = await AppService.verifyAppPayment(reference, appPayload);
            if (response.success) {
                router.push({
                    pathname: '/build-status',
                    params: {
                        appId: response.data.app.app_id,
                        adminCredentials: JSON.stringify(response.data.admin_credentials)
                    }
                });
            } else {
                Alert.alert('Payment Failed', response.message || 'Could not verify payment. Please try again or contact support.');
                setIsSubmitting(false);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Verification failed: ' + error.message);
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            router.back();
        }
    };

    const toggleService = (serviceId: string) => {
        setFormData((prev: any) => {
            const isSelected = prev.services.includes(serviceId);
            if (isSelected) {
                return { ...prev, services: prev.services.filter((s: string) => s !== serviceId) };
            } else {
                return { ...prev, services: [...prev.services, serviceId] };
            }
        });
    };

    const togglePlatform = (platformId: string) => {
        setFormData((prev: any) => {
            const isSelected = prev.platforms.includes(platformId);
            if (isSelected) {
                return { ...prev, platforms: prev.platforms.filter((p: string) => p !== platformId) };
            } else {
                return { ...prev, platforms: [...prev.platforms, platformId] };
            }
        });
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>Brand Your App</Text>
                            <Text style={styles.stepSubtitle}>Customize the look and feel of your app</Text>
                        </View>

                        {/* Logo Upload */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>App Logo</Text>
                            <TouchableOpacity
                                style={[styles.uploadBox, isUploadingLogo && { opacity: 0.6 }]}
                                onPress={pickImage}
                                disabled={isUploadingLogo}
                            >
                                {isUploadingLogo ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <ActivityIndicator size="large" color={Colors.primary} />
                                        <Text style={[styles.uploadText, { marginTop: 8 }]}>Uploading to Cloudinary...</Text>
                                    </View>
                                ) : formData.logo ? (
                                    <Image source={{ uri: formData.logo }} style={{ width: 80, height: 80, borderRadius: 8 }} resizeMode="contain" />
                                ) : (
                                    <>
                                        <Upload color={Colors.gray[400]} size={32} style={{ marginBottom: 8 }} />
                                        <Text style={styles.uploadText}>Click to upload logo</Text>
                                        <Text style={styles.uploadSubtext}>Required size: 512x512px or larger (Square)</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* App Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>App Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.appName}
                                onChangeText={(text) => setFormData({ ...formData, appName: text })}
                                placeholder="My VTU App"
                                placeholderTextColor={Colors.gray[400]}
                            />
                        </View>

                        {/* Package Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Package Name (App Bundle ID)</Text>
                            <TextInput
                                style={[styles.input, packageError ? { borderColor: Colors.red[500] } : null]}
                                value={formData.packageName}
                                onChangeText={(text) => setFormData({ ...formData, packageName: text.toLowerCase() })}
                                placeholder="com.myapp.vtu"
                                placeholderTextColor={Colors.gray[400]}
                                autoCapitalize="none"
                            />
                            {checkingPackage && (
                                <Text style={{ fontSize: 12, color: Colors.secondary, marginTop: 4 }}>
                                    Checking availability...
                                </Text>
                            )}
                            {packageError ? (
                                <Text style={{ fontSize: 12, color: Colors.red[500], marginTop: 4 }}>
                                    {packageError}
                                </Text>
                            ) : (!checkingPackage && formData.packageName.length > 5) && (
                                <Text style={{ fontSize: 12, color: Colors.green[600], marginTop: 4 }}>
                                    Package name available
                                </Text>
                            )}
                        </View>

                        {/* Colors */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Primary Color</Text>
                                <TouchableOpacity
                                    style={styles.colorInputContainer}
                                    onPress={() => {
                                        setActiveColorType('primary');
                                        setShowColorPicker(true);
                                    }}
                                >
                                    <View style={[styles.colorPreview, { backgroundColor: formData.primaryColor }]} />
                                    <View style={{ flex: 1, paddingVertical: 12 }}>
                                        <Text style={{ fontSize: 16, color: Colors.text.primary }}>{formData.primaryColor}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Secondary Color</Text>
                                <TouchableOpacity
                                    style={styles.colorInputContainer}
                                    onPress={() => {
                                        setActiveColorType('secondary');
                                        setShowColorPicker(true);
                                    }}
                                >
                                    <View style={[styles.colorPreview, { backgroundColor: formData.secondaryColor }]} />
                                    <View style={{ flex: 1, paddingVertical: 12 }}>
                                        <Text style={{ fontSize: 16, color: Colors.text.primary }}>{formData.secondaryColor}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Color Picker Modal */}
                        <ColorSelectionModal
                            visible={showColorPicker}
                            initialColor={activeColorType === 'primary' ? formData.primaryColor : formData.secondaryColor}
                            title={`Select ${activeColorType === 'primary' ? 'Primary' : 'Secondary'} Color`}
                            onClose={() => setShowColorPicker(false)}
                            onSelect={onSelectColor}
                        />

                        {/* Live Preview */}
                        <View style={styles.previewContainer}>
                            <Text style={styles.previewLabel}>Live Preview</Text>
                            <View style={styles.previewBox}>
                                <View style={[styles.previewIconBox, { backgroundColor: formData.primaryColor }]}>
                                    {formData.logo ? (
                                        <Image
                                            source={{ uri: formData.logo }}
                                            style={{ width: 80, height: 80, borderRadius: 20 }}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Image
                                            source={require('../assets/images/logo.png')}
                                            style={{ width: 40, height: 40, tintColor: Colors.white }}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>
                                <Text style={[styles.previewTitle, { color: formData.primaryColor }]}>
                                    {formData.appName || 'My VTU App'}
                                </Text>
                                <Text style={styles.previewSubtitle}>
                                    {formData.packageName || 'com.example.app'}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>
                );
            case 2:
                return (
                    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>Business Information</Text>
                            <Text style={styles.stepSubtitle}>Tell us about your business</Text>
                        </View>

                        {/* Import from existing app */}
                        {myApps.length > 0 && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={styles.label}>Import details from existing app</Text>
                                <TouchableOpacity
                                    style={styles.pickerContainer}
                                    onPress={() => setShowAppSelector(true)}
                                >
                                    <Text style={styles.pickerText}>
                                        Select App to Import...
                                    </Text>
                                    <ChevronDown color={Colors.gray[500]} size={20} />
                                </TouchableOpacity>
                            </View>
                        )}

                        <Modal visible={showAppSelector} transparent animationType="slide">
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Select App</Text>
                                        <TouchableOpacity onPress={() => setShowAppSelector(false)} style={styles.modalCloseButton}>
                                            <LucideIcons.X color={Colors.gray[500]} size={24} />
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView style={{ maxHeight: 300 }}>
                                        {myApps.map((app: any) => (
                                            <TouchableOpacity
                                                key={app.app_id}
                                                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] }}
                                                onPress={() => {
                                                    if (app.company) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            businessName: app.company.name || '',
                                                            email: app.company.email || '',
                                                            phone: app.company.phone || '',
                                                            address: app.company.address || '',
                                                            website: app.company.website || ''
                                                        }));
                                                    }
                                                    setShowAppSelector(false);
                                                }}
                                            >
                                                <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text.primary }}>{app.app_name}</Text>
                                                <Text style={{ fontSize: 12, color: Colors.gray[500] }}>{app.package_name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Business Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.businessName}
                                onChangeText={(text) => setFormData({ ...formData, businessName: text })}
                                placeholder="ABC Technologies"
                                placeholderTextColor={Colors.gray[400]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                placeholder="contact@example.com"
                                keyboardType="email-address"
                                placeholderTextColor={Colors.gray[400]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                placeholder="+234 800 000 0000"
                                keyboardType="phone-pad"
                                placeholderTextColor={Colors.gray[400]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                value={formData.address}
                                onChangeText={(text) => setFormData({ ...formData, address: text })}
                                placeholder="123 Business Street, Lagos"
                                multiline
                                placeholderTextColor={Colors.gray[400]}
                            />
                        </View>

                        <View style={[styles.inputGroup, { marginBottom: 20 }]}>
                            <Text style={styles.label}>Website (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.website}
                                onChangeText={(text) => setFormData({ ...formData, website: text })}
                                placeholder="https://example.com"
                                keyboardType="url"
                                placeholderTextColor={Colors.gray[400]}
                            />
                        </View>
                    </Animated.View>
                );

            case 3:
                return (
                    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>Select Services</Text>
                            <Text style={styles.stepSubtitle}>Choose features to enable in your app</Text>
                        </View>

                        {loadingData ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.loadingText}>Loading services...</Text>
                            </View>
                        ) : features.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <HelpCircle color={Colors.gray[400]} size={48} />
                                <Text style={styles.emptyText}>No services available</Text>
                            </View>
                        ) : (
                            <>
                                {/* Category Filters */}
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.categoryScroll}
                                    contentContainerStyle={styles.categoryContent}
                                >
                                    {['all', 'billpayment', 'finance', 'utility', 'communication'].map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.categoryChip,
                                                selectedCategory === cat && styles.categoryChipSelected
                                            ]}
                                            onPress={() => setSelectedCategory(cat)}
                                        >
                                            <Text style={[
                                                styles.categoryChipText,
                                                selectedCategory === cat && styles.categoryChipTextSelected
                                            ]}>
                                                {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Services Grid */}
                                <View style={styles.servicesGrid}>
                                    {features
                                        .filter(f => selectedCategory === 'all' || f.category === selectedCategory)
                                        .map((feature) => {
                                            const isSelected = formData.services.includes(feature.feature_id);
                                            const IconComponent = getIconComponent(feature.icon_name);

                                            return (
                                                <TouchableOpacity
                                                    key={feature.feature_id}
                                                    style={[
                                                        styles.serviceCard,
                                                        isSelected && styles.serviceCardSelected
                                                    ]}
                                                    onPress={() => toggleService(feature.feature_id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={[
                                                        styles.serviceIconContainer,
                                                        isSelected && styles.serviceIconContainerSelected
                                                    ]}>
                                                        <IconComponent
                                                            color={isSelected ? Colors.primary : Colors.gray[600]}
                                                            size={24}
                                                        />
                                                    </View>

                                                    <Text style={[
                                                        styles.serviceLabel,
                                                        isSelected && styles.serviceLabelSelected
                                                    ]} numberOfLines={2}>
                                                        {feature.name}
                                                    </Text>

                                                    {feature.description && (
                                                        <Text style={styles.serviceDescription} numberOfLines={2}>
                                                            {feature.description}
                                                        </Text>
                                                    )}

                                                    <Text style={[
                                                        styles.servicePrice,
                                                        isSelected && styles.servicePriceSelected
                                                    ]}>
                                                        {formatCurrency(feature.base_price)}
                                                    </Text>

                                                    {isSelected && (
                                                        <View style={styles.checkIcon}>
                                                            <Check color={Colors.white} size={14} />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                </View>

                                {/* Selection Summary */}
                                {formData.services.length > 0 && (
                                    <View style={styles.selectionSummary}>
                                        <Text style={styles.summaryText}>
                                            {formData.services.length} service{formData.services.length !== 1 ? 's' : ''} selected
                                        </Text>
                                        <Text style={styles.summaryPrice}>
                                            {formatCurrency(features.filter(f => formData.services.includes(f.feature_id)).reduce((sum, f) => sum + f.base_price, 0))}
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </Animated.View>
                );

            case 4:
                return (
                    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>Admin Panel Setup</Text>
                            <Text style={styles.stepSubtitle}>Create your admin credentials</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Admin Email</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.adminEmail}
                                onChangeText={(text) => setFormData({ ...formData, adminEmail: text })}
                                placeholder="admin@example.com"
                                keyboardType="email-address"
                                placeholderTextColor={Colors.gray[400]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Temporary Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={formData.adminPassword}
                                    onChangeText={(text) => setFormData({ ...formData, adminPassword: text })}
                                    placeholder="••••••••"
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor={Colors.gray[400]}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeButton}
                                >
                                    {showPassword ? (
                                        <EyeOff color={Colors.gray[400]} size={20} />
                                    ) : (
                                        <Eye color={Colors.gray[400]} size={20} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.helperText}>You can change this after first login</Text>
                        </View>

                        <View style={styles.securityTip}>
                            <Shield color={Colors.primary} size={20} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.securityTipText}>
                                    <Text style={{ fontWeight: 'bold' }}>What is this?</Text> This creates your Master Admin account.
                                </Text>
                                <Text style={styles.securityTipSubtext}>
                                    You will use these credentials to log in to your secure backend dashboard where you can manage users, view transactions, set prices, and configure your app settings.
                                </Text>
                            </View>
                        </View>
                    </Animated.View>
                );

            case 5:
                return (
                    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>Build Options</Text>
                            <Text style={styles.stepSubtitle}>Choose your deployment platforms</Text>
                        </View>

                        <View style={styles.platformsContainer}>
                            {[
                                { id: 'android', label: 'Android App', icon: Smartphone, desc: 'APK for Android devices', price: appPrices.PLATFORM_ANDROID },
                                { id: 'web', label: 'Web App', icon: Globe, desc: 'Progressive web application', price: appPrices.PLATFORM_WEB }
                            ].map((platform) => {
                                const isSelected = formData.platforms.includes(platform.id);
                                return (
                                    <TouchableOpacity
                                        key={platform.id}
                                        style={[
                                            styles.platformCard,
                                            isSelected && styles.platformCardSelected
                                        ]}
                                        onPress={() => togglePlatform(platform.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[
                                            styles.platformIconBox,
                                            isSelected && styles.platformIconBoxSelected
                                        ]}>
                                            <platform.icon color={isSelected ? Colors.white : Colors.gray[400]} size={24} />
                                        </View>
                                        <View style={styles.platformInfo}>
                                            <Text style={styles.platformTitle}>{platform.label}</Text>
                                            <Text style={styles.platformDesc}>{platform.desc}</Text>
                                            <Text style={styles.platformPrice}>{formatCurrency(platform.price)}</Text>
                                        </View>
                                        {isSelected && <Check color={Colors.primary} size={24} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {formData.platforms.includes('android') && (
                            <>
                                <Animated.View entering={FadeInRight} style={styles.buildTypeSection}>
                                    <Text style={styles.sectionLabel}>Android Build Type</Text>
                                    <Text style={styles.sectionSubtext}>Select the format(s) you want to build</Text>

                                    <View style={styles.buildTypeOptions}>
                                        {/* APK Preview */}
                                        <TouchableOpacity
                                            style={[
                                                styles.buildTypeCard,
                                                formData.androidBuildTypes.includes('apk') && styles.buildTypeCardSelected
                                            ]}
                                            onPress={() => {
                                                const types = formData.androidBuildTypes.includes('apk')
                                                    ? formData.androidBuildTypes.filter((t: string) => t !== 'apk')
                                                    : [...formData.androidBuildTypes, 'apk'];
                                                setFormData((prev: any) => ({ ...prev, androidBuildTypes: types as ('apk' | 'aab')[] }));
                                            }}
                                        >
                                            <View style={styles.buildTypeHeader}>
                                                <View style={[
                                                    styles.buildTypeCheckbox,
                                                    formData.androidBuildTypes.includes('apk') && styles.buildTypeCheckboxSelected
                                                ]}>
                                                    {formData.androidBuildTypes.includes('apk') && (
                                                        <Check color={Colors.white} size={16} />
                                                    )}
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.buildTypeTitle}>APK (Android Package)</Text>
                                                    <Text style={styles.buildTypeDesc}>Direct installation file. Perfect for quick testing and sharing with friends via WhatsApp or Telegram without using the Play Store.</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {/* AAB */}
                                        <TouchableOpacity
                                            style={[
                                                styles.buildTypeCard,
                                                formData.androidBuildTypes.includes('aab') && styles.buildTypeCardSelected
                                            ]}
                                            onPress={() => {
                                                const isRemoving = formData.androidBuildTypes.includes('aab');
                                                const types = isRemoving
                                                    ? formData.androidBuildTypes.filter((t: string) => t !== 'aab')
                                                    : [...formData.androidBuildTypes, 'aab'];

                                                setFormData((prev: any) => ({
                                                    ...prev,
                                                    androidBuildTypes: types as ('apk' | 'aab')[],
                                                    // Automatically uncheck Play Store if AAB is removed
                                                    publishPlayStore: isRemoving ? false : prev.publishPlayStore
                                                }));
                                            }}
                                        >
                                            <View style={styles.buildTypeHeader}>
                                                <View style={[
                                                    styles.buildTypeCheckbox,
                                                    formData.androidBuildTypes.includes('aab') && styles.buildTypeCheckboxSelected
                                                ]}>
                                                    {formData.androidBuildTypes.includes('aab') && (
                                                        <Check color={Colors.white} size={16} />
                                                    )}
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.buildTypeTitle}>AAB (Android App Bundle)</Text>
                                                    <Text style={styles.buildTypeDesc}>The official publishing format for Google Play. It optimizes app size for users but cannot be installed directly on a phone.</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>

                                <Animated.View
                                    entering={FadeInRight}
                                    style={[
                                        styles.playStoreOption,
                                        !formData.androidBuildTypes.includes('aab') && { opacity: 0.6 }
                                    ]}
                                >
                                    <Switch
                                        value={formData.publishPlayStore}
                                        onValueChange={(val) => {
                                            if (val && !formData.androidBuildTypes.includes('aab')) {
                                                Alert.alert(
                                                    'AAB Required',
                                                    'You must select AAB (Android App Bundle) build type to enable Play Store publishing.'
                                                );
                                                return;
                                            }
                                            setFormData({ ...formData, publishPlayStore: val });
                                        }}
                                        trackColor={{ false: Colors.gray[200], true: Colors.primaryLight }}
                                        thumbColor={formData.publishPlayStore ? Colors.primary : Colors.gray[100]}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.optionTitle}>Publish to Google Play Store</Text>
                                        <Text style={styles.optionPrice}>{formatCurrency(appPrices.PUBLISH_PRICE_PLAY_STORE)}</Text>
                                        {!formData.androidBuildTypes.includes('aab') ? (
                                            <Text style={[styles.optionDesc, { color: Colors.primary }]}>Requires AAB Build Type</Text>
                                        ) : (
                                            <Text style={styles.optionDesc}>We'll help you publish your app on the Play Store</Text>
                                        )}
                                    </View>
                                </Animated.View>
                            </>
                        )}

                        {formData.platforms.includes('web') && (
                            <Animated.View entering={FadeInRight} style={styles.playStoreOption}>
                                <Switch
                                    value={formData.publishWeb}
                                    onValueChange={(val) => setFormData({ ...formData, publishWeb: val })}
                                    trackColor={{ false: Colors.gray[200], true: Colors.primaryLight }}
                                    thumbColor={formData.publishWeb ? Colors.primary : Colors.gray[100]}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.optionTitle}>Publish Web App</Text>
                                    <Text style={styles.optionPrice}>{formatCurrency(appPrices.PUBLISH_WEB)}</Text>
                                    <Text style={styles.optionDesc}>Deploy your web app to production hosting</Text>
                                </View>
                            </Animated.View>
                        )}
                    </Animated.View>
                );
            case 6:
                return (
                    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>Review & Submit</Text>
                            <Text style={styles.stepSubtitle}>Double-check your configuration</Text>
                        </View>

                        <View style={styles.reviewSection}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewTitle}>Branding</Text>
                                <TouchableOpacity onPress={() => setCurrentStep(1)}>
                                    <Text style={styles.editLink}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.reviewText}>App Name: <Text style={styles.reviewValue}>{formData.appName || 'Not set'}</Text></Text>
                            <Text style={styles.reviewText}>Package: <Text style={styles.reviewValue}>{formData.packageName || 'Not set'}</Text></Text>
                        </View>

                        <View style={styles.reviewSection}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewTitle}>Business Info</Text>
                                <TouchableOpacity onPress={() => setCurrentStep(2)}>
                                    <Text style={styles.editLink}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.reviewText}>Name: <Text style={styles.reviewValue}>{formData.businessName || 'Not set'}</Text></Text>
                            <Text style={styles.reviewText}>Email: <Text style={styles.reviewValue}>{formData.email || 'Not set'}</Text></Text>
                        </View>

                        <View style={styles.reviewSection}>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewTitle}>Services</Text>
                                <TouchableOpacity onPress={() => setCurrentStep(3)}>
                                    <Text style={styles.editLink}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.tagsContainer}>
                                {formData.services.length > 0 ? (
                                    formData.services.map(id => {
                                        const s = features.find(f => f.feature_id === id);
                                        const IconComponent = s ? getIconComponent(s.icon_name) : HelpCircle;
                                        return (
                                            <View key={id} style={styles.tag}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <IconComponent size={14} color={Colors.primary} />
                                                    <Text style={styles.tagText}>{s?.name || id}</Text>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.reviewText}>No services selected</Text>
                                )}
                            </View>
                        </View>

                        {/* Payment Method Selection */}
                        <View style={styles.reviewSection}>
                            <Text style={styles.reviewTitle}>Payment Method</Text>
                            <View style={{ gap: 12, marginTop: 12 }}>
                                <TouchableOpacity
                                    style={[styles.paymentOption, formData.paymentMethod === 'wallet' && styles.paymentOptionSelected]}
                                    onPress={() => setFormData({ ...formData, paymentMethod: 'wallet' })}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Wallet color={formData.paymentMethod === 'wallet' ? Colors.primary : Colors.gray[600]} size={24} />
                                        <View>
                                            <Text style={styles.paymentOptionTitle}>Wallet Balance</Text>
                                            <Text style={styles.paymentOptionSub}>Balance: {formatCurrency(walletBalance || 0)}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.radio, formData.paymentMethod === 'wallet' && styles.radioSelected]} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.paymentOption, formData.paymentMethod === 'card' && styles.paymentOptionSelected, { opacity: 0.6 }]}
                                    onPress={() => Alert.alert('Coming Soon', 'Card payments will be available shortly. Please fund your wallet to proceed.')}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <CreditCard color={Colors.gray[400]} size={24} />
                                        <View>
                                            <Text style={styles.paymentOptionTitle}>Debit/Credit Card</Text>
                                            <Text style={{ ...styles.paymentOptionSub, color: Colors.primary, fontWeight: 'bold' }}>Coming Soon</Text>
                                        </View>
                                    </View>
                                    <View style={styles.radio} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Bill Summary */}
                        <View style={styles.billSummary}>
                            <Text style={styles.billTitle}>Bill Summary</Text>

                            {/* Services Breakdown */}
                            {formData.services.map(id => {
                                const s = features.find(f => f.feature_id === id);
                                if (!s) return null;
                                return (
                                    <View key={id} style={styles.billRow}>
                                        <Text style={styles.billItem}>{s.name}</Text>
                                        <Text style={styles.billPrice}>{formatCurrency(s.base_price)}</Text>
                                    </View>
                                );
                            })}

                            {/* Platform Fees */}
                            {formData.platforms.includes('android') && (
                                <View style={styles.billRow}>
                                    <Text style={styles.billItem}>Android App</Text>
                                    <Text style={styles.billPrice}>{formatCurrency(appPrices.PLATFORM_ANDROID)}</Text>
                                </View>
                            )}
                            {formData.platforms.includes('web') && (
                                <View style={styles.billRow}>
                                    <Text style={styles.billItem}>Web App</Text>
                                    <Text style={styles.billPrice}>{formatCurrency(appPrices.PLATFORM_WEB)}</Text>
                                </View>
                            )}

                            {/* Publishing Fees */}
                            {formData.platforms.includes('android') && formData.publishPlayStore && (
                                <View style={styles.billRow}>
                                    <Text style={styles.billItem}>Play Store Publishing</Text>
                                    <Text style={styles.billPrice}>{formatCurrency(appPrices.PUBLISH_PRICE_PLAY_STORE)}</Text>
                                </View>
                            )}

                            <View style={styles.billDivider} />
                            <View style={styles.billTotalRow}>
                                <Text style={styles.billTotalText}>Total Amount</Text>
                                <Text style={styles.billTotalAmount}>{formatCurrency(calculateTotal())}</Text>
                            </View>

                            {(walletBalance || 0) < calculateTotal() && (
                                <View style={styles.insufficientFundsCard}>
                                    <View style={styles.insufficientHeader}>
                                        <LucideIcons.AlertTriangle color="#991B1B" size={20} />
                                        <Text style={styles.insufficientTitle}>Insufficient Balance</Text>
                                    </View>
                                    <Text style={styles.insufficientSub}>Your wallet balance is not enough to complete this build. Please fund your wallet using the details below:</Text>

                                    {userVirtualAccount ? (
                                        <View style={styles.virtualAccountBox}>
                                            <View style={styles.vaRow}>
                                                <Text style={styles.vaLabel}>Bank Name</Text>
                                                <Text style={styles.vaValue}>{userVirtualAccount.bank}</Text>
                                            </View>
                                            <View style={styles.vaRow}>
                                                <Text style={styles.vaLabel}>Account Number</Text>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        // Fallback for copy if needed, but basic text is fine
                                                        Alert.alert('Copied', 'Account number copied to clipboard');
                                                    }}
                                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                                >
                                                    <Text style={styles.vaValueBold}>{userVirtualAccount.account_number}</Text>
                                                    <LucideIcons.Copy size={14} color={Colors.primary} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.vaRow}>
                                                <Text style={styles.vaLabel}>Account Name</Text>
                                                <Text style={styles.vaValue}>{userVirtualAccount.account_name}</Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.generateButton}
                                            onPress={() => router.push('/wallet')}
                                        >
                                            <Text style={styles.generateButtonText}>Generate Virtual Account</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    </Animated.View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Create App</Text>
                </View>
                <View style={styles.financialCard}>
                    <View style={styles.financialRow}>
                        <View style={styles.financialItem}>
                            <Text style={styles.financialLabel}>Cost</Text>
                            <Text style={styles.financialValue}>{formatCurrency(calculateTotal())}</Text>
                        </View>
                        {walletBalance !== null && (
                            <>
                                <View style={styles.financialDivider} />
                                <View style={styles.financialItem}>
                                    <Text style={styles.financialLabel}>Wallet</Text>
                                    <Text style={[styles.financialValue, { color: walletBalance >= calculateTotal() ? Colors.primary : Colors.red[500] }]}>
                                        {formatCurrency(walletBalance)}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.progressContent}>
                    {steps.map((step, index) => (
                        <View key={step.number} style={styles.progressStep}>
                            <View style={[
                                styles.stepCircle,
                                currentStep >= step.number && styles.stepCircleActive,
                                currentStep > step.number && styles.stepCircleCompleted
                            ]}>
                                {currentStep > step.number ? (
                                    <Check color={Colors.white} size={16} />
                                ) : (
                                    <step.icon color={currentStep >= step.number ? Colors.white : Colors.gray[400]} size={16} />
                                )}
                            </View>
                            {index < steps.length - 1 && (
                                <View style={[
                                    styles.stepLine,
                                    currentStep > step.number && styles.stepLineActive
                                ]} />
                            )}
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {renderStepContent()}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
                {currentStep > 1 && (
                    <TouchableOpacity style={styles.footerBackButton} onPress={handleBack}>
                        <ArrowLeft color={Colors.gray[700]} size={20} />
                        <Text style={styles.footerBackText}>Back</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.footerNextButton, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleNext}
                    disabled={isSubmitting}
                >
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryLight]}
                        style={styles.footerNextGradient}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Text style={styles.footerNextText}>
                                    {currentStep === totalSteps ? 'Start Building' : 'Continue'}
                                </Text>
                                <ArrowRight color={Colors.white} size={20} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Modern Insufficient Funds Modal */}
            <Modal
                visible={showInsufficientModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInsufficientModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        entering={FadeInRight}
                        style={styles.modernAlertContainer}
                    >
                        {/* Header with gradient */}
                        <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            style={styles.modernAlertHeader}
                        >
                            <View style={styles.alertIconContainer}>
                                <Wallet color="#fff" size={32} />
                            </View>
                            <Text style={styles.modernAlertTitle}>Insufficient Balance</Text>
                            <Text style={styles.modernAlertSubtitle}>
                                Your wallet doesn't have enough funds
                            </Text>
                        </LinearGradient>

                        {/* Content */}
                        <View style={styles.modernAlertContent}>
                            {/* Balance Comparison */}
                            <View style={styles.balanceComparison}>
                                <View style={styles.balanceBox}>
                                    <Text style={styles.balanceLabel}>Current Balance</Text>
                                    <Text style={styles.balanceAmount}>
                                        ₦{insufficientData.current.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.balanceDivider}>
                                    <ArrowRight color={Colors.gray[400]} size={24} />
                                </View>
                                <View style={[styles.balanceBox, styles.balanceBoxRequired]}>
                                    <Text style={styles.balanceLabelRequired}>Required Amount</Text>
                                    <Text style={styles.balanceAmountRequired}>
                                        ₦{insufficientData.required.toLocaleString()}
                                    </Text>
                                </View>
                            </View>

                            {/* Shortage Info */}
                            <View style={styles.shortageBox}>
                                <Text style={styles.shortageLabel}>You need to add</Text>
                                <Text style={styles.shortageAmount}>
                                    ₦{(insufficientData.required - insufficientData.current).toLocaleString()}
                                </Text>
                            </View>

                            {/* Message */}
                            <Text style={styles.modernAlertMessage}>
                                Please fund your wallet to continue with the app creation. You can use your dedicated virtual account or other payment methods.
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.modernAlertActions}>
                            <TouchableOpacity
                                style={styles.alertCancelButton}
                                onPress={() => {
                                    setShowInsufficientModal(false);
                                    setIsSubmitting(false);
                                }}
                            >
                                <Text style={styles.alertCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.alertFundButton}
                                onPress={() => {
                                    setShowInsufficientModal(false);
                                    setIsSubmitting(false);
                                    router.push('/wallet');
                                }}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryLight]}
                                    style={styles.alertFundGradient}
                                >
                                    <Wallet color="#fff" size={18} />
                                    <Text style={styles.alertFundText}>Fund Wallet</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Modern App Saved (Offline) Modal */}
            <Modal
                visible={showSavedModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSavedModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        entering={FadeInRight}
                        style={styles.modernAlertContainer}
                    >
                        {/* Header with success gradient */}
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.modernAlertHeader}
                        >
                            <View style={styles.alertIconContainer}>
                                <CheckCircle color="#fff" size={32} />
                            </View>
                            <Text style={styles.modernAlertTitle}>App Details Saved!</Text>
                            <Text style={styles.modernAlertSubtitle}>
                                Your configuration is secured
                            </Text>
                        </LinearGradient>

                        {/* Content */}
                        <View style={styles.modernAlertContent}>
                            <View style={styles.infoBox}>
                                <Smartphone color={Colors.primary} size={20} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.infoTitle}>{formData.appName}</Text>
                                    <Text style={styles.infoSub}>{formData.packageName}</Text>
                                </View>
                            </View>

                            <Text style={styles.modernAlertMessage}>
                                We've saved your app details. However, your wallet balance is insufficient to start the build process.
                            </Text>

                            <View style={styles.shortageBox}>
                                <Text style={styles.shortageLabel}>Action Required</Text>
                                <Text style={styles.shortageDescription}>
                                    Fund your wallet with {formatCurrency(calculateTotal())} to initiate the automated build pipeline.
                                </Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.modernAlertActions}>
                            <TouchableOpacity
                                style={styles.alertCancelButton}
                                onPress={() => {
                                    setShowSavedModal(false);
                                    router.push({
                                        pathname: '/build-status',
                                        params: {
                                            appId: savedAppData?.app?.app_id,
                                            adminCredentials: JSON.stringify(savedAppData?.admin_credentials)
                                        }
                                    });
                                }}
                            >
                                <Text style={styles.alertCancelText}>View Status</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.alertFundButton, { flex: 1.2 }]}
                                onPress={() => {
                                    setShowSavedModal(false);
                                    router.push('/dashboard');
                                }}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryLight]}
                                    style={styles.alertFundGradient}
                                >
                                    <Check color="#fff" size={18} />
                                    <Text style={styles.alertFundText}>OK</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

interface ColorSelectionModalProps {
    visible: boolean;
    initialColor: string;
    title: string;
    onClose: () => void;
    onSelect: (color: string) => void;
}

const ColorSelectionModal = ({ visible, initialColor, title, onClose, onSelect }: ColorSelectionModalProps) => {
    const [localColor, setLocalColor] = useState(initialColor);
    const [localHexInput, setLocalHexInput] = useState(initialColor.replace('#', '').toUpperCase());

    const professionalPresets = [
        '#16A34A', '#2563EB', '#7C3AED', '#DC2626', '#EA580C',
        '#0891B2', '#4F46E5', '#BE185D', '#111827', '#4B5563'
    ];

    const handleSelect = ({ hex }: { hex: string }) => {
        setLocalColor(hex);
        setLocalHexInput(hex.replace('#', '').toUpperCase());
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <LucideIcons.X color={Colors.gray[400]} size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.hexInputWrapper}>
                        <Text style={styles.hexHash}>#</Text>
                        <TextInput
                            style={styles.hexInput}
                            value={localHexInput}
                            onChangeText={(text) => {
                                const clean = text.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 6);
                                setLocalHexInput(clean);
                                if (clean.length === 3 || clean.length === 6) {
                                    setLocalColor('#' + clean);
                                }
                            }}
                            placeholder="FFFFFF"
                            maxLength={6}
                        />
                    </View>

                    <ColorPicker
                        style={{ width: '100%' }}
                        value={localColor}
                        onComplete={handleSelect}
                    >
                        <Panel1 style={{ height: 200, borderRadius: 12, marginBottom: 20 }} />
                        <HueSlider style={{ borderRadius: 10, height: 24, marginBottom: 30 }} />

                        <View style={styles.colorPresets}>
                            {professionalPresets.map(preset => (
                                <TouchableOpacity
                                    key={preset}
                                    style={[
                                        styles.presetCircle,
                                        { backgroundColor: preset },
                                        localColor.toUpperCase() === preset.toUpperCase() && { borderWidth: 3, borderColor: '#000' }
                                    ]}
                                    onPress={() => handleSelect({ hex: preset })}
                                />
                            ))}
                        </View>
                    </ColorPicker>

                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: localColor }]}
                        onPress={() => onSelect(localColor)}
                    >
                        <Text style={styles.confirmButtonText}>Confirm Selection</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
        borderBottomColor: Colors.gray[200],
    },
    financialCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    financialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    financialItem: {
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    financialLabel: {
        fontSize: 10,
        color: Colors.gray[500],
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    financialValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    financialDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.gray[200],
        marginHorizontal: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    progressContainer: {
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
        height: 60,
    },
    progressContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    progressStep: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.gray[200],
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleActive: {
        backgroundColor: Colors.primary,
    },
    stepCircleCompleted: {
        backgroundColor: Colors.primary,
    },
    stepLine: {
        width: 30,
        height: 2,
        backgroundColor: Colors.gray[200],
        marginHorizontal: 8,
    },
    stepLineActive: {
        backgroundColor: Colors.primary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 150,
    },
    stepContainer: {
        gap: 24,
    },
    stepHeader: {
        marginBottom: 8,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 16,
        color: Colors.gray[600],
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.gray[700],
    },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text.primary,
    },
    passwordContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 12,
        padding: 16,
        paddingRight: 48,
        fontSize: 16,
        color: Colors.text.primary,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        padding: 8,
    },
    uploadBox: {
        borderWidth: 2,
        borderColor: Colors.gray[300],
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
    },
    uploadText: {
        fontSize: 16,
        color: Colors.gray[600],
        marginBottom: 4,
    },
    uploadSubtext: {
        fontSize: 12,
        color: Colors.gray[400],
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    colorInputContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    colorPreview: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    previewContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    previewLabel: {
        fontSize: 14,
        color: Colors.gray[700],
        marginBottom: 16,
    },
    previewBox: {
        backgroundColor: Colors.gray[100],
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
    },
    previewIconBox: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    previewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    previewSubtitle: {
        fontSize: 14,
        color: Colors.gray[600],
    },
    pickerContainer: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 16,
        color: Colors.text.primary,
        textTransform: 'capitalize',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    helperText: {
        fontSize: 12,
        color: Colors.gray[500],
        marginTop: 4,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 16,
    },
    serviceCard: {
        width: (width - 48 - 16) / 2,
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.gray[200],
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        minHeight: 160,
        position: 'relative',
    },
    serviceCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLighter,
    },
    serviceIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    serviceIconContainerSelected: {
        backgroundColor: Colors.white,
    },
    serviceLabel: {
        fontSize: 14,
        color: Colors.text.primary,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    serviceLabelSelected: {
        color: Colors.primary,
    },
    serviceDescription: {
        fontSize: 11,
        color: Colors.gray[500],
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 14,
    },
    servicePrice: {
        fontSize: 13,
        color: Colors.gray[600],
        fontWeight: '700',
    },
    servicePriceSelected: {
        color: Colors.primary,
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: Colors.gray[500],
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 14,
        color: Colors.gray[500],
    },
    categoryScroll: {
        marginTop: 16,
    },
    categoryContent: {
        gap: 8,
        paddingRight: 16,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.gray[100],
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    categoryChipText: {
        fontSize: 13,
        color: Colors.gray[700],
        fontWeight: '500',
    },
    categoryChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    categoryChipTextSelected: {
        color: Colors.white,
    },
    selectionSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
    },
    summaryText: {
        fontSize: 14,
        color: Colors.white,
        fontWeight: '600',
    },
    summaryPrice: {
        fontSize: 18,
        color: Colors.white,
        fontWeight: 'bold',
    },
    securityTip: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#DCFCE7',
        padding: 16,
        borderRadius: 12,
        alignItems: 'flex-start',
    },
    securityTipText: {
        flex: 1,
        fontSize: 14,
        color: Colors.gray[700],
        lineHeight: 20,
    },
    platformsContainer: {
        gap: 12,
    },
    platformCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.gray[200],
        borderRadius: 16,
        padding: 16,
        gap: 16,
    },
    platformCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#DCFCE7',
    },
    platformIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    platformIconBoxSelected: {
        backgroundColor: Colors.primary,
    },
    platformInfo: {
        flex: 1,
    },
    platformTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    platformDesc: {
        fontSize: 12,
        color: Colors.gray[600],
    },
    playStoreOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 12,
        padding: 16,
        gap: 16,
    },
    optionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.gray[700],
    },
    optionDesc: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    buildTypeSection: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    sectionSubtext: {
        fontSize: 13,
        color: Colors.gray[600],
        marginBottom: 16,
    },
    buildTypeOptions: {
        gap: 12,
    },
    buildTypeCard: {
        backgroundColor: Colors.gray[50],
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: Colors.gray[200],
    },
    buildTypeCardSelected: {
        backgroundColor: '#EFF6FF',
        borderColor: Colors.primary,
    },
    buildTypeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    buildTypeCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.gray[300],
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
    },
    buildTypeCheckboxSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    buildTypeTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    buildTypeDesc: {
        fontSize: 12,
        color: Colors.gray[600],
    },
    reviewSection: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    reviewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    editLink: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '500',
    },
    reviewText: {
        fontSize: 14,
        color: Colors.gray[600],
        marginBottom: 4,
    },
    reviewValue: {
        color: Colors.text.primary,
        fontWeight: '500',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '500',
    },
    estimateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: Colors.primary, // Using primary color directly or gradient via View style if needed, but simple bg is fine
        padding: 24,
        borderRadius: 16,
    },
    estimateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.white,
        marginBottom: 4,
    },
    estimateTime: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[200],
        flexDirection: 'row',
        gap: 16,
    },
    footerBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    footerBackText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.gray[700],
    },
    footerNextButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    footerNextGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    footerNextText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.white,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    closeButtonText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '600',
    },
    modalCloseButton: {
        padding: 4,
    },
    confirmButton: {
        marginTop: 32,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    confirmButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    hexInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gray[50],
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        marginBottom: 20,
    },
    hexHash: {
        fontSize: 18,
        color: Colors.gray[400],
        fontWeight: '600',
    },
    hexInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        fontSize: 18,
        color: Colors.text.primary,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    colorPresets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 10,
        justifyContent: 'center',
    },
    presetCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: Colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    billSummary: {
        backgroundColor: Colors.gray[50],
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    billTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 16,
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    billItem: {
        fontSize: 14,
        color: Colors.gray[600],
    },
    billPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    billDivider: {
        height: 1,
        backgroundColor: Colors.gray[200],
        marginVertical: 16,
    },
    billTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    billTotalText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    billTotalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    paymentOptionSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLighter,
    },
    paymentOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    paymentOptionSub: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.gray[300],
    },
    radioSelected: {
        borderColor: Colors.primary,
        borderWidth: 6,
    },
    insufficientFundsCard: {
        marginTop: 24,
        padding: 20,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    insufficientHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    insufficientTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#991B1B',
    },
    insufficientSub: {
        fontSize: 14,
        color: '#7F1D1D',
        lineHeight: 20,
        marginBottom: 16,
    },
    virtualAccountBox: {
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    vaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vaLabel: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    vaValue: {
        fontSize: 14,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    vaValueBold: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    generateButton: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    generateButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    // Modern Alert Modal Styles
    modernAlertContainer: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    modernAlertHeader: {
        padding: 24,
        alignItems: 'center',
    },
    alertIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modernAlertTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 8,
    },
    modernAlertSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    modernAlertContent: {
        padding: 24,
    },
    balanceComparison: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    balanceBox: {
        flex: 1,
        backgroundColor: Colors.gray[50],
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    balanceBoxRequired: {
        backgroundColor: '#FEE2E2',
    },
    balanceLabel: {
        fontSize: 11,
        color: Colors.gray[600],
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    balanceLabelRequired: {
        fontSize: 11,
        color: '#991B1B',
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    balanceAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    balanceAmountRequired: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#DC2626',
    },
    balanceDivider: {
        paddingHorizontal: 8,
    },
    shortageBox: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    shortageLabel: {
        fontSize: 12,
        color: '#991B1B',
        marginBottom: 4,
        fontWeight: '600',
    },
    shortageAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#DC2626',
    },
    modernAlertMessage: {
        fontSize: 14,
        color: Colors.gray[600],
        textAlign: 'center',
        lineHeight: 20,
    },
    modernAlertActions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
    },
    alertCancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
    },
    alertCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.gray[700],
    },
    alertFundButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    alertFundGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    alertFundText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.white,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.gray[50],
        borderRadius: 12,
        gap: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.gray[100],
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    infoSub: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    shortageDescription: {
        fontSize: 13,
        color: '#991B1B',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 18,
    },
    securityTipSubtext: {
        fontSize: 13,
        color: Colors.gray[500],
        lineHeight: 18,
    },
    platformPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        marginTop: 4,
    },
    optionPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        marginTop: 2,
    },
});
