import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Image, Share, Dimensions } from 'react-native';
import { ChevronLeft, Gift, Share2, Copy, Users, Award } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ReferralScreen({ navigation }) {
  const { t } = useTranslation();
  const referralCode = "MOVEX-7781";

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join me on MoveX for premium logistics! Use my referral code ${referralCode} to get $20 off your first delivery. Download now: https://movex.app`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('refer_and_earn', 'Refer & Earn')}</Text>
            <View style={{ width: 40 }} />
        </View>

        <View style={styles.heroSection}>
            <View style={styles.giftIconBox}>
                <LinearGradient colors={['#2563EB', '#3B82F6']} style={styles.giftGradient}>
                    <Gift size={48} color="#fff" />
                </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Spread the word</Text>
            <Text style={styles.heroSub}>Invite your friends to MoveX and get rewards for every successful delivery they make.</Text>
        </View>
      </LinearGradient>

      <View style={styles.rewardCard}>
          <View style={styles.rewardItem}>
              <Text style={styles.rewardValue}>$20.00</Text>
              <Text style={styles.rewardLabel}>YOUR REWARD</Text>
          </View>
          <View style={styles.rewardDivider} />
          <View style={styles.rewardItem}>
              <Text style={styles.rewardValue}>$15.00</Text>
              <Text style={styles.rewardLabel}>FRIEND'S DISCOUNT</Text>
          </View>
      </View>

      <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>YOUR UNIQUE CODE</Text>
          <View style={styles.codeBox}>
              <Text style={styles.codeText}>{referralCode}</Text>
              <TouchableOpacity style={styles.copyBtn}>
                  <Copy size={20} color="#2563EB" />
              </TouchableOpacity>
          </View>
      </View>

      <View style={styles.footer}>
          <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
              <LinearGradient colors={['#2563EB', '#1d4ed8']} style={styles.shareGradient}>
                  <Share2 size={24} color="#fff" />
                  <Text style={styles.shareTxt}>SHARE INVITE LINK</Text>
              </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statsBtn}>
              <Users size={20} color="#64748b" />
              <Text style={styles.statsTxt}>View Referral Dashboard</Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    heroSection: { alignItems: 'center', marginTop: 40 },
    giftIconBox: { width: 100, height: 100, marginBottom: 24 },
    giftGradient: { flex: 1, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
    heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
    heroSub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 12, paddingHorizontal: 20, lineHeight: 22 },
    rewardCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 24, marginTop: -40, borderRadius: 30, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
    rewardItem: { flex: 1, alignItems: 'center' },
    rewardDivider: { width: 1, backgroundColor: '#f1f5f9', marginHorizontal: 10 },
    rewardValue: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
    rewardLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', marginTop: 4, letterSpacing: 1 },
    codeSection: { padding: 40, alignItems: 'center' },
    codeLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 2, marginBottom: 16 },
    codeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20, borderWidth: 2, borderColor: '#eff6ff', borderStyle: 'dashed' },
    codeText: { fontSize: 24, fontWeight: '900', color: '#2563EB', letterSpacing: 5 },
    copyBtn: { marginLeft: 20 },
    footer: { paddingHorizontal: 24, position: 'absolute', bottom: 40, left: 0, right: 0 },
    shareBtn: { height: 70, borderRadius: 24, overflow: 'hidden' },
    shareGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    shareTxt: { marginLeft: 12, color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
    statsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 10 },
    statsTxt: { color: '#64748b', fontWeight: '700', fontSize: 14 }
});
