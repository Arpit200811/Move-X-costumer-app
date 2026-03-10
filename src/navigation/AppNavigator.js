import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import VerificationScreen from "../screens/VerificationScreen";
import HomeScreen from "../screens/HomeScreen";
import CreateOrderScreen from "../screens/CreateOrderScreen";
import TrackingScreen from "../screens/TrackingScreen";
import PaymentScreen from "../screens/PaymentScreen";
import ConfirmationScreen from "../screens/ConfirmationScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import SavedAddressesScreen from "../screens/SavedAddressesScreen";
import SupportScreen from "../screens/SupportScreen";
import OrderHistoryScreen from "../screens/OrderHistoryScreen";
import GroupOrderScreen from "../screens/GroupOrderScreen";
import NotificationScreen from "../screens/NotificationScreen";
import ReferralScreen from "../screens/ReferralScreen";
import WalletScreen from "../screens/WalletScreen";
import LegalScreen from "../screens/LegalScreen";
import ChatScreen from "../screens/ChatScreen";
import RatingScreen from "../screens/RatingScreen";
import FoodDeliveryScreen from "../screens/FoodDeliveryScreen";
import PharmacyScreen from "../screens/PharmacyScreen";
import StoreMenuScreen from "../screens/StoreMenuScreen";
import CartCheckoutScreen from "../screens/CartCheckoutScreen";
import GroceryScreen from "../screens/GroceryScreen";
import RideScreen from "../screens/RideScreen";
import ParcelScreen from "../screens/ParcelScreen";
import SearchScreen from "../screens/SearchScreen";
import TicketsScreen from "../screens/TicketsScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="GroupOrder" component={GroupOrderScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      <Stack.Screen name="FoodDelivery" component={FoodDeliveryScreen} />
      <Stack.Screen name="Pharmacy" component={PharmacyScreen} />
      <Stack.Screen name="StoreMenu" component={StoreMenuScreen} />
      <Stack.Screen name="CartCheckout" component={CartCheckoutScreen} />
      <Stack.Screen name="Grocery" component={GroceryScreen} />
      <Stack.Screen name="Ride" component={RideScreen} />
      <Stack.Screen name="Parcel" component={ParcelScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Tickets" component={TicketsScreen} />
    </Stack.Navigator>
  );
}
