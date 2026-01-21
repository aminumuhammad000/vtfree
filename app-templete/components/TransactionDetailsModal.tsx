import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    Modal,
    Dimensions,
    Animated,
    Share,
    Platform,
} from 'react-native';
import { transactionService, Transaction as ApiTransaction } from '@/services/transaction.service';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { useAlert } from '@/components/AlertContext';
import * as Clipboard from 'expo-clipboard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TransactionDetailsModalProps {
    visible: boolean;
    transactionId: string | null;
    onClose: () => void;
}

const theme = {
    primary: "#00ADFF", // Snapchat Blue
    backgroundLight: "#FFFFFF",
    backgroundDark: "#000000",
    inputLight: "#F2F2F2",
    inputDark: "#1E1E1E",
    textLight: "#000000",
    textDark: "#FFFFFF",
    textSecondaryLight: "#757575",
    textSecondaryDark: "#A0A0A0",
    success: '#00D166',
    error: '#FF5B5B',
    warning: '#FFFC00',
};

export default function TransactionDetailsModal({
    visible,
    transactionId,
    onClose,
}: TransactionDetailsModalProps) {
    const { isDark } = useTheme();
    const { showSuccess, showError, showInfo } = useAlert();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tx, setTx] = useState<ApiTransaction | null>(null);

    // Animation values
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
    const cardBg = isDark ? theme.inputDark : theme.inputLight;
    const textColor = isDark ? theme.textDark : theme.textLight;
    const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    mass: 0.8,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            if (transactionId) {
                load();
            }
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start();
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, transactionId]);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await transactionService.getTransactionById(transactionId!);

            let transactionData = null;
            if (res?.data?.transaction) transactionData = res.data.transaction;
            else if (res?.transaction) transactionData = res.transaction;
            else if (res?.data) transactionData = res.data;
            else transactionData = res;

            setTx(transactionData as ApiTransaction);
        } catch (e: any) {
            console.error('Error loading transaction:', e);
            const msg = e?.message || 'Failed to load transaction';
            setError(msg);
            showError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!tx) return;
        try {
            const message = `Transaction Receipt\n\nAmount: ₦${tx.amount}\nType: ${formatType(tx.type)}\nStatus: ${tx.status}\nReference: ${tx.reference_number}\nDate: ${new Date(tx.created_at).toLocaleString()}`;
            await Share.share({ message });
        } catch (error) {
            console.error(error);
            showError('Failed to share receipt');
        }
    };

    const handleCopy = async (text: string) => {
        await Clipboard.setStringAsync(text);
        showInfo('Copied to clipboard');
    };

    const formatType = (type: string) => {
        return type?.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || 'Transaction';
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'successful':
            case 'completed': return theme.success;
            case 'failed': return theme.error;
            case 'pending': return theme.warning;
            default: return textSecondaryColor;
        }
    };

    const getIcon = (type: string) => {
        if (type?.includes('airtime')) return 'phone-portrait';
        if (type?.includes('data')) return 'wifi';
        if (type?.includes('wallet')) return 'wallet';
        return 'receipt';
    };

    const Row = ({ label, value, copyable }: { label: string; value?: string | number; copyable?: boolean }) => (
        <View style={styles.row}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>{label}</Text>
            <View style={styles.valueContainer}>
                <Text style={[styles.value, { color: textColor }]} numberOfLines={1} ellipsizeMode="middle">
                    {String(value ?? '—')}
                </Text>
                {copyable && value && (
                    <TouchableOpacity onPress={() => handleCopy(String(value))} style={styles.copyIcon}>
                        <Ionicons name="copy-outline" size={14} color={theme.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: bgColor,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    {/* Handle Bar */}
                    <View style={styles.handleBarContainer}>
                        <View style={[styles.handleBar, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>Transaction Details</Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: cardBg }]}>
                            <Ionicons name="close" size={20} color={textColor} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={[styles.loadingText, { color: textSecondaryColor }]}>Loading details...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.center}>
                            <View style={[styles.errorIcon, { backgroundColor: theme.error + '15' }]}>
                                <Ionicons name="alert" size={32} color={theme.error} />
                            </View>
                            <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
                            <TouchableOpacity
                                style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                                onPress={onClose}
                            >
                                <Text style={styles.retryBtnText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    ) : !tx ? (
                        <View style={styles.center}>
                            <Text style={[styles.errorText, { color: textSecondaryColor }]}>Transaction not found</Text>
                        </View>
                    ) : (
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Receipt Header */}
                            <View style={styles.receiptHeader}>
                                <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name={getIcon(tx.type) as any} size={32} color={theme.primary} />
                                </View>
                                <Text style={[styles.amount, { color: textColor }]}>
                                    -₦{tx.amount.toLocaleString()}
                                </Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tx.status) + '15' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(tx.status) }]} />
                                    <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                                        {tx.status?.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            {/* Details Card */}
                            <View style={[styles.detailsCard, { backgroundColor: cardBg }]}>
                                <Row label="Service" value={formatType(tx.type)} />
                                <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                                <Row label="Date" value={new Date(tx.created_at).toLocaleString()} />
                                <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                                <Row label="Reference" value={tx.reference_number} copyable />
                                <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                                {tx.destination_account && (
                                    <>
                                        <Row label="Recipient" value={tx.destination_account} copyable />
                                        <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                                    </>
                                )}
                                <Row label="Total Fee" value={`₦${(tx.fee ?? 0).toLocaleString()}`} />
                            </View>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: cardBg }]}
                                    onPress={handleShare}
                                >
                                    <Ionicons name="share-outline" size={20} color={textColor} />
                                    <Text style={[styles.actionButtonText, { color: textColor }]}>Share Receipt</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                    onPress={() => {
                                        // Handle report issue
                                    }}
                                >
                                    <Ionicons name="help-buoy-outline" size={20} color="#FFF" />
                                    <Text style={[styles.actionButtonText, { color: "#FFF" }]}>Report Issue</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        height: SCREEN_HEIGHT * 0.85,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    handleBarContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    receiptHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    amount: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    detailsCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        justifyContent: 'flex-end',
        marginLeft: 16,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
    },
    copyIcon: {
        padding: 4,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    errorIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryBtn: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
    },
    retryBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
