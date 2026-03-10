import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, Alert, Dimensions, Platform, StyleSheet } from 'react-native';
import { 
  ChevronLeft, Phone, MessageSquare, AlertTriangle, 
  Clock, MapPin, Navigation, Star, Shield, Target, X, Truck, CheckCircle2, MoreHorizontal, Zap, ShieldAlert, Send
} from 'lucide-react-native';
import io from 'socket.io-client';
import api from '../services/api';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
// MapViewDirections removed to avoid Google Billing
import { Surface, Badge, Button, Avatar, Modal, Portal, TextInput as PaperInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';

// Derive Socket URL from API base URL (Stripping /api and using http instead of https for dev)
const SOCKET_URL = api.defaults.baseURL.replace('/api', '');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_API_KEY';

export default function TrackingScreen({ route, navigation }) {
  const { width, height } = useWindowDimensions();
  const { t } = useTranslation();
  const { order: initialOrder } = route.params;
  const mapRef = useRef(null);
  const [order, setOrder] = useState(route.params.order);
  const [driverLocation, setDriverLocation] = useState(null);
  const [travelInfo, setTravelInfo] = useState({ distance: '...', duration: '...' });
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [chatVisible, setChatVisible] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);

  const recenterMap = () => {
    if (!driverLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
        ...driverLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    }, 1000);
  };

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('join_order', order._id);

    socket.on('order_updated', (updatedOrder) => {
      if (updatedOrder._id === order._id) {
        setOrder(updatedOrder);
        if (updatedOrder.status === 'DELIVERED') {
            navigation.replace('Rating', { order: updatedOrder });
        }
      }
    });

    socket.on('new_message', (msg) => {
        setMessages(prev => [...prev, msg]);
    });

    socket.on('driver_location_updated', (data) => {
        const orderDriverId = order.driverId?._id || order.driverId;
        if (orderDriverId && data.driverId === orderDriverId) {
            const newLoc = {
                latitude: parseFloat(data.lat),
                longitude: parseFloat(data.lng),
            };
            setDriverLocation(newLoc);
            fetchOSRMRoute(newLoc);
        }
    });

    return () => socket.disconnect();
  }, [order._id]);

   /* Inline rating logic removed - moved to RatingScreen */

  const sendMessage = async () => {
      if (!message.trim()) return;
      try {
          await api.post(`/orders/${order._id}/message`, { text: message, senderRole: 'customer' });
          setMessage('');
      } catch (e) {
          Alert.alert(t('comm_error'), t('message_transmit_fail'));
      }
  };

  const handleCancelOrder = () => {
    const reasons = [
        { text: t('mistake_booking', 'Mistake in booking'), value: 'Mistake' },
        { text: t('change_of_mind', 'Change of mind'), value: 'Mind Change' },
        { text: t('long_wait', 'Driver taking too long'), value: 'Long Wait' },
        { text: t('wrong_address', 'Wrong pickup/destination'), value: 'Wrong Address' },
        { text: t('other', 'Other'), value: 'Other' }
    ];

    Alert.alert(
      t('cancel_reason_title', 'Reason for Cancellation'),
      t('cancel_reason_sub', 'Please let us know why you are aborting this mission.'),
      reasons.map(r => ({
          text: r.text,
          style: r.value === 'Other' ? 'default' : 'destructive',
          onPress: async () => {
              try {
                  await api.put(`/orders/${order._id}/cancel`, { reason: r.text });
                  Alert.alert(t('order_cancelled', 'Mission Aborted'), t('order_cancel_success', 'The protocol has been terminated.'));
                  navigation.navigate('Home');
              } catch (err) {
                  const errorMsg = err.response?.data?.message || t('order_cancel_failed', 'Failed to cancel order.');
                  Alert.alert(t('error'), errorMsg);
              }
          }
      })).concat([{ text: t('dismiss', 'Keep Booking'), style: 'cancel' }])
    );
  };

  const pickupLat = order.pickupCoords?.lat || 28.6139;
  const pickupLng = order.pickupCoords?.lng || 77.2090;
  const destLat = order.destCoords?.lat || 28.7041;
  const destLng = order.destCoords?.lng || 77.1025;

  const fetchOSRMRoute = async (driverLoc) => {
      try {
          const dest = order.status === 'ACCEPTED' ? { lat: pickupLat, lng: pickupLng } : { lat: destLat, lng: destLng };
          const url = `https://router.project-osrm.org/route/v1/driving/${driverLoc.longitude},${driverLoc.latitude};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
              const coords = data.routes[0].geometry.coordinates.map(c => ({
                  latitude: c[1],
                  longitude: c[0]
              }));
              setRouteCoords(coords);
              setTravelInfo({
                  distance: (data.routes[0].distance / 1000).toFixed(1),
                  duration: Math.ceil(data.routes[0].duration / 60)
              });
          }
      } catch (e) { console.log('OSRM Error:', e); }
  };

  return (
    <View style={styles.container}>
      {/* Map Content */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{
            latitude: order.pickupCoords?.lat || 28.6139,
            longitude: order.pickupCoords?.lng || 77.2090,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <UrlTile 
            urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            shouldReplaceMapContent={true}
            maximumZ={19}
          />
          <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }}>
             <Surface style={styles.markerContainer} elevation={2}>
                <MapPin size={20} color="#2563EB" />
             </Surface>
          </Marker>

          <Marker coordinate={{ latitude: destLat, longitude: destLng }}>
             <Surface style={styles.markerContainer} elevation={2}>
                <MapPin size={20} color="#EF4444" />
             </Surface>
          </Marker>

          {driverLocation && (
            <Marker coordinate={driverLocation} rotation={90} anchor={{ x: 0.5, y: 0.5 }}>
                <Surface style={styles.driverMarker} elevation={4}>
                    <Truck size={22} color="#fff" />
                </Surface>
            </Marker>
          )}

          {/* OSRM Free Routing */}
          {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeWidth={5}
                strokeColor="#2563EB"
              />
          )}

          {!driverLocation && (
              <Polyline
                coordinates={[
                    { latitude: pickupLat, longitude: pickupLng },
                    { latitude: destLat, longitude: destLng }
                ]}
                strokeColor="#2563EB"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
                opacity={0.3}
              />
          )}
        </MapView>

        <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.navigate('Home')}
        >
          <X size={24} color="#0f172a" />
        </TouchableOpacity>

        <TouchableOpacity 
            onPress={() => {
                Alert.alert(t('emergency_sos'), t('sos_desc', 'Triggering medical/safety emergency. Dispatching help to your GPS.'), [{text: t('cancel')}, {text: t('trigger'), style: 'destructive'}]);
            }}
            style={styles.sosButton}
        >
          <ShieldAlert size={20} color="#fff" />
        </TouchableOpacity>

        {/* Recenter FAB */}
      <TouchableOpacity 
        style={styles.recenterBtn} 
        onPress={recenterMap}
      >
        <Target size={24} color="#0f172a" />
      </TouchableOpacity>

        {/* Live Approach Overlay */}
        {driverLocation && parseFloat(travelInfo.distance) < 0.2 && (
            <View style={styles.approachOverlay}>
                <View style={styles.approachIconBox}>
                    <View style={styles.pulseEffect} />
                    <Zap size={20} color="#fff" />
                </View>
                <View style={styles.approachTextContainer}>
                    <Text style={styles.approachTitle}>{t('approaching_proximity', 'Approaching')}</Text>
                    <Text style={styles.approachSub}>{t('prepare_for_handoff', 'Get ready to meet driver')}</Text>
                </View>
            </View>
        )}

        {/* Chat Toggle Button */}
        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
            <TouchableOpacity 
                onPress={() => setChatVisible(true)}
                style={styles.chatToggleBtn}
            >
                <MessageSquare size={20} color="#fff" />
                {messages.length > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{messages.length}</Text>
                  </View>
                )}
            </TouchableOpacity>
        )}
      </View>

      {/* Order Info Panel */}
      <Surface style={styles.infoPanel} elevation={0}>
        <View style={styles.dragHandle} />
        
        <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.panelHeader}>
                    <View style={styles.statusRow}>
                        <View style={styles.statusBadge}>
                           <Text style={styles.statusBadgeText}>{t(order.status.toLowerCase() + '_status') || order.status}</Text>
                        </View>
                        <Text style={styles.orderIdText}>#{order.orderId?.slice(-8)}</Text>
                    </View>
                    <TouchableOpacity>
                       <MoreHorizontal size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.orderMainTitle}>{t(order.packageType?.toLowerCase()) || order.packageType} {t('shipment_label', 'Delivery')}</Text>

                {driverLocation && (
                    <View style={styles.statsRow}>
                        <View style={styles.etaCard}>
                            <Text style={styles.statLabel}>{t('arrival_ETA', 'Arrival In')}</Text>
                            <Text style={styles.etaValue}>{travelInfo.duration}<Text style={styles.etaUnit}> {t('mins', 'min')}</Text></Text>
                            <View style={styles.etaBackgroundIcon}>
                                <Navigation size={80} color="#fff" />
                            </View>
                        </View>
                        <View style={styles.distanceCard}>
                            <Text style={styles.distanceLabel}>{t('distance', 'Distance')}</Text>
                            <Text style={styles.distanceValue}>{travelInfo.distance}<Text style={styles.distanceUnit}> km</Text></Text>
                        </View>
                    </View>
                )}

                {/* Tracking Progress */}
                <View style={styles.timelineContainer}>
                    <TimelineItem icon={MapPin} title={t('pickup_location', 'Pickup')} subtitle={order.pickup?.address || order.pickup} active={true} />
                    <View style={[styles.timelineLine, { backgroundColor: ['PICKED_UP', 'DELIVERED'].includes(order.status) ? '#10B981' : '#f1f5f9' }]} />
                    <TimelineItem icon={Truck} title={t('on_the_way', 'In Transit')} subtitle={t('driver_moving', 'Heading to destination')} active={['PICKED_UP', 'DELIVERED'].includes(order.status)} />
                    <View style={[styles.timelineLine, { backgroundColor: order.status === 'DELIVERED' ? '#10B981' : '#f1f5f9' }]} />
                    <TimelineItem icon={CheckCircle2} title={t('delivered', 'Delivered')} subtitle={t('dropoff_complete', 'Package dropped off')} active={order.status === 'DELIVERED'} />
                </View>

                {/* OTP and Driver Control */}
                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                    <View style={styles.otpCard}>
                        <View>
                            <Text style={styles.otpLabel}>{t('delivery_pin', 'DELIVERY PIN')}</Text>
                            <Text style={styles.otpValue}>{order.otp || '----'}</Text>
                        </View>
                        <View style={styles.shieldIconBox}>
                             <Shield size={20} color="#0f172a" />
                        </View>
                    </View>
                )}

                {order.driverId && (
                    <View style={styles.driverCard}>
                        <Image
                            source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${order.driverId?._id || 'driver'}` }}
                            style={styles.driverAvatar}
                        />
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverLabel}>{t('your_driver', 'Driver')}</Text>
                            <Text style={styles.driverName}>{order.driverId?.name || t('finding_driver')}</Text>
                        </View>
                        <TouchableOpacity style={styles.contactBtn}>
                            <Phone size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {['PENDING', 'ASSIGNED', 'ACCEPTED'].includes(order.status) && (
                    <TouchableOpacity style={styles.cancelLink} onPress={handleCancelOrder}>
                        <Text style={styles.cancelText}>{t('cancel_order', 'Cancel Order')}</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
      </Surface>

      {/* Messaging Hub */}
      <Portal>
          <Modal visible={chatVisible} onDismiss={() => setChatVisible(false)} contentContainerStyle={styles.chatModal}>
              <View style={{ flex: 1 }}>
                  <View style={styles.chatHeader}>
                      <View>
                          <Text style={styles.chatTitle}>{t('chat_with_driver', 'Chat with Driver')}</Text>
                          <Text style={styles.chatSub}>{t('secure_channel', 'Secure Channel Active')}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.closeChatBtn}>
                          <X size={20} color="#fff" />
                      </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
                      {messages.length === 0 ? (
                          <View style={styles.emptyChat}>
                              <MessageSquare size={40} color="#cbd5e1" />
                              <Text style={styles.emptyChatText}>{t('no_messages_yet', 'No messages yet.')}</Text>
                          </View>
                      ) : (
                          messages.map((m, i) => (
                              <View key={i} style={[styles.msgWrapper, m.senderRole === 'customer' ? styles.msgMe : styles.msgOther]}>
                                  <View style={[styles.msgBubble, m.senderRole === 'customer' ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                                      <Text style={[styles.msgText, m.senderRole === 'customer' ? styles.msgTextMe : styles.msgTextOther]}>{m.text}</Text>
                                  </View>
                                  <Text style={styles.msgTime}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                              </View>
                          ))
                      )}
                  </ScrollView>

                  <View style={styles.chatInputArea}>
                      <View style={styles.chatInputContainer}>
                          <TextInput 
                            placeholder={t('type_message_placeholder')} 
                            style={styles.chatInput}
                            value={message}
                            onChangeText={setMessage}
                          />
                          <TouchableOpacity onPress={sendMessage} style={styles.chatSendBtn}>
                              <Send size={18} color="#fff" />
                          </TouchableOpacity>
                      </View>
                  </View>
              </View>
          </Modal>
      </Portal>
    </View>
  );
}

function TimelineItem({ icon: Icon, title, subtitle, active }) {
  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineIcon, active ? styles.timelineIconActive : styles.timelineIconInactive]}>
        <Icon size={18} color={active ? '#fff' : '#94a3b8'} />
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineTitle, active ? styles.activeText : styles.inactiveText]}>{title}</Text>
        <Text style={styles.timelineSub} numberOfLines={1}>{subtitle}</Text>
      </View>
      {active && <CheckCircle2 size={18} color="#10B981" />}
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    mapContainer: { flex: 1, position: 'relative' },
    map: { width: '100%', height: '100%' },
    markerContainer: { backgroundColor: '#fff', padding: 8, borderRadius: 16, borderWeight: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    driverMarker: { backgroundColor: '#2563EB', padding: 10, borderRadius: 16, borderWeight: 2, borderColor: '#fff' },
    backButton: { position: 'absolute', top: 56, left: 24, width: 48, height: 48, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
    approachOverlay: { position: 'absolute', top: 128, left: 32, right: 32, backgroundColor: '#2563EB', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    approachIconBox: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    pulseEffect: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 12 },
    approachTextContainer: { flex: 1, marginLeft: 16 },
    approachTitle: { color: '#fff', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    approachSub: { color: 'rgba(255,255,255,0.9)', fontWeight: '500', fontSize: 11, mt: 2 },
    sosButton: { position: 'absolute', top: 114, left: 24, width: 48, height: 48, backgroundColor: '#ef4444', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#ef4444', shadowOpacity: 0.3, shadowRadius: 10 },
    chatToggleBtn: { position: 'absolute', top: 56, right: 24, width: 48, height: 48, backgroundColor: '#000', borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
    badgeContainer: { position: 'absolute', top: 0, right: 0, width: 20, height: 20, backgroundColor: '#f43f5e', borderRadius: 10, borderWeight: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    infoPanel: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, marginTop: -32, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWeight: 1, borderColor: '#f1f5f9' },
    dragHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, selfCenter: 'center', alignSelf: 'center', marginBottom: 24 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusBadge: { backgroundColor: '#eff6ff', px: 12, py: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWeight: 1, borderColor: '#dbeafe' },
    statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1 },
    orderIdText: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginLeft: 12, letterSpacing: 1 },
    orderMainTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 24 },
    statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    etaCard: { flex: 1, backgroundColor: '#000', borderRadius: 20, padding: 20, overflow: 'hidden' },
    statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    etaValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
    etaUnit: { fontSize: 14, fontWeight: '500', opacity: 0.8 },
    etaBackgroundIcon: { position: 'absolute', right: -20, bottom: -20, opacity: 0.1 },
    distanceCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, borderWeight: 1, borderColor: '#f1f5f9' },
    distanceLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    distanceValue: { color: '#0f172a', fontSize: 20, fontWeight: '800' },
    distanceUnit: { fontSize: 12, fontWeight: '500', color: '#64748b' },
    timelineContainer: { marginBottom: 32, paddingHorizontal: 8 },
    timelineItem: { flexDirection: 'row', alignItems: 'flex-start' },
    timelineIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    timelineIconActive: { backgroundColor: '#0f172a' },
    timelineIconInactive: { backgroundColor: '#f1f5f9' },
    timelineContent: { flex: 1, marginLeft: 16 },
    timelineTitle: { fontSize: 14, fontWeight: '700' },
    activeText: { color: '#0f172a' },
    inactiveText: { color: '#94a3b8' },
    timelineSub: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '500' },
    timelineLine: { width: 2, height: 20, marginLeft: 19, marginVertical: 4 },
    otpCard: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 20, marginBottom: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f1f5f9' },
    otpLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5 },
    otpValue: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: 8 },
    shieldIconBox: { width: 44, height: 44, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 24 },
    driverAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#f1f5f9' },
    driverInfo: { flex: 1, marginLeft: 16 },
    driverLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
    driverName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    contactBtn: { width: 44, height: 44, backgroundColor: '#000', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    cancelLink: { alignSelf: 'center', paddingBottom: 40 },
    cancelText: { color: '#f43f5e', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    chatModal: { margin: 20, backgroundColor: 'white', borderRadius: 40, height: '75%', overflow: 'hidden' },
    chatHeader: { backgroundColor: '#0f172a', padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    chatSub: { color: '#3b82f6', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    closeChatBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    chatList: { flex: 1, padding: 24 },
    emptyChat: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyChatText: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 16 },
    msgWrapper: { marginBottom: 16, maxWidth: '80%' },
    msgMe: { alignSelf: 'flex-end' },
    msgOther: { alignSelf: 'flex-start' },
    msgBubble: { padding: 16, borderRadius: 24 },
    msgBubbleMe: { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
    msgBubbleOther: { backgroundColor: '#f1f5f9', borderBottomLeftRadius: 4 },
    msgText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
    msgTextMe: { color: '#fff' },
    msgTextOther: { color: '#1e293b' },
    msgTime: { fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
    chatInputArea: { padding: 24, paddingBottom: 40, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    chatInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24, paddingLeft: 20, paddingRight: 8 },
    chatInput: { flex: 1, height: 56, color: '#0f172a', fontWeight: '600' },
    chatSendBtn: { width: 48, height: 48, backgroundColor: '#2563EB', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
    recenterBtn: { position: 'absolute', right: 20, bottom: 320, width: 50, height: 50, backgroundColor: '#fff', borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
});

const mapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#e9e9e9" }] }
];

