import React from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface BuildProgressModalProps {
    visible: boolean;
    stage: string;
    progress: number;
    status: 'not_started' | 'building' | 'completed' | 'failed';
    onClose: () => void;
    apkUrl?: string;
    driveLink?: string;
}

export const BuildProgressModal: React.FC<BuildProgressModalProps> = ({
    visible,
    stage,
    progress,
    status,
    onClose,
    apkUrl, // Assuming direct download link if available
    driveLink
}) => {

    const isCompleted = status === 'completed';
    const isFailed = status === 'failed';

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={isCompleted || isFailed ? onClose : () => { }}
        >
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {isCompleted ? 'Build Successful!' : isFailed ? 'Build Failed' : (stage.includes('Queue') ? 'In Queue' : 'Building App...')}
                        </Text>
                        {(isCompleted || isFailed) && (
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={Colors.text.primary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.content}>
                        {!isCompleted && !isFailed && (
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                                </View>
                                <Text style={styles.percentText}>{progress}%</Text>
                            </View>
                        )}

                        <View style={styles.stageContainer}>
                            {isCompleted ? (
                                <Ionicons name="checkmark-circle" size={64} color={Colors.green[500]} />
                            ) : isFailed ? (
                                <Ionicons name="alert-circle" size={64} color={Colors.red[500]} />
                            ) : (
                                <ActivityIndicator size="large" color={Colors.text.primary} />
                            )}

                            <Text style={styles.stageText}>
                                {isCompleted ? 'Your APK is ready!' : isFailed ? 'Something went wrong.' : stage || 'Initializing...'}
                            </Text>
                        </View>

                        {isCompleted && (
                            <View style={styles.actions}>
                                {driveLink && (
                                    <TouchableOpacity style={styles.button} onPress={() => { /* Handle Link */ }}>
                                        {/* Ideally link handling logic passed from parent or standard Link */}
                                        <Text style={styles.buttonText}>Open Drive Link</Text>
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.note}>Check your email for the download link as well.</Text>
                            </View>
                        )}

                        {isFailed && (
                            <Text style={styles.errorText}>Please contact support or try again later.</Text>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    content: {
        alignItems: 'center',
    },
    progressContainer: {
        width: '100%',
        marginBottom: 20,
    },
    progressBarBg: {
        height: 10,
        backgroundColor: Colors.gray[200],
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.green[500],
    },
    percentText: {
        textAlign: 'right',
        fontSize: 12,
        color: Colors.text.secondary,
        marginTop: 5,
    },
    stageContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    stageText: {
        fontSize: 16,
        color: Colors.text.secondary,
        marginTop: 10,
        textAlign: 'center',
    },
    actions: {
        width: '100%',
        marginTop: 10,
    },
    button: {
        backgroundColor: Colors.text.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    note: {
        fontSize: 12,
        color: Colors.text.tertiary,
        textAlign: 'center',
    },
    errorText: {
        color: Colors.red[500],
        textAlign: 'center',
    }
});
