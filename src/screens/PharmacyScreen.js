import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    SafeAreaView, StatusBar, Image, TextInput, 
    Dimensions, StyleSheet, Platform, ImageBackground, ActivityIndicator,
    Keyboard, useWindowDimensions, KeyboardAvoidingView 
} from 'react-native';
import { 
    ChevronLeft, Search, MapPin, Beaker, 
    Stethoscope, Pill, ScanLine, Tag, FileText, ChevronRight, ChevronDown,
    Activity, Clipboard, Heart, Baby, ShieldCheck, Thermometer, User, 
    Zap, Flame, Star, ShoppingBag, Plus, PlusCircle, Clock
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeInRight, SlideInRight, ZoomIn } from 'react-native-reanimated';
import api from '../services/api';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const APOLLO_SERVICES = [
    { id: 1, name: 'Medicines', icon: Pill, color: '#f89b2d', bg: '#fff7ed', desc: 'Flat 25% OFF' },
    { id: 2, name: 'Doctors', icon: Stethoscope, color: '#2563EB', bg: '#eff6ff', desc: '15 Min Wait' },
    { id: 3, name: 'Home Lab', icon: Beaker, color: '#10B981', bg: '#ecfdf5', desc: 'Free Sample' },
    { id: 4, name: 'Records', icon: Clipboard, color: '#7C3AED', bg: '#f5f3ff', desc: 'Secure Life' }
];

const HEALTH_CONCERNS = [
    { id: 1, name: 'Diabetes', img: 'https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?q=80&w=400', icon: '🩸' },
    { id: 2, name: 'Heart Care', img: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b634?q=80&w=400', icon: '❤️' },
    { id: 3, name: 'Skin Care', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400', icon: '✨' },
    { id: 4, name: 'Baby Care', img: 'https://images.unsplash.com/photo-1522771930-78848d92871d?q=80&w=400', icon: '🍼' },
    { id: 5, name: 'Joint Pain', img: 'https://images.unsplash.com/photo-1559757175-5700dee835be?q=80&w=400', icon: '🦴' }
];

const FLASH_DEALS = [
    { id: 'd1', name: 'Glucometer', price: '₹499', old: '₹1200', off: '60%', img: 'https://cdn-icons-png.flaticon.com/512/3022/3022513.png' },
    { id: 'd2', name: 'Face Mask', price: '₹149', old: '₹350', off: '58%', img: 'https://cdn-icons-png.flaticon.com/512/2877/2877824.png' },
    { id: 'd3', name: 'Dettol', price: '₹85', old: '₹110', off: '22%', img: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png' }
];

export default function PharmacyScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const [userAddress, setUserAddress] = useState('Cyber City, Gurgaon');
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        fetchData(mounted);
        return () => { mounted = false; };
    }, [fetchData]);

    const fetchData = useCallback(async (mounted = true) => {
        try {
            if (mounted) setLoading(true);
            const pharmRes = await api.get('/vendors?type=PHARMACY');
            if (mounted) setPharmacies(pharmRes.data.vendors || []);
        } catch (e) {
        } finally {
            if (mounted) setLoading(false);
        }
    }, []);

    const triggerHaptic = (style = 'light') => {
        if (Haptics?.impactAsync) {
            if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#1a3a5f" />
            <LinearGradient colors={['#1a3a5f', '#1e40af']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.addressSection}>
                        <View style={styles.locRow}>
                            <MapPin size={12} color="#f89b2d" fill="#f89b2d" />
                            <Text style={styles.locLabel}>HOME</Text>
                            <ChevronDown size={14} color="#fff" />
                        </View>
                        <Text style={styles.addressText} numberOfLines={1}>{userAddress}</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBox} onPress={() => navigation.navigate('Profile')}>
                         <View style={styles.avatarCircle}>
                             <User size={20} color="#1a3a5f" />
                         </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.searchContainer}>
                    <TouchableOpacity 
                        style={styles.searchBar}
                        onPress={() => navigation.navigate('Search', { activeTab: 'PHARMACY' })}
                    >
                        <Search size={20} color="#94a3b8" />
                        <Text style={styles.searchPlaceholder}>Search for medicines & health items...</Text>
                        <View style={styles.divider} />
                        <ScanLine size={20} color="#f89b2d" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.serviceGrid}>
                    {APOLLO_SERVICES.map((item, idx) => (
                        <Animated.View key={item.id} entering={FadeInUp.delay(idx * 100)}>
                            <TouchableOpacity style={styles.serviceCard} onPress={() => triggerHaptic('light')}>
                                <View style={[styles.serviceIconContainer, { backgroundColor: item.bg }]}>
                                    <item.icon size={26} color={item.color} />
                                </View>
                                <Text style={styles.serviceTitle}>{item.name}</Text>
                                <Text style={[styles.serviceDesc, { color: item.color }]}>{item.desc}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                <View style={styles.flashSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.headerLeft}>
                            <Flame size={20} color="#f89b2d" fill="#f89b2d" />
                            <Text style={styles.sectionTitle}>FLASH DEALS</Text>
                            <View style={styles.timerBadge}><Text style={styles.timerText}>04:12:45</Text></View>
                        </View>
                        <TouchableOpacity><Text style={styles.seeAllText}>VIEW ALL</Text></TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flashScroll}>
                        {FLASH_DEALS.map((deal) => (
                            <TouchableOpacity key={deal.id} style={styles.dealCard}>
                                <View style={styles.offBadge}><Text style={styles.offText}>{deal.off} OFF</Text></View>
                                <Image source={{ uri: deal.img }} style={styles.dealImg} />
                                <Text style={styles.dealName} numberOfLines={1}>{deal.name}</Text>
                                <View style={styles.dealPriceRow}>
                                    <Text style={styles.dealPrice}>{deal.price}</Text>
                                    <Text style={styles.dealOldPrice}>{deal.old}</Text>
                                </View>
                                <TouchableOpacity style={styles.addBtn} onPress={() => triggerHaptic()}>
                                    <Plus size={16} color="#1a3a5f" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.prescriptionArea}>
                    <LinearGradient colors={['#fff', '#f0f4f8']} style={styles.prescriptionCard}>
                        <View style={styles.pInfo}>
                            <View style={[styles.pIcon, { backgroundColor: '#fff7ed' }]}><FileText size={24} color="#f89b2d" /></View>
                            <View>
                                <Text style={styles.pTitle}>Quick Prescription Order</Text>
                                <Text style={styles.pSub}>Upload & our pharmacist will call you</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.pAction} onPress={() => triggerHaptic('medium')}><Text style={styles.pActionText}>UPLOAD NOW</Text></TouchableOpacity>
                    </LinearGradient>
                </View>

                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Shop by Concern</Text></View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.concernScroll}>
                    {HEALTH_CONCERNS.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.concernItem}>
                            <View style={styles.concernCircle}>
                                <Image source={{ uri: item.img }} style={styles.concernImg} />
                                <View style={styles.concernIcon}><Text style={{ fontSize: 12 }}>{item.icon}</Text></View>
                            </View>
                            <Text style={styles.concernTitleText}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.promoContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled snapToInterval={SCREEN_WIDTH - 40} decelerationRate="fast" contentContainerStyle={styles.promoScroll}>
                        {[
                            { title: 'Home Lab Tests', sub: 'Sample Collection at Home', off: 'Flat 50%', color: '#10B981', img: 'https://images.unsplash.com/photo-1579152276532-83951f90ac2d?q=80&w=800' },
                            { title: 'Consult Online', sub: 'Talk to Doctors in 15min', off: 'Starts ₹199', color: '#2563EB', img: 'https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=800' }
                         ].map((p, i) => (
                             <TouchableOpacity key={i} style={[styles.promoCard, { width: SCREEN_WIDTH - 40 }]}>
                                 <Image source={{ uri: p.img }} style={styles.promoImg} />
                                 <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.promoOverlay}>
                                     <View style={[styles.promoOff, { backgroundColor: p.color }]}><Text style={styles.promoOffText}>{p.off}</Text></View>
                                     <Text style={styles.promoTitleText}>{p.title}</Text>
                                     <Text style={styles.promoSubText}>{p.sub}</Text>
                                     <View style={styles.promoBtn}><Text style={styles.promoBtnText}>Book Now</Text><ChevronRight size={14} color="#000" /></View>
                                 </LinearGradient>
                             </TouchableOpacity>
                         ))}
                    </ScrollView>
                </View>

                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>PARTNER PHARMACIES</Text></View>
                {loading ? <ActivityIndicator size="large" color="#1a3a5f" style={{ margin: 40 }} /> : pharmacies.map((pharm, idx) => (
                    <Animated.View key={pharm._id} entering={FadeInUp.delay(300 + idx * 100)}>
                        <TouchableOpacity style={styles.pharmCard} onPress={() => navigation.navigate('StoreMenu', { vendor: pharm })}>
                            <Image source={{ uri: pharm.image || 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?q=80&w=800' }} style={styles.pharmImgLg} />
                            <View style={styles.pharmDiscount}><Zap size={10} color="#fff" fill="#fff" /><Text style={styles.pharmDiscountText}>20% OFF</Text></View>
                            <View style={styles.pharmInfo}>
                                <View style={styles.pharmHeader}>
                                    <Text style={styles.pharmName}>{pharm.name}</Text>
                                    <View style={styles.ratingBadge}><Star size={10} color="#fff" fill="#fff" /><Text style={styles.ratingText}>{pharm.rating || '4.5'}</Text></View>
                                </View>
                                <Text style={styles.pharmTags}>{pharm.tags?.join(' • ') || 'Medicines • Healthcare'}</Text>
                                <View style={styles.pharmFooter}>
                                    <View style={styles.metaItem}><Clock size={14} color="#94a3b8" /><Text style={styles.metaText}>25 mins</Text></View>
                                    <View style={styles.dot} />
                                    <View style={styles.metaItem}><ShieldCheck size={14} color="#10B981" /><Text style={styles.verifiedText}>CERTIFIED</Text></View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 25, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    iconBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    addressSection: { flex: 1, marginHorizontal: 15 },
    locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locLabel: { color: '#f89b2d', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    addressText: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 2 },
    profileBox: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#fff', overflow: 'hidden' },
    avatarCircle: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    searchContainer: { paddingTop: 0 },
    searchBar: { height: 56, backgroundColor: '#fff', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, elevation: 10, shadowColor: '#1a3a5f', shadowOpacity: 0.2, shadowRadius: 20 },
    searchPlaceholder: { flex: 1, marginLeft: 12, fontSize: 13, fontWeight: '600', color: '#94a3b8' },
    divider: { width: 1, height: 24, backgroundColor: '#f1f5f9', marginHorizontal: 12 },
    scrollContent: { paddingBottom: 100 },
    serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, gap: 15, justifyContent: 'space-between' },
    serviceCard: { width: (SCREEN_WIDTH - 55) / 2, backgroundColor: '#fff', borderRadius: 24, padding: 18, elevation: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
    serviceIconContainer: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    serviceTitle: { fontSize: 15, fontWeight: '800', color: '#1a3a5f' },
    serviceDesc: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginTop: 6 },
    flashSection: { marginTop: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15, marginTop: 20 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1a3a5f', letterSpacing: 0.5 },
    timerBadge: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f89b2d', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    timerText: { fontSize: 11, fontWeight: '800', color: '#f89b2d' },
    seeAllText: { fontSize: 11, fontWeight: '900', color: '#2563EB' },
    flashScroll: { paddingHorizontal: 20, gap: 15 },
    dealCard: { width: 140, backgroundColor: '#fff', borderRadius: 24, padding: 15, borderWidth: 1, borderColor: '#f1f5f9' },
    offBadge: { position: 'absolute', top: -8, left: 15, backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 1 },
    offText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    dealImg: { width: 80, height: 80, alignSelf: 'center', marginBottom: 12 },
    dealName: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
    dealPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    dealPrice: { fontSize: 14, fontWeight: '900', color: '#1a3a5f' },
    dealOldPrice: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through' },
    addBtn: { position: 'absolute', bottom: 15, right: 15, width: 28, height: 28, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    prescriptionArea: { paddingHorizontal: 20, marginTop: 30 },
    prescriptionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 28, borderWidth: 1, borderColor: '#e2e8f0', elevation: 10, shadowColor: '#f89b2d', shadowOpacity: 0.1, shadowRadius: 20 },
    pInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15 },
    pIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    pTitle: { fontSize: 17, fontWeight: '900', color: '#1a3a5f' },
    pSub: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
    pAction: { backgroundColor: '#1a3a5f', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
    pActionText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    concernScroll: { paddingHorizontal: 20, gap: 15 },
    concernItem: { alignItems: 'center', width: 80 },
    concernCircle: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    concernImg: { width: '100%', height: '100%' },
    concernIcon: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    concernTitleText: { fontSize: 11, fontWeight: '800', color: '#1a3a5f', textAlign: 'center', marginTop: 10 },
    promoContainer: { marginTop: 30 },
    promoScroll: { paddingHorizontal: 20, gap: 15 },
    promoCard: { height: 180, borderRadius: 32, overflow: 'hidden' },
    promoImg: { width: '100%', height: '100%' },
    promoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 25, justifyContent: 'flex-end' },
    promoOff: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
    promoOffText: { color: '#fff', fontSize: 12, fontWeight: '900' },
    promoTitleText: { color: '#fff', fontSize: 24, fontWeight: '900' },
    promoSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginTop: 4 },
    promoBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 8 },
    promoBtnText: { color: '#000', fontSize: 12, fontWeight: '800' },
    pharmCard: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 32, overflow: 'hidden', marginBottom: 20, elevation: 8, shadowColor: '#1a3a5f', shadowOpacity: 0.1, shadowRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
    pharmImgLg: { width: '100%', height: 180 },
    pharmDiscount: { position: 'absolute', top: 20, left: 20, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
    pharmDiscountText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    pharmInfo: { padding: 20 },
    pharmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    pharmName: { fontSize: 20, fontWeight: '900', color: '#1a3a5f', flex: 1 },
    ratingBadge: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { color: '#fff', fontSize: 12, fontWeight: '900' },
    pharmTags: { fontSize: 14, color: '#94a3b8', fontWeight: '600', marginBottom: 15 },
    pharmFooter: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, fontWeight: '700', color: '#1a3a5f' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' },
    verifiedText: { fontSize: 11, fontWeight: '900', color: '#10B981', letterSpacing: 0.5 }
});
