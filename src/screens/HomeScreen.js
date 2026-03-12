import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
  useColorScheme,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  Search as SearchIcon,
  Bell,
  MapPin,
  Zap,
  Package,
  ShoppingBag,
  Utensils,
  Pill,
  ChevronDown,
  Navigation,
  Users,
  Star,
  Crown,
  Flame,
  Heart,
  ChevronRight,
  ScanLine,
  Clock,
  ShieldCheck,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { registerForPushNotificationsAsync } from "../services/notifications";
import Skeleton from "../components/Skeleton";

const { width } = Dimensions.get("window");

// Images combining premium Uber/Zomato/Rapido aesthetics
const SERVICES = [
  {
    id: "ride",
    label: "Ride",
    icon: Navigation,
    img: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400",
    color: "#000000",
    badge: "Uber",
  },
  {
    id: "bike",
    label: "Bike",
    icon: Zap,
    img: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400",
    color: "#F6C90E",
    badge: "Rapido",
  },
  {
    id: "food",
    label: "Food",
    icon: Utensils,
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
    color: "#E23744",
    badge: "Zomato",
  },
  {
    id: "grocery",
    label: "Grocery",
    icon: ShoppingBag,
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
    color: "#00BFA5",
    badge: "Blinkit",
  },
  {
    id: "parcel",
    label: "Parcel",
    icon: Package,
    img: "https://images.unsplash.com/photo-1617500588147-38011244e8da?w=400",
    color: "#2563EB",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    icon: Pill,
    img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    color: "#22c55e",
  },
];

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = {
    bg: isDark ? "#020617" : "#ffffff",
    card: isDark ? "#0f172a" : "#ffffff",
    text: isDark ? "#f8fafc" : "#0f172a",
    subtext: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#1e293b" : "#e2e8f0",
  };

  const [locationName, setLocationName] = useState("Locating...");
  const [activeOrders, setActiveOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userFirstName, setUserFirstName] = useState("Guest");

  const fetchActiveOrders = useCallback(async () => {
    try {
      const res = await api.get("/orders/my");
      const orders = res.data.orders || [];
      const TERMINAL = ["DELIVERED", "CANCELLED", "REJECTED", "FAILED"];
      setActiveOrders(orders.filter((o) => !TERMINAL.includes(o.status)));
    } catch (_) {}
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      const rawUser = await AsyncStorage.getItem("movex_user");
      if (mounted && rawUser) {
        const u = JSON.parse(rawUser);
        setUserFirstName(u.name?.split(" ")[0] || "User");
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let loc = await Location.getCurrentPositionAsync({});
        let geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (mounted && geocode.length > 0) {
          setLocationName(
            `${geocode[0].name || geocode[0].street || "Current"}, ${geocode[0].city || ""}`,
          );
        }
      }

      await fetchActiveOrders();
      setIsLoading(false);
      registerForPushNotificationsAsync();
    })();

    const pollInterval = setInterval(fetchActiveOrders, 30000);
    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [fetchActiveOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActiveOrders().then(() => setRefreshing(false));
  }, [fetchActiveOrders]);

  const navigateToService = (id) => {
    if (id === "tickets") {
      navigation.navigate("Tickets");
      return;
    }
    if (id === "ride" || id === "bike") navigation.navigate("Ride");
    else if (id === "food") navigation.navigate("FoodDelivery");
    else if (id === "grocery") navigation.navigate("Grocery");
    else if (id === "pharmacy") navigation.navigate("Pharmacy");
    else if (id === "parcel") navigation.navigate("Parcel");
    else navigation.navigate("CreateOrder", { type: id.toUpperCase() });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />

      {/* HEADER (Zomato Style) */}
      <View style={[styles.header, { backgroundColor: theme.bg }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MapPin size={18} color="#fff" />
          </View>
          <TouchableOpacity 
            style={styles.locationContainer}
            onPress={() => navigation.navigate("Search")}
          >
            <View style={styles.locationRow}>
              <Text style={[styles.locationLabel, { color: theme.text }]}>
                {t("home", "Home")}{" "}
              </Text>
              <ChevronDown size={16} color={theme.text} strokeWidth={3} />
            </View>
            <Text
              style={[styles.locationDetail, { color: theme.subtext }]}
              numberOfLines={1}
            >
              {locationName}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <ScanLine size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate("Profile")}
          >
            <View style={styles.profileBtnInner}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${userFirstName}&background=2563EB&color=fff&bold=true`,
                }}
                style={styles.profileImg}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* SEARCH BAR */}
        <View style={styles.searchWrapper}>
          <TouchableOpacity
            style={[
              styles.searchContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => navigation.navigate("Search")}
          >
            <SearchIcon size={22} color="#f43f5e" style={{ marginRight: 12 }} />
            <Text style={[styles.searchText, { color: theme.subtext }]}>
              {t("search_hint", "Restaurant name or dish...")}
            </Text>
            <View style={styles.searchDivider} />
            <View style={styles.micIcon}>
              <Zap size={18} color="#f43f5e" />
            </View>
          </TouchableOpacity>
        </View>

        {/* UBER / RAPIDO SUPER GRID */}
        <View style={styles.superGrid}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            Explore <Text style={{ color: "#2563EB" }}>MoveX</Text>
          </Text>
          {/* Top Row: Big Cards */}
          <View style={styles.superRowTop}>
            <TouchableOpacity
              style={[styles.bigCard, { backgroundColor: "#000" }]}
              onPress={() => navigateToService("tickets")}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80",
                }}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={[styles.bigCardTitle, { color: "#fff" }]}>
                Book Tickets
              </Text>
              <Image
                source={{
                  uri: "https://cdn3d.iconscout.com/3d/premium/thumb/ticket-4993657-4159583.png",
                }}
                style={styles.bigCardImgObj}
              />
              <View style={[styles.arrowCircle, { backgroundColor: "#fff" }]}>
                <ChevronRight size={14} color="#000" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bigCard, { backgroundColor: "#000" }]}
              onPress={() => navigateToService("food")}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
                }}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={[styles.bigCardTitle, { color: "#fff" }]}>
                MoveX Food
              </Text>
              <Image
                source={{
                  uri: "https://cdn3d.iconscout.com/3d/premium/thumb/burger-4993510-4160451.png",
                }}
                style={styles.bigCardImgObj}
              />
              <View
                style={[styles.arrowCircle, { backgroundColor: "#E23744" }]}
              >
                <ChevronRight size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Middle Row: Medium Cards */}
          <View style={styles.superRowMid}>
            <TouchableOpacity
              style={[styles.midCard, { backgroundColor: "#000" }]}
              onPress={() => navigateToService("bike")}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80",
                }}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={[styles.midCardTitle, { color: "#fff" }]}>
                MoveX Bike
              </Text>
              <Image
                source={{
                  uri: "https://cdn3d.iconscout.com/3d/premium/thumb/motorcycle-4993513-4160454.png",
                }}
                style={styles.midCardImgObj}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.midCard, { backgroundColor: "#000" }]}
              onPress={() => navigateToService("grocery")}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
                }}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={[styles.midCardTitle, { color: "#fff" }]}>
                MoveX Grocery
              </Text>
              <Image
                source={{
                  uri: "https://cdn3d.iconscout.com/3d/premium/thumb/grocery-bag-4993516-4160457.png",
                }}
                style={styles.midCardImgObj}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.midCard, { backgroundColor: "#000" }]}
              onPress={() => navigateToService("parcel")}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1617500588147-38011244e8da?w=600&q=80",
                }}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={[styles.midCardTitle, { color: "#fff" }]}>
                MoveX Parcel
              </Text>
              <Image
                source={{
                  uri: "https://cdn3d.iconscout.com/3d/premium/thumb/delivery-box-4993515-4160456.png",
                }}
                style={styles.midCardImgObj}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ONGOING ORDER (Zomato Style Floating Tracker) */}
        {activeOrders.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.activeOrderWrapper}
            onPress={() =>
              navigation.navigate("Tracking", { order: activeOrders[0] })
            }
          >
            <LinearGradient
              colors={["#2563EB", "#1e40af"]}
              style={styles.activeOrderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.activePulseIndicator} />
              <View style={{ flex: 1, paddingLeft: 16 }}>
                <Text style={styles.activeOrderTag}>LIVE TRACKING</Text>
                <Text style={styles.activeOrderTitle}>
                  {activeOrders[0].status} 🚀
                </Text>
                <Text style={styles.activeOrderSub}>
                  Arriving in ~{activeOrders[0].duration || "10"} mins
                </Text>
              </View>
              <View style={styles.activeOrderAction}>
                <Navigation size={22} color="#fff" fill="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* PREMIUM BANNERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannersScroll}
        >
          <TouchableOpacity style={styles.premiumBanner}>
            <LinearGradient
              colors={["#000000", "#1a1a1a"]}
              style={styles.bannerInner}
            >
              <View style={styles.bannerContent}>
                <View style={styles.badgeView}>
                  <Text style={styles.badgeTextWhite}>MoveX One</Text>
                </View>
                <Text style={styles.bannerTitleWhite}>
                  Free deliveries & up to 30% off rides.
                </Text>
                <Text style={styles.bannerSubWhite}>Join the elite club</Text>
              </View>
              <Crown
                size={70}
                color="rgba(255,255,255,0.08)"
                strokeWidth={1}
                style={{ position: "absolute", right: -15, bottom: -15 }}
              />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.premiumBanner}>
            <LinearGradient
              colors={["#FEF3C7", "#FDE68A"]}
              style={styles.bannerInner}
            >
              <View style={styles.bannerContent}>
                <View style={styles.badgeViewDark}>
                  <Text style={styles.badgeTextDark}>MoveX Rewards</Text>
                </View>
                <Text style={styles.bannerTitleDark}>
                  Win up to ₹500 cashback daily
                </Text>
                <Text style={styles.bannerSubDark}>
                  Pay via UPI at checkout
                </Text>
              </View>
              <Zap
                size={70}
                color="rgba(0,0,0,0.04)"
                strokeWidth={1}
                style={{ position: "absolute", right: -15, bottom: -15 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* HOT PICKS IN YOUR AREA */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Top Rated <Text style={{ color: "#E23744" }}>Restaurants</Text>
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsScroll}
          >
            {isLoading ? (
              [1, 2, 3].map((_, i) => (
                <View key={i} style={[styles.brandCard, { backgroundColor: theme.card }]}>
                  <Skeleton width={160} height={100} borderRadius={16} />
                  <Skeleton width={100} height={15} borderRadius={4} style={{ marginTop: 8 }} />
                  <Skeleton width={60} height={10} borderRadius={4} style={{ marginTop: 4 }} />
                </View>
              ))
            ) : (
              [
                {
                  name: "MoveX Cafe",
                  img: "https://images.unsplash.com/photo-1544787210-2827448b3af3?w=400",
                  time: "15 mins",
                  discount: "50% OFF",
                },
                {
                  name: "MoveX Chicken",
                  img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400",
                  time: "25 mins",
                  discount: "FREE DELIVERY",
                },
                {
                  name: "MoveX Burger",
                  img: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400",
                  time: "20 mins",
                  discount: "60% OFF",
                },
              ].map((b, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.brandCard, { backgroundColor: theme.card }]}
                >
                  <View style={styles.brandImgContainer}>
                    <Image source={{ uri: b.img }} style={styles.brandImg} />
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{b.discount}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Clock size={10} color="#000" />
                      <Text style={styles.timeText}>{b.time}</Text>
                    </View>
                  </View>
                  <Text style={[styles.brandName, { color: theme.text }]}>
                    {b.name}
                  </Text>
                  <View style={styles.brandMeta}>
                    <Star size={12} color="#16a34a" fill="#16a34a" />
                    <Text style={styles.brandRating}>4.5</Text>
                    <Text style={styles.brandDot}> • </Text>
                    <Text style={styles.brandPrice}>₹150 for one</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* SAFETY / TRUST BADGE */}
        <View
          style={[
            styles.trustBanner,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.trustIconBox}>
            <ShieldCheck size={26} color="#16a34a" />
          </View>
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Text style={[styles.trustTitle, { color: theme.text }]}>
              MoveX Safety Promise
            </Text>
            <Text style={[styles.trustSub, { color: theme.subtext }]}>
              End-to-end encrypted rides & 100% contactless food delivery.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  locationContainer: { flex: 1 },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationLabel: { fontSize: 18, fontWeight: "900" },
  locationDetail: { fontSize: 13, marginTop: 2, paddingRight: 20 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  headerIconBtn: { padding: 4 },
  profileBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileImg: { width: "100%", height: "100%" },

  searchWrapper: { paddingHorizontal: 16, marginTop: 12, marginBottom: 24 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  searchText: { flex: 1, fontSize: 15, fontWeight: "600" },
  searchDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  micIcon: { padding: 4 },

  superGrid: { paddingHorizontal: 16, marginBottom: 32 },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  superRowTop: { flexDirection: "row", gap: 12, marginBottom: 12 },
  bigCard: {
    flex: 1,
    height: 120,
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    position: "relative",
  },
  bigCardTitle: { fontSize: 20, fontWeight: "900", color: "#000" },
  bigCardImgObj: {
    position: "absolute",
    bottom: -5,
    right: -5,
    width: 90,
    height: 90,
    resizeMode: "contain",
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#000",
    position: "absolute",
    bottom: 16,
    left: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  superRowMid: { flexDirection: "row", gap: 12 },
  midCard: {
    flex: 1,
    height: 110,
    borderRadius: 20,
    padding: 12,
    position: "relative",
    overflow: "hidden",
  },
  midCardTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000",
    width: "80%",
  },
  midCardImgObj: {
    position: "absolute",
    bottom: -5,
    right: -5,
    width: 60,
    height: 60,
    resizeMode: "contain",
  },

  activeOrderWrapper: { paddingHorizontal: 16, marginBottom: 32 },
  activeOrderGradient: {
    borderRadius: 28,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  activePulseIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10b981",
    borderWidth: 3,
    borderColor: "#fff",
  },
  activeOrderTag: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  activeOrderTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  activeOrderSub: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    opacity: 0.9,
  },
  activeOrderAction: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  bannersScroll: { paddingHorizontal: 16, gap: 16, marginBottom: 40 },
  premiumBanner: {
    width: width * 0.8,
    height: 160,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  bannerInner: { flex: 1, padding: 24, position: "relative" },
  badgeView: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeViewDark: {
    backgroundColor: "rgba(0,0,0,0.05)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeTextWhite: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  badgeTextDark: {
    color: "#000",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  bannerTitleWhite: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    width: "85%",
    lineHeight: 28,
  },
  bannerSubWhite: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  bannerTitleDark: {
    color: "#000",
    fontSize: 22,
    fontWeight: "900",
    width: "85%",
    lineHeight: 28,
  },
  bannerSubDark: {
    color: "rgba(0,0,0,0.5)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },

  sectionContainer: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  seeAll: { fontSize: 14, fontWeight: "800", color: "#f43f5e" },
  brandsScroll: { paddingHorizontal: 16, gap: 16 },
  brandCard: { width: 160, borderRadius: 20, overflow: "hidden" },
  brandImgContainer: {
    width: "100%",
    height: 160,
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
  },
  brandImg: { width: "100%", height: "100%" },
  discountBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  timeBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: { color: "#000", fontSize: 11, fontWeight: "800" },
  brandName: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 14,
    paddingHorizontal: 4,
  },
  brandMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 4,
  },
  brandRating: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748b",
    marginLeft: 4,
  },
  brandDot: { color: "#cbd5e1", fontSize: 14 },
  brandPrice: { fontSize: 13, color: "#64748b", fontWeight: "600" },

  trustBanner: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  trustIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  trustTitle: { fontSize: 16, fontWeight: "900", marginBottom: 6 },
  trustSub: { fontSize: 13, lineHeight: 20, fontWeight: "500" },
});
