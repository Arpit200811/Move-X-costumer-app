import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// 🔧 DEVICE CONFIG
//   • Running on Android Emulator  → keep DEVICE_IP = null
//   • Running on Physical Device   → set DEVICE_IP to your PC's LAN IP
//     (Run `ipconfig` on your PC, look for IPv4 under your WiFi adapter)
//     Example: const DEVICE_IP = '192.168.1.5';
// ─────────────────────────────────────────────────────────────
const DEVICE_IP = process.env.EXPO_PUBLIC_BACKEND_IP || '172.24.195.197'; 

const getBaseUrl = () => {
  // Priority 1: Environment Variable (Perfect for production/deployment)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // Priority 2: Manual Device IP (Best for physical device testing)
  if (DEVICE_IP && DEVICE_IP !== '10.0.2.2' && DEVICE_IP !== 'localhost') {
    return `http://${DEVICE_IP}:5000/api`;
  }

  // Priority 3: Emulator Fallbacks
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
};

export const API_URL = getBaseUrl();
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_URL.replace('/api', '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('movex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
