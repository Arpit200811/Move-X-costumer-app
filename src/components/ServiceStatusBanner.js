import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Info, AlertTriangle, ZapOff } from 'lucide-react-native';

const ServiceStatusBanner = ({ status }) => {
  if (status === 'serviceable' || status === 'checking') return null;

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.iconContainer}>
          <ZapOff size={16} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Neural Interface Status: Disconnected</Text>
          <Text style={styles.subtitle}>Sorry, MoveX mission protocols are not active in this sector yet.</Text>
        </View>
        <View style={styles.badge}>
            <Text style={styles.badgeText}>OUT OF ZONE</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  banner: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  }
});

export default ServiceStatusBanner;
