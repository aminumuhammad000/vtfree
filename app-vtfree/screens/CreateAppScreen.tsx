import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, Image, Switch, Platform, ActivityIndicator, Alert } from 'react-native';
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
    Upload,
    HelpCircle,
    Smartphone,
    Globe,
    Monitor,
    ChevronDown,
    Wallet,
    CreditCard
} from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInRight, FadeOutLeft, Layout, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { AppService } from '../services/app.service';
import { Modal } from 'react-native';
import ColorPicker, { Panel1, Swatches, Preview, OpacitySlider, HueSlider } from 'reanimated-color-picker';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function CreateAppScreen() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Branding
        logo: null as string | null,
        primaryColor: '#16A34A',
        secondaryColor: '#22C55E',
        appName: '',
        tagline: '',

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

        // Step 5: Build Options
        platforms: [] as string[],
        publishPlayStore: false,
        publishAppStore: false,
        paymentMethod: 'wallet' as 'wallet' | 'card'
    });

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [activeColorType, setActiveColorType] = useState<'primary' | 'secondary'>('primary');

    const onSelectColor = ({ hex }: { hex: string }) => {
        if (activeColorType === 'primary') {
            setFormData(prev => ({ ...prev, primaryColor: hex }));
        } else {
            setFormData(prev => ({ ...prev, secondaryColor: hex }));
        }
    };

    const totalSteps = 6;

    const steps = [
        { number: 1, title: 'Branding', icon: Palette },
        { number: 2, title: 'Business Info', icon: Building2 },
        { number: 3, title: 'Services', icon: CheckSquare },
        { number: 4, title: 'Admin Panel', icon: Shield },
        { number: 5, title: 'Build Options', icon: Rocket },
        { number: 6, title: 'Review', icon: Check }
    ];

    const servicesList = [
        { id: 'airtime', label: 'Airtime', icon: '📱', price: 3000 },
        { id: 'data', label: 'Data', icon: '📶', price: 5000 },
        { id: 'cable', label: 'Cable TV', icon: '📺', price: 3000 },
        { id: 'electricity', label: 'Electricity', icon: '⚡', price: 3000 },
        { id: 'exam', label: 'Exam Pins', icon: '📝', price: 3000 },
        { id: 'airtime2cash', label: 'Airtime to Cash', icon: '💰', price: 5000 },
        { id: 'sms', label: 'Bulk SMS', icon: '💬', price: 3000 },
        { id: 'giftcard', label: 'Gift Card', icon: '🎁', price: 5000 }
    ];

    const calculateTotal = () => {
        let total = 0;
        // Services
        formData.services.forEach(serviceId => {
            const service = servicesList.find(s => s.id === serviceId);
            if (service) total += service.price;
        });

        // Platform Base Fees
        if (formData.platforms.includes('android')) total += 10000; // Android App Base Price
        if (formData.platforms.includes('ios')) total += 100000;   // iOS App Base Price
        if (formData.platforms.includes('web')) total += 20000;    // Web App Base Price

        // Publishing Fees
        if (formData.platforms.includes('android') && formData.publishPlayStore) total += 35000;
        if (formData.platforms.includes('ios') && formData.publishAppStore) total += 50000;

        return total;
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString()}`;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setFormData({ ...formData, logo: `data:image/jpeg;base64,${result.assets[0].base64}` });
        }
    };

    const handleNext = async () => {
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
                package_name: `com.vtfree.${formData.appName.toLowerCase().replace(/\s+/g, '')}`,
                platforms: {
                    android: formData.platforms.includes('android'),
                    ios: formData.platforms.includes('ios'),
                    web: formData.platforms.includes('web')
                },
                publish_play_store: formData.publishPlayStore,
                publish_app_store: formData.publishAppStore,
                branding: {
                    primary_color: formData.primaryColor,
                    secondary_color: formData.secondaryColor,
                    logo_url: formData.logo || 'https://via.placeholder.com/150'
                },
                services: formData.services,
                payment_method: formData.paymentMethod
            };

            const response = await AppService.createApp(payload);

            if (response.success && !response.payment_required) {
                router.push({
                    pathname: '/build-status',
                    params: {
                        appId: response.data.app.app_id,
                        adminCredentials: JSON.stringify(response.data.admin_credentials)
                    }
                });
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
                    Alert.alert(
                        'Insufficient Funds',
                        `You need ₦${(response.data.required || 0).toLocaleString()} but have ₦${(response.data.current || 0).toLocaleString()}. Please fund your wallet.`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'My Wallet', onPress: () => router.push('/wallet') }
                        ]
                    );
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
        setFormData(prev => ({
            ...prev,
            services: prev.services.includes(serviceId)
                ? prev.services.filter(s => s !== serviceId)
                : [...prev.services, serviceId]
        }));
    };

    const togglePlatform = (platformId: string) => {
        setFormData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(platformId)
                ? prev.platforms.filter(p => p !== platformId)
                : [...prev.platforms, platformId]
        }));
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
                            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                                {formData.logo ? (
                                    <Image source={{ uri: formData.logo }} style={{ width: 80, height: 80, borderRadius: 8 }} resizeMode="contain" />
                                ) : (
                                    <>
                                        <Upload color={Colors.gray[400]} size={32} style={{ marginBottom: 8 }} />
                                        <Text style={styles.uploadText}>Click to upload logo</Text>
                                        <Text style={styles.uploadSubtext}>PNG, JPG up to 2MB</Text>
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

                        {/* Tagline */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tagline</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.tagline}
                                onChangeText={(text) => setFormData({ ...formData, tagline: text })}
                                placeholder="Recharge made easy"
                                placeholderTextColor={Colors.gray[400]}
                            />
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

                        <Modal visible={showColorPicker} animationType='slide' transparent={true}>
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Select {activeColorType === 'primary' ? 'Primary' : 'Secondary'} Color</Text>
                                        <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                                            <Text style={styles.closeButtonText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <ColorPicker
                                        style={{ width: '100%', height: 400 }}
                                        value={activeColorType === 'primary' ? formData.primaryColor : formData.secondaryColor}
                                        onComplete={onSelectColor}
                                    >
                                        <Preview />
                                        <Panel1 />
                                        <HueSlider />
                                        <OpacitySlider />
                                        <Swatches />
                                    </ColorPicker>
                                </View>
                            </View>
                        </Modal>

                        {/* Live Preview */}
                        <View style={styles.previewContainer}>
                            <Text style={styles.previewLabel}>Live Preview</Text>
                            <View style={styles.previewBox}>
                                <View style={[styles.previewIconBox, { backgroundColor: formData.primaryColor }]}>
                                    <Image
                                        source={require('../assets/images/logo.png')}
                                        style={{ width: 40, height: 40, tintColor: Colors.white }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={[styles.previewTitle, { color: formData.primaryColor }]}>
                                    {formData.appName || 'My VTU App'}
                                </Text>
                                <Text style={styles.previewSubtitle}>
                                    {formData.tagline || 'Recharge made easy'}
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

                        <View style={styles.inputGroup}>
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
                            <Text style={styles.stepSubtitle}>Choose which services to enable</Text>
                        </View>

                        <View style={styles.servicesGrid}>
                            {servicesList.map((service) => {
                                const isSelected = formData.services.includes(service.id);
                                return (
                                    <TouchableOpacity
                                        key={service.id}
                                        style={[
                                            styles.serviceCard,
                                            isSelected && styles.serviceCardSelected
                                        ]}
                                        onPress={() => toggleService(service.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.serviceIcon}>{service.icon}</Text>
                                        <Text style={[
                                            styles.serviceLabel,
                                            isSelected && styles.serviceLabelSelected
                                        ]}>{service.label}</Text>
                                        <Text style={[
                                            styles.servicePrice,
                                            isSelected && styles.servicePriceSelected
                                        ]}>{formatCurrency(service.price)}</Text>
                                        {isSelected && (
                                            <View style={styles.checkIcon}>
                                                <Check color={Colors.primary} size={16} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
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
                            <TextInput
                                style={styles.input}
                                value={formData.adminPassword}
                                onChangeText={(text) => setFormData({ ...formData, adminPassword: text })}
                                placeholder="••••••••"
                                secureTextEntry
                                placeholderTextColor={Colors.gray[400]}
                            />
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
                                { id: 'android', label: 'Android App', icon: Smartphone, desc: 'APK for Android devices', price: 10000 },
                                { id: 'ios', label: 'iOS App', icon: Smartphone, desc: 'App for iPhones & iPads', price: 100000 },
                                { id: 'web', label: 'Web App', icon: Globe, desc: 'Progressive web application', price: 20000 }
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
                            <Animated.View entering={FadeInRight} style={styles.playStoreOption}>
                                <Switch
                                    value={formData.publishPlayStore}
                                    onValueChange={(val) => setFormData({ ...formData, publishPlayStore: val })}
                                    trackColor={{ false: Colors.gray[200], true: Colors.primaryLight }}
                                    thumbColor={formData.publishPlayStore ? Colors.primary : Colors.gray[100]}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.optionTitle}>Publish to Google Play Store</Text>
                                    <Text style={styles.optionPrice}>₦35,000</Text>
                                    <Text style={styles.optionDesc}>We'll help you publish your app on the Play Store</Text>
                                </View>
                            </Animated.View>
                        )}

                        {formData.platforms.includes('ios') && (
                            <Animated.View entering={FadeInRight} style={styles.playStoreOption}>
                                <Switch
                                    value={formData.publishAppStore}
                                    onValueChange={(val) => setFormData({ ...formData, publishAppStore: val })}
                                    trackColor={{ false: Colors.gray[200], true: Colors.primaryLight }}
                                    thumbColor={formData.publishAppStore ? Colors.primary : Colors.gray[100]}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.optionTitle}>Publish to Apple App Store</Text>
                                    <Text style={styles.optionPrice}>₦50,000</Text>
                                    <Text style={styles.optionDesc}>We'll help you publish your app on the App Store</Text>
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
                            <Text style={styles.reviewText}>Tagline: <Text style={styles.reviewValue}>{formData.tagline || 'Not set'}</Text></Text>
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
                                        const s = servicesList.find(sl => sl.id === id);
                                        return (
                                            <View key={id} style={styles.tag}>
                                                <Text style={styles.tagText}>{s?.icon} {s?.label}</Text>
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
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Wallet color={formData.paymentMethod === 'wallet' ? Colors.primary : Colors.gray[600]} size={24} />
                                        <View>
                                            <Text style={styles.paymentOptionTitle}>Wallet Balance</Text>
                                            <Text style={styles.paymentOptionSub}>Pay from your VTfree wallet</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.radio, formData.paymentMethod === 'wallet' && styles.radioSelected]} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.paymentOption, formData.paymentMethod === 'card' && styles.paymentOptionSelected]}
                                    onPress={() => setFormData({ ...formData, paymentMethod: 'card' })}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <CreditCard color={formData.paymentMethod === 'card' ? Colors.primary : Colors.gray[600]} size={24} />
                                        <View>
                                            <Text style={styles.paymentOptionTitle}>Debit/Credit Card</Text>
                                            <Text style={styles.paymentOptionSub}>Pay securely via Paystack</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.radio, formData.paymentMethod === 'card' && styles.radioSelected]} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Bill Summary */}
                        <View style={styles.billSummary}>
                            <Text style={styles.billTitle}>Bill Summary</Text>

                            {/* Services Breakdown */}
                            {formData.services.map(id => {
                                const s = servicesList.find(sl => sl.id === id);
                                if (!s) return null;
                                return (
                                    <View key={id} style={styles.billRow}>
                                        <Text style={styles.billItem}>{s.label}</Text>
                                        <Text style={styles.billPrice}>{formatCurrency(s.price)}</Text>
                                    </View>
                                );
                            })}

                            {/* Platform Fees */}
                            {formData.platforms.includes('android') && (
                                <View style={styles.billRow}>
                                    <Text style={styles.billItem}>Android App</Text>
                                    <Text style={styles.billPrice}>{formatCurrency(10000)}</Text>
                                </View>
                            )}
                            {formData.platforms.includes('ios') && (
                                <View style={styles.billRow}>
                                    <Text style={styles.billItem}>iOS App</Text>
                                    <Text style={styles.billPrice}>{formatCurrency(100000)}</Text>
                                </View>
                            )}
                            {formData.platforms.includes('web') && (
                                <View style={styles.billRow}>
                                    <Text style={styles.billItem}>Web App</Text>
                                    <Text style={styles.billPrice}>{formatCurrency(20000)}</Text>
                                </View>
                            )}

                            {/* Publishing Fees */}
                            {formData.platforms.includes('android') && formData.publishPlayStore && (
                                <View style={styles.billRow}>
                                    <Text style={styles.billItem}>Play Store Publishing</Text>
                                    <Text style={styles.billPrice}>{formatCurrency(35000)}</Text>
                                </View>
                            )}
                            {formData.platforms.includes('ios') && formData.publishAppStore && (
                                <View style={styles.billRow}>
                                    <Text style={styles.billItem}>Apple Store Publishing</Text>
                                    <Text style={styles.billPrice}>{formatCurrency(50000)}</Text>
                                </View>
                            )}

                            <View style={styles.billDivider} />
                            <View style={styles.billTotalRow}>
                                <Text style={styles.billTotalText}>Total Amount</Text>
                                <Text style={styles.billTotalAmount}>{formatCurrency(calculateTotal())}</Text>
                            </View>
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
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Create New App</Text>
                    <Text style={styles.headerSubtitle}>Step {currentStep} of {totalSteps}</Text>
                </View>
                <View style={styles.totalBadge}>
                    <Text style={styles.totalBadgeText}>{formatCurrency(calculateTotal())}</Text>
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
            <View style={styles.footer}>
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
        </View>
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
    totalBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    totalBadgeText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 14,
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
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: Colors.gray[500],
        textAlign: 'center',
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
        paddingBottom: 100,
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
        gap: 12,
    },
    serviceCard: {
        width: (width - 48 - 12) / 2,
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.gray[200],
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    serviceCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#DCFCE7',
    },
    serviceIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    serviceLabel: {
        fontSize: 14,
        color: Colors.gray[700],
        fontWeight: '500',
    },
    serviceLabelSelected: {
        color: Colors.primary,
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
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
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
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
    servicePrice: {
        fontSize: 12,
        color: Colors.gray[500],
        marginTop: 4,
        fontWeight: '600',
    },
    servicePriceSelected: {
        color: Colors.primary,
    },
    securityTipSubtext: {
        fontSize: 12,
        color: Colors.gray[600],
        marginTop: 4,
        lineHeight: 18,
    },
    optionPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
        marginVertical: 2,
    },
    platformPrice: {
        fontSize: 12,
        color: Colors.gray[500],
        marginTop: 2,
        fontWeight: '600',
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
});
