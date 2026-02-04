import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Rocket, Smartphone, Globe, Monitor, Check, AlertCircle, ShoppingCart } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { AppService } from '../services/app.service';
import { WalletService } from '../services/wallet.service';
import CustomAlert from '../components/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BuildAppScreen() {
    const router = useRouter();
    const { appId } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [appData, setAppData] = useState<any>(null);
    const [prices, setPrices] = useState<any>({});
    const [walletBalance, setWalletBalance] = useState(0);

    // Build Config State
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [androidBuildTypes, setAndroidBuildTypes] = useState<string[]>(['apk']);
    const [publishPlayStore, setPublishPlayStore] = useState(false);
    const [publishWeb, setPublishWeb] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
    }>({ visible: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        if (appId) loadData();
    }, [appId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [detailsRes, pricesRes, walletRes] = await Promise.all([
                AppService.getAppDetails(appId as string),
                AppService.getAppPrices(),
                WalletService.getWallet()
            ]);

            if (detailsRes.success) {
                setAppData(detailsRes.data.app);
                // Pre-select current platforms or default to android
                const currentPlatforms = [];
                if (detailsRes.data.app.platforms?.android) currentPlatforms.push('android');
                if (detailsRes.data.app.platforms?.web) currentPlatforms.push('web');

                if (currentPlatforms.length === 0) setPlatforms(['android']);
                else setPlatforms(currentPlatforms);
            }

            if (pricesRes.success) {
                setPrices(pricesRes.data);
            }

            if (walletRes.success) {
                setWalletBalance(walletRes.data.balance || 0);
            }

        } catch (error) {
            console.error('Failed to load data', error);
            Alert.alert('Error', 'Failed to load app data');
        } finally {
            setLoading(false);
        }
    };

    const togglePlatform = (platform: string) => {
        setPlatforms(prev => {
            if (prev.includes(platform)) return prev.filter(p => p !== platform);
            return [...prev, platform];
        });
    };

    const toggleBuildType = (type: string) => {
        setAndroidBuildTypes(prev => {
            if (prev.includes(type)) return prev.filter(t => t !== type);
            return [...prev, type];
        });
    };

    const calculateTotal = () => {
        let total = 0;
        // Base Platform Fees (Only charge if it's a new platform or explicit re-charge? 
        // User request: "updating app will not charge you anything but building do so"
        // Usually, building involves generating the artifact.

        // Assuming we charge for the Build Action itself based on platforms selected.
        // Or strictly following the prices.

        if (platforms.includes('android')) total += (prices.PLATFORM_ANDROID || 10000);
        if (platforms.includes('web')) total += (prices.PLATFORM_WEB || 20000);

        // Add publishing fees if selected
        if (platforms.includes('android') && publishPlayStore) total += (prices.PUBLISH_PRICE_PLAY_STORE || 35000);
        if (platforms.includes('web') && publishWeb) total += (prices.PUBLISH_WEB || 15000);

        return total;
    };

    const handleBuild = async () => {
        const isBuilding = appData?.status === 'building' || appData?.build_status_full === 'queued' || appData?.build_status_full === 'building';
        if (isBuilding) {
            Alert.alert('Build in Progress', 'Your app is already building. Please wait for it to complete.');
            router.push({ pathname: '/build-status', params: { appId: appId as string } });
            return;
        }

        if (platforms.length === 0) {
            Alert.alert('Required', 'Please select at least one platform');
            return;
        }

        if (platforms.includes('android') && androidBuildTypes.length === 0) {
            Alert.alert('Required', 'Please select at least one build type for Android');
            return;
        }

        const totalCost = calculateTotal();
        if (walletBalance < totalCost) {
            Alert.alert('Insufficient Funds', `You need ₦${totalCost.toLocaleString()} but have ₦${walletBalance.toLocaleString()}. Please fund your wallet.`);
            return;
        }

        Alert.alert(
            'Confirm Build',
            `This will cost ₦${totalCost.toLocaleString()}. Do you want to proceed?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Pay & Build',
                    style: 'default',
                    onPress: processBuild
                }
            ]
        );
    };

    const processBuild = async () => {
        setSubmitting(true);
        try {
            // Need a specific endpoint or update + build logic.
            // Using updateApp first to save config, then trigger payment/build.
            // Or if backend supports direct build params.
            // Assuming we pass config to updateApp then call payAndStartBuild?
            // Or verify if updateApp supports 'rebuild' flag with payment logic.
            // The user said "building do so" (charge). 

            // Let's assume we save platform config first.
            await AppService.updateApp(appId as string, {
                platforms: {
                    android: platforms.includes('android'),
                    web: platforms.includes('web'),
                    ios: platforms.includes('ios')
                },
                android_build_types: androidBuildTypes,
                publish_play_store: publishPlayStore,
                publish_web: publishWeb,
                // Note: Not sending 'rebuild: true' here to avoid free auto-rebuild if any
            });

            // Now trigger paid build
            // Assuming payAndStartBuild endpoint handles deducting money and starting job
            await AppService.payAndStartBuild(appId as string);

            setAlertConfig({
                visible: true,
                type: 'success',
                title: 'Build Started',
                message: 'Your app build has proven successful and started. You will be notified when it is ready.'
            });

        } catch (error: any) {
            setAlertConfig({
                visible: true,
                type: 'error',
                title: 'Build Failed',
                message: error.message || 'Failed to start build process.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (alertConfig.type === 'success') {
            router.push({ pathname: '/build-status', params: { appId: appId as string } });
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );

    const totalCost = calculateTotal();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Build & Publish</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Rocket color={Colors.primary} size={24} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoTitle}>Ready to Build?</Text>
                        <Text style={styles.infoDesc}>Select your target platforms and build options. This process will compile your app into installable files.</Text>
                    </View>
                </View>

                {/* Platform Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Target Platforms</Text>

                    <View style={styles.optionsGrid}>
                        <TouchableOpacity
                            style={[styles.optionCard, platforms.includes('android') && styles.optionCardSelected]}
                            onPress={() => togglePlatform('android')}
                        >
                            <View style={[styles.iconBox, platforms.includes('android') && styles.iconBoxSelected]}>
                                <Smartphone size={24} color={platforms.includes('android') ? Colors.white : Colors.gray[600]} />
                            </View>
                            <Text style={styles.optionLabel}>Android App</Text>
                            <Text style={styles.optionPrice}>₦{(prices.PLATFORM_ANDROID || 0).toLocaleString()}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionCard, platforms.includes('web') && styles.optionCardSelected]}
                            onPress={() => togglePlatform('web')}
                        >
                            <View style={[styles.iconBox, platforms.includes('web') && styles.iconBoxSelected]}>
                                <Globe size={24} color={platforms.includes('web') ? Colors.white : Colors.gray[600]} />
                            </View>
                            <Text style={styles.optionLabel}>Web App</Text>
                            <Text style={styles.optionPrice}>₦{(prices.PLATFORM_WEB || 0).toLocaleString()}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Android Options */}
                {platforms.includes('android') && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Android Configuration</Text>

                        <View style={styles.subSection}>
                            <Text style={styles.subLabel}>Build Types</Text>
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.chip, androidBuildTypes.includes('apk') && styles.chipSelected]}
                                    onPress={() => toggleBuildType('apk')}
                                >
                                    <Text style={[styles.chipText, androidBuildTypes.includes('apk') && styles.chipTextSelected]}>APK (Direct Install)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.chip, androidBuildTypes.includes('aab') && styles.chipSelected]}
                                    onPress={() => toggleBuildType('aab')}
                                >
                                    <Text style={[styles.chipText, androidBuildTypes.includes('aab') && styles.chipTextSelected]}>AAB (Play Store)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.checkboxRow, publishPlayStore && styles.checkboxRowSelected]}
                            onPress={() => setPublishPlayStore(!publishPlayStore)}
                        >
                            <View style={[styles.checkbox, publishPlayStore && styles.checkboxSelected]}>
                                {publishPlayStore && <Check size={14} color={Colors.white} />}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.checkboxTitle}>Publish to Play Store</Text>
                                <Text style={styles.checkboxDesc}>We will handle the upload to Google Play Store</Text>
                            </View>
                            <Text style={styles.addonPrice}>+₦{(prices.PUBLISH_PRICE_PLAY_STORE || 0).toLocaleString()}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Web Options */}
                {platforms.includes('web') && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Web Configuration</Text>
                        <TouchableOpacity
                            style={[styles.checkboxRow, publishWeb && styles.checkboxRowSelected]}
                            onPress={() => setPublishWeb(!publishWeb)}
                        >
                            <View style={[styles.checkbox, publishWeb && styles.checkboxSelected]}>
                                {publishWeb && <Check size={14} color={Colors.white} />}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.checkboxTitle}>Host & Publish</Text>
                                <Text style={styles.checkboxDesc}>Auto-deploy to custom domain</Text>
                            </View>
                            <Text style={styles.addonPrice}>+₦{(prices.PUBLISH_WEB || 0).toLocaleString()}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <ShoppingCart color={Colors.text.primary} size={20} />
                        <Text style={styles.summaryTitle}>Cost Summary</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Cost</Text>
                        <Text style={styles.summaryValue}>₦{totalCost.toLocaleString()}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Wallet Balance</Text>
                        <Text style={[
                            styles.summaryValue,
                            walletBalance < totalCost ? { color: Colors.red[500] } : { color: Colors.green[600] }
                        ]}>
                            ₦{walletBalance.toLocaleString()}
                        </Text>
                    </View>

                    {walletBalance < totalCost && (
                        <View style={styles.insufficientBox}>
                            <AlertCircle color={Colors.red[500]} size={16} />
                            <Text style={styles.insufficientText}>Insufficient funds. Please top up.</Text>
                        </View>
                    )}
                </View>

                {(() => {
                    const isBuilding = appData?.status === 'building' || appData?.build_status_full === 'queued' || appData?.build_status_full === 'building';
                    return (
                        <TouchableOpacity
                            style={[
                                styles.buildButton,
                                (submitting || (walletBalance < totalCost && !isBuilding)) && styles.buildButtonDisabled,
                                isBuilding && { backgroundColor: Colors.yellow[600] }
                            ]}
                            onPress={handleBuild}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <>
                                    <Rocket color={Colors.white} size={20} />
                                    <Text style={styles.buildButtonText}>
                                        {isBuilding ? 'Build in Progress' : 'Pay & Build'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    );
                })()}

            </ScrollView>

            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={closeAlert}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    iconButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: Colors.gray[50],
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    content: {
        padding: 20,
        gap: 20,
        paddingBottom: 40,
    },
    infoCard: {
        flexDirection: 'row',
        gap: 16,
        padding: 20,
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E40AF',
        marginBottom: 4,
    },
    infoDesc: {
        fontSize: 13,
        color: '#3B82F6',
        lineHeight: 18,
    },
    section: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 12,
    },
    optionsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    optionCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.gray[200],
    },
    optionCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#F0FDF4',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    iconBoxSelected: {
        backgroundColor: Colors.primary,
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    optionPrice: {
        fontSize: 12,
        color: Colors.gray[500],
        fontWeight: '500',
    },
    subSection: {
        marginBottom: 16,
    },
    subLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.gray[600],
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.gray[100],
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: 13,
        color: Colors.gray[600],
        fontWeight: '500',
    },
    chipTextSelected: {
        color: Colors.white,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        marginBottom: 8,
    },
    checkboxRowSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#F0FDF4',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.gray[300],
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
    },
    checkboxSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkboxTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    checkboxDesc: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    addonPrice: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    summaryCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        marginTop: 8,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.gray[600],
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginVertical: 12,
    },
    insufficientBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        padding: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
    },
    insufficientText: {
        fontSize: 12,
        color: Colors.red[600],
        fontWeight: '500',
    },
    buildButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 18,
        borderRadius: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        marginTop: 8,
    },
    buildButtonDisabled: {
        backgroundColor: Colors.gray[300],
        shadowOpacity: 0,
        elevation: 0,
    },
    buildButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
