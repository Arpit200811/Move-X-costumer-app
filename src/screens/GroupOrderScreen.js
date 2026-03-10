import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, FlatList, 
    SafeAreaView, StatusBar, Image, Share, Alert, 
    Dimensions, KeyboardAvoidingView, Platform, StyleSheet
} from 'react-native';
import { 
    Users, Plus, Trash2, ChevronLeft, Link, 
    Lock, Unlock, ArrowRight, ShoppingBag, 
    CircleUser, Zap, Sparkles
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import api, { SOCKET_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function GroupOrderScreen({ navigation, route }) {
    const { t } = useTranslation();
    const [group, setGroup] = useState(null);
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [participantName, setParticipantName] = useState('Me');

    useEffect(() => {
        const loadName = async () => {
            const user = await AsyncStorage.getItem('movex_user');
            if (user) setParticipantName(JSON.parse(user).name);
        };
        loadName();
    }, []);

    const createGroup = async () => {
        setLoading(true);
        try {
            const res = await api.post('/group-orders/create');
            setGroup(res.data.groupOrder);
            joinSocketRoom(res.data.groupOrder._id);
        } catch (e) {
            Alert.alert(t('error', 'Error'), t('group_create_failed', 'Failed to create group'));
        } finally {
            setLoading(false);
        }
    };

    const joinGroup = async () => {
        if (!inviteCode) return;
        setLoading(true);
        try {
            const res = await api.post('/group-orders/join', { inviteCode });
            setGroup(res.data.group);
            joinSocketRoom(res.data.group._id);
        } catch (e) {
            Alert.alert(t('error', 'Error'), t('invalid_invite_code', 'Invalid invite code or group expired'));
        } finally {
            setLoading(false);
        }
    };

    const joinSocketRoom = (groupId) => {
        const socket = io(SOCKET_URL);
        socket.emit('join_group_room', groupId);
        socket.on('group_cart_updated', (data) => {
            setGroup(prev => ({ ...prev, cart: data.cart, totalAmount: data.total }));
        });
        socket.on('group_locked', () => {
            setGroup(prev => ({ ...prev, status: 'LOCKED' }));
        });
    };

    const shareInvite = () => {
        if (!group) return;
        Share.share({
            message: `Hey! Join my MoveX group order. Use code: ${group.inviteCode}`,
        });
    };

    const addItem = () => {
        const samples = [
            { name: 'Burger', price: 12.99, icon: '🍔' },
            { name: 'Pizza', price: 18.50, icon: '🍕' },
            { name: 'Tacos', price: 9.99, icon: '🌮' }
        ];
        const item = samples[Math.floor(Math.random() * samples.length)];
        api.post(`/group-orders/${group._id}/items`, { item: { ...item, quantity: 1 } });
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ChevronLeft size={20} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('split_cart', 'SPLIT CART')}</Text>
            <View style={{ width: 44 }} />
        </View>
    );

    if (!group) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" />
                {renderHeader()}
                <View style={styles.emptyContainer}>
                    <Animated.View entering={FadeIn} style={{ alignItems: 'center' }}>
                        <View style={styles.iconCircle}>
                            <Users size={60} color="#2563EB" />
                        </View>
                        <Text style={styles.emptyTitle}>{t('group_session', 'GROUP SESSION')}</Text>
                        <Text style={styles.emptyDesc}>
                            {t('group_session_desc', 'Start a shared session with friends. Add items from different menus and split the bill instantly.')}
                        </Text>
                    </Animated.View>

                    <TouchableOpacity 
                        onPress={createGroup}
                        style={styles.hostBtn}
                    >
                        <Text style={styles.hostBtnText}>{t('host_new_group', 'HOST NEW GROUP')}</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <Text style={styles.orJoinText}>{t('or_join_existing', 'OR JOIN EXISTING')}</Text>
                    <View style={styles.joinRow}>
                        <TextInput 
                            placeholder={t('invite_code', 'INVITE CODE')}
                            value={inviteCode}
                            onChangeText={setInviteCode}
                            autoCapitalize="characters"
                            style={styles.inviteInput}
                            placeholderTextColor="#94a3b8"
                        />
                        <TouchableOpacity 
                            onPress={joinGroup}
                            style={styles.joinBtn}
                        >
                            <ArrowRight size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            
            {/* Control Panel */}
            <View style={styles.controlPanel}>
                {renderHeader()}
                <View style={styles.codeBanner}>
                    <View>
                        <Text style={styles.codeLabel}>{t('group_code', 'GROUP CODE')}</Text>
                        <Text style={styles.codeText}>{group.inviteCode}</Text>
                    </View>
                    <TouchableOpacity onPress={shareInvite} style={styles.shareBtn}>
                        <Link size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Members Strip */}
                <View style={styles.membersRow}>
                    <Text style={styles.hubLabel}>{t('hub_active', 'HUB ACTIVE')}:</Text>
                    <FlatList 
                        horizontal
                        data={group.members}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(m) => m.userId}
                        renderItem={({ item }) => (
                            <View style={styles.memberAvatarBox}>
                                <Image 
                                    source={{ uri: item.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${item.userId}`}} 
                                    style={styles.avatar} 
                                />
                                <View style={styles.statusDot} />
                            </View>
                        )}
                        ListFooterComponent={
                             <TouchableOpacity style={styles.addMemberBtn}>
                                <Plus size={16} color="#94a3b8" />
                             </TouchableOpacity>
                        }
                    />
                </View>
            </View>

            {/* Split Cart List */}
            <View style={styles.cartContainer}>
                <View style={styles.cartHeaderRow}>
                    <Text style={styles.cartTitle}>{t('shared_cart', 'SHARED CART')}</Text>
                    <View style={styles.itemCountBadge}>
                         <Text style={styles.itemCountText}>{group.cart?.length || 0} {t('items', 'ITEMS')}</Text>
                    </View>
                </View>

                <FlatList 
                    data={group.cart}
                    keyExtractor={(item, index) => item.uniqueKey || index.toString()}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInRight.delay(index * 100)}>
                            <View style={styles.cartItemCard}>
                                <View style={styles.itemIconBox}>
                                    <Text style={{ fontSize: 24 }}>{item.icon || '📦'}</Text>
                                </View>
                                <View style={styles.itemInfo}>
                                    <View style={styles.itemRow}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <View style={styles.roleBadge}>
                                            <Text style={styles.roleText}>{item.addedBy === group.creator?._id ? t('host', 'HOST') : t('guest', 'GUEST')}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.itemPrice}>₹{item.price?.toFixed(2)}</Text>
                                </View>
                                <TouchableOpacity style={styles.deleteBtn}>
                                    <Trash2 size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyCartBox}>
                            <ShoppingBag size={50} color="#000" style={{ opacity: 0.2 }} />
                            <Text style={styles.emptyCartText}>{t('cart_is_empty', 'CART IS EMPTY')}</Text>
                        </View>
                    }
                />
            </View>

            {/* Action Bar */}
            <View style={styles.actionBar}>
                 <View style={styles.actionHeaderRow}>
                     <View>
                        <Text style={styles.totalLabel}>{t('total_bill', 'TOTAL BILL')}</Text>
                        <Text style={styles.totalAmount}>₹{(group.totalAmount || 0).toFixed(2)}</Text>
                     </View>
                     <TouchableOpacity 
                        onPress={addItem}
                        style={styles.addItemBtn}
                     >
                         <Plus size={24} color="#0f172a" />
                     </TouchableOpacity>
                 </View>

                 <TouchableOpacity 
                    style={styles.payBtn}
                    onPress={() => navigation.navigate('Payment', { groupOrder: group })}
                 >
                    <Unlock size={20} color="#fff" style={{ marginRight: 15 }} />
                    <Text style={styles.payBtnText}>{t('lock_and_pay', 'LOCK & PAY')}</Text>
                 </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8fafc', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingTop: 24, paddingBottom: 16 },
    backBtn: { padding: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    headerTitle: { fontSize: 18, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2, color: '#0f172a' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    iconCircle: { backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: 32, borderRadius: 100, marginBottom: 32 },
    emptyTitle: { fontSize: 24, fontWeight: '900', fontStyle: 'italic', color: '#0f172a', marginBottom: 16 },
    emptyDesc: { color: '#94a3b8', textAlign: 'center', marginBottom: 40, lineHeight: 24, fontSize: 16 },
    hostBtn: { backgroundColor: '#2563EB', width: '100%', paddingVertical: 20, borderRadius: 24, alignItems: 'center', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, marginBottom: 16 },
    hostBtnText: { color: '#fff', fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
    divider: { width: '100%', height: 1, backgroundColor: '#f1f5f9', marginVertical: 24 },
    orJoinText: { color: '#94a3b8', fontWeight: '800', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 },
    joinRow: { flexDirection: 'row', width: '100%', gap: 12 },
    inviteInput: { flex: 1, backgroundColor: '#fff', height: 56, borderRadius: 16, paddingHorizontal: 20, borderWidth: 1, borderColor: '#f1f5f9', fontWeight: '900', fontStyle: 'italic', color: '#0f172a', fontSize: 16 },
    joinBtn: { backgroundColor: '#0f172a', width: 64, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    controlPanel: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, borderBottomLeftRadius: 48, borderBottomRightRadius: 48, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, zIndex: 10 },
    codeBanner: { backgroundColor: '#0f172a', padding: 24, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginHorizontal: 16 },
    codeLabel: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    codeText: { color: '#fff', fontSize: 30, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
    shareBtn: { padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
    membersRow: { flexDirection: 'row', marginTop: 24, alignItems: 'center', paddingHorizontal: 16 },
    hubLabel: { color: '#94a3b8', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', marginRight: 12 },
    memberAvatarBox: { position: 'relative', marginRight: 12 },
    avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e2e8f0', borderWidth: 2, borderColor: '#fff' },
    statusDot: { position: 'absolute', bottom: -4, right: -4, width: 12, height: 12, backgroundColor: '#10b981', borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
    addMemberBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    cartContainer: { flex: 1, paddingHorizontal: 32, paddingTop: 32 },
    cartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 8 },
    cartTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', fontStyle: 'italic' },
    itemCountBadge: { backgroundColor: 'rgba(37, 99, 235, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(37, 99, 235, 0.2)' },
    itemCountText: { color: '#2563EB', fontWeight: '900', fontSize: 10 },
    cartItemCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center' },
    itemIconBox: { width: 48, height: 48, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderRadius: 16, marginRight: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    itemInfo: { flex: 1 },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    itemName: { color: '#0f172a', fontWeight: '900', fontStyle: 'italic', fontSize: 16 },
    roleBadge: { backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 12 },
    roleText: { color: '#94a3b8', fontWeight: '900', fontSize: 8, letterSpacing: 2 },
    itemPrice: { color: '#2563EB', fontWeight: '900', fontStyle: 'italic', fontSize: 14 },
    deleteBtn: { padding: 8, opacity: 0.2 },
    emptyCartBox: { alignItems: 'center', paddingVertical: 80 },
    emptyCartText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 4, marginTop: 20, color: '#000', opacity: 0.2 },
    actionBar: { padding: 32, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderTopWidth: 1, borderColor: '#f1f5f9', borderTopLeftRadius: 40, borderTopRightRadius: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 15 },
    actionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    totalLabel: { color: '#94a3b8', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    totalAmount: { color: '#0f172a', fontWeight: '900', fontSize: 30, fontStyle: 'italic' },
    addItemBtn: { padding: 20, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    payBtn: { backgroundColor: '#0f172a', paddingVertical: 24, borderRadius: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
    payBtnText: { color: '#fff', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 2 }
});
