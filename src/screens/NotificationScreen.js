import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, Bell, Package, Tag, Info, Trash2, CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../services/api';

export default function NotificationScreen({ navigation }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.log('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-read/all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const removeNotification = async (id) => {
    // We don't have a delete endpoint yet, so let's just mark it read locally
    // or add a delete endpoint to backend. For now, local filter.
    setNotifications(notifications.filter(n => n._id !== id));
  };

  const getIcon = (title) => {
    if (title.includes('Order') || title.includes('Mission')) return Package;
    if (title.includes('Wallet') || title.includes('Payout')) return Tag;
    return Info;
  };

  const renderItem = ({ item }) => {
    const Icon = getIcon(item.title);
    const itemColor = item.title.includes('✅') || item.title.includes('Delivered') ? '#10B981' : '#3B82F6';
    
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={async () => {
             if (!item.isRead) {
                 try {
                     await api.put(`/notifications/mark-read/${item._id}`);
                     setNotifications(notifications.map(n => n._id === item._id ? { ...n, isRead: true } : n));
                 } catch (e) {}
             }
        }}
      >
        <View style={[styles.iconBox, { backgroundColor: itemColor + '10' }]}>
            <Icon size={20} color={itemColor} />
        </View>
        <View style={styles.contentBox}>
            <View style={styles.headerRow}>
                <Text style={styles.typeText}>{item.title}</Text>
                <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications', 'Notifications')}</Text>
        <TouchableOpacity onPress={markAllRead}>
            <CheckCircle2 size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
              <ActivityIndicator color="#2563EB" size="large" />
          </View>
      ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Bell size={60} color="#e2e8f0" />
                    <Text style={styles.emptyTitle}>All caught up!</Text>
                    <Text style={styles.emptySub}>We will notify you when something important happens.</Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    notificationCard: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    unreadCard: { backgroundColor: '#fff', borderColor: '#dbeafe', borderLeftWidth: 4, borderLeftColor: '#2563EB' },
    iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    contentBox: { flex: 1 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    typeText: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
    timeText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
    title: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
    unreadTitle: { fontWeight: '800', color: '#0f172a' },
    message: { fontSize: 13, color: '#64748b', lineHeight: 18 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', marginTop: 10, marginLeft: 8 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 24 },
    emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 20 }
});
