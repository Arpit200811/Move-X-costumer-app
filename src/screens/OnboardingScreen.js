import React, { useState, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, 
  Dimensions, Image, SafeAreaView, 
  FlatList, StatusBar, useWindowDimensions 
} from 'react-native';
import { ArrowRight, Truck, Shield, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SLIDES = [
  {
    id: '1',
    title: 'premium_logistics',
    description: 'onboarding_desc_1',
    image: require('../../assets/onboarding/onboarding_1.png'),
    icon: Truck,
  },
  {
    id: '2',
    title: 'secure_delivery',
    description: 'onboarding_desc_2',
    image: require('../../assets/onboarding/onboarding_2.png'),
    icon: Shield,
  },
  {
    id: '3',
    title: 'realtime_tracking',
    description: 'onboarding_desc_3',
    image: require('../../assets/onboarding/onboarding_3.png'),
    icon: Clock,
  }
];

export default function OnboardingScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const flatListRef = useRef(null);

  const completeOnboarding = async (targetScreen) => {
    await AsyncStorage.setItem('movex_onboarded', 'true');
    navigation.replace(targetScreen);
  };

  const handleNext = () => {
    if (activeTab < SLIDES.length - 1) {
      flatListRef.current.scrollToIndex({ index: activeTab + 1 });
    } else {
      completeOnboarding('Register');
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.imageWrapper}>
          <Image 
            source={item.image} 
            style={styles.image} 
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>
          {t(item.title, item.title)}
        </Text>
        <Text style={styles.description}>
          {t(item.description, 'Professional grade logistics solutions for individual and enterprise needs.')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={() => completeOnboarding('Login')}>
          <Text style={styles.skipText}>{t('skip', 'Skip')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setActiveTab(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.bottomContainer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                activeTab === i ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          ))}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity 
          onPress={handleNext}
          style={styles.nextBtn}
        >
          <Text style={styles.nextBtnText}>
            {activeTab === SLIDES.length - 1 ? t('create_account_cta', 'Create Account') : t('continue', 'Continue')}
          </Text>
          <ArrowRight size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>

        {/* Login Link for existing users */}
        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => completeOnboarding('Login')}
        >
          <Text style={styles.loginText}>
            {t('already_member', 'Already a member?')} <Text style={styles.loginTextBold}>{t('login_cta', 'Sign In')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  skipContainer: { paddingHorizontal: 24, paddingVertical: 16, alignItems: 'flex-end' },
  skipText: { color: '#94a3b8', fontWeight: '600', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 },
  slide: { padding: 32, justifyContent: 'center', alignItems: 'center' },
  imageWrapper: { width: '100%', height: 288, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  image: { width: '80%', height: 280 },
  title: { fontSize: 36, fontWeight: '700', textAlign: 'center', color: '#0f172a', marginBottom: 24, letterSpacing: -1 },
  description: { fontSize: 18, textAlign: 'center', color: '#64748b', lineHeight: 28, paddingHorizontal: 24 },
  bottomContainer: { paddingHorizontal: 40, paddingBottom: 64 },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginBottom: 48, gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  activeDot: { width: 32, backgroundColor: '#000' },
  inactiveDot: { width: 8, backgroundColor: '#e2e8f0' },
  nextBtn: { backgroundColor: '#000', height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  nextBtnText: { color: '#fff', fontWeight: '600', fontSize: 16, marginRight: 12 },
  loginLink: { marginTop: 24, alignSelf: 'center' },
  loginText: { color: '#94a3b8', fontWeight: '500', fontSize: 14 },
  loginTextBold: { color: '#000', fontWeight: '600' }
});
