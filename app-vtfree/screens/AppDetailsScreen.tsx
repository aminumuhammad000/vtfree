import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Smartphone } from 'lucide-react-native';
import Colors from '../constants/Colors';

export default function AppDetailsScreen() {
    const router = useRouter();
    const { appId } = useLocalSearchParams();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>App Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.placeholder}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={{ width: 80, height: 80, tintColor: Colors.primary, marginBottom: 16 }}
                        resizeMode="contain"
                    />
                    <Text style={styles.placeholderTitle}>App Details</Text>
                    <Text style={styles.placeholderText}>App ID: {appId || 'N/A'}</Text>
                </View>
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
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    placeholder: {
        alignItems: 'center',
    },
    placeholderTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: 16,
        marginBottom: 8,
    },
    placeholderText: {
        fontSize: 14,
        color: Colors.gray[600],
        textAlign: 'center',
    },
});
