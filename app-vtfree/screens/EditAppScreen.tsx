import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Trash2, Sliders } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { AppService } from '../services/app.service';
import CustomAlert from '../components/CustomAlert';

export default function EditAppScreen() {
    const router = useRouter();
    const { appId } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [appData, setAppData] = useState<any>(null);

    // Form State
    const [appName, setAppName] = useState('');
    const [primaryColor, setPrimaryColor] = useState('');

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
                setAppName(app.app_name);
                setPrimaryColor(app.branding?.primary_color || Colors.primary);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async () => {
        setSaving(true);
        try {
            // Mock API call - In real implementation, add updateApp endpoint to AppService
            // await AppService.updateApp(appId, { app_name: appName, branding: { primary_color: primaryColor } });

            // Simulating success for now
            setTimeout(() => {
                setAlertConfig({
                    visible: true,
                    type: 'success',
                    title: 'App Updated',
                    message: 'Your app configuration has been saved successfully.'
                });
                setSaving(false);
            }, 1000);

        } catch (error: any) {
            setAlertConfig({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to update app.'
            });
            setSaving(false);
        }
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (alertConfig.type === 'success') {
            router.back();
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit App</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Basic Info Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Basic Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>App Name</Text>
                        <TextInput
                            style={styles.input}
                            value={appName}
                            onChangeText={setAppName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>App ID</Text>
                        <View style={styles.readOnlyInput}>
                            <Text style={{ color: Colors.gray[500], fontFamily: 'monospace' }} selectable>{appId}</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Package Name</Text>
                        <View style={styles.readOnlyInput}>
                            <Text style={{ color: Colors.gray[500] }}>{appData?.package_name}</Text>
                        </View>
                        <Text style={styles.helperText}>Package name cannot be changed.</Text>
                    </View>
                </View>

                {/* Branding Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Branding</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <View style={[styles.colorPreview, { backgroundColor: primaryColor }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Primary Color</Text>
                            <TextInput
                                style={styles.input}
                                value={primaryColor}
                                onChangeText={setPrimaryColor}
                                placeholder="#000000"
                            />
                        </View>
                    </View>
                </View>

                {/* Services Config (Placeholder) */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                        <Text style={styles.cardTitle}>Services Configuration</Text>
                        <Sliders size={20} color={Colors.primary} />
                    </View>
                    <Text style={{ color: Colors.gray[500], fontSize: 13, lineHeight: 20 }}>
                        Advanced service configuration (VTU endpoints, API keys, etc.) is managed via the Admin Panel for security.
                    </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color={Colors.white} /> : (
                        <>
                            <Save color={Colors.white} size={20} />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Danger Zone */}
                <TouchableOpacity style={styles.deleteButton}>
                    <Trash2 color={Colors.red[500]} size={20} />
                    <Text style={styles.deleteText}>Delete App</Text>
                </TouchableOpacity>

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
        backgroundColor: Colors.background,
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
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: Colors.white,
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
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        shadowColor: Colors.shadow.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 16,
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
    colorPreview: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    saveButton: {
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
    },
    saveButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 16,
        backgroundColor: Colors.red[100],
        marginTop: 20,
    },
    deleteText: {
        color: Colors.red[600],
        fontWeight: '600',
    },
});
