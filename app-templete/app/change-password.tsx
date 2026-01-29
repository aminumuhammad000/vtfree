import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { useAlert } from '@/components/AlertContext';
import { userService } from '@/services/user.service';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const { showSuccess, showError } = useAlert();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false,
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

    const toggleShowPassword = (field: 'current' | 'new' | 'confirm') => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async () => {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            showError('Please fill in all fields');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            showError('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }

        try {
            setLoading(true);
            const response = await userService.updatePassword(formData.currentPassword, formData.newPassword);

            if (response.success) {
                showSuccess('Password changed successfully');
                router.back();
            }
        } catch (error: any) {
            showError(error.message || 'Failed to change password');
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
                <Text style={[styles.headerTitle, { color: textColor }]}>Change Password</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]}
                >
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Current Password</Text>
                        <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                placeholder="Enter current password"
                                placeholderTextColor={textSecondaryColor}
                                value={formData.currentPassword}
                                onChangeText={(text) => handleUpdate('currentPassword', text)}
                                secureTextEntry={!showPassword.current}
                            />
                            <TouchableOpacity onPress={() => toggleShowPassword('current')} style={styles.eyeIcon}>
                                <Ionicons name={showPassword.current ? "eye-off" : "eye"} size={20} color={textSecondaryColor} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>New Password</Text>
                        <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                placeholder="Enter new password"
                                placeholderTextColor={textSecondaryColor}
                                value={formData.newPassword}
                                onChangeText={(text) => handleUpdate('newPassword', text)}
                                secureTextEntry={!showPassword.new}
                            />
                            <TouchableOpacity onPress={() => toggleShowPassword('new')} style={styles.eyeIcon}>
                                <Ionicons name={showPassword.new ? "eye-off" : "eye"} size={20} color={textSecondaryColor} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Confirm New Password</Text>
                        <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                placeholder="Confirm new password"
                                placeholderTextColor={textSecondaryColor}
                                value={formData.confirmPassword}
                                onChangeText={(text) => handleUpdate('confirmPassword', text)}
                                secureTextEntry={!showPassword.confirm}
                            />
                            <TouchableOpacity onPress={() => toggleShowPassword('confirm')} style={styles.eyeIcon}>
                                <Ionicons name={showPassword.confirm ? "eye-off" : "eye"} size={20} color={textSecondaryColor} />
                            </TouchableOpacity>
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
                            <Text style={styles.submitButtonText}>Update Password</Text>
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
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    eyeIcon: {
        padding: 8,
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
