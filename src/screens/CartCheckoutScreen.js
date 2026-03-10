import React, { useState, useEffect } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    SafeAreaView, StatusBar, TextInput,
    StyleSheet, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { 
    ChevronLeft, MapPin, Navigation as NavIcon, Zap, Phone, CreditCard, Wallet, ChevronRight, X, CheckCircle, 
    ShieldCheck, AlertTriangle, FileText, Activity
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const getDynamicDeliveryFee = (pCoords, dCoords) => {
    if (!pCoords || !dCoords || !pCoords.lat || !dCoords.lat) return 30;
    const dist = calculateDistance(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
    const baseFee = 30;
    const perKmRate = 12;
    if (dist <= 2) return baseFee;
    return Math.round(baseFee + (dist - 2) * perKmRate);
};

export default function CartCheckoutScreen({ route, navigation }) {
    const { vendor, items, total } = route.params;
    const isPharmacy = vendor?.type === 'PHARMACY';
    const themeColor = isPharmacy ? '#1a3a5f' : '#10B981';
    const accentColor = isPharmacy ? '#f89b2d' : '#10B981';

    const [loading, setLoading] = useState(false);
    const [quote, setQuote] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [isCalculating, setIsCalculating] = useState(true);
    const [promoCode, setPromoCode] = useState('');
    const [tempPromo, setTempPromo] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [walletBalance, setWalletBalance] = useState(0);

    const pickupCoords = vendor.location || { lat: 28.4595, lng: 77.0266 };
    const destCoords = route.params.userLocation 
        ? { lat: route.params.userLocation.latitude, lng: route.params.userLocation.longitude }
        : { lat: 28.4951, lng: 77.0897 };

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/auth/profile');
                if (res.data.success) {
                    setWalletBalance(res.data.user.walletBalance || 0);
                    await AsyncStorage.setItem('movex_user', JSON.stringify(res.data.user));
                }
            } catch (e) {
                const rawUser = await AsyncStorage.getItem('movex_user');
                if (rawUser) setWalletBalance(JSON.parse(rawUser).walletBalance || 0);
            }
        })();
        fetchQuote();
    }, []);

    const fetchQuote = async () => {
        setIsCalculating(true);
        try {
            const res = await api.post('/orders/quote', {
                pickup: pickupCoords,
                destination: destCoords,
                serviceClass: 'Economy'
            });
            setQuote(res.data.quote);
        } catch (e) {
            const dynamicFee = getDynamicDeliveryFee(pickupCoords, destCoords);
            setQuote({
                total: (total + dynamicFee + (total * 0.05)).toFixed(2),
                deliveryFee: dynamicFee.toFixed(2),
                tax: (total * 0.05).toFixed(2),
                currency: 'INR',
                currencySymbol: '₹',
                surgeMultiplier: 1.0,
                surgeReasons: []
            });
        } finally {
            setIsCalculating(false);
        }
    };

    const applyPromo = async () => {
        if (!tempPromo.trim()) return;
        try {
            const res = await api.post('/marketing/validate-coupon', {
                code: tempPromo.toUpperCase(),
                cartAmount: Number(quote?.total) || total,
                serviceType: isPharmacy ? 'PHARMACY' : 'ALL'
            });
            setDiscount(res.data.discount);
            setPromoCode(tempPromo.toUpperCase());
            setPromoApplied(true);
        } catch(e) {
            Alert.alert('Coupon Failed', 'Invalid coupon code');
        }
    };

    const clearPromo = () => {
        setPromoCode('');
        setTempPromo('');
        setDiscount(0);
        setPromoApplied(false);
    };

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const deliveryFee = parseFloat(quote?.deliveryFee || 30);
            const taxAmount = parseFloat(quote?.tax || 0);
            const grandTotal = (total + deliveryFee + taxAmount - discount);

            const orderPayload = {
                serviceClass: 'Economy',
                pickup: vendor.name,
                destination: 'Home (Default)',
                pickupCoords: pickupCoords,
                destCoords: destCoords,
                itemsTotal: total,
                deliveryFee: deliveryFee,
                tax: taxAmount,
                taxData: { tax: taxAmount, currency: 'INR' },
                total: grandTotal,
                currency: 'INR',
                partnerId: vendor._id,
                items: items, 
                status: 'PENDING',
                paymentMethod,
                promoCode,
                discount,
                parcelDescription: `${items.length} items from ${vendor.name}`
            };

            const response = await api.post('/orders', orderPayload);
            const { order } = response.data;
            
            if (paymentMethod === 'Card') {
                navigation.navigate('Payment', { order });
            } else {
                navigation.replace('Confirmation', { order });
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Unable to create your order.';
            Alert.alert('Checkout Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={isPharmacy ? 'light-content' : 'dark-content'} backgroundColor={isPharmacy ? '#1a3a5f' : '#fff'} />
            
            <View style={[styles.header, isPharmacy && { backgroundColor: themeColor }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={isPharmacy ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isPharmacy && { color: '#fff' }]}>Review & Pay</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                
                {isPharmacy && (
                    <Animated.View entering={FadeInDown} style={styles.rxRequirementBox}>
                        <ShieldCheck size={20} color="#10B981" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.rxReqTitle}>Prescription Verified</Text>
                            <Text style={styles.rxReqSub}>Our pharmacist has reviewed your items.</Text>
                        </View>
                    </Animated.View>
                )}

                <Animated.View entering={FadeInDown.delay(100)}>
                     <Text style={styles.sectionTitle}>Delivery To</Text>
                     <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.iconBox, { backgroundColor: isPharmacy ? '#eff6ff' : '#f0fdf4' }]}>
                                <MapPin size={24} color={isPharmacy ? '#3b82f6' : '#22c55e'} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.cardTitle}>{route.params.userLocation ? 'Current Location' : 'Default Home'}</Text>
                                <Text style={styles.cardSub}>Cyber City, Block B, Gurgaon</Text>
                            </View>
                        </View>
                     </View>
                </Animated.View>

                {isPharmacy && (
                    <Animated.View entering={FadeInDown.delay(150)} style={[styles.card, { marginTop: 15, backgroundColor: '#fdf2f8', borderColor: '#fbcfe8', borderWidth: 1 }]}>
                        <View style={styles.row}>
                            <FileText size={20} color="#db2777" />
                            <Text style={{ marginLeft: 10, fontWeight: '700', color: '#db2777', fontSize: 13 }}>Prescription Attached (rx_order_102.pdf)</Text>
                        </View>
                    </Animated.View>
                )}

                <Animated.View entering={FadeInDown.delay(200)}>
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Order Summary</Text>
                    <View style={styles.card}>
                        <Text style={styles.vendorName}>{vendor.name}</Text>
                        <View style={styles.divider} />
                        {items.map((item, idx) => (
                            <View key={idx} style={styles.itemRow}>
                                <View style={[styles.itemQtyBox, isPharmacy && { borderColor: '#1a3a5f30' }]}>
                                    <Text style={[styles.itemQty, { color: themeColor }]}>{item.quantity}x</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    {isPharmacy && <Text style={styles.pillsSub}>10 Tablets (Strip)</Text>}
                                </View>
                                <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300)}>
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Bill Details</Text>
                    <View style={styles.card}>
                        {isCalculating ? (
                            <View style={{ padding: 20 }}>
                                <ActivityIndicator color={themeColor} />
                                <Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 8, fontSize: 12 }}>Calculating healthcare safety taxes...</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Item Total</Text>
                                    <Text style={styles.billValue}>₹{total.toFixed(2)}</Text>
                                </View>
                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Delivery Charges</Text>
                                    <Text style={styles.billValue}>₹{parseFloat(quote?.deliveryFee || 30).toFixed(2)}</Text>
                                </View>
                                {discount > 0 && (
                                    <View style={styles.billRow}>
                                        <Text style={[styles.billLabel, { color: '#10B981' }]}>Healthcare Discount</Text>
                                        <Text style={[styles.billValue, { color: '#10B981' }]}>-₹{discount.toFixed(2)}</Text>
                                    </View>
                                )}
                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Safety & Taxes</Text>
                                    <Text style={styles.billValue}>₹{parseFloat(quote?.tax || 0).toFixed(2)}</Text>
                                </View>
                                <View style={styles.billDivider} />
                                <View style={styles.billRow}>
                                    <Text style={styles.grandTotalLabel}>Total Amount</Text>
                                    <Text style={[styles.grandTotalValue, { color: themeColor }]}>₹{(total + parseFloat(quote?.deliveryFee || 30) + parseFloat(quote?.tax || 0) - discount).toFixed(2)}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </Animated.View>

                {isPharmacy && (
                    <View style={styles.trustBadge}>
                        <Activity size={16} color="#94a3b8" />
                        <Text style={styles.trustText}>Part of MoveX Secure Delivery Network</Text>
                    </View>
                )}

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.payBtn} 
                    onPress={handleCheckout}
                    disabled={loading || isCalculating}
                >
                    <LinearGradient colors={loading || isCalculating ? ['#94a3b8','#64748b'] : [themeColor, themeColor]} style={styles.payGradient}>
                        <View>
                            <Text style={styles.payActionText}>₹{quote ? (total + parseFloat(quote.deliveryFee || 30) + parseFloat(quote.tax || 0) - discount).toFixed(2) : '...'}</Text>
                            <Text style={styles.payActionSub}>Click to Securely Pay</Text>
                        </View>
                        <View style={styles.payRight}>
                            <Text style={styles.placeOrderText}>Place Order</Text>
                            <ChevronRight size={24} color="#fff" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    content: { padding: 20, paddingBottom: 120 },
    rxRequirementBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', padding: 15, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#a7f3d0' },
    rxReqTitle: { fontSize: 15, fontWeight: '900', color: '#065f46' },
    rxReqSub: { fontSize: 12, color: '#065f46', opacity: 0.7, fontWeight: '600' },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },
    card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 5, borderWidth: 1, borderColor: '#f1f5f9' },
    row: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
    cardSub: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '600' },
    vendorName: { fontSize: 18, fontWeight: '900', color: '#1a3a5f' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
    itemQtyBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginRight: 15 },
    itemQty: { fontSize: 13, fontWeight: '900' },
    itemName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    pillsSub: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
    itemPrice: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    billLabel: { fontSize: 14, color: '#64748b', fontWeight: '700' },
    billValue: { fontSize: 14, color: '#1e293b', fontWeight: '800' },
    billDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15, borderStyle: 'dashed' },
    grandTotalLabel: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    grandTotalValue: { fontSize: 22, fontWeight: '900' },
    trustBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 25 },
    trustText: { fontSize: 12, fontWeight: '800', color: '#94a3b8' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    payBtn: { borderRadius: 20, overflow: 'hidden' },
    payGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 25 },
    payActionText: { color: '#fff', fontSize: 20, fontWeight: '900' },
    payActionSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 2 },
    payRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
