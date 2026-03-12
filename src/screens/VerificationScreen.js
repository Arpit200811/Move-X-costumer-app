import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';

const verificationSchema = yup.object().shape({
  code: yup.string().required('Code is required').length(4, 'Code must be 4 digits')
});

export default function VerificationScreen({ route, navigation }) {
  const { phone } = route.params;
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(verificationSchema),
    defaultValues: { code: '' },
    mode: 'onChange'
  });

  const handleVerify = async (data) => {
    try {
      const response = await api.post('/auth/verify-otp', { phone, otp: data.code });
      const { token, user } = response.data;

      if (token) {
        let finalUser = user;
        
        // If they are registering, update their profile with the name
        if (route.params.isRegistering && route.params.registrationData) {
            try {
                const updateRes = await api.put('/users/profile', {
                    name: route.params.registrationData.name,
                    profileImage: route.params.registrationData.profileImage
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (updateRes.data.user) {
                    finalUser = updateRes.data.user;
                }
            } catch (profileErr) {
                console.log("Profile update failed:", profileErr.message);
            }
        }

        await AsyncStorage.setItem('movex_token', token);
        await AsyncStorage.setItem('movex_user', JSON.stringify(finalUser));
        
        Toast.show({ 
          type: 'success', 
          text1: 'Verified! ✅', 
          text2: route.params.isRegistering ? 'Your account has been created successfully.' : 'Your phone number has been verified.' 
        });
        setTimeout(() => navigation.replace('Home'), 1500);
      }
    } catch (error) {
      Toast.show({ 
        type: 'error', 
        text1: 'Verification Failed', 
        text2: error.response?.data?.message || 'The verification code is incorrect.' 
      });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <ArrowLeft size={24} color="#0f172a" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>Enter the 4-digit code sent to {phone}</Text>

        <View style={styles.otpContainer}>
          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.otpInput, errors.code && { borderBottomColor: '#ef4444' }]}
                maxLength={4}
                keyboardType="number-pad"
                placeholder="0000"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
              />
            )}
          />
          {errors.code && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 8, fontWeight: 'bold' }}>{errors.code.message}</Text>}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit(handleVerify)}>
          <Text style={styles.buttonText}>Verify & Proceed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resend}>
          <Text style={styles.resendText}>Didn't receive code? <Text style={{ color: '#000000', fontWeight: '600' }}>Resend</Text></Text>
        </TouchableOpacity>

        {/* Demo mode hint */}
        <View style={styles.demoHint}>
          <Text style={styles.demoHintLabel}>🎯 DEMO MODE</Text>
          <Text style={styles.demoHintText}>Use code: <Text style={styles.demoCode}>1234</Text></Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  backBtn: { marginTop: 60, paddingHorizontal: 24, paddingVertical: 12, width: 68, height: 48, justifyContent: 'center' },
  content: { padding: 24, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748b', marginBottom: 40, lineHeight: 22 },
  otpContainer: { marginBottom: 40, alignItems: 'center' },
  otpInput: { fontSize: 32, fontWeight: '700', color: '#1e293b', letterSpacing: 16, borderBottomWidth: 1, borderBottomColor: '#cbd5e1', width: '60%', textAlign: 'center', paddingVertical: 12 },
  button: { backgroundColor: '#000000', height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  resend: { marginTop: 24, alignItems: 'center' },
  resendText: { color: '#94a3b8', fontSize: 14 },
  demoHint: {
    marginTop: 32, backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, padding: 16, alignItems: 'center'
  },
  demoHintLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' },
  demoHintText: { fontSize: 14, color: '#475569' },
  demoCode: { color: '#000000', fontWeight: '700', fontSize: 16 },
});
