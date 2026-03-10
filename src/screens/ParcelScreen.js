import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    SafeAreaView, StatusBar, Image, TextInput,
    Dimensions, StyleSheet, Platform, ActivityIndicator,
    useWindowDimensions, KeyboardAvoidingView
} from 'react-native';
import { 
    ChevronLeft, Package, MapPin, Truck, 
    Zap, Clock, ShieldCheck, ChevronRight, Info, AlertTriangle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const PACKAGE_TYPES = [
    { id: '1', name: 'Document', icon: 'https://cdn-icons-png.flaticon.com/512/281/281760.png', bgImg: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=600&auto=format&fit=crop', color: '#eff6ff' },
    { id: '2', name: 'Electronics', icon: 'https://cdn-icons-png.flaticon.com/512/3659/3659898.png', bgImg: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=600&auto=format&fit=crop', color: '#ede9fe' },
    { id: '3', name: 'Clothing', icon: 'https://cdn-icons-png.flaticon.com/512/3050/3050186.png', bgImg: 'https://images.unsplash.com/photo-1445205170230-053b830160d8?q=80&w=600&auto=format&fit=crop', color: '#fef2f2' },
    { id: '4', name: 'Food/Gifts', icon: 'https://cdn-icons-png.flaticon.com/512/3481/3481239.png', bgImg: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop', color: '#fefce8' },
];

const RECENT_SENDS = [
    { id: 'r1', name: 'Mom (Home)', address: 'Sector 55, Golf Course Road' },
    { id: 'r2', name: 'Rahul (Office)', address: 'WeWork, Cyber City' }
];

const FEATURES = [
    { id: 'f1', title: 'Live Tracking', desc: 'Track your package in real-time on the map.', icon: '📍' },
    { id: 'f2', title: 'Secure Handling', desc: 'OTP verification at pickup and dropoff.', icon: '🔒' }
];

export default function ParcelScreen({ route, navigation }) {
    const { width, height } = useWindowDimensions();
    const [selectedType, setSelectedType] = useState('1');
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userAddress, setUserAddress] = useState('Fetching location...');

    const triggerHaptic = (type = 'light') => {
        if (Platform.OS === 'web') return;
        if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    useEffect(() => {
        const fetchAddress = async () => {
            if (route?.params?.userLocation) {
                const { latitude, longitude } = route.params.userLocation;
                try {
                    const res = await fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
                    const data = await res.json();
                    if (data.features && data.features.length > 0) {
                        const props = data.features[0].properties;
                        const address = props.name || props.street || props.city || props.state || 'Current Location';
                        setUserAddress(address);
                    } else {
                        setUserAddress(`Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    }
                } catch (e) {
                    setUserAddress(`Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                }
            } else {
                setUserAddress('Current Location, Sector 45');
            }
        };
        fetchAddress();
    }, [route?.params?.userLocation]);

    useEffect(() => {
        // Fetch a default quote for demo purposes (Current Location to a mock nearby point)
        fetchDemoQuote();
    }, []);

    const fetchDemoQuote = async () => {
        const pLat = route.params?.userLocation?.latitude || 28.6139;
        const pLng = route.params?.userLocation?.longitude || 77.2090;

        setLoading(true);
        try {
            const res = await api.post('/orders/quote', {
                pickup: { lat: pLat, lng: pLng },
                destination: { lat: pLat + 0.02, lng: pLng + 0.02 }, // Demo nearby
                serviceClass: 'Economy'
            });
            setQuote(res.data.quote);
        } catch (e) {}
        finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header (Zomato Style) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Send Parcel</Text>
                <TouchableOpacity style={styles.infoBtn}>
                    <Info size={22} color="#64748b" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Modern Banner */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.heroWrapper}>
                    <LinearGradient colors={['#2563EB', '#1e40af']} style={styles.heroGradient}>
                        <View style={styles.heroContent}>
                            <Text style={styles.heroTag}>MOVE ANYTHING</Text>
                            <Text style={styles.heroTitle}>Hyperlocal{'\n'}Delivery in 60m</Text>
                            <Text style={styles.heroSub}>Safe, Secure & Insured</Text>
                        </View>
                        <Image 
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' }} 
                            style={styles.heroIllustration}
                        />
                    </LinearGradient>
                </Animated.View>

                {/* Logistics Route Card */}
                <Animated.View entering={FadeInUp.delay(200)} style={styles.routeCard}>
                    <View style={styles.locationVisual}>
                        <View style={styles.dotFrom} />
                        <View style={styles.dashedLine} />
                        <View style={styles.pinTo}>
                            <MapPin size={16} color="#fff" />
                        </View>
                    </View>
                    <View style={styles.locationDetails}>
                        <TouchableOpacity style={styles.locRow}>
                            <Text style={styles.locLabel}>PICKUP FROM</Text>
                            <Text style={styles.locMain} numberOfLines={1}>{userAddress}</Text>
                        </TouchableOpacity>
                        <View style={styles.locDivider} />
                        <TouchableOpacity style={styles.locRow}>
                            <Text style={styles.locLabel}>DELIVER TO</Text>
                            <Text style={[styles.locMain, { color: '#94a3b8' }]}>Search destination...</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Recent Sends */}
                <Text style={styles.sectionTitle}>Send Again</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
                    {RECENT_SENDS.map((recent, i) => (
                        <Animated.View key={recent.id} entering={FadeInRight.delay(i * 100)}>
                            <TouchableOpacity key={recent.id} style={styles.recentCard} onPress={() => triggerHaptic('medium')}>
                                <View style={styles.recentIconBox}>
                                    <Clock size={20} color="#2563EB" />
                                </View>
                                <View style={styles.recentInfo}>
                                    <Text style={styles.recentName}>{recent.name}</Text>
                                    <Text style={styles.recentAddress} numberOfLines={1}>{recent.address}</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </ScrollView>

                {/* Package Type Selection */}
                <Text style={styles.sectionTitle}>What are you sending?</Text>
                <View style={styles.typeGrid}>
                    {PACKAGE_TYPES.map((type, idx) => (
                        <Animated.View key={type.id} entering={FadeInUp.delay(idx * 100)}>
                            <TouchableOpacity 
                                style={[styles.typeItemLg, selectedType === type.id && styles.typeItemActiveLg]}
                                onPress={() => {
                                    setSelectedType(type.id);
                                    triggerHaptic('light');
                                }}
                            >
                                <Image source={{ uri: type.bgImg }} style={styles.typeImgBg} />
                                <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={styles.typeGradient}>
                                    <View style={[styles.typeIconWrapLg, { backgroundColor: type.color }]}>
                                        <Image source={{ uri: type.icon }} style={styles.typeIconLg} />
                                    </View>
                                    <Text style={styles.typeNameLg}>{type.name}</Text>
                                    {selectedType === type.id && (
                                        <View style={styles.selectedBadge}>
                                            <ChevronRight size={14} color="#fff" />
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Prohibited Items Warning */}
                <View style={styles.warningBox}>
                    <AlertTriangle size={18} color="#F59E0B" />
                    <Text style={styles.warningText}>We don't deliver prohibited items, intoxicants, or valuables above ₹5000.</Text>
                </View>

                {/* Secure Badge */}
                <View style={styles.secureBadge}>
                    <ShieldCheck size={20} color="#10B981" />
                    <Text style={styles.secureText}>Every delivery is insured up to ₹2000</Text>
                </View>

                {/* Why MoveX */}
                <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Why MoveX Parcel?</Text>
                <View style={styles.featuresGrid}>
                    {FEATURES.map((feat, i) => (
                        <Animated.View key={feat.id} entering={FadeInUp.delay(i * 150)}>
                            <View style={styles.featureItem}>
                                <View style={styles.featIconBox}>
                                    <Text style={styles.featEmoji}>{feat.icon}</Text>
                                </View>
                                <View style={styles.featInfo}>
                                    <Text style={styles.featTitle}>{feat.title}</Text>
                                    <Text style={styles.featDesc}>{feat.desc}</Text>
                                </View>
                            </View>
                        </Animated.View>
                    ))}
                </View>

            </ScrollView>

            {/* Sticky Action Footer */}
            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <Text style={styles.estimateLabel}>{quote?.surgeMultiplier > 1 ? 'HIGH DEMAND PRICE' : 'ESTIMATED PRICE'}</Text>
                    <Text style={[styles.estimatePrice, quote?.surgeMultiplier > 1 && { color: '#f59e0b' }]}>
                        {loading ? '...' : (quote ? `${quote.currencySymbol}${quote.total}` : '₹129 – ₹159')}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.nextBtn} 
                    onPress={() => {
                        triggerHaptic('success');
                        navigation.navigate('CreateOrder', { 
                            type: 'PARCEL',
                            userLocation: route.params?.userLocation
                        });
                    }}
                >
                    <LinearGradient colors={['#2563EB', '#1e40af']} style={styles.nextGradient}>
                        <Text style={styles.nextText}>Select Courier</Text>
                        <ChevronRight size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
    infoBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: 20, paddingBottom: 140 },

    heroWrapper: { borderRadius: 28, overflow: 'hidden', elevation: 12, shadowColor: '#2563EB', shadowOpacity: 0.2, shadowRadius: 20, marginBottom: 24 },
    heroGradient: { padding: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroContent: { flex: 1 },
    heroTag: { color: 'rgba(255,255,255,0.6)', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
    heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 8 },
    heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginTop: 4 },
    heroIllustration: { width: 90, height: 90, resizeMode: 'contain' },

    routeCard: { backgroundColor: '#fff', borderRadius: 28, padding: 20, flexDirection: 'row', gap: 15, borderWidth: 1.5, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 8, marginBottom: 30 },
    locationVisual: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    dotFrom: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2563EB', borderWidth: 2.5, borderColor: '#fff', elevation: 4 },
    dashedLine: { width: 1.5, flex: 1, backgroundColor: '#cbd5e1', marginVertical: 6 },
    pinTo: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', elevation: 4 },
    locationDetails: { flex: 1, gap: 18 },
    locRow: { flex: 1 },
    locLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
    locMain: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginTop: 4 },
    locDivider: { height: 1, backgroundColor: '#f1f5f9' },

    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 20, letterSpacing: -0.5 },
    recentScroll: { paddingBottom: 25, gap: 15 },
    recentCard: { width: 220, backgroundColor: '#fff', borderRadius: 24, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
    recentIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    recentInfo: { flex: 1 },
    recentName: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
    recentAddress: { fontSize: 11, color: '#64748b', fontWeight: '600' },

    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15, marginBottom: 30 },
    typeItemLg: { width: (width - 40 - 15) / 2, height: 180, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
    typeItemActiveLg: { borderWidth: 3, borderColor: '#2563EB' },
    typeImgBg: { width: '100%', height: '100%', position: 'absolute' },
    typeGradient: { flex: 1, padding: 20, justifyContent: 'space-between' },
    typeIconWrapLg: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    typeIconLg: { width: 30, height: 30, resizeMode: 'contain' },
    typeNameLg: { fontSize: 18, fontWeight: '900', color: '#fff' },
    selectedBadge: { position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },

    warningBox: { flexDirection: 'row', backgroundColor: '#fff7ed', padding: 18, borderRadius: 20, gap: 15, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#ffedd5' },
    warningText: { flex: 1, fontSize: 12, color: '#9a3412', fontWeight: '600', lineHeight: 18 },
    secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f0fdf4', paddingVertical: 10, borderRadius: 10 },
    secureText: { fontSize: 13, fontWeight: '800', color: '#10b981' },

    featuresGrid: { gap: 15 },
    featureItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1.5, borderColor: '#f8fafc' },
    featIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 18 },
    featEmoji: { fontSize: 26 },
    featInfo: { flex: 1 },
    featTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
    featDesc: { fontSize: 13, color: '#64748b', fontWeight: '500', lineHeight: 19 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 25, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
    footerInfo: { flex: 1 },
    estimateLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5 },
    estimatePrice: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 4 },
    nextBtn: { borderRadius: 20, overflow: 'hidden', minWidth: 180 },
    nextGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 25, gap: 10 },
    nextText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
