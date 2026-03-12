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
import Constants from 'expo-constants';
import { API_URL as ENV_API_URL, SOCKET_URL as ENV_SOCKET_URL } from '@env';

const getBaseUrl = () => {
  // 1. If we are in production (not dev mode), use the production URL
  if (!__DEV__) {
    return 'https://move-x-backend.onrender.com/api';
  }

  // 2. If an ENV_API_URL is provided, use it
  if (ENV_API_URL) return ENV_API_URL;

  // 3. Auto-detect Local IP for Physical Devices/Emulators
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost ? debuggerHost.split(':')[0] : '10.16.15.197'; 

  if (Platform.OS === 'android') {
    // If on physical device via debuggerHost, use that IP, else use local machine IP or loopback
    return debuggerHost ? `http://${localhost}:5000/api` : 'http://10.16.15.197:5000/api';
  }

  // iOS / Web / Other
  return `http://${localhost}:5000/api`;
};

export const API_URL = getBaseUrl();
export const SOCKET_URL = ENV_SOCKET_URL || API_URL.replace('/api', '');

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
