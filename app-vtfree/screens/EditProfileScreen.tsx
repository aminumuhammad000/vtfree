import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Mail, Save } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/auth.service';
import CustomAlert from '../components/CustomAlert';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
    }>({
        visible: false,
        type: 'success',
        title: '',
        message: ''
    });

    const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
        setAlertConfig({ visible: true, type, title, message });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (alertConfig.type === 'success') {
            router.back();
        }
    };

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            const result = await AuthService.updateProfile({
                first_name: firstName,
                last_name: lastName,
                // Email updates might require verification logic, usually locked or triggers flow
                email: email
            });
            if (result.success) {
                await updateUser(result.data.user);
                showAlert('success', 'Success', 'Profile updated successfully');
            } else {
                showAlert('error', 'Update Failed', result.message || 'Failed to update profile');
            }
        } catch (error: any) {
            showAlert('error', 'Error', error.message || 'An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <View style={styles.inputContainer}>
                            <User color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Enter first name"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <View style={styles.inputContainer}>
                            <User color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Enter last name"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Mail color={Colors.gray[400]} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={false} // Often locked
                            />
                        </View>
                        <Text style={styles.helperText}>Contact support to change email</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleUpdate}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Save color={Colors.white} size={20} />
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={closeAlert}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: Colors.gray[100],
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    content: {
        padding: 20,
    },
    formCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 24,
        gap: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray[700],
    },
    inputContainer: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        top: 14,
        zIndex: 1,
    },
    input: {
        backgroundColor: Colors.gray[50],
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 16,
        paddingVertical: 12,
        paddingLeft: 48,
        paddingRight: 16,
        fontSize: 16,
        color: Colors.text.primary,
    },
    helperText: {
        fontSize: 12,
        color: Colors.gray[500],
        marginLeft: 4,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 8,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
