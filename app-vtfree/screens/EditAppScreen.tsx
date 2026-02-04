import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, Image, Switch, Platform, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Save,
    Trash2,
    Palette,
    Building2,
    Settings,
    Upload,
    Check,
    X,
    Eye,
    EyeOff,
    Rocket
} from 'lucide-react-native';
import Colors from '../constants/Colors';
import { AppService } from '../services/app.service';
import CustomAlert from '../components/CustomAlert';
import * as ImagePicker from 'expo-image-picker';
import ColorPicker, { Panel1, Swatches, Preview, OpacitySlider, HueSlider } from 'reanimated-color-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- Reused Color Picker Component ---
const ColorSelectionModal = ({ visible, onClose, onSelect, initialColor, title }: any) => {
    const [localColor, setLocalColor] = useState(initialColor);
    const [hexInput, setHexInput] = useState(initialColor.replace('#', ''));

    useEffect(() => {
        setLocalColor(initialColor);
        setHexInput(initialColor.replace('#', ''));
    }, [initialColor, visible]);

    const handleHexChange = (text: string) => {
        const cleanHex = text.replace(/[^A-Fa-f0-9]/g, '').slice(0, 6).toUpperCase();
        setHexInput(cleanHex);
        if (cleanHex.length === 6) {
            setLocalColor(`#${cleanHex}`);
        }
    };

    const professionalPresets = [
        '#16A34A', '#2563EB', '#7C3AED', '#DC2626', '#EA580C',
        '#0891B2', '#4F46E5', '#BE185D', '#111827', '#4B5563'
    ];

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <X color={Colors.gray[500]} size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Manual Hex Input */}
                    <View style={styles.hexInputWrapper}>
                        <Text style={styles.hexHash}>#</Text>
                        <TextInput
                            style={styles.hexInput}
                            value={hexInput}
                            onChangeText={handleHexChange}
                            maxLength={6}
                            placeholder="000000"
                        />
                        <View style={[styles.colorPreview, { backgroundColor: localColor, width: 32, height: 32 }]} />
                    </View>

                    <ColorPicker style={{ width: '100%', gap: 20 }} value={localColor} onComplete={({ hex }) => {
                        setLocalColor(hex);
                        setHexInput(hex.replace('#', '').toUpperCase());
                    }}>
                        <Preview hideInitialColor />
                        <Panel1 />
                        <HueSlider />
                        <OpacitySlider />
                        <View style={styles.colorPresets}>
                            {professionalPresets.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[styles.presetCircle, { backgroundColor: color }]}
                                    onPress={() => {
                                        setLocalColor(color);
                                        setHexInput(color.replace('#', ''));
                                    }}
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
};

export default function EditAppScreen() {
    const router = useRouter();
    const { appId } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [appData, setAppData] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        appName: '',
        appNameOriginal: '',
        packageName: '',
        primaryColor: '#16A34A',
        secondaryColor: '#22C55E',
        logo: null as string | null,

        // Business Info (If editable) 
        // Assuming we might want to edit company info too if the API supports it
        businessName: '',
        email: '',
        phone: '',
        address: ''
    });

    // Color Picker State
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [activeColorType, setActiveColorType] = useState<'primary' | 'secondary'>('primary');

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
    }>({ visible: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        if (appId) fetchDetails();
    }, [appId]);

    const fetchDetails = async () => {
        try {
            const response = await AppService.getAppDetails(appId as string);
            if (response.success) {
                const app = response.data.app;
                setAppData(app);

                // Populate Form
                setFormData({
                    appName: app.app_name,
                    appNameOriginal: app.app_name,
                    packageName: app.package_name,
                    primaryColor: app.branding?.primary_color || Colors.primary,
                    secondaryColor: app.branding?.secondary_color || '#22C55E', // Fallback
                    logo: app.branding?.logo_url || null,
                    businessName: app.company?.name || '',
                    email: app.company?.email || '',
                    phone: app.company?.phone || '',
                    address: app.company?.address || ''
                });
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load app details');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            if (asset.width < 512 || asset.height < 512) {
                Alert.alert(
                    'Image Too Small',
                    `Logo must be at least 512x512 pixels. Currently: ${asset.width}x${asset.height}px.`
                );
                return;
            }

            try {
                setIsUploadingLogo(true);
                const response = await AppService.uploadLogo(asset.uri);
                if (response.success) {
                    setFormData(prev => ({ ...prev, logo: response.data.logo_url }));
                } else {
                    Alert.alert('Upload Failed', response.message || 'Could not upload logo.');
                }
            } catch (error: any) {
                Alert.alert('Error', 'An error occurred while uploading.');
            } finally {
                setIsUploadingLogo(false);
            }
        }
    };

    const onSelectColor = (hex: string) => {
        if (activeColorType === 'primary') {
            setFormData(prev => ({ ...prev, primaryColor: hex }));
        } else {
            setFormData(prev => ({ ...prev, secondaryColor: hex }));
        }
        setShowColorPicker(false);
    };

    const handleSave = async () => {
        if (!formData.appName.trim()) {
            Alert.alert('Required', 'App Name is required');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                app_name: formData.appName,
                branding: {
                    primary_color: formData.primaryColor,
                    secondary_color: formData.secondaryColor,
                    logo_url: formData.logo
                },
                company: {
                    name: formData.businessName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address
                }
            };

            await AppService.updateApp(appId as string, payload);

            setAlertConfig({
                visible: true,
                type: 'success',
                title: 'Changes Saved',
                message: 'App settings have been updated successfully.'
            });
        } catch (error: any) {
            setAlertConfig({
                visible: true,
                type: 'error',
                title: 'Update Failed',
                message: error.message || 'Failed to update app details.'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        setAlertConfig({
            visible: true,
            type: 'warning',
            title: 'Delete App',
            message: 'Are you sure you want to delete this app? This action cannot be undone.',
            showCancel: true,
            confirmText: 'Delete',
            onConfirm: async () => {
                setLoading(true);
                try {
                    await AppService.deleteApp(appId as string);
                    router.replace('/');
                } catch (error: any) {
                    setAlertConfig({
                        visible: true,
                        type: 'error',
                        title: 'Delete Failed',
                        message: error.message || 'Failed to delete app'
                    });
                    setLoading(false);
                }
            }
        } as any);
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (alertConfig.type === 'success') {
            router.back();
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit App Details</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveHeaderButton, saving && { opacity: 0.7 }]}>
                    {saving ? <ActivityIndicator size="small" color={Colors.white} /> : <Check color={Colors.white} size={20} />}
                    <Text style={styles.saveHeaderText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Branding Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Palette color={Colors.primary} size={20} />
                        <Text style={styles.sectionTitle}>App Branding</Text>
                    </View>

                    {/* Logo */}
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
                                    <Text style={[styles.uploadText, { marginTop: 8 }]}>Uploading...</Text>
                                </View>
                            ) : formData.logo ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                    <Image source={{ uri: formData.logo }} style={{ width: 64, height: 64, borderRadius: 12 }} />
                                    <View>
                                        <Text style={styles.uploadText}>Change Logo</Text>
                                        <Text style={styles.uploadSubtext}>Tap to replace</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Upload color={Colors.gray[400]} size={32} style={{ marginBottom: 8 }} />
                                    <Text style={styles.uploadText}>Upload Logo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
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
                                <Text style={styles.colorValue}>{formData.primaryColor}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Secondary</Text>
                            <TouchableOpacity
                                style={styles.colorInputContainer}
                                onPress={() => {
                                    setActiveColorType('secondary');
                                    setShowColorPicker(true);
                                }}
                            >
                                <View style={[styles.colorPreview, { backgroundColor: formData.secondaryColor }]} />
                                <Text style={styles.colorValue}>{formData.secondaryColor}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* App Information */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Settings color={Colors.primary} size={20} />
                        <Text style={styles.sectionTitle}>Basic Info</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>App Name</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.appName}
                            onChangeText={(t) => setFormData(prev => ({ ...prev, appName: t }))}
                            placeholder="App Name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Package Name</Text>
                        <View style={styles.readOnlyInput}>
                            <Text style={{ color: Colors.gray[500] }}>{formData.packageName}</Text>
                        </View>
                        <Text style={styles.helperText}>Package name cannot be changed once created.</Text>
                    </View>
                </View>

                {/* Business Info */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Building2 color={Colors.primary} size={20} />
                        <Text style={styles.sectionTitle}>Business Info</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Business Name</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.businessName}
                            onChangeText={(t) => setFormData(prev => ({ ...prev, businessName: t }))}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Support Email</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(t) => setFormData(prev => ({ ...prev, email: t }))}
                            keyboardType="email-address"
                        />
                    </View>
                </View>

                {/* Build Option */}
                {appData?.status !== 'pending' && (
                    <View style={styles.sectionContainer}>
                        {(() => {
                            const isBuilding = appData?.status === 'building' || appData?.build_status_full === 'queued' || appData?.build_status_full === 'building';
                            const isFailed = appData?.status === 'failed' || appData?.build_status_full === 'failed';

                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1, paddingRight: 16 }}>
                                        <Text style={styles.sectionTitle}>Build & Publish</Text>
                                        <Text style={{ color: Colors.gray[500], fontSize: 13, marginTop: 4 }}>
                                            {isBuilding ? 'A build is currently in progress.' : (isFailed ? 'The last build attempt failed.' : 'Ready to deploy changes? Create a new build.')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.buildActionButton,
                                            isBuilding && { backgroundColor: Colors.yellow[600] },
                                            isFailed && { backgroundColor: Colors.red[600] }
                                        ]}
                                        onPress={() => router.push({
                                            pathname: isBuilding || isFailed ? '/build-status' : '/build-app',
                                            params: { appId }
                                        })}
                                    >
                                        <Rocket color={Colors.white} size={16} />
                                        <Text style={styles.buildActionButtonText}>
                                            {isBuilding ? 'View Progress' : (isFailed ? 'Retry Build' : 'Build App')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })()}
                    </View>
                )}

                {/* Danger Zone */}
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Trash2 color={Colors.red[600]} size={20} />
                    <Text style={styles.deleteText}>Delete App</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <ColorSelectionModal
                visible={showColorPicker}
                initialColor={activeColorType === 'primary' ? formData.primaryColor : formData.secondaryColor}
                title={`Select ${activeColorType === 'primary' ? 'Primary' : 'Secondary'} Color`}
                onClose={() => setShowColorPicker(false)}
                onSelect={onSelectColor}
            />

            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={closeAlert}
                showCancel={(alertConfig as any).showCancel}
                confirmText={(alertConfig as any).confirmText}
                onConfirm={(alertConfig as any).onConfirm}
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
        alignItems: 'center'
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
    saveHeaderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveHeaderText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    scrollContent: {
        padding: 20,
        gap: 20,
    },
    sectionContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
        paddingBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.gray[600],
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.gray[50],
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: Colors.text.primary,
    },
    readOnlyInput: {
        backgroundColor: Colors.gray[100],
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 12,
        padding: 12,
    },
    helperText: {
        fontSize: 12,
        color: Colors.gray[400],
        marginTop: 6,
    },
    uploadBox: {
        borderWidth: 2,
        borderColor: Colors.gray[300],
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.gray[50],
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    uploadSubtext: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    colorInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.gray[50],
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 12,
        padding: 8,
    },
    colorPreview: {
        width: 40,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    colorValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        marginTop: 10,
    },
    deleteText: {
        color: Colors.red[600],
        fontWeight: '600',
    },
    // Modal Styles
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
    modalCloseButton: {
        padding: 4,
    },
    confirmButton: {
        marginTop: 24,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
    },
    colorPresets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 16,
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
    buildActionButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    buildActionButtonText: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
});
