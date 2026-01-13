import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { SupportService } from '../services/support.service';

export default function DocumentationScreen() {
    const router = useRouter();
    const [content, setContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await SupportService.getDocumentation();
            if (response.success) {
                // Assuming response.data is an array or object. If empty, we'll show empty state.
                const data = Array.isArray(response.data) ? response.data : [];
                setContent(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Documentation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                ) : content.length > 0 ? (
                    content.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardBody}>{item.body || item.content}</Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.placeholder}>
                        <FileText color={Colors.gray[300]} size={64} />
                        <Text style={styles.placeholderTitle}>Coming Soon</Text>
                        <Text style={styles.placeholderText}>Comprehensive guides and API documentation are being updated.</Text>
                    </View>
                )}
            </ScrollView>
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
        fontSize: 20,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    cardBody: {
        fontSize: 14,
        color: Colors.gray[600],
        lineHeight: 20,
    },
    placeholder: {
        alignItems: 'center',
        marginTop: 60,
    },
    placeholderTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.gray[800],
        marginTop: 16,
        marginBottom: 8,
    },
    placeholderText: {
        fontSize: 14,
        color: Colors.gray[500],
        textAlign: 'center',
    },
});
