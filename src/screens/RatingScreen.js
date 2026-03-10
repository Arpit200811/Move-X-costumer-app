import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Star, X, ChevronRight, MessageSquare, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function RatingScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { order } = route.params;
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return Alert.alert('Rate your trip', 'Please select a star rating.');
        
        setLoading(true);
        try {
            await api.put(`/orders/${order._id}/rate`, { rating, review });
            navigation.replace('Home');
        } catch (err) {
            Alert.alert('Error', 'Failed to submit rating. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <X size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('trip_rating', 'How was your trip?')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.driverInfo}>
                    <View style={styles.avatarBox}>
                        <Text style={styles.avatarText}>{order.driverId?.name?.charAt(0) || 'D'}</Text>
                    </View>
                    <Text style={styles.driverName}>{order.driverId?.name || 'Your Driver'}</Text>
                    <Text style={styles.tripId}>#{order.orderId?.slice(-8)}</Text>
                </View>

                <View style={styles.starSection}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity 
                            key={s} 
                            onPress={() => setRating(s)}
                            style={styles.starBox}
                        >
                            <Star 
                                size={40} 
                                color={rating >= s ? '#F59E0B' : '#e2e8f0'} 
                                fill={rating >= s ? '#F59E0B' : 'transparent'} 
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.label}>{t('leave_feedback', 'Tell us more about your experience')}</Text>
                    <View style={styles.inputBox}>
                        <MessageSquare size={18} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('feedback_placeholder', 'Type your message...')}
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={4}
                            value={review}
                            onChangeText={setReview}
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.submitBtn, rating === 0 && styles.btnDisabled]} 
                    onPress={handleSubmit}
                    disabled={loading || rating === 0}
                >
                    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.btnGradient}>
                        <Text style={styles.submitBtnText}>{loading ? t('submitting') : t('submit_review')}</Text>
                        <ChevronRight size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <ShieldCheck size={14} color="#94a3b8" />
                    <Text style={styles.footerText}>{t('secure_feedback', 'Your feedback is secure and private.')}</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1, padding: 24, alignItems: 'center' },
    driverInfo: { alignItems: 'center', marginBottom: 40 },
    avatarBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#2563EB' },
    driverName: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    tripId: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 4, letterSpacing: 1 },
    starSection: { flexDirection: 'row', gap: 12, marginBottom: 48 },
    starBox: { padding: 4 },
    inputSection: { width: '100%', marginBottom: 40 },
    label: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    inputBox: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#f1f5f9' },
    inputIcon: { marginTop: 4, marginRight: 12 },
    input: { flex: 1, color: '#0f172a', fontWeight: '600', fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
    submitBtn: { width: '100%', borderRadius: 24, overflow: 'hidden' },
    btnGradient: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 12 },
    btnDisabled: { opacity: 0.3 },
    footer: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto', paddingBottom: 20 },
    footerText: { fontSize: 12, color: '#94a3b8', marginLeft: 8, fontWeight: '600' }
});
