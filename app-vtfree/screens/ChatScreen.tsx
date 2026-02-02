import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Paperclip, Mic, Image as ImageIcon, FileText, X } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';

import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

// Types
interface Message {
    _id: string;
    text?: string;
    senderId: string;
    type: 'text' | 'image' | 'audio' | 'document';
    fileUrl?: string; // For images/audio/docs
    fileName?: string; // For docs
    createdAt: Date;
}

export default function ChatScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [socket, setSocket] = useState<any>(null);
    const [isRecording, setIsRecording] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);

    // Mock initial messages for UI demo before backend is fully ready
    useEffect(() => {
        setMessages([
            {
                _id: '1',
                text: 'Hello! How can we help you today with your VTU app?',
                senderId: 'admin',
                type: 'text',
                createdAt: new Date(Date.now() - 100000),
            }
        ]);

        // Initialize Socket (Placeholder URL)
        // const newSocket = io('http://YOUR_BACKEND_URL');
        // setSocket(newSocket);

        // return () => newSocket.close();
    }, []);

    const sendMessage = (type: 'text' | 'image' | 'document' | 'audio' = 'text', content?: any) => {
        if (type === 'text' && !inputText.trim()) return;

        const newMessage: Message = {
            _id: Date.now().toString(), // Temp ID
            senderId: user?._id || 'user',
            type: type,
            text: type === 'text' ? inputText : undefined,
            fileUrl: (type !== 'text') ? content?.uri : undefined,
            fileName: (type === 'document') ? content?.name : undefined,
            createdAt: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');

        // Scroll to bottom
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        // Emit to socket here
        // socket.emit('sendMessage', newMessage);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            sendMessage('image', result.assets[0]);
        }
    };

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({});
        if (result.assets && result.assets.length > 0) {
            sendMessage('document', result.assets[0]);
        }
    };

    const startRecording = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            Alert.alert('Failed to start recording', String(err));
        }
    };

    const stopRecording = async () => {
        setRecording(null);
        setIsRecording(false);
        await recording?.stopAndUnloadAsync();
        const uri = recording?.getURI();
        if (uri) {
            sendMessage('audio', { uri });
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.senderId === (user?._id || 'user');

        return (
            <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowOther]}>
                {!isMe && <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>A</Text></View>}

                <View style={[
                    styles.bubble,
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                    item.type === 'image' && { padding: 4 }
                ]}>
                    {/* Text Message */}
                    {item.type === 'text' && (
                        <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
                            {item.text}
                        </Text>
                    )}

                    {/* Image Message */}
                    {item.type === 'image' && item.fileUrl && (
                        <Image source={{ uri: item.fileUrl }} style={styles.messageImage} />
                    )}

                    {/* Document Message */}
                    {item.type === 'document' && (
                        <View style={styles.docContainer}>
                            <FileText color={isMe ? Colors.white : Colors.primary} size={24} />
                            <Text style={[styles.docText, isMe ? styles.textMe : styles.textOther]} numberOfLines={1}>
                                {item.fileName || 'Document'}
                            </Text>
                        </View>
                    )}

                    {/* Audio Message (Placeholder UI) */}
                    {item.type === 'audio' && (
                        <View style={styles.audioContainer}>
                            <Mic color={isMe ? Colors.white : Colors.primary} size={20} />
                            <Text style={[styles.audioText, isMe ? styles.textMe : styles.textOther]}>Voice Note (0:05)</Text>
                        </View>
                    )}

                    <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeOther]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text.primary} size={24} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Image
                        source={{ uri: 'https://ui-avatars.com/api/?name=Admin+Support&background=10B981&color=fff' }}
                        style={styles.headerAvatar}
                    />
                    <View>
                        <Text style={styles.headerTitle}>VTfree Support</Text>
                        <Text style={styles.headerStatus}>Online</Text>
                    </View>
                </View>
                <TouchableOpacity>
                    {/* Optional menu icon */}
                </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                style={styles.list}
            />

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={pickDocument} style={styles.attachButton}>
                    <Paperclip color={Colors.gray[500]} size={22} />
                </TouchableOpacity>

                <TouchableOpacity onPress={pickImage} style={styles.attachButton}>
                    <ImageIcon color={Colors.gray[500]} size={22} />
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Message..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />

                {inputText.trim() ? (
                    <TouchableOpacity onPress={() => sendMessage('text')} style={styles.sendButton}>
                        <Send color={Colors.white} size={20} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        style={[styles.recordButton, isRecording && { backgroundColor: Colors.red[500], transform: [{ scale: 1.2 }] }]}
                    >
                        <Mic color={Colors.white} size={20} />
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5E5E5', // WhatsApp-like background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 10,
        paddingHorizontal: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    backButton: {
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    headerStatus: {
        fontSize: 12,
        color: Colors.green[600],
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    rowMe: {
        justifyContent: 'flex-end',
    },
    rowOther: {
        justifyContent: 'flex-start',
    },
    avatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.gray[300],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.gray[700],
    },
    bubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    bubbleMe: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 2, // WhatsApp style tail
    },
    bubbleOther: {
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 2, // WhatsApp style tail
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    textMe: {
        color: Colors.white,
    },
    textOther: {
        color: Colors.text.primary,
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    timeMe: {
        color: 'rgba(255,255,255,0.7)',
    },
    timeOther: {
        color: Colors.gray[400],
    },

    // Rich Media Styles
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: 12,
    },
    docContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    docText: {
        maxWidth: 150,
        fontWeight: '500',
    },
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    audioText: {
        fontWeight: '500',
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingBottom: 24, // Safe area
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[200],
    },
    attachButton: {
        padding: 8,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.gray[100],
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
