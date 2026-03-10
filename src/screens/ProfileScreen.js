import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Image, ActivityIndicator, SafeAreaView, StatusBar, StyleSheet
} from 'react-native';
import { 
    ChevronLeft, User, Phone, Edit3, LogOut, Globe, Shield, CreditCard, 
    Bell, ChevronRight, Zap, MapPin, HelpCircle, Gift, Package
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
        loadUser();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    try {
      const raw = await AsyncStorage.getItem('movex_user');
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout_confirm_title', 'Log Out'), 
      t('logout_confirm_desc', 'Are you sure you want to log out from MoveX?'), 
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: async () => {
            try {
                await AsyncStorage.multiRemove(['movex_token', 'movex_user']);
                navigation.replace('Login');
            } catch (e) {
                Alert.alert('Error', 'Failed to logout properly.');
            }
        }}
      ]
    );
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#2563EB" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile', 'Profile')}</Text>
        <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
             <Bell size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Profile Identity Deck */}
        <View style={styles.identitySection}>
            <View style={styles.avatarContainer}>
                <LinearGradient colors={['#2563EB', '#1e40af']} style={styles.avatarGradient}>
                    <Image
                        source={{ uri: user?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user?._id}` }}
                        style={styles.avatar}
                    />
                </LinearGradient>
                <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editAvatarBtn}>
                    <Edit3 size={18} color="#2563EB" />
                </TouchableOpacity>
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.name}</Text>
                <View style={styles.roleBadge}>
                    <Zap size={10} color="#64748b" fill="#64748b" />
                    <Text style={styles.roleText}>{user?.role || 'PREMIUM MEMBER'}</Text>
                </View>
            </View>
        </View>

        {/* Global Settings Grid */}
        <View style={styles.settingsSection}>
            <Text style={styles.sectionLabel}>{t('account_settings', 'ACCOUNT SETTINGS')}</Text>
            <View style={styles.optionsCard}>
                <OptionItem 
                    icon={User} 
                    label={t('edit_profile', 'PROFILE INFORMATION')} 
                    value={user?.email || 'Update your profile'} 
                    onPress={() => navigation.navigate('EditProfile')} 
                />
                <OptionItem 
                    icon={MapPin} 
                    label={t('saved_places', 'SAVED ADDRESSES')} 
                    value="Home, Work & Others" 
                    border 
                    onPress={() => navigation.navigate('SavedAddresses')}
                />
                <OptionItem 
                    icon={CreditCard} 
                    label={t('my_wallet', 'WALLET BALANCE')} 
                    value={`${user?.walletBalance?.toFixed(2) || '0.00'} Available`} 
                    border 
                    onPress={() => navigation.navigate('Wallet')}
                />
                <OptionItem 
                    icon={Gift} 
                    label={t('refer_earn', 'REFER & EARN')} 
                    value="Invite friends, get credits" 
                    border 
                    onPress={() => navigation.navigate('Referral')}
                />
                <OptionItem 
                    icon={Package} 
                    label="ORDER HISTORY" 
                    value="View all your past orders" 
                    border 
                    onPress={() => navigation.navigate('OrderHistory')}
                />
                <OptionItem 
                    icon={HelpCircle} 
                    label={t('help_support', 'HELP & SUPPORT')} 
                    value="Get 24/7 assistance" 
                    border 
                    onPress={() => navigation.navigate('Support')}
                />
            </View>

            <Text style={styles.sectionLabel}>{t('interface_language', 'INTERFACE LANGUAGE')}</Text>
            <View style={styles.langGrid}>
                {[
                    { code: 'en', flag: '🇺🇸', name: 'English' },
                    { code: 'hi', flag: '🇮🇳', name: 'हिन्दी' },
                    { code: 'es', flag: '🇪🇸', name: 'Español' },
                    { code: 'ar', flag: '🇦🇪', name: 'العربية' },
                ].map((l) => (
                    <TouchableOpacity 
                        key={l.code}
                        style={[styles.langBtn, i18n.language === l.code && styles.langBtnActive]}
                        onPress={() => i18n.changeLanguage(l.code)}
                    >
                        <Text style={styles.langFlag}>{l.flag}</Text>
                        <Text style={[styles.langName, i18n.language === l.code && { color: '#fff' }]}>{l.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={20} color="#EF4444" />
                <Text style={styles.logoutText}>{t('logout', 'Sign Out')}</Text>
            </TouchableOpacity>

            <View style={styles.versionInfo}>
                <Text style={styles.versionText}>MOVEX ENTERPRISE v1.1.1</Text>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OptionItem({ icon: Icon, label, value, border, onPress }) {
    return (
        <TouchableOpacity 
            style={[styles.optionItem, border && { borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}
            onPress={onPress}
        >
            <View style={styles.optionIconBox}>
                <Icon size={20} color="#64748b" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{label}</Text>
                <Text style={styles.optionValue} numberOfLines={1}>{value}</Text>
            </View>
            <ChevronRight size={18} color="#cbd5e1" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    bellBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    identitySection: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff' },
    avatarContainer: { position: 'relative' },
    avatarGradient: { padding: 4, borderRadius: 45 },
    avatar: { width: 90, height: 90, borderRadius: 42, backgroundColor: '#fff' },
    editAvatarBtn: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#fff',
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    userInfo: { marginTop: 20, alignItems: 'center' },
    userName: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 8
    },
    roleText: { color: '#64748b', fontWeight: '800', fontSize: 9, letterSpacing: 1, marginLeft: 6 },
    settingsSection: { paddingHorizontal: 20, marginTop: 20 },
    sectionLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 16, marginLeft: 8 },
    optionsCard: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', marginBottom: 30 },
    optionItem: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    optionIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    optionLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
    optionValue: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 2 },
    langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
    langBtn: {
        flex: 1,
        minWidth: '45%',
        height: 60,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16
    },
    langBtnActive: { backgroundColor: '#000', borderColor: '#000' },
    langFlag: { fontSize: 20, marginRight: 12 },
    langName: { fontSize: 13, fontWeight: '700', color: '#475569' },
    logoutBtn: {
        height: 64,
        backgroundColor: '#fff1f2',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ffe4e6',
        marginBottom: 40
    },
    logoutText: { color: '#e11d48', fontWeight: '800', fontSize: 16, marginLeft: 12, letterSpacing: 1 },
    versionInfo: { alignItems: 'center', opacity: 0.2, paddingBottom: 40 },
    versionText: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 2 }
});
