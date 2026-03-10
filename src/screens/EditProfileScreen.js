import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { ChevronLeft, Camera, User, Mail, Phone, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function EditProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    avatar: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const raw = await AsyncStorage.getItem('movex_user');
      if (raw) {
        const u = JSON.parse(raw);
        setUser(u);
        setForm({
          name: u.name || '',
          email: u.email || '',
          avatar: u.avatar || null
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to update profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setForm({ ...form, avatar: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Name cannot be empty');
    
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        name: form.name.trim(),
        email: form.email.trim(),
        avatar: form.avatar
      });
      
      const updatedUser = { ...user, ...res.data.user };
      await AsyncStorage.setItem('movex_user', JSON.stringify(updatedUser));
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Update Failed', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#2563EB" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 15 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('edit_profile', 'Edit Profile')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator size="small" color="#2563EB" /> : <Check size={24} color="#2563EB" />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
              <LinearGradient colors={['#2563EB', '#1e40af']} style={styles.avatarGradient}>
                <Image 
                  source={{ uri: form.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}` }} 
                  style={styles.avatar} 
                />
              </LinearGradient>
              <View style={styles.cameraIcon}>
                <Camera size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>{t('change_photo', 'Tap to change photo')}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>{(t('full_name', 'FULL NAME')).toUpperCase()}</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="John Doe"
              />
            </View>

            <Text style={styles.inputLabel}>{(t('email_address', 'EMAIL ADDRESS')).toUpperCase()}</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.inputLabel}>{(t('phone_number', 'PHONE NUMBER')).toUpperCase()}</Text>
            <View style={[styles.inputWrapper, styles.disabledInput]}>
              <Phone size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: '#94a3b8' }]}
                value={user?.phone}
                editable={false}
              />
            </View>
            <Text style={styles.helperText}>{t('phone_fixed_helper', 'Phone number cannot be changed for security reasons.')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  saveBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginVertical: 30 },
  avatarWrapper: { position: 'relative' },
  avatarGradient: { padding: 3, borderRadius: 50 },
  avatar: { width: 100, height: 100, borderRadius: 47, backgroundColor: '#fff' },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff'
  },
  avatarLabel: { marginTop: 12, fontSize: 13, color: '#64748b', fontWeight: '500' },
  form: { paddingHorizontal: 24 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 8, marginTop: 24 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 56, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  disabledInput: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  helperText: { marginTop: 8, fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }
});
