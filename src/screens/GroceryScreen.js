import React, { useState, useEffect } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    SafeAreaView, StatusBar, Image, TextInput,
    Dimensions, StyleSheet, Platform, FlatList
} from 'react-native';
import { 
    ChevronLeft, Search, MapPin, ShoppingCart, 
    Zap, Clock, Star, ChevronRight, Filter, Minus, Plus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, FadeInUp, SlideInRight, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: '1', name: 'Vegetables', image: 'https://cdn-icons-png.flaticon.com/512/2153/2153788.png', color: '#f0fdf4', bgImg: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600&auto=format&fit=crop' },
    { id: '2', name: 'Fruits', image: 'https://cdn-icons-png.flaticon.com/512/3194/3194766.png', color: '#fff7ed', bgImg: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=600&auto=format&fit=crop' },
    { id: '3', name: 'Dairy', image: 'https://cdn-icons-png.flaticon.com/512/305/305167.png', color: '#eff6ff', bgImg: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=600&auto=format&fit=crop' },
    { id: '4', name: 'Bakery', image: 'https://cdn-icons-png.flaticon.com/512/3014/3014535.png', color: '#fef2f2', bgImg: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop' },
    { id: '5', name: 'Meat', image: 'https://cdn-icons-png.flaticon.com/512/1046/1046769.png', color: '#fff1f2', bgImg: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=600&auto=format&fit=crop' },
];

const RECOMMENDED = [
    { id: '1', name: 'BigBasket Super', rating: 4.8, time: '20-30', discount: '20% OFF', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80' },
    { id: '2', name: 'Reliance Fresh', rating: 4.5, time: '15-25', discount: 'Free Delivery', image: 'https://images.unsplash.com/photo-1543168256-418811576931?w=800&q=80' },
    { id: '3', name: 'Blinkit Express', rating: 4.9, time: '10-15', discount: '50% OFF', image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80' },
];

const FLASH_DEALS = [
    { id: 'f1', name: 'Fresh Avocado', price: '₹140', oldPrice: '₹220', image: 'https://cdn-icons-png.flaticon.com/512/2153/2153788.png' },
    { id: 'f2', name: 'Greek Yogurt', price: '₹60', oldPrice: '₹95', image: 'https://cdn-icons-png.flaticon.com/512/305/305167.png' },
    { id: 'f3', name: 'Sourdough', price: '₹85', oldPrice: '₹120', image: 'https://cdn-icons-png.flaticon.com/512/3014/3014535.png' },
];

const ESSENTIALS = [
    { id: 'e1', name: 'Cleaning & Household', color: '#e0f2fe', icon: '🧹', img: 'https://images.unsplash.com/photo-1584824486509-112e4181f1b6?q=80&w=400&auto=format&fit=crop' },
    { id: 'e2', name: 'Personal Care', color: '#fce7f3', icon: '🧴', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400&auto=format&fit=crop' },
    { id: 'e3', name: 'Pet Care', color: '#ffedd5', icon: '🐾', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&auto=format&fit=crop' },
];

const BESTSELLERS = [
    { id: 'b1', name: 'Amul Taaza Milk', price: '₹64', vol: '1 L', image: 'https://cdn-icons-png.flaticon.com/512/869/869469.png' },
    { id: 'b2', name: 'Whole Wheat Atta', price: '₹220', vol: '5 kg', image: 'https://cdn-icons-png.flaticon.com/512/5753/5753982.png' },
    { id: 'b3', name: 'Fresh Eggs', price: '₹45', vol: '6 pcs', image: 'https://cdn-icons-png.flaticon.com/512/837/837560.png' },
    { id: 'b4', name: 'Potato Local', price: '₹30', vol: '1 kg', image: 'https://cdn-icons-png.flaticon.com/512/1135/1135502.png' },
];

export default function GroceryScreen({ route, navigation }) {
    const [stores, setStores] = useState([]);
    const [userAddress, setUserAddress] = useState('Cyber City, Gurugram');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        
        const fetchData = async () => {
            if (mounted) setLoading(true);
            try {
                // Fetch location if available
                if (route?.params?.userLocation) {
                    const { latitude, longitude } = route.params.userLocation;
                    const geoRes = await fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
                    const geoData = await geoRes.json();
                    if (mounted && geoData.features?.length > 0) {
                        const props = geoData.features[0].properties;
                        setUserAddress(props.name || props.street || props.city || 'Current Location');
                    }
                }

                // Fetch Grocery Stores (Supermarkets)
                const storeRes = await api.get('/vendors?type=GROCERY');
                if (mounted) setStores(storeRes.data.vendors || []);
            } catch (e) {
                console.error('Grocery fetch error:', e);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [route?.params?.userLocation]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            
            {/* Premium Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.deliveryInfo}>
                        <Text style={styles.deliveryLabel}>{route.params?.userLocation ? 'CURRENT LOCATION' : 'DELIVER TO'}</Text>
                        <View style={styles.locationRow}>
                            <MapPin size={14} color="#2563EB" />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {userAddress}
                            </Text>
                            <ChevronRight size={14} color="#64748b" />
                        </View>
                    </View>
                    <TouchableOpacity style={styles.cartBtn}>
                        <ShoppingCart size={22} color="#000" />
                        <View style={styles.cartBadge} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={20} color="#94a3b8" />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search fresh grocery, milk, snacks..."
                            value={search}
                            onChangeText={setSearch}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Filter size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Promo Banner */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.promoCard}>
                    <LinearGradient 
                        colors={['#2563EB', '#1e40af']} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 1 }}
                        style={styles.promoGradient}
                    >
                        <View style={styles.promoLeft}>
                            <Text style={styles.promoTag}>LIMITED OFFER</Text>
                            <Text style={styles.promoTitle}>Fresh Morning Delivery</Text>
                            <Text style={styles.promoDesc}>Get 30% OFF on your first grocery delivery!</Text>
                            <TouchableOpacity style={styles.promoAction}>
                                <Text style={styles.promoActionText}>Claim Now</Text>
                            </TouchableOpacity>
                        </View>
                        <Image 
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3724/3724720.png' }} 
                            style={styles.promoImg}
                        />
                    </LinearGradient>
                </Animated.View>

                {/* Flash Sale Section */}
                <View style={styles.flashHeader}>
                    <View>
                        <Text style={styles.flashTitle}>Flash Sale</Text>
                        <View style={styles.countdownRow}>
                            <Clock size={12} color="#EF4444" />
                            <Text style={styles.countdownText}>Ends in 08m 42s</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.seeAllBtn}>
                        <Text style={styles.seeAllText}>VIEW ALL</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flashList}>
                    {FLASH_DEALS.map((item, idx) => (
                        <Animated.View key={item.id} entering={SlideInRight.delay(200 + idx * 100)}>
                            <TouchableOpacity style={styles.flashItem}>
                                <Image source={{ uri: item.image }} style={styles.flashImg} />
                                <View style={styles.flashInfo}>
                                    <Text style={styles.flashName}>{item.name}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.currentPrice}>{item.price}</Text>
                                        <Text style={styles.oldPrice}>{item.oldPrice}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.addBtn}>
                                    <Plus size={16} color="#2563EB" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </ScrollView>

                {/* Categories */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Shop by Category</Text>
                    <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                    {CATEGORIES.map((cat, idx) => (
                        <Animated.View key={cat.id} entering={FadeInRight.delay(200 + idx * 100)}>
                            <TouchableOpacity style={styles.categoryItemLg}>
                                <Image source={{ uri: cat.bgImg }} style={styles.catImgBg} />
                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.catGradient}>
                                    <View style={[styles.categoryIconWrap, { backgroundColor: cat.color }]}>
                                        <Image source={{ uri: cat.image }} style={styles.categoryIcon} />
                                    </View>
                                    <Text style={styles.categoryNameLg}>{cat.name}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </ScrollView>

                {/* Bestsellers Section (Vertical Grid) */}
                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                    <Text style={styles.sectionTitle}>Daily Bestsellers</Text>
                </View>
                <View style={styles.bestsellerGrid}>
                    {BESTSELLERS.map((item, idx) => (
                        <Animated.View key={item.id} entering={FadeInUp.delay(100 * idx)}>
                            <TouchableOpacity style={styles.bestCard}>
                                <Image source={{ uri: item.image }} style={styles.bestImg} />
                                <View style={styles.bestInfo}>
                                    <Text style={styles.bestName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.bestVol}>{item.vol}</Text>
                                    <View style={styles.bestBottom}>
                                        <Text style={styles.bestPrice}>{item.price}</Text>
                                        <TouchableOpacity style={styles.miniAddBtn}>
                                            <Plus size={14} color="#2563EB" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Household & More */}
                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.sectionTitle}>More Than Groceries</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.essentialScroll}>
                    {ESSENTIALS.map((ess, idx) => (
                        <Animated.View key={ess.id} entering={FadeInRight.delay(idx * 150)}>
                            <TouchableOpacity style={styles.essCard}>
                                <Image source={{ uri: ess.img }} style={styles.essImgBg} />
                                <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={styles.essGradient}>
                                    <View style={[styles.essIconBox, { backgroundColor: ess.color }]}>
                                        <Text style={styles.essEmoji}>{ess.icon}</Text>
                                    </View>
                                    <Text style={styles.essName}>{ess.name}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </ScrollView>

                {/* Hyperlocal Stores */}
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>Stores Around You</Text>
                    <View style={styles.fastTag}>
                        <Zap size={10} color="#fff" fill="#fff" />
                        <Text style={styles.fastText}>15 MIN</Text>
                    </View>
                </View>

                {loading ? (
                    <View>
                        {[1, 2].map(i => <SkeletonStoreCard key={i} />)}
                    </View>
                ) : (
                    stores.map((store, idx) => (
                        <Animated.View key={store._id || idx} entering={FadeInDown.delay(400 + idx * 100)}>
                            <TouchableOpacity 
                                style={styles.storeCard}
                                onPress={() => navigation.navigate('StoreMenu', { vendor: store })}
                            >
                                <Image source={{ uri: store.image || store.img || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80' }} style={styles.storeImg} />
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>{store.offers || store.discount || 'Special Offer'}</Text>
                                </View>
                                <View style={styles.storeDetails}>
                                    <View style={styles.storeHeader}>
                                        <Text style={styles.storeName}>{store.name}</Text>
                                        <View style={styles.ratingBadge}>
                                            <Star size={12} color="#fff" fill="#fff" />
                                            <Text style={styles.ratingText}>{store.rating || '4.5'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.storeMeta}>
                                        <Clock size={14} color="#64748b" />
                                        <Text style={styles.metaText}>{store.time || '20-30'} mins • {store.deliveryFee === 0 ? 'Free Delivery' : 'Fast Delivery'}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function SkeletonStoreCard() {
    const opacity = useSharedValue(0.3);
    useEffect(() => {
        opacity.value = withRepeat(withSequence(withTiming(0.6, { duration: 1000 }), withTiming(0.3, { duration: 1000 })), -1, true);
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View style={[styles.storeCard, style, { padding: 0 }]}>
            <View style={[styles.storeImg, { backgroundColor: '#e2e8f0' }]} />
            <View style={styles.storeDetails}>
                <View style={{ width: '60%', height: 24, backgroundColor: '#cbd5e1', borderRadius: 6, marginBottom: 8 }} />
                <View style={{ width: '40%', height: 16, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    deliveryInfo: { flex: 1, marginHorizontal: 15 },
    deliveryLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    locationText: { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 4 },
    cartBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    cartBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#fff' },
    searchContainer: { flexDirection: 'row', marginTop: 20, gap: 12 },
    searchBar: { flex: 1, height: 50, backgroundColor: '#f1f5f9', borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#0f172a' },
    searchInputPlaceholder: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#94a3b8' },
    filterBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    promoCard: { marginBottom: 24, borderRadius: 25, overflow: 'hidden', elevation: 10, shadowColor: '#2563EB', shadowOpacity: 0.2, shadowRadius: 15 },
    promoGradient: { padding: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    promoLeft: { flex: 1 },
    promoTag: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    promoTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 8 },
    promoDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8, lineHeight: 20 },
    promoAction: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 15 },
    promoActionText: { color: '#2563EB', fontWeight: '800', fontSize: 13 },
    promoImg: { width: 100, height: 100, resizeMode: 'contain' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    seeAll: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
    categoriesList: { gap: 16, paddingRight: 20 },
    categoryItemLg: { width: 140, height: 180, borderRadius: 24, overflow: 'hidden', backgroundColor: '#f1f5f9' },
    catImgBg: { width: '100%', height: '100%', position: 'absolute' },
    catGradient: { flex: 1, padding: 16, justifyContent: 'flex-end', alignItems: 'flex-start' },
    categoryIconWrap: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    categoryIcon: { width: 30, height: 30, resizeMode: 'contain' },
    categoryNameLg: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
    bestsellerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    bestCard: { width: (width - 40 - 12) / 2, backgroundColor: '#fff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 4 },
    bestImg: { width: 70, height: 70, alignSelf: 'center', marginBottom: 12, resizeMode: 'contain' },
    bestInfo: { gap: 4 },
    bestName: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
    bestVol: { fontSize: 11, color: '#64748b', fontWeight: '600' },
    bestBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    bestPrice: { fontSize: 15, fontWeight: '900', color: '#2563EB' },
    miniAddBtn: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
    essentialScroll: { gap: 16, paddingRight: 20, paddingBottom: 10 },
    essCard: { width: 140, height: 140, borderRadius: 24, overflow: 'hidden' },
    essImgBg: { width: '100%', height: '100%', position: 'absolute' },
    essGradient: { flex: 1, padding: 16, justifyContent: 'flex-end' },
    essIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    essEmoji: { fontSize: 20 },
    essName: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
    fastTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
    fastText: { color: '#fff', fontWeight: '900', fontSize: 10 },
    storeCard: { backgroundColor: '#fff', borderRadius: 25, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    storeImg: { width: '100%', height: 180, resizeMode: 'cover' },
    discountBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    discountText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    storeDetails: { padding: 20 },
    storeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    storeName: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    ratingText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    storeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
    metaText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
    flashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
    flashTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
    countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    countdownText: { fontSize: 11, fontWeight: '800', color: '#EF4444', letterSpacing: 0.5 },
    seeAllBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    seeAllText: { color: '#2563EB', fontSize: 10, fontWeight: '900' },
    flashList: { gap: 16, paddingRight: 20 },
    flashItem: { width: 160, backgroundColor: '#fff', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    flashImg: { width: 80, height: 80, alignSelf: 'center', marginBottom: 16 },
    flashInfo: { gap: 6 },
    flashName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    currentPrice: { fontSize: 16, fontWeight: '900', color: '#2563EB' },
    oldPrice: { fontSize: 12, color: '#94a3b8', textDecorationLine: 'line-through', fontWeight: '700' },
    addBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }
});
