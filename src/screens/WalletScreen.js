import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, FlatList, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { ChevronLeft, Plus, CreditCard, ArrowUpRight, ArrowDownLeft, Clock, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WalletScreen({ navigation }) {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const userRes = await AsyncStorage.getItem('movex_user');
      if (userRes) setUser(JSON.parse(userRes));

      const txRes = await api.get('/wallet/transactions');
      setTransactions(txRes.data.transactions || []);
    } catch (err) {
      console.log('Wallet fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMoney = async () => {
      const amount = parseFloat(topUpAmount);
      if (!amount || isNaN(amount) || amount <= 0) {
          Alert.alert('Invalid Amount', 'Please enter a valid base amount.');
          return;
      }
      try {
          setIsProcessing(true);
          const res = await api.post('/wallet/top-up', { amount: amount.toString(), method: 'Card / UPI' });
          if (res.data.success) {
              const updatedUser = { ...user, walletBalance: res.data.balance };
              setUser(updatedUser);
              await AsyncStorage.setItem('movex_user', JSON.stringify(updatedUser));
              fetchData();
              setShowTopUp(false);
              setTopUpAmount('');
              Alert.alert('Success', `Successfully added ₹${amount} to your wallet.`);
          }
      } catch (e) {
          Alert.alert('Top Up Failed', 'We could not process your transaction at this time.');
      } finally {
          setIsProcessing(false);
      }
  };

  const renderTransaction = ({ item }) => {
    const isCredit = item.amount > 0;
    return (
        <View style={styles.transactionCard}>
          <View style={[styles.transactionIcon, { backgroundColor: isCredit ? '#F0FDF4' : '#FFF7ED' }]}>
              {isCredit ? <ArrowDownLeft size={20} color="#10B981" /> : <ArrowUpRight size={20} color="#F97316" />}
          </View>
          <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>{item.description || 'Transaction'}</Text>
              <Text style={styles.transactionTime}>{new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
          </View>
          <Text style={[styles.transactionAmount, { color: isCredit ? '#10B981' : '#0f172a' }]}>
              {isCredit ? '+' : '-'}{user?.currency === 'INR' ? '₹' : '$'}{Math.abs(item.amount).toFixed(2)}
          </Text>
        </View>
    );
  };

  if (loading && !user) return <View style={styles.centered}><ActivityIndicator color="#2563EB" size="large" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('my_wallet', 'My Wallet')}</Text>
            <View style={{ width: 40 }} />
        </View>

        <View style={styles.premiumCardContainer}>
            <LinearGradient colors={['#2563EB', '#1e40af']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.premiumCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>MoveX Wallet</Text>
                    <Zap size={20} color="rgba(255,255,255,0.6)" />
                </View>
                
                <View style={styles.cardBalanceSection}>
                    <Text style={styles.cardBalanceLabel}>Available Balance</Text>
                    <View style={styles.cardBalanceRow}>
                        <Text style={styles.cardCurrency}>{user?.currency === 'INR' || !user?.currency ? '₹' : '$'}</Text>
                        <Text style={styles.cardBalanceValue}>{user?.walletBalance?.toFixed(2) || '0.00'}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.cardUser}>{user?.name?.toUpperCase() || 'MOVEX USER'}</Text>
                    <View style={styles.cardType}>
                        <View style={[styles.cardDot, { backgroundColor: '#fff' }]} />
                        <Text style={styles.cardTypeText}>PREMIUM</Text>
                    </View>
                </View>
            </LinearGradient>
        </View>

        <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowTopUp(true)}>
                <LinearGradient colors={['#fff', '#f8fafc']} style={styles.quickActionGradient}>
                    <Plus size={20} color="#2563EB" />
                    <Text style={styles.quickActionLabel}>Add Money</Text>
                </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn}>
                <LinearGradient colors={['#fff', '#f8fafc']} style={styles.quickActionGradient}>
                    <CreditCard size={20} color="#2563EB" />
                    <Text style={styles.quickActionLabel}>My Cards</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
          <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Transaction History</Text>
              <TouchableOpacity>
                  <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
          </View>

          <FlatList
            data={transactions}
            keyExtractor={item => item._id}
            renderItem={renderTransaction}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.promoCard}>
              <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.promoGradient}>
                  <Zap size={24} color="#2563EB" />
                  <View style={{ marginLeft: 16, flex: 1 }}>
                      <Text style={styles.promoTitle}>Auto-Pay is active</Text>
                      <Text style={styles.promoSub}>Your balance will be used for next bookings.</Text>
                  </View>
              </LinearGradient>
          </View>
      </View>

      {/* Top Up Modal Overlay */}
      <Modal visible={showTopUp} animationType="slide" transparent={true} onRequestClose={() => setShowTopUp(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Top-up Wallet</Text>
                      <TouchableOpacity onPress={() => setShowTopUp(false)}>
                          <Text style={styles.modalCloseBtn}>Cancel</Text>
                      </TouchableOpacity>
                  </View>
                  <Text style={styles.modalSub}>Enter amount to add</Text>
                  <View style={styles.inputContainer}>
                      <Text style={styles.currencyPrefix}>₹</Text>
                      <TextInput
                          style={styles.amountInput}
                          keyboardType="numeric"
                          placeholder="0"
                          value={topUpAmount}
                          onChangeText={setTopUpAmount}
                          autoFocus
                      />
                  </View>
                  <View style={styles.chipRow}>
                      {['500', '1000', '2000'].map(amt => (
                          <TouchableOpacity key={amt} style={styles.chipBtn} onPress={() => setTopUpAmount(amt)}>
                              <Text style={styles.chipText}>+₹{amt}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleAddMoney} disabled={isProcessing}>
                      {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Proceed to Pay</Text>}
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    premiumCardContainer: { marginHorizontal: 24, marginTop: 40 },
    premiumCard: { padding: 32, borderRadius: 36, height: 210, justifyContent: 'space-between', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
    cardBalanceSection: {},
    cardBalanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
    cardBalanceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
    cardCurrency: { color: '#fff', fontSize: 28, fontWeight: '800', marginRight: 4 },
    cardBalanceValue: { color: '#fff', fontSize: 50, fontWeight: '900', letterSpacing: -1 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardUser: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    cardType: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    cardDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    cardTypeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    quickActions: { flexDirection: 'row', gap: 16, marginHorizontal: 24, marginTop: 32 },
    quickActionBtn: { flex: 1, height: 64, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
    quickActionGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    quickActionLabel: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    historyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    viewAll: { color: '#2563EB', fontWeight: '700', fontSize: 14 },
    transactionCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    transactionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    transactionInfo: { flex: 1 },
    transactionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    transactionTime: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
    transactionAmount: { fontSize: 16, fontWeight: '800' },
    promoCard: { marginTop: 24, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
    promoGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
    promoTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
    promoSub: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    modalCloseBtn: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
    modalSub: { color: '#64748b', fontSize: 14, fontWeight: '500', marginBottom: 24 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#2563EB', paddingBottom: 12, marginBottom: 24 },
    currencyPrefix: { fontSize: 40, fontWeight: '900', color: '#0f172a', marginRight: 8 },
    amountInput: { flex: 1, fontSize: 40, fontWeight: '900', color: '#0f172a', padding: 0 },
    chipRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    chipBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center' },
    chipText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
    confirmBtn: { backgroundColor: '#000', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
