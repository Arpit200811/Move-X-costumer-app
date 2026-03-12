import React, { useState, useEffect, useMemo } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    SafeAreaView, StatusBar, Image, TextInput,
    Dimensions, StyleSheet, Platform, FlatList
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Search, MapPin, ShoppingCart, ShoppingBag, Zap, Clock, Star, ChevronRight as ChevronRightIcon, Filter, Minus, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import useCartStore from '../store/useCartStore';
import * as Haptics from 'expo-haptics';
import ServiceStatusBanner from '../components/ServiceStatusBanner';

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

const BANNERS = [
    { id: 1, title: 'Freshness\nDelivered', sub: 'Get 30% OFF on Fruits', color: ['#10B981', '#059669'], img: 'https://cdn-icons-png.flaticon.com/512/3724/3724720.png' },
    { id: 2, title: 'Morning\nEssentials', sub: 'Milk & Bread in 15 mins', color: ['#2563EB', '#1e40af'], img: 'https://cdn-icons-png.flaticon.com/512/3050/3050186.png' },
    { id: 3, title: 'Midnight\nSnacking', sub: 'Flat ₹100 Off on Munchies', color: ['#7C3AED', '#5B21B6'], img: 'https://cdn-icons-png.flaticon.com/512/3050/3050186.png' }
];

const COUPONS = [
    { id: 'c1', code: 'MOVE30', desc: '30% OFF', bg: '#fef2f2', border: '#fca5a5', text: '#ef4444' },
    { id: 'c2', code: 'FREESHIP', desc: 'FREE Delivery', bg: '#eff6ff', border: '#93c5fd', text: '#3b82f6' },
];

export default function GroceryScreen({ route, navigation }) {
    const [stores, setStores] = useState([]);
    const [userAddress, setUserAddress] = useState('Locating...');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dynamicProducts, setDynamicProducts] = useState([]);
    const [filteredStores, setFilteredStores] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [locationLabel, setLocationLabel] = useState('DELIVER TO');
    const [serviceStatus, setServiceStatus] = useState('checking'); // 'checking' | 'serviceable' | 'unserviceable'

    const cart = useCartStore((state) => state.cart);
    const addItem = useCartStore((state) => state.addItem);
    const removeItem = useCartStore((state) => state.removeItem);
    const clearCart = useCartStore((state) => state.clearCart);

    const triggerHaptic = (type = 'light') => {
        if (Platform.OS === 'web') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleAdd = (item, vendorId) => {
        triggerHaptic();
        addItem(item, vendorId);
    };

    const cartSummary = useMemo(() => {
        // Merge static and dynamic products for summary calculation
        const allPossibleProducts = [
            ...dynamicProducts,
            ...BESTSELLERS,
            ...FLASH_DEALS
        ];
        
        let totalItems = 0;
        let totalPrice = 0;
        
        const itemsList = [];
        Object.keys(cart).forEach(id => {
            const product = allPossibleProducts.find(p => (p._id === id || p.id === id));
            if (product) {
                const qty = cart[id];
                const price = parseFloat(product.price?.toString().replace('₹', '')) || 0;
                totalItems += qty;
                totalPrice += (price * qty);
                itemsList.push({ ...product, quantity: qty });
            }
        });

        return { totalItems, totalPrice: totalPrice.toFixed(2), itemsList };
    }, [cart, dynamicProducts, filteredProducts]);

    const navigateToCheckout = () => {
        if (cartSummary.totalItems === 0) return;
        
        // Find the active vendor for the cart
        const currentVendorId = useCartStore.getState().vendorId;
        let activeVendor = stores.find(s => (s._id === currentVendorId || s.id === currentVendorId));
        
        if (!activeVendor) {
            // Try to use first store's location as fallback
            const fallbackLoc = stores[0]?.location || { lat: 28.4595, lng: 77.0266 };
            activeVendor = { 
                _id: currentVendorId || 'GROCERY_VENDOR', 
                name: 'Grocery Express', 
                type: 'GROCERY',
                location: fallbackLoc
            };
        }

        navigation.navigate('CartCheckout', { 
            vendor: activeVendor, 
            items: cartSummary.itemsList, 
            total: parseFloat(cartSummary.totalPrice),
            userLocation: route.params?.userLocation
        });
    };

    useEffect(() => {
        let mounted = true;
        
        const fetchData = async () => {
            if (mounted) setLoading(true);
            try {
                // Fetch location dynamically
                let longitude, latitude;

                if (route?.params?.userLocation) {
                    latitude = route.params.userLocation.latitude;
                    longitude = route.params.userLocation.longitude;
                } else {
                    let { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        latitude = loc.coords.latitude;
                        longitude = loc.coords.longitude;
                    }
                }

                if (latitude && longitude && mounted) {
                    const geoRes = await fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
                    const geoData = await geoRes.json();
                    if (mounted && geoData.features?.length > 0) {
                        const props = geoData.features[0].properties;
                        const address = props.name || props.street || props.city || 'Current Location';
                        setUserAddress(address);
                        const label = route?.params?.userLocation ? 'CURRENT LOCATION' : 'DELIVER TO';
                        setLocationLabel(label);
                        
                        // Optionally store last known location
                        await AsyncStorage.setItem('last_known_grocery_loc', JSON.stringify({ latitude, longitude, address, label }));
                    }
                } else {
                    // Fallback to stored location if GPS fails
                    const storedLoc = await AsyncStorage.getItem('last_known_grocery_loc');
                    if (storedLoc && mounted) {
                        const parsed = JSON.parse(storedLoc);
                        setUserAddress(parsed.address);
                        setLocationLabel(parsed.label || 'SAVED ADDRESS');
                    } else if (mounted) {
                        setUserAddress('Select Location');
                        setLocationLabel('DELIVER TO');
                    }
                }

                // Check Serviceability
                if (latitude && longitude && mounted) {
                    try {
                        const checkUrl = `/serviceable-check?lat=${latitude}&lng=${longitude}`;
                        console.log(`📡 [GROCERY] Checking serviceability at: ${api.defaults.baseURL}${checkUrl}`);
                        const serviceRes = await api.get(checkUrl);
                        if (mounted) {
                            setServiceStatus(serviceRes.data.isServiceable ? 'serviceable' : 'unserviceable');
                        }
                    } catch (serviceErr) {
                        console.error('Service check error:', serviceErr?.response?.status, serviceErr?.message);
                        if (mounted) setServiceStatus('serviceable'); 
                    }
                }

                // Fetch Grocery Stores (Supermarkets)
                const storeRes = await api.get('/vendors?type=GROCERY');
                const vendors = storeRes.data.vendors || [];
                if (mounted) {
                    setStores(vendors);
                    setFilteredStores(vendors);
                }

                // Extract products for dynamic sections
                const allProducts = vendors.flatMap(v => (v.products || []).map(p => ({ ...p, vendorName: v.name })));
                if (mounted && allProducts.length > 0) {
                    const sliced = allProducts.slice(0, 8);
                    setDynamicProducts(sliced);
                    setFilteredProducts(sliced);
                }
            } catch (e) {
                console.error('Grocery fetch error:', e);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [route?.params?.userLocation]);

    useEffect(() => {
        if (!search.trim()) {
            setFilteredStores(stores);
            setFilteredProducts(dynamicProducts);
            return;
        }

        const lowSearch = search.toLowerCase();
        setFilteredStores(stores.filter(s => s.name.toLowerCase().includes(lowSearch)));
        setFilteredProducts(dynamicProducts.filter(p => p.name.toLowerCase().includes(lowSearch)));
    }, [search, stores, dynamicProducts]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            
            {/* Premium Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.deliveryInfo}
                        onPress={() => navigation.navigate('Search')}
                    >
                        <Text style={styles.deliveryLabel}>{locationLabel}</Text>
                        <View style={styles.locationRow}>
                            <MapPin size={14} color="#2563EB" />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {userAddress}
                            </Text>
                            <ChevronRightIcon size={14} color="#64748b" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cartBtn} onPress={navigateToCheckout}>
                        <ShoppingCart size={22} color="#000" />
                        {cartSummary.totalItems > 0 && (
                            <View style={styles.badgeLarge}>
                                <Text style={styles.badgeText}>{cartSummary.totalItems}</Text>
                            </View>
                        )}
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

            <ServiceStatusBanner status={serviceStatus} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Promo Banners Carousel */}
                <ScrollView 
                    horizontal 
                    pagingEnabled 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.bannerContainer}
                    contentContainerStyle={{ gap: 0 }}
                >
                    {BANNERS.map(banner => (
                        <View key={banner.id} style={[styles.promoCard, { width: width - 40, marginRight: 15 }]}>
                            <LinearGradient 
                                colors={banner.color} 
                                start={{ x: 0, y: 0 }} 
                                end={{ x: 1, y: 1 }}
                                style={styles.promoGradient}
                            >
                                <View style={styles.promoLeft}>
                                    <Text style={styles.promoTag}>OFFER ZONE</Text>
                                    <Text style={styles.promoTitle}>{banner.title}</Text>
                                    <Text style={styles.promoDesc}>{banner.sub}</Text>
                                    <TouchableOpacity style={styles.promoAction}>
                                        <Text style={[styles.promoActionText, { color: banner.color[0] }]}>Shop Now</Text>
                                    </TouchableOpacity>
                                </View>
                                <Image source={{ uri: banner.img }} style={styles.promoImg} />
                            </LinearGradient>
                        </View>
                    ))}
                </ScrollView>

                {/* Coupons Section */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.couponScroll}>
                    {COUPONS.map(cpn => (
                        <View key={cpn.id} style={[styles.couponCard, { backgroundColor: cpn.bg, borderColor: cpn.border }]}>
                            <View style={styles.couponLeft}>
                                <Zap size={10} color={cpn.text} fill={cpn.text} />
                                <Text style={[styles.couponCode, { color: cpn.text }]}>{cpn.code}</Text>
                            </View>
                            <View style={styles.couponDivider} />
                            <Text style={styles.couponDesc}>{cpn.desc}</Text>
                        </View>
                    ))}
                </ScrollView>

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
                    {FLASH_DEALS.map((item, idx) => {
                        const qty = cart[item.id] || 0;
                        return (
                            <View key={item.id}>
                                <TouchableOpacity style={styles.flashItem}>
                                    <Image source={{ uri: item.image }} style={styles.flashImg} />
                                    <View style={styles.flashInfo}>
                                        <Text style={styles.flashName}>{item.name}</Text>
                                        <View style={styles.priceRow}>
                                            <Text style={styles.currentPrice}>{item.price}</Text>
                                            <Text style={styles.oldPrice}>{item.oldPrice}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.addControlFlash}>
                                        {qty > 0 ? (
                                            <View style={styles.miniStepper}>
                                                <TouchableOpacity onPress={() => removeItem(item.id)}><Minus size={12} color="#2563EB" /></TouchableOpacity>
                                                <Text style={styles.miniQty}>{qty}</Text>
                                                <TouchableOpacity onPress={() => handleAdd(item, 'FLASH_VENDOR')}><Plus size={12} color="#2563EB" /></TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity 
                                                style={[styles.addBtn, serviceStatus === 'unserviceable' && styles.disabledBtn]} 
                                                onPress={() => serviceStatus !== 'unserviceable' && handleAdd(item, 'FLASH_VENDOR')}
                                                disabled={serviceStatus === 'unserviceable'}
                                            >
                                                <Plus size={16} color={serviceStatus === 'unserviceable' ? '#94a3b8' : '#2563EB'} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Categories */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Shop by Category</Text>
                    <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                    {CATEGORIES.map((cat, idx) => (
                        <View key={cat.id}>
                            <TouchableOpacity style={styles.categoryItemLg}>
                                <Image source={{ uri: cat.bgImg }} style={styles.catImgBg} />
                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.catGradient}>
                                    <View style={[styles.categoryIconWrap, { backgroundColor: cat.color }]}>
                                        <Image source={{ uri: cat.image }} style={styles.categoryIcon} />
                                    </View>
                                    <Text style={styles.categoryNameLg}>{cat.name}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                {/* Dynamic Bestsellers Section (Vertical Grid) */}
                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                    <Text style={styles.sectionTitle}>Daily Top Items</Text>
                    <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>REAL-TIME</Text>
                    </View>
                </View>
                <View style={styles.bestsellerGrid}>
                    {(filteredProducts.length > 0 ? filteredProducts : BESTSELLERS).map((item, idx) => {
                        const itemId = item._id || item.id;
                        const qty = cart[itemId] || 0;
                        return (
                            <View key={itemId}>
                                <TouchableOpacity style={styles.bestCard}>
                                    <Image source={{ uri: item.image || item.img || 'https://cdn-icons-png.flaticon.com/512/869/869469.png' }} style={styles.bestImg} />
                                    <View style={styles.bestInfo}>
                                        <Text style={styles.bestName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.bestVol}>{item.vol || item.category || '500g'}</Text>
                                        <View style={styles.bestBottom}>
                                            <Text style={styles.bestPrice}>₹{item.price}</Text>
                                            
                                            <View style={styles.bestAddControl}>
                                                {qty > 0 ? (
                                                    <View style={styles.stepperSmall}>
                                                        <TouchableOpacity onPress={() => removeItem(itemId)}><Minus size={12} color="#2563EB" /></TouchableOpacity>
                                                        <Text style={styles.qtySmall}>{qty}</Text>
                                                        <TouchableOpacity onPress={() => handleAdd(item, item.vendorId || 'DYNAMIC_VENDOR')}><Plus size={12} color="#2563EB" /></TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity 
                                                        style={[styles.miniAddBtn, serviceStatus === 'unserviceable' && styles.disabledBtn]} 
                                                        onPress={() => serviceStatus !== 'unserviceable' && handleAdd(item, item.vendorId || 'DYNAMIC_VENDOR')}
                                                        disabled={serviceStatus === 'unserviceable'}
                                                    >
                                                        <Plus size={14} color={serviceStatus === 'unserviceable' ? '#94a3b8' : '#2563EB'} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                {/* Household & More */}
                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.sectionTitle}>More Than Groceries</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.essentialScroll}>
                    {ESSENTIALS.map((ess, idx) => (
                        <View key={ess.id}>
                            <TouchableOpacity style={styles.essCard}>
                                <Image source={{ uri: ess.img }} style={styles.essImgBg} />
                                <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={styles.essGradient}>
                                    <View style={[styles.essIconBox, { backgroundColor: ess.color }]}>
                                        <Text style={styles.essEmoji}>{ess.icon}</Text>
                                    </View>
                                    <Text style={styles.essName}>{ess.name}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
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
                    filteredStores.map((store, idx) => (
                        <View key={store._id || idx}>
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
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Floating Blinkit Style Cart Bar */}
            {cartSummary.totalItems > 0 && (
                <View style={styles.floatingCartBar}>
                    <TouchableOpacity 
                        style={styles.cartActionBtn}
                        onPress={navigateToCheckout}
                    >
                        <View style={styles.cartBarLeft}>
                            <View style={styles.cartBarIcon}>
                                <ShoppingBag size={20} color="#fff" />
                                <View style={styles.cartBarBadge}>
                                    <Text style={styles.cartBarBadgeText}>{cartSummary.totalItems}</Text>
                                </View>
                            </View>
                            <View style={styles.cartBarText}>
                                <Text style={styles.cartBarPrice}>₹{cartSummary.totalPrice}</Text>
                                <Text style={styles.cartBarSub}>View Cart</Text>
                            </View>
                        </View>
                        <View style={styles.cartBarRight}>
                            <Text style={styles.checkoutText}>CHECKOUT</Text>
                            <ChevronRightIcon size={18} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

function SkeletonStoreCard() {
    return (
        <View style={[styles.storeCard, { opacity: 0.5, padding: 0 }]}>
            <View style={[styles.storeImg, { backgroundColor: '#e2e8f0' }]} />
            <View style={styles.storeDetails}>
                <View style={{ width: '60%', height: 24, backgroundColor: '#cbd5e1', borderRadius: 6, marginBottom: 8 }} />
                <View style={{ width: '40%', height: 16, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 10, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    deliveryInfo: { flex: 1, marginHorizontal: 15 },
    deliveryLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    locationText: { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 4 },
    cartBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    cartBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#fff' },
    badgeLarge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
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
    addBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
    bannerContainer: { marginBottom: 10 },
    couponScroll: { paddingHorizontal: 0, gap: 10, marginBottom: 20 },
    couponCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 8 },
    couponLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    couponCode: { fontSize: 12, fontWeight: '900' },
    couponDivider: { width: 1, height: 15, backgroundColor: '#94a3b8', opacity: 0.3 },
    couponDesc: { fontSize: 11, fontWeight: '700', color: '#1e293b' },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    liveText: { fontSize: 9, fontWeight: '900', color: '#10B981' },
    addControlFlash: { position: 'absolute', top: 12, right: 12 },
    miniStepper: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#dbeafe' },
    miniQty: { fontSize: 13, fontWeight: '900', color: '#2563EB' },
    bestAddControl: { marginLeft: 'auto' },
    stepperSmall: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#dbeafe' },
    qtySmall: { fontSize: 12, fontWeight: '900', color: '#2563EB' },
    floatingCartBar: { position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 1000 },
    cartActionBtn: { backgroundColor: '#2563EB', height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, elevation: 10, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 10 },
    cartBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cartBarIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    cartBarBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2563EB' },
    cartBarBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    cartBarText: { gap: 0 },
    cartBarPrice: { color: '#fff', fontSize: 18, fontWeight: '900' },
    cartBarSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' },
    cartBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkoutText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    disabledBtn: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', shadowOpacity: 0 },
});
