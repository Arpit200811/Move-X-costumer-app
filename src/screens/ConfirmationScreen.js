import React, { useEffect } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    SafeAreaView, StatusBar, StyleSheet, Dimensions, Platform, Alert 
} from 'react-native';
import { 
    CheckCircle2, Navigation, Package, ShieldCheck, 
    Zap, Share2, ArrowRight, Star
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useWindowDimensions } from 'react-native';

export default function ConfirmationScreen({ route, navigation }) {
    const { width, height } = useWindowDimensions();
    const { order } = route.params;

    useEffect(() => {
        // Trigger celebration haptic
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, []);

    const handleCancelOrder = () => {
        const reasons = [
            { text: 'Made a mistake in booking', value: 'Mistake' },
            { text: 'Changed my mind', value: 'Mind Change' },
            { text: 'Wait time is too high', value: 'Long Wait' },
            { text: 'Other', value: 'Other' }
        ];

        Alert.alert(
            'Select Reason',
            'Why do you want to cancel this booking?',
            reasons.map(r => ({
                text: r.text,
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await api.put(`/orders/${order._id}/cancel`, { reason: r.text });
                        if (res.data.success) {
                            Alert.alert('Cancelled', 'Your booking request has been aborted.');
                            navigation.replace('Home');
                        }
                    } catch (err) {
                        const errorMsg = err.response?.data?.message || 'Unable to cancel at this moment.';
                        Alert.alert('Error', errorMsg);
                    }
                }
            })).concat([{ text: 'Don\'t Cancel', style: 'cancel' }])
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.replace('Home')} style={styles.closeBtn}>
                        <Star size={20} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleBox}>
                        <Text style={styles.headerTitle}>BOOKING SECURED</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn}>
                        <Share2 size={20} color="#000" />
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <Animated.View entering={ZoomIn.duration(800)} style={styles.mainBadge}>
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                style={styles.badgeGradient}
                            >
                                <CheckCircle2 size={64} color="#fff" strokeWidth={1.5} />
                            </LinearGradient>
                            <Animated.View entering={FadeInDown.delay(400)} style={styles.shieldBadge}>
                                <ShieldCheck size={20} color="#fff" />
                            </Animated.View>
                        </Animated.View>

                        <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
                            Request Confirmed
                        </Animated.Text>
                        <Animated.Text entering={FadeInDown.delay(300)} style={styles.subtitle}>
                            Booking <Text style={styles.orderIdText}>#{(order._id || 'SYNC').slice(-8).toUpperCase()}</Text> is currently being dispatched. A driver will be assigned soon.
                        </Animated.Text>
                    </View>

                    {/* Elite Stats Card */}
                    <Animated.View entering={FadeInDown.delay(500)} style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>SERVICE</Text>
                            <Text style={styles.statValue}>{order.packageType || 'Ride'}</Text>
                        </View>
                        <View style={[styles.statBox, styles.statBorder]}>
                            <Text style={styles.statLabel}>STATUS</Text>
                            <Text style={[styles.statValue, { color: '#10B981' }]}>Active</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>PAYMENT</Text>
                            <Text style={styles.statValue}>{order.paymentMethod || 'Cash'}</Text>
                        </View>
                    </Animated.View>

                    {/* Summary Section */}
                    <Animated.View entering={FadeInDown.delay(600)} style={styles.summaryCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>BOOKING DETAILS</Text>
                            <Zap size={14} color="#2563EB" fill="#2563EB" />
                        </View>
                        
                        <View style={styles.detailRow}>
                            <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                                <Package size={18} color="#2563EB" />
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={styles.detailLabel}>Package Tier</Text>
                                <Text style={styles.detailValue}>{order.packageType} Economy</Text>
                            </View>
                            <ArrowRight size={16} color="#cbd5e1" />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailRow}>
                            <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
                                <ShieldCheck size={18} color="#10B981" />
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={styles.detailLabel}>Safety Protocol</Text>
                                <Text style={styles.detailValue}>MoveX Secured • Insurance Active</Text>
                            </View>
                            <CheckCircle2 size={16} color="#10B981" />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(700)} style={styles.tipCard}>
                        <Text style={styles.tipText}>
                            💡 <Text style={styles.tipBold}>Tip:</Text> Keep your 4-digit PIN ready to share with the driver upon arrival for a seamless start.
                        </Text>
                    </Animated.View>
                </ScrollView>

                <Animated.View entering={FadeInUp.delay(800)} style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.trackBtn}
                        onPress={() => navigation.replace('Tracking', { order })}
                    >
                        <LinearGradient
                            colors={['#0f172a', '#1e293b']}
                            style={styles.btnGradient}
                        >
                            <Navigation size={20} color="#fff" />
                            <Text style={styles.trackBtnText}>Track My Order</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.cancelBtn}
                        onPress={handleCancelOrder}
                    >
                        <Text style={styles.cancelBtnText}>Cancel Request</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.homeBtn}
                        onPress={() => navigation.replace('Home')}
                    >
                        <Text style={styles.homeBtnText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}



const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    safeArea: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
        paddingBottom: 10,
        backgroundColor: '#fff',
        zIndex: 100
    },
    closeBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    headerTitleBox: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    headerTitle: { fontSize: 10, fontWeight: '900', color: '#64748b', letterSpacing: 1.5 },
    scrollContent: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 120 },

    heroSection: { alignItems: 'center', marginBottom: 40 },
    mainBadge: { position: 'relative', marginBottom: 32 },
    badgeGradient: { width: 140, height: 140, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
    shieldBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#000', width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', elevation: 10 },

    title: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1, marginBottom: 12, textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 24, fontWeight: '500', paddingHorizontal: 15 },
    orderIdText: { color: '#000', fontWeight: '800' },

    statsContainer: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 24, paddingVertical: 15, marginBottom: 30, borderWidth: 1, borderColor: '#f1f5f9' },
    statBox: { flex: 1, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0' },
    statLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
    statValue: { fontSize: 14, fontWeight: '800', color: '#0f172a' },

    summaryCard: { backgroundColor: '#fff', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 15, elevation: 5, borderWidth: 1, borderColor: '#f1f5f9' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 11, fontWeight: '900', color: '#64748b', letterSpacing: 1.5 },
    detailRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    detailInfo: { flex: 1, marginLeft: 16 },
    detailLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 18 },

    tipCard: { backgroundColor: '#fff7ed', padding: 18, borderRadius: 20, marginTop: 25, borderWidth: 1, borderColor: '#ffedd5' },
    tipText: { fontSize: 12, color: '#9a3412', lineHeight: 20, fontWeight: '600' },
    tipBold: { fontWeight: '800' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 25, paddingBottom: 40, paddingTop: 20 },
    trackBtn: { borderRadius: 22, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
    btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 12 },
    trackBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    homeBtn: { alignItems: 'center', marginTop: 10 },
    homeBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
    cancelBtn: { alignItems: 'center', marginTop: 20, paddingVertical: 10 },
    cancelBtnText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }
});
