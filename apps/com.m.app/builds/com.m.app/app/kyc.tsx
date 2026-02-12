import React, { useState, useEffect } from 'react';
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
    Modal,
    FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { useAlert } from '@/components/AlertContext';
import { userService } from '@/services/user.service';
import { useProfile } from '@/components/ProfileContext';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara'
];

export default function KYCScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { profileData, refreshProfile } = useProfile();
    const { showSuccess, showError } = useAlert();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        phone_number: '',
        bvn: '',
        nin: '',
        date_of_birth: '',
        address: '',
        city: '',
        state: 'Lagos',
        country: 'Nigeria',
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState(new Date(2000, 0, 1));
    const [showStateModal, setShowStateModal] = useState(false);

    useEffect(() => {
        if (profileData) {
            setFormData({
                phone_number: profileData.phone_number || '',
                bvn: profileData.bvn || '',
                nin: profileData.nin || '',
                date_of_birth: profileData.date_of_birth ? new Date(profileData.date_of_birth).toISOString().split('T')[0] : '',
                address: profileData.address || '',
                city: profileData.city || '',
                state: profileData.state || 'Lagos',
                country: 'Nigeria',
            });
            if (profileData.date_of_birth) {
                setDate(new Date(profileData.date_of_birth));
            }
        }
    }, [profileData]);

    const handleUpdate = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
            const formattedDate = selectedDate.toISOString().split('T')[0];
            handleUpdate('date_of_birth', formattedDate);
        }
    };

    const handleSubmit = async () => {
        if (!formData.phone_number || !formData.date_of_birth || !formData.address || !formData.bvn) {
            showError('Please fill in all required fields (Phone, BVN, DOB, Address)');
            return;
        }

        try {
            setLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const response = await userService.updateProfile({
                ...formData,
                kyc_status: 'pending'
            });

            if (response.success) {
                showSuccess('KYC details submitted successfully. We will review it shortly.');
                await refreshProfile();
                router.back();
            }
        } catch (error: any) {
            showError(error.message || 'Failed to submit KYC details');
        } finally {
            setLoading(false);
        }
    };

    const bgColor = theme.background;
    const cardBg = theme.surface;
    const textColor = theme.text;
    const textSecondary = theme.textSecondary;
    const brandColor = theme.primary;

    const renderStateItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[styles.stateItem, { borderBottomColor: theme.border + '20' }]}
            onPress={() => {
                handleUpdate('state', item);
                setShowStateModal(false);
            }}
        >
            <Text style={[styles.stateItemText, { color: textColor }]}>{item}</Text>
            {formData.state === item && (
                <Ionicons name="checkmark-circle" size={20} color={brandColor} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <View style={[styles.header, { backgroundColor: bgColor }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: cardBg }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={20} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>KYC Verification</Text>
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
                    <Animated.View entering={FadeInUp.delay(200)} style={[styles.infoCard, { backgroundColor: brandColor + '15' }]}>
                        <MaterialCommunityIcons name="shield-check" size={24} color={brandColor} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoTitle, { color: brandColor }]}>Identity Verification</Text>
                            <Text style={[styles.infoText, { color: textColor }]}>
                                Complete verification to enable virtual accounts and increase transaction limits.
                            </Text>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400)} style={styles.formSection}>
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: textSecondary }]}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
                                placeholder="08012345678"
                                placeholderTextColor={textSecondary}
                                value={formData.phone_number}
                                onChangeText={(text) => handleUpdate('phone_number', text)}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: textSecondary }]}>BVN (11 Digits)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
                                placeholder="222XXXXXXXX"
                                placeholderTextColor={textSecondary}
                                value={formData.bvn}
                                onChangeText={(text) => handleUpdate('bvn', text)}
                                keyboardType="numeric"
                                maxLength={11}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: textSecondary }]}>Date of Birth</Text>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: cardBg, justifyContent: 'center' }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={{ color: formData.date_of_birth ? textColor : textSecondary, fontSize: 16 }}>
                                    {formData.date_of_birth || "Select Date of Birth"}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color={brandColor} style={styles.inputIcon} />
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: textSecondary }]}>Residential Address</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: cardBg, color: textColor, height: 80, paddingTop: 12 }]}
                                placeholder="No 12. Example Street"
                                placeholderTextColor={textSecondary}
                                value={formData.address}
                                onChangeText={(text) => handleUpdate('address', text)}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={[styles.label, { color: textSecondary }]}>City</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
                                    placeholder="Ikeja"
                                    placeholderTextColor={textSecondary}
                                    value={formData.city}
                                    onChangeText={(text) => handleUpdate('city', text)}
                                />
                            </View>
                            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={[styles.label, { color: textSecondary }]}>State</Text>
                                <TouchableOpacity
                                    style={[styles.input, { backgroundColor: cardBg, justifyContent: 'center' }]}
                                    onPress={() => setShowStateModal(true)}
                                >
                                    <Text style={{ color: textColor, fontSize: 16 }}>{formData.state}</Text>
                                    <Ionicons name="chevron-down" size={20} color={brandColor} style={styles.inputIcon} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: textSecondary }]}>Country</Text>
                            <View style={[styles.input, { backgroundColor: cardBg, justifyContent: 'center', opacity: 0.7 }]}>
                                <Text style={{ color: textColor, fontSize: 16 }}>Nigeria</Text>
                                <MaterialCommunityIcons name="flag-variant" size={20} color={brandColor} style={styles.inputIcon} />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: textSecondary }]}>NIN (Optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
                                placeholder="Enter NIN (11 digits)"
                                placeholderTextColor={textSecondary}
                                value={formData.nin}
                                onChangeText={(text) => handleUpdate('nin', text)}
                                keyboardType="numeric"
                                maxLength={11}
                            />
                        </View>
                    </Animated.View>

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: brandColor }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit for Verification</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* State Picker Modal */}
            <Modal
                visible={showStateModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowStateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Select State</Text>
                            <TouchableOpacity onPress={() => setShowStateModal(false)}>
                                <Ionicons name="close" size={24} color={textColor} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={NIGERIAN_STATES}
                            keyExtractor={(item) => item}
                            renderItem={renderStateItem}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        />
                    </View>
                </View>
            </Modal>
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
        borderRadius: 20,
        marginBottom: 24,
        alignItems: 'flex-start',
        gap: 12,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        lineHeight: 18,
        opacity: 0.9,
    },
    formSection: {
        marginBottom: 10,
    },
    formGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '500',
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        right: 16,
    },
    row: {
        flexDirection: 'row',
    },
    submitButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '70%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    stateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    stateItemText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
