import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, FlatList
} from 'react-native';
import { ChevronLeft, MapPin, Home, Briefcase, Plus, Trash2, ChevronRight, Bookmark } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';

const addressSchema = yup.object().shape({
  address: yup.string().required('Address is required').min(5, 'Address is too short')
});

export default function SavedAddressesScreen({ navigation }) {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([
    { id: '1', type: 'HOME', address: '123 Sky Tower, New Delhi, India', icon: Home },
    { id: '2', type: 'WORK', address: 'Tech Park, Sector 62, Noida, Uttar Pradesh', icon: Briefcase },
    { id: '3', type: 'OTHER', address: 'Gym Central, Downtown Square', icon: Bookmark },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(addressSchema),
    defaultValues: { address: '' },
    mode: 'onChange'
  });
  const [newType, setNewType] = useState('OTHER');

  const handleDelete = (id) => {
    Alert.alert(
      'Remove Address',
      'Are you sure you want to remove this saved place?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setAddresses(prev => prev.filter(a => a.id !== id));
          Toast.show({ type: 'success', text1: 'Address Removed' });
        }}
      ]
    );
  };

  const handleAddAddress = (data) => {
    const newEntry = {
      id: Date.now().toString(),
      type: newType,
      address: data.address.trim(),
      icon: newType === 'HOME' ? Home : newType === 'WORK' ? Briefcase : Bookmark
    };
    setAddresses(prev => [newEntry, ...prev]);
    setShowAddModal(false);
    reset();
    Toast.show({ type: 'success', text1: 'Success', text2: 'Address saved!' });
  };

  const renderItem = ({ item }) => {
    const Icon = item.icon || Bookmark; // Fallback to Bookmark
    return (
      <View style={styles.addressCard}>
        <View style={styles.iconBox}>
          <Icon size={20} color="#2563EB" />
        </View>
        <View style={styles.addressInfo}>
          <Text style={styles.addressType}>{item.type}</Text>
          <Text style={styles.addressText} numberOfLines={2}>{item.address}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('saved_places', 'Saved Places')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={addresses}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MapPin size={48} color="#e2e8f0" />
            <Text style={styles.emptyText}>{t('no_saved_places', 'No saved places found')}</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.addFullBtn}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.addFullBtnText}>{t('add_new_address', 'Add New Address')}</Text>
      </TouchableOpacity>

      {/* Basic Add Address Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Place</Text>
                
                <View style={styles.typeSelector}>
                    {['HOME', 'WORK', 'OTHER'].map(type => (
                        <TouchableOpacity 
                            key={type} 
                            onPress={() => setNewType(type)}
                            style={[styles.typeBtn, newType === type && styles.typeBtnActive]}
                        >
                            <Text style={[styles.typeBtnText, newType === type && styles.typeBtnTextActive]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Controller
                    control={control}
                    name="address"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.textInput, errors.address && { borderColor: '#ef4444' }]}
                            placeholder="Enter full address"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            multiline
                        />
                    )}
                />
                {errors.address && <Text style={{ color: '#ef4444', fontSize: 11, marginTop: -16, marginBottom: 20, fontWeight: 'bold' }}>{errors.address.message}</Text>}

                <View style={styles.modalActions}>
                    <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSubmit(handleAddAddress)} style={styles.confirmBtn}>
                        <Text style={styles.confirmBtnText}>SAVE PLACE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
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
  listContent: { padding: 20, paddingBottom: 100 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  addressInfo: { flex: 1 },
  addressType: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 2 },
  addressText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  deleteBtn: { padding: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  addFullBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#000',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5
  },
  addFullBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', width: '90%', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { flex: 1, height: 40, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  typeBtnActive: { backgroundColor: '#eff6ff', borderColor: '#2563EB' },
  typeBtnText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  typeBtnTextActive: { color: '#2563EB' },
  textInput: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 14, color: '#0f172a', height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 56, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  confirmBtn: { flex: 1, height: 56, borderRadius: 16, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' }
});
