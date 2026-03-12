import 'react-native-gesture-handler';
import './src/global.css';
import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import './src/i18n'; 
import { Provider as PaperProvider } from 'react-native-paper';
// import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync, subscribeToNotifications } from './src/services/notifications';

/*
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",
  tracesSampleRate: 1.0,
});
*/

const queryClient = new QueryClient();

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
    <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
            <StripeProvider publishableKey={STRIPE_KEY}>
                <PaperProvider>
                    <NavigationContainer>
                        <AppNavigator />
                        <StatusBar style="auto" />
                    </NavigationContainer>
                    <Toast />
                </PaperProvider>
            </StripeProvider>
        </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
