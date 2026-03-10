// Issue #16 Fix: SplashScreen now checks for existing token
// If token exists → navigate directly to Home (auto-login)
// If no token   → navigate to Login

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Truck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }) {
  const logoScale   = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 10 }),
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(async () => {
      // Check if user is already logged in
      try {
        const hasOnboarded = await AsyncStorage.getItem('movex_onboarded');
        const token = await AsyncStorage.getItem('movex_token');
        const user  = await AsyncStorage.getItem('movex_user');

        if (!hasOnboarded) {
          setTimeout(() => navigation.replace('Onboarding'), 800);
          return;
        }

        if (token && user) {
          setTimeout(() => navigation.replace('Home'), 800);
        } else {
          setTimeout(() => navigation.replace('Login'), 800);
        }
      } catch (_) {
        setTimeout(() => navigation.replace('Login'), 800);
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logo, { transform: [{ scale: logoScale }] }]}>
        <Truck size={60} color="#fff" />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>MoveX Express</Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: textOpacity }]}>Swift. Secure. Simple.</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0066FF', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 120, height: 120, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 8, fontWeight: '600' },
});
