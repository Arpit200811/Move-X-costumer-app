import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, 
    SafeAreaView, StatusBar, Image, TextInput,
    Dimensions, StyleSheet, Platform, Alert, KeyboardAvoidingView,
    ActivityIndicator, Keyboard, useWindowDimensions
} from 'react-native';
import { 
    ChevronLeft, Search, MapPin, Navigation, 
    Zap, Clock, Shield, ChevronRight, Menu, Home, Briefcase, Star, X
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import Animated, { FadeInDown, SlideInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { TrendingUp, Info, Map as MapIcon, History as HistoryIcon, Clock3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withRepeat, withSequence, withTiming, useSharedValue as useSV } from 'react-native-reanimated';


const VEHICLES = [
    { id: '0', name: 'MoveX Moto', multiplier: 0.4, time: '2 min', image: 'https://cdn-icons-png.flaticon.com/512/3179/3179532.png', desc: 'Fastest in traffic', tagline: 'Express Bike' },
    { id: '1', name: 'MoveX Go', multiplier: 1.0, time: '4 min', image: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', desc: 'Affordable everyday rides', tagline: 'Value Select' },
    { id: '2', name: 'MoveX Prime', multiplier: 1.4, time: '3 min', image: 'https://cdn-icons-png.flaticon.com/512/744/744465.png', desc: 'Premium Sedans', tagline: 'Executive Class' },
    { id: '3', name: 'MoveX Black', multiplier: 2.2, time: '5 min', image: 'https://cdn-icons-png.flaticon.com/512/2736/2736853.png', desc: 'Luxury Experience', tagline: 'Top Tier' },
    { id: '4', name: 'MoveX XL', multiplier: 1.8, time: '6 min', image: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', desc: 'Space for 6', tagline: 'Large Groups' },
];

const FAVORITES = [
    { name: 'Home', city: 'Cyber City, Gurugram', lat: 28.4951, lng: 77.0878, icon: Home },
    { name: 'Work', city: 'Connaught Place, Delhi', lat: 28.6315, lng: 77.2167, icon: Briefcase }
];

export default function RideScreen({ navigation, route }) {
    const { width, height } = useWindowDimensions();
    const { t } = useTranslation();
    const [pickup, setPickup] = useState('Current Location');
    const [destination, setDestination] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('1');
    const [quote, setQuote] = useState(null);
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [pickupCoords, setPickupCoords] = useState({ lat: 28.6139, lng: 77.2090 });
    const [destCoords, setDestCoords] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [searchField, setSearchField] = useState(null); // 'pickup' | 'dest'
    const [searchLoading, setSearchLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);

    // Load recent history
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const history = await AsyncStorage.getItem('ride_history');
            if (history) setRecentSearches(JSON.parse(history).slice(0, 3));
        } catch (e) { console.log(e); }
    };

    const saveToHistory = async (loc) => {
        try {
            let history = await AsyncStorage.getItem('ride_history');
            history = history ? JSON.parse(history) : [];
            const newHistory = [loc, ...history.filter(h => h.name !== loc.name)].slice(0, 10);
            await AsyncStorage.setItem('ride_history', JSON.stringify(newHistory));
            setRecentSearches(newHistory.slice(0, 3));
        } catch (e) { console.log(e); }
    };

    const triggerHaptic = (type = 'light') => {
        if (Platform.OS === 'web') return;
        if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Auto-detect live location and reverse geocode
    useEffect(() => {
        const loc = route?.params?.userLocation;
        if (loc) {
            setPickupCoords({ lat: loc.latitude, lng: loc.longitude });
            fetch(`https://photon.komoot.io/reverse?lon=${loc.longitude}&lat=${loc.latitude}`)
                .then(res => res.json())
                .then(data => {
                    if (data.features && data.features.length > 0) {
                        const props = data.features[0].properties;
                        const address = props.name || props.street || props.city || props.state || 'Current Location';
                        setPickup(address);
                    }
                })
                .catch(e => console.log('Reverse geocode error:', e));
        }
    }, [route?.params?.userLocation]);

    const searchLocation = async (text, field) => {
        if (field === 'pickup') setPickup(text);
        else setDestination(text);
        setSearchField(field);

        if (text.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`);
            const data = await res.json();
            const formatted = data.features.map(f => ({
                name: f.properties.name || f.properties.street || 'Unknown Place',
                city: f.properties.city || f.properties.state || '',
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0]
            }));
            setSearchResults(formatted);
        } catch (e) {
            console.log('Search error:', e);
        } finally {
            setSearchLoading(false);
        }
    };

    const selectLocation = (loc) => {
        triggerHaptic('medium');
        if (searchField === 'pickup') {
            setPickup(loc.name);
            setPickupCoords({ lat: loc.lat, lng: loc.lng });
        } else {
            setDestination(loc.name);
            setDestCoords({ lat: loc.lat, lng: loc.lng });
            saveToHistory(loc);
        }
        setSearchResults([]);
        setSearchField(null);
        Keyboard.dismiss();
    };

    useEffect(() => {
        if (destCoords) {
           fetchQuote();
        }
    }, [destCoords, selectedVehicle]);

    const fetchQuote = async () => {
        setLoadingQuote(true);
        try {
            const res = await api.post('/orders/quote', {
                pickup: pickupCoords,
                destination: destCoords,
                serviceClass: 'Economy'
            });
            setQuote(res.data.quote);
        } catch (e) {
            if (e.response?.status === 403) {
                Alert.alert("Service Unavailable", "We don't operate in this area yet.");
            }
        } finally {
            setLoadingQuote(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            
            <MapView 
                provider={PROVIDER_DEFAULT}
                style={styles.map}
                initialRegion={{
                    latitude: route?.params?.userLocation?.latitude || 28.6139,
                    longitude: route?.params?.userLocation?.longitude || 77.2090,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <UrlTile 
                    urlTemplate="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    shouldReplaceMapContent={true}
                    maximumZ={20}
                />
                <Marker coordinate={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }}>
                    <PulseMarker color="#2563EB" />
                </Marker>
            </MapView>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={StyleSheet.absoluteFill} 
                pointerEvents="box-none"
            >
                <SafeAreaView style={{ flex: 1 }} pointerEvents="box-none">
                {!searchField && (
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <ChevronLeft size={24} color="#000" />
                        </TouchableOpacity>
                        <View style={styles.safetyBadge}>
                            <Shield size={14} color="#10B981" />
                            <Text style={styles.safetyText}>Secured by MoveX</Text>
                        </View>
                    </View>
                )}
 
                <Animated.View 
                    style={[
                        styles.searchCard, 
                        searchField ? styles.searchCardFull : styles.searchCardFloating,
                        searchField && { 
                            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20 
                        }
                    ]}
                >
                    <View style={styles.searchInner}>
                        <View style={styles.indicatorContainer}>
                            <View style={styles.dotCurrent} />
                            <View style={styles.line} />
                            <View style={styles.dotDest} />
                        </View>
                        <View style={styles.inputGroup}>
                            <View style={styles.inputBox}>
                                <TextInput 
                                    style={styles.input}
                                    value={pickup}
                                    onChangeText={(t) => searchLocation(t, 'pickup')}
                                    onFocus={() => setSearchField('pickup')}
                                    placeholder="Enter Pickup Location"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                            <View style={styles.inputBox}>
                                <TextInput 
                                    style={styles.input}
                                    value={destination}
                                    onChangeText={(t) => searchLocation(t, 'dest')}
                                    onFocus={() => setSearchField('dest')}
                                    placeholder="Where to?"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </View>
                    </View>
                    
                    {searchResults.length > 0 ? (
                        <ScrollView style={styles.resultsScroll} keyboardShouldPersistTaps="handled">
                            {searchResults.map((loc, i) => (
                                <Animated.View key={i} entering={FadeInDown.delay(i * 50)}>
                                    <TouchableOpacity style={styles.searchItem} onPress={() => selectLocation(loc)}>
                                        <View style={styles.resultIconBox}><MapPin size={18} color="#2563EB" /></View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.searchName}>{loc.name}</Text>
                                            <Text style={styles.searchCity}>{loc.city}</Text>
                                        </View>
                                        <ChevronRight size={16} color="#cbd5e1" />
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    ) : searchField && (
                        <ScrollView style={styles.resultsScroll} keyboardShouldPersistTaps="handled">
                            {searchLoading ? (
                                <View style={styles.skeletonContainer}>
                                    {[1, 2, 3].map(i => (
                                        <View key={i} style={styles.skeletonRow}>
                                            <View style={styles.skeletonCircle} />
                                            <View style={styles.skeletonLineGroup}>
                                                <View style={styles.skeletonLineLong} />
                                                <View style={styles.skeletonLineShort} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.historyTitle}>FAVORITES</Text>
                                    <View style={styles.favoritesGrid}>
                                        {FAVORITES.map((fav, i) => {
                                            const Icon = fav.icon;
                                            return (
                                                <TouchableOpacity key={i} style={styles.favoriteBtn} onPress={() => selectLocation(fav)}>
                                                    <View style={[styles.favIconBox, { backgroundColor: i === 0 ? '#eff6ff' : i === 1 ? '#f0fdf4' : '#fff7ed' }]}>
                                                        <Icon size={20} color={i === 0 ? '#2563EB' : i === 1 ? '#10B981' : '#f59e0b'} />
                                                    </View>
                                                    <Text style={styles.favText}>{fav.name}</Text>
                                                </TouchableOpacity>
                                            )
                                        })}
                                        <TouchableOpacity style={styles.favoriteBtn} onPress={() => triggerHaptic()}>
                                            <View style={[styles.favIconBox, { backgroundColor: '#fff7ed' }]}>
                                                <Star size={20} color="#f59e0b" />
                                            </View>
                                            <Text style={styles.favText}>Saved</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.sectionHeader}>
                                        <HistoryIcon size={14} color="#64748b" />
                                        <Text style={styles.historyTitle}>RECENT DESTINATIONS</Text>
                                    </View>

                                    {recentSearches.length > 0 ? recentSearches.map((loc, i) => (
                                        <TouchableOpacity key={i} style={styles.historyCard} onPress={() => { triggerHaptic(); selectLocation(loc); }}>
                                            <View style={styles.historyIconBox}>
                                                <Clock3 size={18} color="#64748b" />
                                            </View>
                                            <View style={styles.historyInfo}>
                                                <Text style={styles.historyName}>{loc.name}</Text>
                                                <Text style={styles.historySub}>{loc.city}</Text>
                                            </View>
                                            <ChevronRight size={14} color="#cbd5e1" />
                                        </TouchableOpacity>
                                    )) : (
                                        [1, 2].map((_, i) => (
                                            <View key={i} style={styles.historyCard}>
                                                <View style={styles.historyIconBox}>
                                                    <Clock3 size={18} color="#cbd5e1" />
                                                </View>
                                                <View style={styles.historyInfo}>
                                                    <Text style={[styles.historyName, { color: '#cbd5e1' }]}>No history yet</Text>
                                                    <Text style={styles.historySub}>Previous trips will appear here</Text>
                                                </View>
                                            </View>
                                        ))
                                    )}

                                    <TouchableOpacity style={styles.setMapBtn} onPress={() => { triggerHaptic(); setSearchField(null); }}>
                                        <MapIcon size={18} color="#2563EB" />
                                        <Text style={styles.setMapText}>Set location on map</Text>
                                        <ChevronRight size={16} color="#2563EB" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    )}
                </Animated.View>

                {!searchField && (
                    <View style={[styles.bottomSheet, { width: width }]}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.handle} />
                            <View style={styles.titleRow}>
                                <View>
                                    <Text style={styles.sheetTitle}>Choose a trip</Text>
                                    {quote?.surgeMultiplier > 1 && (
                                        <View style={styles.surgeBadge}>
                                            <TrendingUp size={10} color="#fff" />
                                            <Text style={styles.surgeBadgeText}>HIGH DEMAND PRICING</Text>
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity style={styles.scheduleBtn} onPress={() => triggerHaptic()}>
                                    <Clock size={16} color="#2563EB" />
                                    <Text style={styles.scheduleText}>Schedule</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.vehicleList}>
                            {VEHICLES.map((v, idx) => {
                                const isSelected = selectedVehicle === v.id;
                                return (
                                    <Animated.View key={v.id} entering={SlideInRight.delay(idx * 150)}>
                                        <TouchableOpacity 
                                            activeOpacity={0.8}
                                            style={[styles.vehicleCard, isSelected && styles.selectedCard]}
                                            onPress={() => {
                                                setSelectedVehicle(v.id);
                                                triggerHaptic('light');
                                            }}
                                        >
                                            <View style={styles.imageWrapper}>
                                                <Image source={{ uri: v.image }} style={styles.vehicleImg} />
                                                {isSelected && <View style={styles.selectedGlow} />}
                                            </View>
                                            <View style={styles.vehicleInfo}>
                                                <View style={styles.vehicleNameRow}>
                                                    <Text style={[styles.vehicleName, isSelected && { color: '#2563EB' }]}>{v.name}</Text>
                                                    <Text style={[styles.vehiclePrice, !quote && styles.pricePlaceholder]}>
                                                        {loadingQuote ? (
                                                            <ActivityIndicator size="small" color="#2563EB" />
                                                        ) : quote ? (
                                                            `${quote.currencySymbol}${Math.round(parseFloat(quote.total) * v.multiplier)}`
                                                        ) : (
                                                            '--'
                                                        )}
                                                    </Text>
                                                </View>
                                                <Text style={styles.vehicleTagline}>{v.tagline}</Text>
                                                <View style={styles.vehicleMeta}>
                                                    <View style={styles.ratingBox}>
                                                        <Star size={10} color="#fbbf24" fill="#fbbf24" />
                                                        <Text style={styles.ratingText}>4.9</Text>
                                                    </View>
                                                    <Text style={styles.metaText}> • (240+) • {v.time} away</Text>
                                                </View>
                                            </View>
                                            {isSelected && (
                                                <Animated.View entering={FadeInDown} style={styles.checkMarker}>
                                                    <Zap size={14} color="#fff" fill="#fff" />
                                                </Animated.View>
                                            )}
                                        </TouchableOpacity>
                                    </Animated.View>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity 
                                style={[styles.confirmBtn, (!quote || loading) && styles.btnDisabled]} 
                                disabled={!quote || loading || loadingQuote}
                                onPress={async () => {
                                    triggerHaptic('medium');
                                    setLoading(true);
                                    try {
                                        const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
                                        const res = await api.post('/orders', {
                                            pickup: pickup,
                                            destination: destination,
                                            pickupCoords: pickupCoords,
                                            destCoords: destCoords,
                                            serviceClass: vehicle.name.split(' ')[1],
                                            total: quote.total,
                                            packageType: 'RIDE',
                                            paymentMethod: 'Cash'
                                        });
                                        triggerHaptic('success');
                                        navigation.navigate('Tracking', { order: res.data.order });
                                    } catch (err) {
                                        Alert.alert("Booking Failed", err.response?.data?.message || err.message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                <LinearGradient colors={['#2563EB', '#1e40af']} style={styles.confirmGradient}>
                                    {loading ? <ActivityIndicator color="#fff" /> : (
                                        <>
                                            <Text style={styles.confirmText}>Request {VEHICLES.find(v => v.id === selectedVehicle).name}</Text>
                                            <Navigation size={20} color="#fff" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}

const PulseMarker = React.memo(({ color }) => {
    const scale = useSV(1);
    const opacity = useSV(0.6);
    useEffect(() => {
        scale.value = withRepeat(withTiming(2.2, { duration: 1800 }), -1, false);
        opacity.value = withRepeat(withTiming(0, { duration: 1800 }), -1, false);
    }, []);
    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
        backgroundColor: color
    }));
    return (
        <View style={styles.pickupMarker}>
            <Animated.View style={[styles.pulseRing, ringStyle]} />
            <View style={[styles.markerInner, { backgroundColor: color }]} />
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    map: { ...StyleSheet.absoluteFillObject },
    pickupMarker: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
    pulseRing: { position: 'absolute', width: 20, height: 20, borderRadius: 10 },
    markerInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 10, 
        paddingBottom: 12, 
        zIndex: 2000 
    },
    iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', elevation: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12 },
    safetyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8, elevation: 8, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.1)' },
    safetyText: { fontSize: 11, fontWeight: '800', color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5 },
    searchCard: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 30, zIndex: 1000 },
    searchCardFloating: { 
        marginTop: 12, 
        marginHorizontal: 16, 
        borderRadius: 14, 
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    searchCardFull: { ...StyleSheet.absoluteFillObject, borderRadius: 0, paddingHorizontal: 20, backgroundColor: '#fff' },
    activeBackBtn: { width: 44, height: 52, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
    resultIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
    resultsScroll: { flex: 1, marginTop: 15 },
    historyTitle: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 16, textTransform: 'uppercase' },
    favoritesGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
    favoriteBtn: { alignItems: 'center', gap: 8, width: '30%' },
    favIconBox: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    favText: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, marginTop: 10 },
    historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    historyIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    historyInfo: { flex: 1, marginLeft: 16 },
    historyName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
    historySub: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
    historyDist: { fontSize: 13, fontWeight: '800', color: '#2563EB', opacity: 0.8 },
    setMapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 18, borderRadius: 20, marginTop: 32, gap: 12, borderWidth: 1, borderColor: '#dbeafe' },
    setMapText: { flex: 1, fontSize: 15, fontWeight: '800', color: '#2563EB' },
    skeletonContainer: { marginTop: 20, gap: 20 },
    skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    skeletonCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9' },
    skeletonLineGroup: { flex: 1, gap: 8 },
    skeletonLineLong: { width: '80%', height: 12, borderRadius: 6, backgroundColor: '#f1f5f9' },
    skeletonLineShort: { width: '40%', height: 10, borderRadius: 5, backgroundColor: '#f8fafc' },
    searchInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    indicatorContainer: { width: 16, alignItems: 'center', justifyContent: 'center', height: 80 },
    dotCurrent: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', borderWidth: 1.5, borderColor: '#fff' },
    dotDest: { width: 8, height: 8, borderRadius: 1, backgroundColor: '#10B981', borderWidth: 1.5, borderColor: '#fff' },
    line: { width: 1.2, flex: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
    inputGroup: { flex: 1, gap: 8 },
    inputBox: { height: 42, justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    input: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
    bottomSheet: { position: 'absolute', bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 24, paddingBottom: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 30, elevation: 25 },
    handle: { width: 35, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 12 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sheetTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
    scheduleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
    scheduleText: { color: '#64748b', fontWeight: '800', fontSize: 12 },
    vehicleList: { maxHeight: 300 },
    vehicleCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, padding: 10, borderRadius: 18, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: 'transparent' },
    selectedCard: { borderColor: '#2563EB', backgroundColor: '#fff', shadowColor: '#2563EB', shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 },
    imageWrapper: { width: 60, height: 45, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    vehicleImg: { width: '100%', height: '100%', resizeMode: 'contain', zIndex: 1 },
    selectedGlow: { position: 'absolute', width: 30, height: 8, backgroundColor: '#2563EB', borderRadius: 20, bottom: 2, opacity: 0.15 },
    vehicleInfo: { flex: 1, marginLeft: 12 },
    vehicleNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    vehicleName: { fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
    vehiclePrice: { fontSize: 17, fontWeight: '900', color: '#0f172a' },
    pricePlaceholder: { color: '#cbd5e1', fontSize: 14 },
    vehicleTagline: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: 1, textTransform: 'uppercase', opacity: 0.8 },
    vehicleMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 3 },
    ratingText: { fontSize: 10, fontWeight: '800', color: '#92400e' },
    metaText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
    checkMarker: { position: 'absolute', right: -5, top: -5, width: 24, height: 24, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', elevation: 2 },
    footer: { marginTop: 24 },
    confirmBtn: { borderRadius: 24, overflow: 'hidden', shadowColor: '#2563EB', shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
    confirmGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 16, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.1)' },
    confirmText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    surgeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4, marginTop: 4 },
    surgeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    btnDisabled: { opacity: 0.5 },
    searchItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    searchName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    searchCity: { fontSize: 12, color: '#94a3b8', fontWeight: '500' }
});
