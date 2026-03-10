import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Alert, 
  SafeAreaView, StatusBar, ScrollView, StyleSheet,
  ActivityIndicator
} from 'react-native';
import { User, Phone, ArrowRight, ShieldCheck, Camera } from 'lucide-react-native';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    profileImage: null
  });
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your gallery to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setForm({ ...form, profileImage: result.assets[0].uri });
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.phone) {
      return Alert.alert(t('error', 'Error'), t('all_fields_required', 'Please fill in all required fields.'));
    }

    if (form.phone.length < 10) {
      return Alert.alert(t('invalid_phone', 'Invalid Phone'), t('phone_length_error', 'Phone number must be at least 10 digits long.'));
    }

    setLoading(true);
    try {
      // Step 1: Send OTP to verify phone
      await api.post('/auth/send-otp', { phone: form.phone });
      
      // Navigate to verification but pass registration data
      navigation.navigate('Verification', { 
        phone: form.phone, 
        isRegistering: true,
        registrationData: {
          name: form.name,
          profileImage: form.profileImage
        }
      });
    } catch (error) {
      console.error("Register Error:", error);
      Alert.alert(
        t('registration_failed', 'Registration Failed'), 
        error.response?.data?.message || error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t('create_account', 'Create Account')}</Text>
                <Text style={styles.subtitle}>{t('register_desc', 'Join MoveX for premium logistics and secure deliveries.')}</Text>
            </View>

            <View style={styles.avatarSection}>
                <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                    {form.profileImage ? (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.imageText}>Photo Uploaded</Text>
                        </View>
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Camera size={30} color="#94a3b8" />
                        </View>
                    )}
                    <View style={styles.addIcon}>
                        <Text style={styles.addIconText}>+</Text>
                    </View>
                </TouchableOpacity>
                <Text style={styles.avatarLabel}>{t('upload_photo', 'Add Profile Photo')}</Text>
            </View>

            <View style={styles.inputSection}>
                <View style={styles.inputRow}>
                    <User size={20} color="#64748b" />
                    <TextInput
                        style={styles.textInput}
                        placeholder={t('full_name', 'Full Name')}
                        placeholderTextColor="#94a3b8"
                        value={form.name}
                        onChangeText={(v) => setForm({ ...form, name: v })}
                    />
                </View>

                <View style={styles.inputRow}>
                    <Phone size={20} color="#64748b" />
                    <TextInput
                        style={styles.textInput}
                        placeholder={t('phone_number', 'Phone Number')}
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        value={form.phone}
                        onChangeText={(v) => setForm({ ...form, phone: v })}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.button, (form.name && form.phone) ? styles.buttonActive : styles.buttonInactive]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={styles.btnContent}>
                             <Text style={styles.buttonText}>{t('register_now', 'Create Account')}</Text>
                             <ArrowRight size={20} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.loginLink}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginLinkText}>
                        {t('already_member', 'Already have an account?')} <Text style={styles.loginLinkBold}>{t('login_cta', 'Sign In')}</Text>
                    </Text>
                </TouchableOpacity>

                <View style={styles.securityRow}>
                    <ShieldCheck size={14} color="#94a3b8" />
                    <Text style={styles.securityText}>{t('secure_encryption', 'End-to-end encrypted connection')}</Text>
                </View>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20,
    },
    backBtn: {
        marginBottom: 20,
    },
    backText: {
        fontSize: 30,
        color: '#000',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        color: '#64748b',
        fontSize: 16,
        lineHeight: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 30,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    addIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#000',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    addIconText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    avatarLabel: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
    },
    inputSection: {
        paddingHorizontal: 24,
    },
    inputRow: {
        backgroundColor: '#f8fafc',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    textInput: {
        flex: 1,
        marginLeft: 12,
        color: '#1e293b',
        fontSize: 16,
        fontWeight: '500',
    },
    button: {
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonActive: {
        backgroundColor: '#000000',
    },
    buttonInactive: {
        backgroundColor: '#cbd5e1',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
        marginRight: 10,
    },
    loginLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    loginLinkText: {
        color: '#64748b',
        fontSize: 14,
    },
    loginLinkBold: {
        color: '#000',
        fontWeight: '700',
    },
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 40,
        opacity: 0.5,
    },
    securityText: {
        color: '#94a3b8',
        fontSize: 12,
        marginLeft: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
