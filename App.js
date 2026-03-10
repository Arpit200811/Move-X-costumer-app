import 'react-native-gesture-handler';
import './src/global.css';
import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import './src/i18n'; 
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync, subscribeToNotifications } from './src/services/notifications';

LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
  'Warning: InteractionManager',
  'SafeAreaView has been deprecated',
]);

// Load Stripe key from .env (EXPO_PUBLIC_ prefix makes it accessible in RN)
const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_MockKey12345';

export default function App() {
  React.useEffect(() => {
    registerForPushNotificationsAsync();

    const subscription = subscribeToNotifications();

    return () => {
        if (subscription && subscription.remove) subscription.remove();
    };
  }, []);

  return (
    <StripeProvider publishableKey={STRIPE_KEY}>
        <PaperProvider>
            <NavigationContainer>
                <AppNavigator />
                <StatusBar style="auto" />
            </NavigationContainer>
        </PaperProvider>
    </StripeProvider>
  );
}
