import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, Linking, TouchableOpacity, Image, Platform } from 'react-native';
import api from '../services/api';
import { ShieldAlert, RefreshCw, Smartphone, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Current App Version (Should match your app.json)
const CURRENT_VERSION = '1.1.1';

const StartupGuardian = ({ children }) => {
    const [status, setStatus] = useState('loading'); // 'loading' | 'active' | 'maintenance' | 'update' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        checkSystem();
    }, []);

    const checkSystem = async () => {
        try {
            const res = await api.get('/system/status');
            const { maintenanceMode, minVersion, latestVersion } = res.data;

            if (maintenanceMode) {
                setStatus('maintenance');
                return;
            }

            // Simple version check (Enterprise grade apps force updates)
            if (minVersion && isVersionOlder(CURRENT_VERSION, minVersion)) {
                setStatus('update');
                return;
            }

            setStatus('active');
        } catch (err) {
            console.error('System Health Check Failed:', err.message);
            // Default to active if health check fails but network is okay
            // Change this to 'error' if you want hard enforcement
            setStatus('active'); 
        }
    };

    const isVersionOlder = (current, min) => {
        const cParts = current.split('.').map(Number);
        const mParts = min.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (cParts[i] < mParts[i]) return true;
            if (cParts[i] > mParts[i]) return false;
        }
        return false;
    };

    if (status === 'loading') return null;

    return (
        <View style={{ flex: 1 }}>
            {children}

            {/* MAINTENANCE MODAL (Overlay) */}
            <Modal visible={status === 'maintenance'} transparent animationType="fade">
                <View style={styles.overlay}>
                    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.modalContent}>
                        <ShieldAlert size={80} color="#F59E0B" style={{ marginBottom: 20 }} />
                        <Text style={styles.title}>System Optimization</Text>
                        <Text style={styles.sub}>We are currently performing a standard neural link recalibration. We will be back online shortly.</Text>
                        <TouchableOpacity style={styles.btn} onPress={checkSystem}>
                             <Text style={styles.btnText}>Retry Core Link</Text>
                             <RefreshCw size={18} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </Modal>

            {/* FORCE UPDATE MODAL */}
            <Modal visible={status === 'update'} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.whiteModal}>
                        <Smartphone size={60} color="#2563EB" />
                        <Text style={[styles.title, { color: '#0f172a' }]}>New Protocol Available</Text>
                        <Text style={[styles.sub, { color: '#64748b' }]}>A critical architecture update (v1.2.0) is mandatory for continued service connectivity.</Text>
                        <TouchableOpacity 
                            style={[styles.btn, { backgroundColor: '#2563EB', width: '100%' }]} 
                            onPress={() => Linking.openURL('https://movex.com/download')}
                        >
                             <Text style={styles.btnText}>Update MoveX Core</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    modalContent: { width: '100%', borderRadius: 32, padding: 40, alignItems: 'center', borderWeight: 1, borderColor: 'rgba(255,255,255,0.1)' },
    whiteModal: { width: '100%', backgroundColor: '#fff', borderRadius: 32, padding: 40, alignItems: 'center' },
    title: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 15 },
    sub: { color: 'rgba(255,255,255,0.7)', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    btn: { backgroundColor: '#2563EB', paddingHorizontal: 30, paddingVertical: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});

export default StartupGuardian;
