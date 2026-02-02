import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, X, CreditCard, CheckCircle, TrendingUp, Clock, Zap } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { WalletService } from '../services/wallet.service';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WalletScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Funding State
    const [showFundModal, setShowFundModal] = useState(false);
    const [fundAmount, setFundAmount] = useState('');
    const [funding, setFunding] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            const response = await WalletService.getWallet();
            if (response.success) {
                setBalance(response.data.balance);
                setTransactions(response.data.transactions);
            }
        } catch (error: any) {
            // Only log non-auth errors (auth errors are expected when not logged in)
            if (!error?.isAuthError) {
                console.error('Wallet fetch failed:', error);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchWalletData();
    };

    const handleFundWallet = async () => {
        if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }

        setFunding(true);
        try {
            const response = await WalletService.fundWallet(Number(fundAmount));
            if (response.success) {
                Alert.alert('Success', 'Wallet funded successfully!');
                setBalance(response.data.balance);
                // Prepend new transaction (assuming mock response structure)
                setTransactions([response.data.transaction, ...transactions]);
                setShowFundModal(false);
                setFundAmount('');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to fund wallet');
        } finally {
            setFunding(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return '₦' + amount.toLocaleString();
    };

    const handleCreateVirtualAccount = async () => {
        setIsGenerating(true);
        try {
            const res = await AuthService.createVirtualAccount('wema'); // Defaulting to Wema
            if (res.success) {
                // Update local user state
                const updatedUser = { ...user, virtual_account: res.data };
                // Use context updater if available, else manual
                if (updateUser) {
                    await updateUser(updatedUser);
                } else {
                    // Fallback if context doesn't expose updater yet (though we added it)
                    await AsyncStorage.setItem('vtfree_user', JSON.stringify(updatedUser));
                }
                Alert.alert('Success', 'Virtual account generated successfully!');
            } else {
                Alert.alert('Failed', res.message || 'Failed to generate virtual account');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'An error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Wallet</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />}
            >
                {/* Balance Card */}
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <View style={styles.balanceHeader}>
                        <Text style={styles.balanceLabel}>Total Balance</Text>
                        <Wallet color={Colors.white} size={24} opacity={0.8} />
                    </View>
                    <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>

                </LinearGradient>

                {/* Virtual Account / Funding Section */}
                <Text style={styles.sectionTitle}>Fund Wallet</Text>

                {user?.virtual_account ? (
                    <View style={styles.virtualAccountCard}>
                        <View style={styles.vaHeader}>
                            <CheckCircle color={Colors.green[600]} size={18} />
                            <Text style={styles.vaTitle}>Bank Transfer (Instant)</Text>
                        </View>
                        <View style={styles.vaContent}>
                            <View style={styles.vaItem}>
                                <Text style={styles.vaLabel}>Bank Name</Text>
                                <Text style={styles.vaValue}>{user.virtual_account.bank}</Text>
                            </View>
                            <View style={styles.vaDivider} />
                            <View style={styles.vaItem}>
                                <Text style={styles.vaLabel}>Account Number</Text>
                                <View style={styles.vaAccountRow}>
                                    <Text style={styles.vaAccountNumber}>{user.virtual_account.account_number}</Text>
                                    <TouchableOpacity style={styles.copyButton}>
                                        <Text style={styles.copyText}>Copy</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.vaDivider} />
                            <View style={styles.vaItem}>
                                <Text style={styles.vaLabel}>Account Name</Text>
                                <Text style={styles.vaValue}>{user.virtual_account.account_name}</Text>
                            </View>
                        </View>
                        <View style={styles.vaFooter}>
                            <Clock size={12} color={Colors.gray[500]} />
                            <Text style={styles.vaNote}>Transfer to this account to fund your wallet instantly.</Text>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.generateButton}
                        onPress={handleCreateVirtualAccount}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <LinearGradient
                                    colors={[Colors.primary, Colors.primaryLight]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                <Zap color={Colors.white} size={20} fill={Colors.white} />
                                <Text style={styles.generateButtonText}>Generate Personal Account Number</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Transactions */}
                <Text style={styles.sectionTitle}>Recent Transactions</Text>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
                ) : transactions.length > 0 ? (
                    <View style={styles.transactionsList}>
                        {transactions.map((tx) => (
                            <View key={tx._id} style={styles.transactionItem}>
                                <View style={[
                                    styles.iconBox,
                                    { backgroundColor: tx.type === 'credit' ? Colors.green[100] : Colors.red[100] }
                                ]}>
                                    {tx.type === 'credit' ? (
                                        <ArrowDownLeft color={Colors.green[600]} size={20} />
                                    ) : (
                                        <ArrowUpRight color={Colors.red[500]} size={20} />
                                    )}
                                </View>
                                <View style={styles.txInfo}>
                                    <Text style={styles.txDesc}>{tx.description}</Text>
                                    <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString()}</Text>
                                </View>
                                <Text style={[
                                    styles.txAmount,
                                    { color: tx.type === 'credit' ? Colors.green[600] : Colors.red[500] }
                                ]}>
                                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No transactions yet</Text>
                    </View>
                )}
            </ScrollView>

            {/* Fund Modal */}
            <Modal
                transparent
                visible={showFundModal}
                animationType="fade"
                onRequestClose={() => setShowFundModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Fund Wallet</Text>
                            <TouchableOpacity onPress={() => setShowFundModal(false)}>
                                <X color={Colors.gray[500]} size={24} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Enter Amount (₦)</Text>
                        <TextInput
                            style={styles.input}
                            value={fundAmount}
                            onChangeText={setFundAmount}
                            placeholder="e.g. 5000"
                            keyboardType="numeric"
                            autoFocus
                        />

                        {/* Quick Amounts */}
                        <View style={styles.quickAmounts}>
                            {[5000, 10000, 20000, 50000].map(amt => (
                                <TouchableOpacity
                                    key={amt}
                                    style={styles.quickChip}
                                    onPress={() => setFundAmount(amt.toString())}
                                >
                                    <Text style={styles.quickChipText}>{formatCurrency(amt)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.submitFundButton}
                            onPress={handleFundWallet}
                            disabled={funding}
                        >
                            {funding ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.submitFundButtonText}>Proceed to Pay</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 48,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
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
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120, // Space for TabBar
    },
    balanceCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 24,
    },
    cardActions: {
        flexDirection: 'row',
    },
    fundButton: {
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    fundButtonText: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 16,
        marginLeft: 4,
    },
    transactionsList: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 8,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    txInfo: {
        flex: 1,
    },
    txDesc: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    txDate: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    txAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: Colors.gray[500],
    },

    // Modal
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
    },
    inputLabel: {
        fontSize: 14,
        color: Colors.gray[600],
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        marginBottom: 16,
        color: Colors.text.primary,
    },
    quickAmounts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    quickChip: {
        backgroundColor: Colors.gray[100],
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    quickChipText: {
        color: Colors.gray[700],
        fontSize: 14,
        fontWeight: '500',
    },
    submitFundButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitFundButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    virtualAccountCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    vaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    vaTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#166534',
    },
    vaContent: {
        gap: 0,
    },
    vaItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    vaDivider: {
        height: 1,
        backgroundColor: '#DCFCE7',
    },
    vaLabel: {
        fontSize: 13,
        color: '#166534',
        opacity: 0.7,
    },
    vaValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#166534',
    },
    vaAccountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    vaAccountNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#166534',
        letterSpacing: 1,
    },
    copyButton: {
        backgroundColor: Colors.white,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 0.5,
        borderColor: '#DCFCE7',
    },
    copyText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.primary,
    },
    vaFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#DCFCE7',
    },
    vaNote: {
        fontSize: 11,
        color: '#166534',
        opacity: 0.6,
        fontStyle: 'italic',
    },
    generateButton: {
        borderRadius: 16,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    generateButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        zIndex: 1,
    },
});
