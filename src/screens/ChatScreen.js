import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet, Image } from 'react-native';
import { ChevronLeft, Send, Phone, Info, MoreHorizontal, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function ChatScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { recipientName, recipientRole, orderId } = route.params || { recipientName: 'Support Agent', recipientRole: 'Support', orderId: 'GEN-Chat' };
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    let socket;
    const loadMessages = async () => {
        try {
            const res = await api.get(`/orders/${orderId}`);
            if (res.data.success && res.data.order && res.data.order.messages) {
                const formatted = res.data.order.messages.map(m => ({
                    id: m._id || Math.random().toString(),
                    text: m.text,
                    sender: m.senderRole === 'customer' ? 'me' : 'other',
                    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }));
                setMessages(formatted);
            }
        } catch (e) {
            console.log('Error loading messages');
        }
    };

    const setupSocket = async () => {
        const baseUrl = api.defaults.baseURL.replace('/api', '');
        socket = io(baseUrl);
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_order', orderId);
        });

        socket.on('new_message', (data) => {
            const incoming = {
                id: data.id || Date.now().toString(),
                text: data.text,
                sender: 'other',
                time: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, incoming]);
        });
    };

    loadMessages();
    setupSocket();

    return () => {
        if (socket) socket.disconnect();
    };
  }, [orderId]);

  const sendMessage = () => {
    if (!message.trim()) return;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'me',
      time: time
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Real-time emit
    if (socketRef.current) {
        socketRef.current.emit('send_message', {
            orderId: orderId,
            text: message.trim(),
            sender: 'Customer'
        });
    }

    setMessage('');
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageWrapper, item.sender === 'me' ? styles.myMessage : styles.otherMessage]}>
        <View style={[styles.messageBubble, item.sender === 'me' ? styles.myBubble : styles.otherBubble]}>
            <Text style={[styles.messageText, item.sender === 'me' ? styles.myText : styles.otherText]}>{item.text}</Text>
        </View>
        <Text style={styles.messageTime}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
            <View style={styles.avatarMini}>
                <User size={18} color="#2563EB" />
            </View>
            <View>
                <Text style={styles.headerName}>{recipientName}</Text>
                <Text style={styles.headerStatus}>{recipientRole} • Active Now</Text>
            </View>
        </View>
        <TouchableOpacity style={styles.actionBtn}>
            <Phone size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={message}
                    onChangeText={setMessage}
                    multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                    <Send size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    avatarMini: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    headerName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    headerStatus: { fontSize: 11, color: '#10B981', fontWeight: '600' },
    actionBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    chatList: { padding: 20, paddingBottom: 40 },
    messageWrapper: { marginBottom: 20, maxWidth: '80%' },
    myMessage: { alignSelf: 'flex-end' },
    otherMessage: { alignSelf: 'flex-start' },
    messageBubble: { padding: 16, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    myBubble: { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
    otherBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#f1f5f9' },
    messageText: { fontSize: 14, lineHeight: 20 },
    myText: { color: '#fff' },
    otherText: { color: '#475569' },
    messageTime: { fontSize: 10, color: '#94a3b8', marginTop: 4, alignSelf: 'flex-end' },
    inputArea: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24, paddingLeft: 20, paddingRight: 8, paddingVertical: 8 },
    input: { flex: 1, minHeight: 40, color: '#0f172a', paddingVertical: 8 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginLeft: 12 }
});
