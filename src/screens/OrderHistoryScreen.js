import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, SafeAreaView, StatusBar, StyleSheet
} from 'react-native';
import { ChevronLeft, Package, CheckCircle2, XCircle, Clock, X, ArrowRight, MapPin, Zap } from 'lucide-react-native';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const STATUS_CONFIG = {
  DELIVERED:  { color: '#10B981', bg: '#D1FAE5', label: 'Delivered' },
  CANCELLED:  { color: '#EF4444', bg: '#FEE2E2', label: 'Cancelled' },
  REJECTED:   { color: '#DC2626', bg: '#FEE2E2', label: 'Rejected' },
  ACCEPTED:   { color: '#3B82F6', bg: '#EFF6FF', label: 'Accepted' },
  PICKED_UP:  { color: '#F59E0B', bg: '#FEF3C7', label: 'Picked Up' },
  EN_ROUTE:   { color: '#8B5CF6', bg: '#F5F3FF', label: 'En Route' },
  PENDING:    { color: '#64748b', bg: '#F1F5F9', label: 'Pending' },
};

export default function OrderHistoryScreen({ navigation }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/my');
      setOrders((res.data.orders || []).reverse());
    } catch (err) {
      console.log('OrderHistory error', err.message);
    } finally { 
      // Add a slight delay for smooth transition
      setTimeout(() => {
        setLoading(false); 
        setRefreshing(false); 
      }, 500);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = (order) => {
    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      return Alert.alert(t('action_denied', 'Action Denied'), t('order_state_desc', { status: t(STATUS_CONFIG[order.status]?.key) }) || `Order is already ${order.status.toLowerCase()}.`);
    }
    Alert.alert(
      t('cancel_order_title', 'Cancel Order'),
      t('cancel_order_confirm', 'Are you sure you want to cancel this order?'),
      [
        { text: t('no', 'No'), style: 'cancel' },
        { text: t('yes_cancel', 'Yes, Cancel'), style: 'destructive', onPress: async () => {
          try {
            await api.put(`/orders/${order._id}/cancel`);
            fetchOrders();
          } catch (err) {
            Alert.alert(t('error', 'Error'), err.response?.data?.message || t('cancel_failed', 'Failed to cancel order.'));
          }
        }}
      ]
    );
  };

  const handleReorder = (order) => {
    Alert.alert('Reorder', 'Do you want to repeat this order?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Repeat', onPress: () => {
            // Check if it's a cart-based order (Food/Grocery)
            if (order.items && order.items.length > 0) {
                navigation.navigate('CartCheckout', {
                    vendor: order.partnerId || { _id: 'repeat', name: 'Saved Vendor' },
                    items: order.items,
                    total: order.itemsTotal || order.price || 0,
                    userLocation: { latitude: order.pickupCoords?.lat || 28.6139, longitude: order.pickupCoords?.lng || 77.2090 }
                });
            } else {
                // Parcel or Ride
                navigation.navigate('CreateOrder', { type: order.packageType || 'General' });
            }
        }}
    ]);
  };

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    const canCancel = !['DELIVERED', 'CANCELLED', 'REJECTED', 'PICKED_UP'].includes(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => (item.status === 'PENDING' || item.status === 'ACCEPTED' || item.status === 'PICKED_UP') && navigation.navigate('Tracking', { order: item })}
      >
        <View style={styles.cardHeader}>
            <View style={styles.orderIdBadge}>
                <Package size={14} color="#64748b" />
                <Text style={styles.orderIdText}>#{item.orderId?.slice(-10)}</Text>
            </View>
            <Text style={styles.priceText}>{item.currency === 'INR' || !item.currency ? '₹' : '$'}{(item.total || item.price || 0).toFixed(2)}</Text>
        </View>

        <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
                <View style={styles.detailIconBox}>
                    <MapPin size={14} color="#2563EB" />
                </View>
                <Text style={styles.detailLabel} numberOfLines={1}>{t(item.packageType?.toLowerCase()) || item.packageType} {t('shipment_label')}</Text>
            </View>
            <View style={[styles.detailItem, { opacity: 0.6 }]}>
                <View style={[styles.detailIconBox, { backgroundColor: '#f8fafc' }]}>
                    <ArrowRight size={14} color="#94a3b8" />
                </View>
                <Text style={styles.detailSubText} numberOfLines={1}>{item.destination?.address || item.destination || 'N/A'}</Text>
            </View>
        </View>

        <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            
            <View style={styles.actionRow}>
                {canCancel && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
                        <X size={18} color="#EF4444" />
                    </TouchableOpacity>
                )}
                {item.status === 'DELIVERED' && (
                    <TouchableOpacity style={styles.reorderBtn} onPress={() => handleReorder(item)}>
                        <Text style={styles.reorderText}>Reorder</Text>
                        <Zap size={14} color="#2563EB" />
                    </TouchableOpacity>
                )}
                <View style={styles.nextBtn}>
                    <ArrowRight size={18} color="#fff" />
                </View>
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('order_history', 'Order History')}</Text>
        <TouchableOpacity style={styles.headerMenuBtn}>
             <Clock size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: 24 }}>
            {[1,2,3,4].map(i => <SkeletonItem key={i} />)}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#2563EB" />}
          ListEmptyComponent={<EmptyState />}
        />
      )}
    </SafeAreaView>
  );
}

function SkeletonItem() {
    const opacity = useSharedValue(0.3);
    useEffect(() => {
        opacity.value = withRepeat(withSequence(withTiming(0.6, { duration: 1000 }), withTiming(0.3, { duration: 1000 })), -1, true);
    }, []);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View style={[styles.skeletonCard, style]}>
            <View style={styles.skeletonHeader}>
                <View style={styles.skeletonBadge} />
                <View style={styles.skeletonPrice} />
            </View>
            <View style={styles.skeletonBody}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, { width: '60%', marginTop: 12 }]} />
            </View>
        </Animated.View>
    );
}

function EmptyState() {
    return (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
                <Package size={60} color="#e2e8f0" />
                <Text style={styles.emptyText}>No orders found</Text>
                <Text style={styles.emptySubText}>When you book a shipment, it will appear here.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    headerBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    headerMenuBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 32, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    orderIdBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    orderIdText: { marginLeft: 8, fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
    priceText: { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
    detailsRow: { marginBottom: 20, gap: 12 },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
    detailLabel: { flex: 1, marginLeft: 16, fontSize: 14, fontWeight: '700', color: '#444' },
    detailSubText: { flex: 1, marginLeft: 16, fontSize: 13, color: '#94a3b8', fontWeight: '600', fontStyle: 'italic' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f8fafc' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
    actionRow: { flexDirection: 'row', gap: 12 },
    cancelBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffe4e6' },
    reorderBtn: { flexDirection: 'row', height: 44, borderRadius: 14, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: '#bfdbfe', gap: 6 },
    reorderText: { color: '#2563EB', fontWeight: '800', fontSize: 13 },
    nextBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10 },
    skeletonCard: { backgroundColor: '#e2e8f0', borderRadius: 32, padding: 24, marginBottom: 20, height: 180 },
    skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    skeletonBadge: { width: 100, height: 30, borderRadius: 12, backgroundColor: '#cbd5e1' },
    skeletonPrice: { width: 60, height: 30, borderRadius: 12, backgroundColor: '#cbd5e1' },
    skeletonBody: { gap: 12 },
    skeletonLine: { width: '100%', height: 20, borderRadius: 10, backgroundColor: '#cbd5e1' },
    emptyContainer: { marginTop: 60, alignItems: 'center' },
    emptyCard: { backgroundColor: '#fff', padding: 40, borderRadius: 32, borderDash: [10, 10], borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', width: '100%' },
    emptyText: { marginTop: 24, fontSize: 16, fontWeight: '800', color: '#64748b' },
    emptySubText: { marginTop: 8, fontSize: 13, color: '#94a3b8', textAlign: 'center', fontWeight: '500' }
});
