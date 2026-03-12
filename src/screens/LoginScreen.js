import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, SafeAreaView, StatusBar, ScrollView, StyleSheet } from 'react-native';
import { Phone, ArrowRight, Zap, ShieldCheck } from 'lucide-react-native';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';

const loginSchema = yup.object().shape({
  phone: yup.string()
    .required('Phone number is required')
    .min(10, 'Phone must be at least 10 digits')
    .matches(/^\d+$/, 'Phone must contain only numbers')
});

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { phone: '' },
    mode: 'onChange'
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone: data.phone });
      Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'Please check your SMS' });
      navigation.navigate('Verification', { phone: data.phone });
    } catch (error) {
      const msg = error.response?.data?.message || t('auth_error_desc', 'Unable to connect to service. Please try again.');
      Toast.show({ type: 'error', text1: t('login_failed', 'Login Failed'), text2: msg });
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
                <View style={styles.logoBox}>
                    <Text style={styles.logoText}>M</Text>
                </View>
                
                <Text style={styles.title}>{t('movex', 'MoveX')}</Text>
                <Text style={styles.subtitle}>{t('enter_phone_desc', 'Enter your phone number to continue')}</Text>
            </View>

            <View style={styles.inputSection}>
                <View style={[styles.inputRow, errors.phone && { borderColor: '#ef4444' }]}>
                    <Phone size={20} color="#64748b" />
                    <Controller
                        control={control}
                        name="phone"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.textInput}
                                placeholder={t('phone_number', 'Phone Number')}
                                placeholderTextColor="#94a3b8"
                                keyboardType="phone-pad"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                            />
                        )}
                    />
                </View>
                {errors.phone && <Text style={{ color: '#ef4444', fontSize: 13, marginTop: -15, marginBottom: 15, fontWeight: '600' }}>{errors.phone.message}</Text>}

                <TouchableOpacity 
                    style={[styles.button, isValid ? styles.buttonActive : styles.buttonInactive]}
                    onPress={handleSubmit(handleLogin)}
                    disabled={loading || !isValid}
                >
                    <Text style={styles.buttonText}>{loading ? (t('loading', 'Please wait...')) : (t('continue', 'Continue'))}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.registerLink}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.registerLinkText}>
                        {t('new_user_question', 'New to MoveX?')} <Text style={styles.registerLinkBold}>{t('create_account', 'Create Account')}</Text>
                    </Text>
                </TouchableOpacity>

                <View style={styles.securityRow}>
                    <ShieldCheck size={14} color="#94a3b8" />
                    <Text style={styles.securityText}>{t('secure_connection', 'Secure Connection')}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>{t('terms_desc', 'By continuing, you agree to our Terms of Service and Privacy Policy.')}</Text>
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
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    logoBox: {
        width: 60,
        height: 60,
        backgroundColor: '#000000',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    subtitle: {
        color: '#64748b',
        fontSize: 15,
        fontWeight: '400',
        lineHeight: 22,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    inputSection: {
        paddingHorizontal: 24,
        marginTop: 10,
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
        marginBottom: 24,
    },
    textInput: {
        flex: 1,
        marginLeft: 12,
        color: '#1e293b',
        fontSize: 16,
    },
    button: {
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonActive: {
        backgroundColor: '#000000',
    },
    buttonInactive: {
        backgroundColor: '#cbd5e1',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    securityText: {
        color: '#94a3b8',
        fontSize: 13,
        marginLeft: 6,
    },
    registerLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    registerLinkText: {
        color: '#64748b',
        fontSize: 14,
    },
    registerLinkBold: {
        color: '#000',
        fontWeight: '700',
    },
    footer: {
        marginTop: 'auto',
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
});
