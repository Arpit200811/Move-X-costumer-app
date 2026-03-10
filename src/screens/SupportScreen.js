import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, StyleSheet, Image, Linking, Platform
} from 'react-native';
import { ChevronLeft, MessageCircle, Phone, Mail, FileText, ChevronRight, HelpCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function SupportScreen({ navigation }) {
  const { t } = useTranslation();

  const faqList = [
    { title: 'How to track my order?' },
    { title: 'Payment methods accepted' },
    { title: 'Cancellation policy' },
    { title: 'Reporting a damaged item' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 15 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('support_center', 'Help & Support')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
            <View style={styles.heroIconBox}>
                <HelpCircle size={40} color="#2563EB" />
            </View>
            <Text style={styles.heroTitle}>How can we help you?</Text>
            <Text style={styles.heroSub}>Search our help center or contact our support team directly</Text>
        </View>

        <View style={styles.optionsGrid}>
            <TouchableOpacity 
                style={styles.optionCard} 
                onPress={() => navigation.navigate('Chat', { recipientName: 'Support Agent', recipientRole: 'Help Desk' })}
            >
                <View style={[styles.optionIconBox, { backgroundColor: '#2563EB15' }]}>
                    <MessageCircle size={24} color="#2563EB" />
                </View>
                <Text style={styles.optionTitle}>Live Chat</Text>
                <Text style={styles.optionDesc}>Chat with our support executive</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => Linking.openURL('tel:+1234567890')}>
                <View style={[styles.optionIconBox, { backgroundColor: '#10B98115' }]}>
                    <Phone size={24} color="#10B981" />
                </View>
                <Text style={styles.optionTitle}>Call Support</Text>
                <Text style={styles.optionDesc}>Direct line to help desk</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => Linking.openURL('mailto:support@movex.com')}>
                <View style={[styles.optionIconBox, { backgroundColor: '#F59E0B15' }]}>
                    <Mail size={24} color="#F59E0B" />
                </View>
                <Text style={styles.optionTitle}>Email Us</Text>
                <Text style={styles.optionDesc}>Get response within 24 hours</Text>
            </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('frequent_questions', 'FREQUENTLY ASKED')}</Text>
        <View style={styles.faqSection}>
            {faqList.map((faq, i) => (
                <TouchableOpacity key={i} style={styles.faqItem}>
                    <FileText size={18} color="#64748b" />
                    <Text style={styles.faqText}>{faq.title}</Text>
                    <ChevronRight size={16} color="#cbd5e1" />
                </TouchableOpacity>
            ))}
        </View>

        <TouchableOpacity style={styles.termsBtn} onPress={() => navigation.navigate('Legal')}>
            <Text style={styles.termsText}>{t('terms_privacy', 'Privacy Policy & Terms of Service')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24 },
  heroSection: { alignItems: 'center', marginBottom: 40 },
  heroIconBox: { width: 80, height: 80, borderRadius: 30, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  heroSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  optionsGrid: { gap: 16, marginBottom: 40 },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  optionIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  optionDesc: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 16 },
  faqSection: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 12 },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  faqText: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600', color: '#475569' },
  termsBtn: { marginTop: 40, alignItems: 'center' },
  termsText: { fontSize: 12, color: '#2563EB', fontWeight: '600', textDecorationLine: 'underline' }
});
