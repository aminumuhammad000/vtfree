import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Headphones, Plus, MessageCircle } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { SupportService } from '../services/support.service';
import { useAuth } from '../context/AuthContext';

export default function SupportScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await SupportService.getTickets();
            if (response.success) {
                setTickets(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        if (!subject || !description) {
            alert('Please fill in all fields');
            return;
        }

        setCreating(true);
        try {
            const response = await SupportService.createTicket({ subject, description, priority });
            if (response.success) {
                alert('Ticket created successfully');
                setShowForm(false);
                setSubject('');
                setDescription('');
                fetchTickets();
            } else {
                alert(response.message || 'Failed to create ticket');
            }
        } catch (error: any) {
            alert(error.message || 'An error occurred');
        } finally {
            setCreating(false);
        }
    };

    const renderTicket = ({ item }: { item: any }) => (
        <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
                <Text style={styles.ticketSubject}>{item.subject}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'resolved' ? Colors.green[100] : Colors.yellow[100] }]}>
                    <Text style={[styles.statusText, { color: item.status === 'resolved' ? Colors.green[700] : Colors.yellow[700] }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
            <Text style={styles.ticketDescription} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.ticketDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support</Text>
                <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addButton}>
                    <Plus color={Colors.primary} size={24} />
                </TouchableOpacity>
            </View>

            {showForm ? (
                <ScrollView contentContainerStyle={styles.formContent}>
                    <Text style={styles.sectionTitle}>New Ticket</Text>

                    <Text style={styles.label}>Subject</Text>
                    <TextInput
                        style={styles.input}
                        value={subject}
                        onChangeText={setSubject}
                        placeholder="Issue summary"
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe your issue in detail..."
                        multiline
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>Priority</Text>
                    <View style={styles.priorityContainer}>
                        {['low', 'medium', 'high'].map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[styles.priorityChip, priority === p && styles.priorityActive]}
                                onPress={() => setPriority(p)}
                            >
                                <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleCreateTicket}
                        disabled={creating}
                    >
                        {creating ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Ticket</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <View style={styles.content}>
                    {loading ? (
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            data={tickets}
                            renderItem={renderTicket}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Headphones color={Colors.gray[300]} size={64} />
                                    <Text style={styles.emptyText}>No support tickets yet.</Text>
                                    <Text style={styles.emptySubtext}>Tap the + button to create one.</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            )}
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
    addButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    content: {
        flex: 1,
    },
    formContent: {
        padding: 24,
    },
    listContent: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        color: Colors.text.primary,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray[700],
        marginBottom: 8,
        marginTop: 16,
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
    textArea: {
        height: 120,
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    priorityChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.gray[100],
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    priorityActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    priorityText: {
        fontSize: 14,
        color: Colors.gray[600],
    },
    priorityTextActive: {
        color: Colors.white,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    submitButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    ticketCard: {
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ticketSubject: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    ticketDescription: {
        fontSize: 14,
        color: Colors.gray[600],
        marginBottom: 8,
    },
    ticketDate: {
        fontSize: 12,
        color: Colors.gray[400],
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.gray[800],
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.gray[500],
        marginTop: 8,
    },
});
