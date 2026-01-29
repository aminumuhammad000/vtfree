import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { useAlert } from '@/components/AlertContext';
import { userService } from '@/services/user.service';

export default function KYCScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const { showSuccess, showError } = useAlert();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        bvn: '',
        nin: '',
        dob: '',
        address: '',
        city: '',
        state: '',
    });

    const theme = {
        primary: '#00ADFF',
        backgroundLight: '#FFFFFF',
        backgroundDark: '#000000',
        cardLight: '#F2F2F2',
        cardDark: '#1E1E1E',
        textLight: '#000000',
        textDark: '#FFFFFF',
        textSecondaryLight: '#757575',
        textSecondaryDark: '#A0A0A0',
        inputBgLight: '#F8F9FA',
        inputBgDark: '#2C2C2C',
    };

    const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
    const cardBg = isDark ? theme.cardDark : theme.cardLight;
    const textColor = isDark ? theme.textDark : theme.textLight;
    const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
    const inputBg = isDark ? theme.inputBgDark : theme.inputBgLight;

    const handleUpdate = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.bvn || !formData.nin || !formData.dob || !formData.address) {
            showError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            // Assuming there's an endpoint for KYC update
            const response = await userService.updateProfile({
                ...formData,
                kyc_status: 'pending' // Set to pending for admin review
            });

            if (response.success) {
                showSuccess('KYC details submitted successfully');
                router.back();
            }
        } catch (error: any) {
            showError(error.message || 'Failed to submit KYC details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <View style={[styles.header, { backgroundColor: bgColor }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: cardBg }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={20} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Verification (KYC)</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    <View style={[styles.infoCard, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
                        <Text style={[styles.infoText, { color: textColor }]}>
                            Complete your KYC verification to unlock higher transaction limits and full account features.
                        </Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Bank Verification Number (BVN)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                            placeholder="Enter your BVN"
                            placeholderTextColor={textSecondaryColor}
                            value={formData.bvn}
                            onChangeText={(text) => handleUpdate('bvn', text)}
                            keyboardType="numeric"
                            maxLength={11}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>National Identity Number (NIN)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                            placeholder="Enter your NIN"
                            placeholderTextColor={textSecondaryColor}
                            value={formData.nin}
                            onChangeText={(text) => handleUpdate('nin', text)}
                            keyboardType="numeric"
                            maxLength={11}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Date of Birth</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                            placeholder="DD/MM/YYYY"
                            placeholderTextColor={textSecondaryColor}
                            value={formData.dob}
                            onChangeText={(text) => handleUpdate('dob', text)}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Residential Address</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: textColor, height: 80, paddingTop: 12 }]}
                            placeholder="Enter your full address"
                            placeholderTextColor={textSecondaryColor}
                            value={formData.address}
                            onChangeText={(text) => handleUpdate('address', text)}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={[styles.label, { color: textSecondaryColor }]}>City</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                                placeholder="City"
                                placeholderTextColor={textSecondaryColor}
                                value={formData.city}
                                onChangeText={(text) => handleUpdate('city', text)}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={[styles.label, { color: textSecondaryColor }]}>State</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                                placeholder="State"
                                placeholderTextColor={textSecondaryColor}
                                value={formData.state}
                                onChangeText={(text) => handleUpdate('state', text)}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: theme.primary }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Verification</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        padding: 24,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
    },
    submitButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 40,
        shadowColor: '#00ADFF',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
