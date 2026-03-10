import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, 
  ScrollView, TextInput, Alert, ActivityIndicator, 
  SafeAreaView, StyleSheet, Platform, StatusBar, useWindowDimensions, KeyboardAvoidingView
} from 'react-native';
import { ChevronLeft, MapPin, Package, ArrowRight, Zap, Target, Truck, ShieldCheck, Navigation, Banknote, CreditCard, Ticket, Wallet, Smartphone, CheckCircle, Percent, Home, Briefcase, User } from 'lucide-react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Helper: Haversine distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const getDynamicDeliveryFee = (pCoords, dCoords, basePrice) => {
    if (!pCoords || !dCoords || !pCoords.lat || !dCoords.lat) return basePrice;
    const dist = calculateDistance(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
    const perKmRate = 12; // 12 rs for every extra km out of base radius
    if (dist <= 2) return basePrice;
    return Math.round(basePrice + (dist - 2) * perKmRate);
};

const SERVICE_CLASSES = [
  { id: 'economy', name: 'Economy', price: 30.00, icon: Truck, speed: '9 min', color: '#2563EB' },
  { id: 'comfort', name: 'Comfort', price: 55.00, icon: Target, speed: '4 min', color: '#10B981' },
  { id: 'business', name: 'Business', price: 99.00, icon: ShieldCheck, speed: '2 min', color: '#4F46E5' },
];

// Common city preset locations
const PRESET_LOCATIONS = [
  { name: 'Current Location', lat: 28.6139, lng: 77.2090, city: 'New Delhi' },
  { name: 'Connaught Place', lat: 28.6315, lng: 77.2167, city: 'New Delhi' },
  { name: 'Cyber City, Gurgaon', lat: 28.4983, lng: 77.0881, city: 'Gurgaon' },
  { name: 'Noida Sector 18', lat: 28.5708, lng: 77.3219, city: 'Noida' },
  { name: 'IGI Airport', lat: 28.5561, lng: 77.1000, city: 'New Delhi' },
];

const SAVED_LOCATIONS = [
  { id: 'home', name: 'Home', icon: Home, lat: 28.4983, lng: 77.0881, city: 'Gurgaon, DLF Phase 3' },
  { id: 'work', name: 'Work', icon: Briefcase, lat: 28.6315, lng: 77.2167, city: 'New Delhi, Connaught Place' },
  { id: 'friend', name: 'Ravi', icon: User, lat: 28.5675, lng: 77.2432, city: 'New Delhi, Lajpat Nagar' },
];

export default function CreateOrderScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const { type = 'General' } = route.params || {};
  
  const [pickupText, setPickupText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [activeField, setActiveField] = useState(null); // 'pickup' | 'dest'
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(SERVICE_CLASSES[0]);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [coupon, setCoupon] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);

  const triggerHaptic = (type = 'light') => {
    if (Platform.OS === 'web') return;
    if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Auto-detect and reverse geocode live location
  useEffect(() => {
    const loc = route.params?.userLocation;
    if (loc && !pickupCoords) {
      setPickupCoords({ lat: loc.latitude, lng: loc.longitude });
      setPickupText('Current Location');
      
      // Reverse geocode using Photon API (Free, OSM-based)
      fetch(`https://photon.komoot.io/reverse?lon=${loc.longitude}&lat=${loc.latitude}`)
        .then(res => res.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            const props = data.features[0].properties;
            const address = props.name || props.street || props.city || props.state || 'Current Location';
            setPickupText(address);
          }
        })
        .catch(err => console.log('Reverse geocode error:', err));
    }
  }, [route.params?.userLocation]);

  const searchLocation = async (text) => {
    if (activeField === 'pickup') setPickupText(text);
    else setDestinationText(text);

    if (text.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Using Photon API (OSM based, Free, No key needed)
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`);
      const data = await res.json();
      const formatted = data.features.map(f => ({
        name: f.properties.name || f.properties.street || 'Unknown Place',
        city: f.properties.city || f.properties.state || f.properties.country || '',
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

  const selectPreset = (location) => {
    if (activeField === 'pickup') {
      setPickupText(location.name);
      setPickupCoords({ lat: location.lat, lng: location.lng });
    } else if (activeField === 'dest') {
      setDestinationText(location.name);
      setDestCoords({ lat: location.lat, lng: location.lng });
    }
    setActiveField(null);
    setSearchResults([]);
    triggerHaptic('medium');

    // Fetch quote when both locations selected
    if (
      (activeField === 'pickup' && destCoords) ||
      (activeField === 'dest' && pickupCoords)
    ) {
      const pC = activeField === 'pickup' ? { lat: location.lat, lng: location.lng } : pickupCoords;
      const dC = activeField === 'dest' ? { lat: location.lat, lng: location.lng } : destCoords;
      fetchQuote(pC, dC);
    }
  };

  const fetchQuote = async (pC, dC) => {
    try {
      const res = await api.post('/orders/quote', { pickup: pC, destination: dC, serviceClass: selectedClass.name });
      setQuote(res.data.quote);
    } catch (e) {
      const dynamicFee = getDynamicDeliveryFee(pC, dC, selectedClass.price);
      setQuote({ 
        total: dynamicFee.toFixed(2), 
        currency: 'INR', 
        currencySymbol: '₹', 
        surgeMultiplier: 1.0,
        distance: calculateDistance(pC.lat, pC.lng, dC.lat, dC.lng).toFixed(1)
      });
    }
  };

  const handleCreate = async () => {
    if (!pickupText || !destinationText) {
      return Alert.alert('Incomplete Details', 'Please select both pickup and destination locations.');
    }

    setLoading(true);
    try {
      const res = await api.post('/orders', {
        pickup: pickupText,
        destination: destinationText,
        pickupCoords: pickupCoords || { lat: 28.6139, lng: 77.2090 },
        destCoords: destCoords || { lat: 28.5355, lng: 77.3910 },
        serviceClass: selectedClass.name,
        packageType: type,
        parcelDescription: description || 'No description provided',
        weight: '1',
        paymentMethod: paymentMethod,
        total: finalTotal,
        deliveryFee: parseFloat(quote?.total || selectedClass.price),
      });

      if (res.data.success) {
        setLoading(false);
        const order = res.data.order;
        triggerHaptic('success');
        navigation.navigate('Payment', { order });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong.';
      Alert.alert('Booking Failed', msg.replace(/_/g, ' '));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromo = (codeToApply = coupon) => {
      const code = codeToApply.toUpperCase();
      if (code === 'FIRST50' || code === 'FREEDEL') {
          setAppliedPromo({ code, discount: code === 'FIRST50' ? 50 : 40 });
          setCoupon(code);
          triggerHaptic('success');
      } else {
          Alert.alert("Invalid", "This promo code is not valid.");
      }
  };

  const estimatedTotal = parseFloat(quote?.total || selectedClass.price);
  const finalTotal = appliedPromo ? Math.max(0, estimatedTotal - appliedPromo.discount) : estimatedTotal;

  const pLat = pickupCoords?.lat || route.params?.userLocation?.latitude || 28.6139;
  const pLng = pickupCoords?.lng || route.params?.userLocation?.longitude || 77.2090;
  const dLat = destCoords?.lat || 28.5355;
  const dLng = destCoords?.lng || 77.3910;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('create_order', 'Create Order')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* OSM Map Preview */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={{ flex: 1 }}
            initialRegion={{ latitude: pLat, longitude: pLng, latitudeDelta: 0.2, longitudeDelta: 0.2 }}
          >
            <UrlTile 
              urlTemplate="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
              shouldReplaceMapContent 
              maximumZ={20} 
            />
            {pickupCoords && (
              <Marker coordinate={{ latitude: pLat, longitude: pLng }}>
                <View style={styles.pickupMarker}><Target size={12} color="#fff" /></View>
              </Marker>
            )}
            {destCoords && (
              <Marker coordinate={{ latitude: dLat, longitude: dLng }}>
                <View style={styles.destMarker}><MapPin size={12} color="#fff" /></View>
              </Marker>
            )}
          </MapView>
          {quote && (
            <View style={styles.routeBanner}>
              <Zap size={14} color="#2563EB" />
              <Text style={styles.routeBannerText}>
                {quote.distance ? `${quote.distance} km  •  ` : ''}₹{parseFloat(quote.total).toFixed(2)} estimated
              </Text>
              {quote.surgeMultiplier > 1 && (
                <View style={styles.surgeBadge}>
                  <Text style={styles.surgeBadgeText}>⚡ {quote.surgeMultiplier}x</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.contentWrapper}>
          {/* Route Card */}
          <View style={styles.routeCard}>
            <Text style={styles.cardLabel}>Route Details</Text>

            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>PICKUP</Text>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Where to pick up?"
                  value={activeField === 'pickup' ? pickupText : (pickupText || '')}
                  onChangeText={(t) => {
                    setActiveField('pickup');
                    searchLocation(t);
                  }}
                  onFocus={() => setActiveField('pickup')}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <Navigation size={16} color="#2563EB" />
            </View>

            <View style={styles.lineConnector} />

            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>DESTINATION</Text>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Where to deliver?"
                  value={activeField === 'dest' ? destinationText : (destinationText || '')}
                  onChangeText={(t) => {
                    setActiveField('dest');
                    searchLocation(t);
                  }}
                  onFocus={() => setActiveField('dest')}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <MapPin size={16} color="#EF4444" />
            </View>

            {/* Saved Locations Shortcuts */}
            {activeField && !searchLoading && searchResults.length === 0 && (
                <View style={styles.savedLocationsWrap}>
                    <Text style={styles.presetTitle}>Saved Places</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedScroll}>
                        {SAVED_LOCATIONS.map(sl => {
                            const Icon = sl.icon;
                            return (
                                <TouchableOpacity key={sl.id} style={styles.savedChip} onPress={() => selectPreset(sl)}>
                                    <View style={styles.savedIconBox}>
                                        <Icon size={14} color="#0f172a" />
                                    </View>
                                    <Text style={styles.savedChipText}>{sl.name}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Location Picker Dropdown */}
            {activeField && (
              <View style={styles.presetList}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.presetTitle}>{searchResults.length > 0 ? 'Search Results' : 'Suggestions'}</Text>
                    {searchLoading && <ActivityIndicator size="small" color="#2563EB" />}
                </View>
                
                {(searchResults.length > 0 ? searchResults : PRESET_LOCATIONS).map((loc, i) => (
                  <TouchableOpacity key={i} style={styles.presetItem} onPress={() => selectPreset(loc)}>
                    <View style={styles.presetIcon}>
                      <MapPin size={14} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.presetName} numberOfLines={1}>{loc.name}</Text>
                      <Text style={styles.presetCity} numberOfLines={1}>{loc.city}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Service Class */}
          <Text style={styles.sectionTitle}>Service Class</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
            {SERVICE_CLASSES.map((cls) => {
              const Icon = cls.icon;
              const isActive = selectedClass.id === cls.id;
              return (
                <TouchableOpacity
                  key={cls.id}
                  onPress={() => {
                    setSelectedClass(cls);
                    triggerHaptic('light');
                    if (pickupCoords && destCoords) fetchQuote(pickupCoords, destCoords);
                  }}
                  style={[styles.serviceCard, isActive ? styles.serviceCardActive : styles.serviceCardInactive]}
                >
                  <View style={[styles.serviceIconBox, { backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : '#f8fafc' }]}>
                    <Icon size={20} color={isActive ? '#fff' : '#64748b'} />
                  </View>
                  <Text style={[styles.serviceName, { color: isActive ? '#fff' : '#0f172a' }]}>{cls.name}</Text>
                  <View style={styles.serviceFooter}>
                    <Text style={[styles.serviceEta, { color: isActive ? '#cbd5e1' : '#94a3b8' }]}>{cls.speed}</Text>
                    <Text style={[styles.servicePrice, { color: isActive ? '#fff' : '#0f172a' }]}>₹{cls.price}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Notes */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Notes</Text>
          <View style={styles.textAreaBox}>
            <TextInput
              placeholder="Instructions for driver..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={styles.textArea}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Offers & Coupons */}
          <View style={styles.premiumOfferSection}>
              <View style={styles.offerSectionHeader}>
                  <Text style={styles.sectionTitle}>Offers & Coupons</Text>
                  <TouchableOpacity>
                      <Text style={styles.viewCoupons}>View All</Text>
                  </TouchableOpacity>
              </View>
              
              <View style={styles.promoContainer}>
                  <View style={styles.promoInputBox}>
                      <Ticket size={18} color="#2563EB" />
                      <TextInput
                          style={styles.promoInput}
                          placeholder="Enter promo code"
                          value={coupon}
                          onChangeText={setCoupon}
                          placeholderTextColor="#94a3b8"
                          autoCapitalize="characters"
                      />
                      {appliedPromo && (
                          <CheckCircle size={18} color="#10B981" fill="#DCFCE7" />
                      )}
                  </View>
                  <TouchableOpacity 
                    style={[styles.applyBtn, appliedPromo && { backgroundColor: '#10B981' }]} 
                    onPress={() => handleApplyPromo(coupon)}
                  >
                      <Text style={styles.applyBtnText}>{appliedPromo ? 'APPLIED' : 'APPLY'}</Text>
                  </TouchableOpacity>
              </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.availablePromos}>
              <TouchableOpacity style={styles.promoTag} onPress={() => handleApplyPromo('FIRST50')}>
                  <Percent size={14} color="#2563EB" />
                  <Text style={styles.promoTagText}>FIRST50</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.promoTag} onPress={() => handleApplyPromo('FREEDEL')}>
                  <Zap size={14} color="#2563EB" />
                  <Text style={styles.promoTagText}>FREEDEL</Text>
              </TouchableOpacity>
          </ScrollView>

          {/* Payment Methods */}
          <View style={styles.paymentMethodSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentGrid}>
                {[
                { id: 'Cash', icon: Banknote, desc: 'Pay on delivery', color: '#10B981' },
                { id: 'Wallet', icon: Wallet, desc: 'MoveX Pay balance', color: '#2563EB' },
                { id: 'UPI', icon: Smartphone, desc: 'GPay, PhonePe, Paytm', color: '#4F46E5' },
                { id: 'Card', icon: CreditCard, desc: 'Credit or Debit Card', color: '#F59E0B' }
                ].map((pm) => (
                    <TouchableOpacity 
                        key={pm.id}
                        onPress={() => {
                            setPaymentMethod(pm.id);
                            triggerHaptic('light');
                        }}
                        style={[styles.pmCard, paymentMethod === pm.id && { borderColor: pm.color, backgroundColor: pm.color + '05' }]}
                    >
                        <View style={styles.pmHeader}>
                            <View style={[styles.pmIconBox, { backgroundColor: pm.color + '15' }]}>
                                <pm.icon size={18} color={pm.color} />
                            </View>
                            {paymentMethod === pm.id && (
                                <View style={[styles.activeIndicator, { backgroundColor: pm.color }]}>
                                    <CheckCircle size={10} color="#fff" />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.pmName, paymentMethod === pm.id && { color: pm.color }]}>{pm.id}</Text>
                        <Text style={styles.pmDesc}>{pm.desc}</Text>
                    </TouchableOpacity>
                ))}
            </View>
          </View>

          {/* Price & Payment */}
          <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.priceCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.priceLabel}>Estimated Total</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
                  <Text style={styles.priceValue}>₹{finalTotal.toFixed(2)}</Text>
                  {appliedPromo && (
                      <Text style={styles.priceOldValue}>₹{estimatedTotal.toFixed(2)}</Text>
                  )}
              </View>
              <Text style={styles.priceSub}>Paying via {paymentMethod}</Text>
            </View>
            <Package size={40} color="rgba(255,255,255,0.1)" />
          </LinearGradient>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Confirm {selectedClass.name} Order</Text>
              <ArrowRight size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerBtn: { width: 40, height: 40, backgroundColor: '#f8fafc', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    scrollView: { backgroundColor: '#f8fafc' },
    mapContainer: { height: 260, backgroundColor: '#e2e8f0', position: 'relative', overflow: 'hidden' },
    pickupMarker: { padding: 8, backgroundColor: '#2563EB', borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
    destMarker: { padding: 8, backgroundColor: '#EF4444', borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
    routeBanner: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
    routeBannerText: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },
    surgeBadge: { backgroundColor: 'rgba(249,115,22,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    surgeBadgeText: { color: '#f97316', fontSize: 10, fontWeight: '800' },
    contentWrapper: { padding: 20 },
    routeCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 24 },
    cardLabel: { color: '#94a3b8', fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    locationLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase' },
    locationValue: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 2 },
    locationInput: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 2, padding: 0 },
    locationPlaceholder: { color: '#94a3b8', fontWeight: '500' },
    lineConnector: { width: 1, height: 20, backgroundColor: '#e2e8f0', marginLeft: 4.5, marginVertical: 2 },
    presetList: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    presetTitle: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    presetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
    presetIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
    presetName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    presetCity: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
    savedLocationsWrap: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    savedScroll: { gap: 12, paddingVertical: 4 },
    savedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingRight: 16, paddingLeft: 4, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
    savedIconBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    savedChipText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
    sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    serviceCard: { width: 140, padding: 16, borderRadius: 20, borderWidth: 1 },
    serviceCardActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
    serviceCardInactive: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
    serviceIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    serviceName: { fontSize: 14, fontWeight: '700' },
    serviceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    serviceEta: { fontSize: 10, fontWeight: '600' },
    servicePrice: { fontSize: 13, fontWeight: '800' },
    textAreaBox: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
    textArea: { color: '#0f172a', fontWeight: '500', fontSize: 14, height: 64, textAlignVertical: 'top' },
    premiumOfferSection: { marginTop: 32, backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#eff6ff' },
    offerSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    viewCoupons: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
    promoContainer: { flexDirection: 'row', gap: 12 },
    promoInputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 16, height: 50, gap: 12 },
    promoInput: { flex: 1, fontSize: 13, fontWeight: '800', color: '#0f172a', letterSpacing: 1 },
    applyBtn: { backgroundColor: '#0f172a', paddingHorizontal: 20, borderRadius: 16, justifyContent: 'center', alignItems: 'center', minWidth: 90 },
    applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
    availablePromos: { marginTop: 16, gap: 12, paddingBottom: 8 },
    promoTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    promoTagText: { color: '#64748b', fontWeight: '800', fontSize: 11 },
    paymentMethodSection: { marginTop: 32 },
    paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, marginBottom: 24, justifyContent: 'space-between' },
    pmCard: { width: '48.5%', backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 2, borderColor: '#f1f5f9' },
    pmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    pmIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    activeIndicator: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    pmName: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    pmDesc: { fontSize: 10, color: '#94a3b8', fontWeight: '600', lineHeight: 14 },
    priceOldValue: { color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 18, textDecorationLine: 'line-through' },
    priceCard: { borderRadius: 24, padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 100 },
    priceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    priceValue: { color: '#fff', fontWeight: '900', fontSize: 32, letterSpacing: -1 },
    priceSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600', marginTop: 4 },
    bottomBar: { position: 'absolute', bottom: 24, left: 24, right: 24 },
    confirmBtn: { backgroundColor: '#000', height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15 },
    confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
