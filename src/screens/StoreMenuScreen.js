import React, { useState, useMemo, useRef } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    SafeAreaView, StatusBar, Image, 
    Dimensions, StyleSheet, Platform, TextInput, useWindowDimensions, KeyboardAvoidingView
} from 'react-native';
import { 
    ChevronLeft, Star, Heart, Clock, MoreHorizontal, Info, Minus, Plus, 
    ShoppingBag, Search as SearchIcon, Share2, Filter, Zap, ChevronDown, MapPin, ShieldCheck, FileText
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
    FadeInDown, FadeInUp, 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import useCartStore from '../store/useCartStore';

const HEADER_HEIGHT = 280;

export default function StoreMenuScreen({ route, navigation }) {
    const { width, height } = useWindowDimensions();
    const { vendor = {} } = route.params || {};
    const cart = useCartStore((state) => state.cart);
    const addItem = useCartStore((state) => state.addItem);
    const removeItem = useCartStore((state) => state.removeItem);
    const getSummary = useCartStore((state) => state.getSummary);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isVegOnly, setIsVegOnly] = useState(false);
    
    // Theme Configuration
    const listType = vendor?.type || 'FOOD';
    const isPharmacy = listType === 'PHARMACY';
    const themeColor = isPharmacy ? '#1a3a5f' : '#E23744';
    const accentColor = isPharmacy ? '#f89b2d' : '#E23744';
    const bgColor = isPharmacy ? '#f8fafc' : '#fff';

    // Simplified static header for stability
    const headerStyle = {};
    const stickyTitleStyle = { opacity: 0 };
    const onScroll = () => {};

    const products = useMemo(() => {
        let list = vendor?.products || [];
        if (searchQuery) {
            list = list.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (isVegOnly && !isPharmacy) {
            list = list.filter(p => p.category?.toLowerCase() === 'veg' || p.tags?.includes('Veg'));
        }
        return list;
    }, [vendor?.products, searchQuery, isVegOnly, isPharmacy]);

    const triggerHaptic = (type = 'light') => {
        if (Platform.OS === 'web') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleAdd = (product) => {
        triggerHaptic();
        addItem(product, vendor._id);
    };

    const handleRemove = (product) => {
        triggerHaptic();
        removeItem(product._id);
    };

    const checkoutSummary = useMemo(() => {
        return getSummary(vendor?.products || []);
    }, [cart, vendor?.products, getSummary]);

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <StatusBar barStyle={isPharmacy ? "light-content" : "dark-content"} />
            
            {/* Custom Header Back/Actions */}
            <SafeAreaView style={[styles.navBar, isPharmacy && { backgroundColor: themeColor }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                    <ChevronLeft size={24} color={isPharmacy ? "#fff" : "#000"} />
                </TouchableOpacity>
                <View style={[styles.stickyTitleContainer, stickyTitleStyle]}>
                    <Text style={[styles.stickyTitle, isPharmacy && { color: '#fff' }]}>{vendor.name}</Text>
                    <Text style={[styles.stickySub, isPharmacy && { color: 'rgba(255,255,255,0.7)' }]}>{vendor.deliveryTime || '30 min'}</Text>
                </View>
                <View style={styles.navActions}>
                    <TouchableOpacity style={styles.navBtn}><SearchIcon size={20} color={isPharmacy ? "#fff" : "#000"} /></TouchableOpacity>
                    <TouchableOpacity style={[styles.navBtn, { marginLeft: 10 }]}><Share2 size={20} color={isPharmacy ? "#fff" : "#000"} /></TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView 
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: checkoutSummary.totalItems > 0 ? 120 : 40 }}
            >
                {/* Hero Info Section */}
                <View style={[styles.hero, headerStyle]}>
                    <View style={styles.heroContent}>
                        <View style={styles.titleRow}>
                            <Text style={styles.heroTitle}>{vendor.name}</Text>
                            <View style={[styles.ratingBox, isPharmacy && { backgroundColor: '#10B981' }]}>
                                <Text style={styles.ratingValue}>{vendor.rating || '4.2'}</Text>
                                <Star size={12} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
                            </View>
                        </View>
                        <Text style={styles.heroTags}>{vendor.tags?.join(', ') || 'Continental, Mughlai'}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaBadge}>
                                <Clock size={12} color="#64748b" />
                                <Text style={styles.metaText}>{vendor.deliveryTime || '30 min'}</Text>
                            </View>
                            <View style={[styles.metaBadge, { marginLeft: 12 }]}>
                                <MapPin size={12} color="#64748b" />
                                <Text style={styles.metaText}>1.2 km</Text>
                            </View>
                            {isPharmacy && (
                                <View style={[styles.metaBadge, { marginLeft: 12, backgroundColor: '#f0fdf4' }]}>
                                    <ShieldCheck size={12} color="#10B981" />
                                    <Text style={[styles.metaText, { color: '#10B981' }]}>Verified</Text>
                                </View>
                            )}
                        </View>
                        
                        <View style={styles.offerLine}>
                            <Zap size={14} color={accentColor} fill={accentColor} />
                            <Text style={[styles.offerText, { color: accentColor }]}>FLAT 15% OFF + Free Delivery above ₹299</Text>
                        </View>
                    </View>
                </View>

                {/* Filter & Search Mini Bar */}
                <View style={styles.menuControls}>
                    {!isPharmacy && (
                        <View style={styles.vegFilter}>
                            <Text style={styles.vegText}>Veg Only</Text>
                            <TouchableOpacity 
                                style={[styles.toggleBackground, isVegOnly && styles.toggleActive]}
                                onPress={() => setIsVegOnly(!isVegOnly)}
                            >
                                <View style={[styles.toggleCircle, isVegOnly && styles.toggleCircleActive]} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={[styles.menuSearchBar, isPharmacy && { backgroundColor: '#fff', elevation: 2 }]}>
                        <SearchIcon size={16} color="#94a3b8" />
                        <TextInput 
                            placeholder={isPharmacy ? "Search medicines & healthcare..." : "Search in menu..."}
                            placeholderTextColor="#94a3b8"
                            style={styles.menuSearchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Menu Item Category Header */}
                <View style={styles.categoryDivider}>
                    <Text style={styles.categoryTitle}>{isPharmacy ? 'Our Products' : 'Recommended Dishes'}</Text>
                    <Text style={styles.categoryCount}>{products.length} ITEMS</Text>
                </View>

                {/* Menu Items List */}
                <View style={styles.menuList}>
                    {products.map((item, i) => {
                        const qty = cart[item._id] || 0;
                        return (
                            <View key={item._id}>
                                <View style={[styles.itemCard, isPharmacy && styles.pharmacyItemCard]}>
                                    <View style={styles.itemInfo}>
                                        {!isPharmacy ? (
                                            <View style={styles.vegBadge}>
                                                <View style={[styles.vegInner, { borderColor: item.category === 'Non-Veg' ? '#E23744' : '#10B981' }]}>
                                                    <View style={[styles.vegDot, { backgroundColor: item.category === 'Non-Veg' ? '#E23744' : '#10B981' }]} />
                                                </View>
                                                <Text style={styles.bestsellerTag}>{i < 2 ? 'BESTSELLER' : ''}</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.rxBadge}>
                                                <FileText size={10} color="#f89b2d" />
                                                <Text style={styles.rxText}>PRESCRIPTION REQUIRED</Text>
                                            </View>
                                        )}
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <View style={styles.priceRow}>
                                            <Text style={styles.itemPrice}>₹{item.price}</Text>
                                            {isPharmacy && <Text style={styles.itemOldPrice}>₹{(item.price * 1.2).toFixed(0)}</Text>}
                                        </View>
                                        <Text style={styles.itemDesc} numberOfLines={3}>
                                            {item.description || (isPharmacy ? 'Safe and effective medicine, use as directed by a healthcare professional.' : 'Made with fresh ingredients, served with special dips and salad side.')}
                                        </Text>
                                    </View>
                                    
                                    <View style={styles.itemImageWrapper}>
                                        <Image 
                                            source={{ uri: item.image?.startsWith('http') ? item.image : (isPharmacy ? 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300' : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300') }} 
                                            style={styles.itemImg} 
                                        />
                                        <View style={styles.addControl}>
                                            {qty > 0 ? (
                                                <View style={[styles.stepper, { borderColor: accentColor + '30', shadowColor: accentColor }]}>
                                                    <TouchableOpacity style={styles.stepBtn} onPress={() => handleRemove(item)}>
                                                        <Minus size={14} color={accentColor} strokeWidth={3} />
                                                    </TouchableOpacity>
                                                    <Text style={[styles.qtyText, { color: accentColor }]}>{qty}</Text>
                                                    <TouchableOpacity style={styles.stepBtn} onPress={() => handleAdd(item)}>
                                                        <Plus size={14} color={accentColor} strokeWidth={3} />
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity style={[styles.addBtn, { borderColor: accentColor + '30', shadowColor: accentColor }]} onPress={() => handleAdd(item)}>
                                                    <Text style={[styles.addBtnText, { color: accentColor }]}>ADD</Text>
                                                    <Plus size={12} color={accentColor} style={styles.plusIcon} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Floating Cart (Zomato/Apollo Style) */}
            {checkoutSummary.totalItems > 0 && (
                <View style={styles.floatingCart}>
                    <TouchableOpacity 
                        style={[styles.cartContent, { backgroundColor: themeColor, shadowColor: themeColor }]}
                        onPress={() => navigation.navigate('CartCheckout', { 
                            vendor, 
                            items: checkoutSummary.itemsList, 
                            total: checkoutSummary.totalPrice,
                            userLocation: route.params?.userLocation 
                        })}
                    >
                        <View style={styles.cartLeft}>
                            <View style={styles.cartInfo}>
                                <Text style={styles.cartQty}>{checkoutSummary.totalItems} ITEM{checkoutSummary.totalItems > 1 ? 'S' : ''}</Text>
                                <Text style={styles.cartPrice}>₹{checkoutSummary.totalPrice}</Text>
                            </View>
                            <Text style={styles.cartExtra}>plus taxes</Text>
                        </View>
                        <View style={styles.cartRight}>
                            <Text style={styles.viewCartText}>View Cart</Text>
                            <ShoppingBag size={18} color="#fff" style={{ marginLeft: 8 }} />
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    navBar: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20,
        height: 100,
        zIndex: 1000
    },
    navBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    navActions: { flexDirection: 'row' },
    stickyTitleContainer: { flex: 1, alignItems: 'center' },
    stickyTitle: { fontSize: 16, fontWeight: '900', color: '#000' },
    stickySub: { fontSize: 11, color: '#64748b', fontWeight: '700' },

    hero: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
    heroContent: { 
        backgroundColor: '#fff', 
        borderRadius: 24, 
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroTitle: { fontSize: 26, fontWeight: '900', color: '#000', letterSpacing: -1 },
    ratingBadge: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingValue: { fontSize: 14, fontWeight: '900', color: '#fff' },
    heroTags: { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
    metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
    metaText: { fontSize: 12, color: '#475569', fontWeight: '800' },
    offerLine: { flexDirection: 'row', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15, gap: 8 },
    offerText: { fontSize: 12, fontWeight: '900' },

    menuControls: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25, gap: 12 },
    vegFilter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    vegText: { fontSize: 12, fontWeight: '900', color: '#475569', marginRight: 10 },
    toggleBackground: { width: 34, height: 20, borderRadius: 10, backgroundColor: '#e2e8f0', padding: 2 },
    toggleActive: { backgroundColor: '#10B981' },
    toggleCircle: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff' },
    toggleCircleActive: { transform: [{ translateX: 14 }] },
    menuSearchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 12, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    menuSearchInput: { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#000' },

    categoryDivider: { paddingHorizontal: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    categoryTitle: { fontSize: 18, fontWeight: '900', color: '#000' },
    categoryCount: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },

    menuList: { paddingHorizontal: 20 },
    itemCard: { flexDirection: 'row', marginBottom: 40, gap: 20 },
    pharmacyItemCard: { backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 4 },
    itemInfo: { flex: 1 },
    vegBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    vegInner: { width: 14, height: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', borderRadius: 2 },
    vegDot: { width: 6, height: 6, borderRadius: 3 },
    rxBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    rxText: { fontSize: 10, fontWeight: '900', color: '#f89b2d', letterSpacing: 0.5 },
    bestsellerTag: { fontSize: 10, fontWeight: '900', color: '#f59e0b', letterSpacing: 0.5 },
    itemName: { fontSize: 17, fontWeight: '900', color: '#1e293b' },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    itemPrice: { fontSize: 15, fontWeight: '800', color: '#000' },
    itemOldPrice: { fontSize: 12, color: '#94a3b8', textDecorationLine: 'line-through' },
    itemDesc: { fontSize: 13, color: '#64748b', marginTop: 8, lineHeight: 20, fontWeight: '500' },

    itemImageWrapper: { width: 120, height: 120, position: 'relative' },
    itemImg: { width: 120, height: 120, borderRadius: 20, backgroundColor: '#f8fafc' },
    addControl: { position: 'absolute', bottom: -12, alignSelf: 'center' },
    addBtn: { 
        backgroundColor: '#fff', 
        width: 90, 
        height: 36, 
        borderRadius: 10, 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderWidth: 1, 
        elevation: 4,
        flexDirection: 'row'
    },
    addBtnText: { fontWeight: '900', fontSize: 14, marginRight: 4 },
    plusIcon: { position: 'absolute', top: 4, right: 6 },
    stepper: { 
        backgroundColor: '#fff', 
        width: 100, 
        height: 36, 
        borderRadius: 10, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        borderWidth: 1,
        elevation: 4
    },
    stepBtn: { padding: 4 },
    qtyText: { fontSize: 15, fontWeight: '900' },

    floatingCart: { position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 2000 },
    cartContent: { 
        borderRadius: 16, 
        padding: 16, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        elevation: 10
    },
    cartLeft: { flex: 1 },
    cartInfo: { flexDirection: 'row', alignItems: 'center' },
    cartQty: { color: '#fff', fontWeight: '800', fontSize: 13, opacity: 0.9 },
    cartPrice: { color: '#fff', fontWeight: '900', fontSize: 18, marginLeft: 8 },
    cartExtra: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' },
    cartRight: { flexDirection: 'row', alignItems: 'center' },
    viewCartText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
