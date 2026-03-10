import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    SafeAreaView, StatusBar, Image, TextInput, 
    Dimensions, StyleSheet, Platform, ActivityIndicator,
    Keyboard, useWindowDimensions, KeyboardAvoidingView
} from 'react-native';
import { 
    ChevronLeft, Search, Mic, MapPin, SlidersHorizontal, 
    Clock, Star, Heart, Percent, Zap, ChevronDown,
    ArrowRight, Filter, ShoppingBag, Info
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    FadeInDown, FadeInUp, FadeIn, 
    useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat 
} from 'react-native-reanimated';
import api from '../services/api';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';


const FILTERS = [
    { id: 'sort', name: 'Sort', icon: <ChevronDown size={14} color="#000" /> },
    { id: 'fast', name: 'Nearest' },
    { id: 'rating', name: 'Rating 4.0+' },
    { id: 'veg', name: 'Pure Veg' },
    { id: 'offers', name: 'Offers' }
];

const CUISINES = [
    { id: 1, name: 'Pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop' },
    { id: 2, name: 'Burger', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop' },
    { id: 3, name: 'Healthy', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=300&auto=format&fit=crop' },
    { id: 4, name: 'Biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=300&auto=format&fit=crop' },
    { id: 5, name: 'Cakes', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=300&auto=format&fit=crop' },
    { id: 6, name: 'North Indian', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=300&auto=format&fit=crop' },
    { id: 7, name: 'Chinese', img: 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=300&auto=format&fit=crop' },
    { id: 8, name: 'Rolls', img: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?q=80&w=300&auto=format&fit=crop' }
];

const BANNERS = [
    { id: 1, title: 'Cravings satisfied!', sub: 'Up to 50% OFF + Free Delivery', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop', color: '#E23744' },
    { id: 2, title: 'The Healthy Way', sub: 'Salads, Juices and more...', img: 'https://images.unsplash.com/photo-1543352658-9270447fc339?q=80&w=800&auto=format&fit=crop', color: '#10B981' }
];

export default function FoodDeliveryScreen({ navigation, route }) {
    const { width, height } = useWindowDimensions();
    const [search, setSearch] = useState('');
    const [places, setPlaces] = useState([]);
    const [filteredPlaces, setFilteredPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userAddress, setUserAddress] = useState('Fetching location...');
    const [activeFilter, setActiveFilter] = useState(null);

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
                    if (data.features?.length > 0) {
                        const props = data.features[0].properties;
                        setUserAddress(props.name || props.street || props.city || 'Current Location');
                    }
                } catch (e) { setUserAddress('New Delhi, India'); }
            } else {
                setUserAddress('Cyber City, Gurugram');
            }
        };
        fetchAddress();
    }, [route?.params?.userLocation]);

    useEffect(() => {
        let mounted = true;
        const fetchPlaces = async () => {
            if (mounted) setLoading(true);
            try {
                const res = await api.get('/vendors?type=FOOD');
                if (mounted) {
                    setPlaces(res.data.vendors);
                    setFilteredPlaces(res.data.vendors);
                }
            } catch (err) {
                const dummy = [
                    { id: '1', name: 'The Burger Club', rating: 4.2, time: '25 min', tags: ['American', 'Burger'], image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400', averagePrice: 400, offers: '50% OFF' },
                    { id: '2', name: 'Biryani Blues', rating: 4.5, time: '35 min', tags: ['Mughlai', 'Biryani'], image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', averagePrice: 600, offers: '₹100 OFF' },
                    { id: '3', name: 'La Pinoz Pizza', rating: 4.1, time: '20 min', tags: ['Italian', 'Pizza'], image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', averagePrice: 350, offers: 'Buy 1 Get 1' }
                ];
                if (mounted) {
                    setPlaces(dummy);
                    setFilteredPlaces(dummy);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchPlaces();
        return () => { mounted = false; };
    }, []);

    const handleSearch = useCallback((text) => {
        setSearch(text);
        if (text === '') {
            setFilteredPlaces(places);
        } else {
            const low = text.toLowerCase();
            const filtered = places.filter(p => 
                p.name.toLowerCase().includes(low) || 
                p.tags?.some(t => t.toLowerCase().includes(low))
            );
            setFilteredPlaces(filtered);
        }
    }, [places]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Zomato Style Top Sticky Header */}
            <SafeAreaView style={styles.header}>
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.locationContainer} onPress={() => triggerHaptic()}>
                        <View style={styles.locationIconBox}>
                            <MapPin size={22} color="#E23744" fill="#E2374444" />
                        </View>
                        <View style={styles.locationTextContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.locationMain}>Home</Text>
                                <ChevronDown size={14} color="#000" style={{ marginLeft: 4 }} />
                            </View>
                            <Text style={styles.locationSub} numberOfLines={1}>{userAddress}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileBox} onPress={() => navigation.navigate('Profile')}>
                        <Image 
                            source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=JohnDoe' }} 
                            style={styles.profileImg} 
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBarWrapper}>
                    <View style={styles.searchBar}>
                        <Search size={20} color="#E23744" />
                        <TextInput 
                            placeholder="Search for 'Biryani' or 'Pizza'..."
                            style={styles.searchInput}
                            value={search}
                            onChangeText={handleSearch}
                            placeholderTextColor="#94a3b8"
                        />
                        <View style={styles.searchVerticalDivider} />
                        <TouchableOpacity onPress={() => triggerHaptic()}>
                            <Mic size={20} color="#E23744" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Chips Layer */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.filterScroll}
                >
                    {FILTERS.map(filter => (
                        <TouchableOpacity 
                            key={filter.id} 
                            style={[styles.filterChip, activeFilter === filter.id && styles.filterChipActive]}
                            onPress={() => { setActiveFilter(filter.id === activeFilter ? null : filter.id); triggerHaptic(); }}
                        >
                            <Text style={[styles.filterText, activeFilter === filter.id && styles.filterTextActive]}>{filter.name}</Text>
                            {filter.icon && <View style={{ marginLeft: 6 }}>{filter.icon}</View>}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 100 }}
                stickyHeaderIndices={[]}
            >
                {/* Visual Banners (Zomato Style) */}
                <View style={styles.bannerContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width - 40} decelerationRate="fast" contentContainerStyle={styles.bannerScroll}>
                        {BANNERS.map(banner => (
                            <TouchableOpacity key={banner.id} activeOpacity={0.9} style={[styles.bannerCard, { width: width - 40 }]} onPress={() => triggerHaptic('medium')}>
                                <Image source={{ uri: banner.img }} style={styles.bannerImg} />
                                <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.bannerGradient}>
                                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                                    <Text style={styles.bannerSub}>{banner.sub}</Text>
                                </LinearGradient>
                                <View style={styles.bannerIndicator}>
                                    <ArrowRight size={14} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* "What's on your mind?" Grid (Swiggy UI) */}
                <View style={styles.sectionTitleWrapper}>
                    <Text style={styles.sectionTitle}>What's on your mind?</Text>
                </View>
                <View style={styles.cuisineGrid}>
                    {CUISINES.map((cuisine, i) => (
                        <Animated.View key={cuisine.id} entering={FadeInDown.delay(i * 100)} style={styles.cuisineItem}>
                            <TouchableOpacity style={styles.cuisinePressable} onPress={() => triggerHaptic()}>
                                <View style={styles.cuisineCircle}>
                                    <Image source={{ uri: cuisine.img }} style={styles.cuisineImg} />
                                </View>
                                <Text style={styles.cuisineName}>{cuisine.name}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Restaurant Selection (Zomato Elite Style) */}
                <View style={styles.sectionTitleWrapper}>
                    <Text style={styles.sectionTitle}>Featured Restaurants</Text>
                    <Text style={styles.sectionSubTitle}>Curated spots for premium dining</Text>
                </View>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#E23744" />
                    </View>
                ) : (
                    <View style={styles.restaurantContainer}>
                        {filteredPlaces.map((rest, i) => (
                            <Animated.View key={rest.id || i} entering={FadeInDown.delay(i * 100)}>
                                <TouchableOpacity 
                                    style={styles.restCard}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        triggerHaptic('medium');
                                        navigation.navigate('StoreMenu', { vendor: rest });
                                    }}
                                >
                                    <View style={styles.restImgWrapper}>
                                        <Image source={{ uri: rest.image || rest.img }} style={styles.restImg} />
                                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.restImgGradient} />
                                        <TouchableOpacity style={styles.restHeart}>
                                            <Heart size={20} color="#fff" />
                                        </TouchableOpacity>
                                        <View style={styles.restOfferBadge}>
                                            <Percent size={12} color="#fff" style={{ marginRight: 4 }} />
                                            <Text style={styles.restOfferText}>{rest.offers || 'FLAT ₹100 OFF'}</Text>
                                        </View>
                                        <View style={styles.restTimeBadge}>
                                            <Clock size={12} color="#000" style={{ marginRight: 4 }} />
                                            <Text style={styles.restTimeText}>{rest.time || '30 min'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.restInfo}>
                                        <View style={styles.restTopRow}>
                                            <Text style={styles.restName}>{rest.name}</Text>
                                            <View style={styles.restRatingBox}>
                                                <Text style={styles.restRatingText}>{rest.rating || 4.0}</Text>
                                                <Star size={12} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
                                            </View>
                                        </View>
                                        <View style={styles.restMetaRow}>
                                            <Text style={styles.restTags} numberOfLines={1}>{rest.tags?.join(', ') || 'Continental, Mughlai'}</Text>
                                            <Text style={styles.restPrice}>₹{rest.averagePrice || 350} for two</Text>
                                        </View>
                                        <View style={styles.restPromoLine}>
                                            <Zap size={14} color="#8B5CF6" fill="#8B5CF6" />
                                            <Text style={styles.restPromoText}>FREE DELIVERY in 30 mins</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { 
        backgroundColor: '#fff', 
        paddingTop: Platform.OS === 'android' ? 10 : 0,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
    locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    locationIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    locationTextContainer: { marginLeft: 12 },
    locationMain: { fontSize: 18, fontWeight: '900', color: '#000' },
    locationSub: { fontSize: 13, color: '#64748b', fontWeight: '600', flex: 1 },
    profileBox: { width: 45, height: 45, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
    profileImg: { width: '100%', height: '100%' },

    searchBarWrapper: { paddingHorizontal: 20, marginBottom: 15 },
    searchBar: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        height: 52, 
        borderRadius: 16, 
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#1e293b' },
    searchVerticalDivider: { width: 1, height: 24, backgroundColor: '#cbd5e1', marginHorizontal: 12 },

    filterScroll: { paddingHorizontal: 20, paddingBottom: 15 },
    filterChip: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        paddingHorizontal: 14, 
        paddingVertical: 8, 
        borderRadius: 12, 
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    filterChipActive: { borderColor: '#E23744', backgroundColor: '#fff5f5' },
    filterText: { fontSize: 13, fontWeight: '800', color: '#475569' },
    filterTextActive: { color: '#E23744' },

    bannerContainer: { marginTop: 20 },
    bannerScroll: { paddingHorizontal: 20, gap: 15 },
    bannerCard: { height: 180, borderRadius: 24, overflow: 'hidden', position: 'relative' },
    bannerImg: { width: '100%', height: '100%', position: 'absolute' },
    bannerGradient: { flex: 1, padding: 24, justifyContent: 'flex-end' },
    bannerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    bannerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', marginTop: 4 },
    bannerIndicator: { position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },

    sectionTitleWrapper: { paddingHorizontal: 20, marginTop: 32, marginBottom: 15 },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#000', letterSpacing: -0.5 },
    sectionSubTitle: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 2 },

    cuisineGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, justifyContent: 'space-between' },
    cuisineItem: { width: '25%', alignItems: 'center', marginBottom: 20 },
    cuisinePressable: { alignItems: 'center' },
    cuisineCircle: { width: 70, height: 70, borderRadius: 35, overflow: 'hidden', backgroundColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    cuisineImg: { width: '100%', height: '100%' },
    cuisineName: { marginTop: 8, fontSize: 12, fontWeight: '800', color: '#1e293b' },

    restaurantContainer: { paddingHorizontal: 20 },
    restCard: { marginBottom: 30, backgroundColor: '#fff', borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
    restImgWrapper: { width: '100%', height: 220, position: 'relative' },
    restImg: { width: '100%', height: '100%' },
    restImgGradient: { ...StyleSheet.absoluteFillObject },
    restHeart: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    restOfferBadge: { position: 'absolute', bottom: 16, left: 16, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    restOfferText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    restTimeBadge: { position: 'absolute', bottom: 16, right: 16, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    restTimeText: { color: '#000', fontWeight: '900', fontSize: 13 },

    restInfo: { padding: 20 },
    restTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    restName: { fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
    restRatingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    restRatingText: { color: '#fff', fontWeight: '900', fontSize: 14 },
    restMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    restTags: { flex: 1, fontSize: 15, color: '#64748b', fontWeight: '600' },
    restPrice: { fontSize: 14, color: '#475569', fontWeight: '800', marginLeft: 15 },
    restPromoLine: { flexDirection: 'row', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15, gap: 8 },
    restPromoText: { fontSize: 13, color: '#8B5CF6', fontWeight: '900' },

    loaderContainer: { height: 200, justifyContent: 'center', alignItems: 'center' }
});
