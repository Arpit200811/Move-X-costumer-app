import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
  useColorScheme,
  Platform,
  Animated,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import {
  ChevronLeft,
  Search as SearchIcon,
  Navigation as NavIcon,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Clapperboard,
  BusFront,
  Star,
  Heart,
  Flame,
  ShieldCheck,
  ChevronRight,
  Bell,
  Share2,
  Info,
  Filter,
  Users,
  Mic2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import api from "../services/api";

const { width } = Dimensions.get("window");

const TICKETS_CATEGORIES = [
  { id: "movies", label: "Movies", icon: Clapperboard, color: "#f43f5e" },
  { id: "bus", label: "Bus", icon: BusFront, color: "#3b82f6" },
  { id: "events", label: "Events", icon: Ticket, color: "#10b981" },
];

const GENRES = [
  "All",
  "Action",
  "Sci-Fi",
  "Comedy",
  "Romantic",
  "Horror",
  "Animation",
];

// Removed static hardcoded arrays to enforce real-backend fetching

export default function TicketsScreen({ navigation }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = {
    bg: isDark ? "#000000" : "#f8fafc",
    card: isDark ? "#111827" : "#ffffff",
    text: isDark ? "#f8fafc" : "#0f172a",
    subtext: isDark ? "#9ca3af" : "#64748b",
    border: isDark ? "#1f2937" : "#e2e8f0",
  };

  const [activeTab, setActiveTab] = useState("movies");
  const [activeGenre, setActiveGenre] = useState("All");
  const [busFrom, setBusFrom] = useState("New Delhi");
  const [busTo, setBusTo] = useState("Manali, HP");
  const [busDate, setBusDate] = useState("Sat, 15 Oct 2026");
  const [isSearchingBuses, setIsSearchingBuses] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Backend States
  const [ticketsData, setTicketsData] = useState({
    movies: { featured: [], showing: [] },
    buses: { offers: [], routes: [] },
    events: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    fetchTicketsData();
  }, []);

  const fetchTicketsData = async () => {
    try {
      const res = await api.get("/tickets/home");
      if (res.data?.success) {
        setTicketsData(res.data.data);
      }
    } catch (err) {
      console.log("Error fetching tickets config:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTicketsData();
  };

  const handleSearchBuses = async () => {
    if (!busFrom || !busTo) {
      Alert.alert("Missing Information", "Please enter both origin and destination cities.");
      return;
    }
    setIsSearchingBuses(true);
    try {
      const res = await api.get(`/tickets/search/buses?from=${busFrom}&to=${busTo}&date=${busDate}`);
      if (res.data?.success) {
        setSearchResults(res.data.routes);
      }
    } catch (err) {
      console.log("Error searching buses:", err);
      Alert.alert("Neural Link Error", "Unable to synchronize with bus network.");
    } finally {
      setIsSearchingBuses(false);
    }
  };

  const handleBooking = (title) => {
    Alert.alert(
      "Confirm Reservation",
      `Initialize booking sequence for "${title}"?`,
      [
        { text: "Abort", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            Alert.alert(
              "Success",
              "Ticket reservation initialized. Our agent will contact you shortly!",
            ),
        },
      ],
    );
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const MoviesSection = () => (
    <View style={styles.section}>
      {/* Genre Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genreScroll}
      >
        {GENRES.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[
              styles.genrePill,
              activeGenre === genre
                ? { backgroundColor: "#f43f5e", borderColor: "#f43f5e" }
                : { backgroundColor: "transparent", borderColor: theme.border },
            ]}
            onPress={() => setActiveGenre(genre)}
          >
            <Text
              style={[
                styles.genreText,
                activeGenre === genre
                  ? { color: "#fff" }
                  : { color: theme.text },
              ]}
            >
              {genre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Carousel */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredScroll}
      >
        {ticketsData?.movies?.featured?.map((movie) => (
          <TouchableOpacity
            key={movie.id}
            style={styles.featuredCard}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: movie.img }}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)", "#000"]}
              style={styles.featuredGradient}
            />
            <View style={styles.featuredContent}>
              <View style={styles.ratingRow}>
                <Star
                  size={14}
                  color="#f59e0b"
                  fill="#f59e0b"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.featuredRating}>{movie.rating}</Text>
                <Text style={styles.featuredVotes}>({movie.votes} votes)</Text>
              </View>
              <Text style={styles.featuredTitle}>{movie.title}</Text>
              <Text style={styles.featuredGenre}>
                {movie.genre} {movie.is3D ? "• 3D" : ""}
              </Text>
              <TouchableOpacity
                style={[
                  styles.bookBtn,
                  {
                    backgroundColor: "#f43f5e",
                    alignSelf: "flex-start",
                    paddingHorizontal: 24,
                    marginTop: 12,
                  },
                ]}
                onPress={() => handleBooking(movie.title)}
              >
                <Text style={styles.bookBtnText}>Book Tickets</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionHeading, { color: theme.text }]}>
          <Flame size={20} color="#f43f5e" fill="#f43f5e" /> Recommended Movies
        </Text>
        <Text style={styles.seeAll}>
          See All <ChevronRight size={14} color="#f43f5e" />
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moviesScroll}
      >
        {ticketsData?.movies?.showing?.map((movie) => (
          <TouchableOpacity
            key={movie.id}
            style={styles.movieCard}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.movieImgContainer,
                { backgroundColor: theme.border },
              ]}
            >
              <Image source={{ uri: movie.img }} style={styles.movieImg} />
              {movie.is3D && (
                <View style={styles.threeDBadge}>
                  <Text style={styles.threeDBadgeText}>3D / 2D</Text>
                </View>
              )}
              <View style={styles.compactRatingBadge}>
                <Star
                  size={10}
                  color="#f59e0b"
                  fill="#f59e0b"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.compactRatingText}>
                  {movie.rating} • {movie.votes}
                </Text>
              </View>
            </View>
            <Text
              style={[styles.movieTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {movie.title}
            </Text>
            <Text style={[styles.movieGenre, { color: theme.subtext }]}>
              {movie.genre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Premium MoveX Format Banner */}
      <View style={styles.imaxBanner}>
        <LinearGradient
          colors={["#0f172a", "#020617"]}
          style={styles.imaxGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.imaxTitle}>
              MoveX <Text style={{ color: "#f59e0b" }}>GOLD</Text>
            </Text>
            <Text style={styles.imaxSub}>
              Premium recliner seating with gourmet food service at your seat.
            </Text>
          </View>
          <Clapperboard
            size={48}
            color="rgba(255,255,255,0.1)"
            style={{ position: "absolute", right: -10, bottom: -10 }}
          />
        </LinearGradient>
      </View>
    </View>
  );

  const BusSection = () => (
    <View style={styles.section}>
      {/* Bus Offers */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.offersScroll}
      >
        {ticketsData?.buses?.offers?.map((offer) => (
          <TouchableOpacity key={offer.id} style={styles.offerCard}>
            <LinearGradient
              colors={[offer.color1, offer.color2]}
              style={styles.offerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.offerIconCircle}>
                <Ticket size={24} color={offer.color1} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <View style={styles.offerCodeBox}>
                  <Text style={styles.offerCode}>{offer.code}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Heavy Search Box */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: isDark ? "#000" : "#64748b",
          },
        ]}
      >
        <View style={styles.heavySearchRow}>
          <NavIcon size={20} color={theme.subtext} />
          <View style={styles.heavyInputArea}>
            <Text style={[styles.heavyLabel, { color: theme.subtext }]}>
              Leaving from
            </Text>
            <TextInput
              style={[styles.heavyValue, { color: theme.text }]}
              value={busFrom}
              onChangeText={setBusFrom}
              placeholder="Enter Origin"
              placeholderTextColor={theme.subtext}
            />
          </View>
        </View>

        <View style={styles.swapBtnContainer}>
          <View style={[styles.dashedLine, { borderColor: theme.border }]} />
          <TouchableOpacity
            style={[
              styles.heavySwapBtn,
              { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
            onPress={() => {
              const temp = busFrom;
              setBusFrom(busTo);
              setBusTo(temp);
            }}
          >
            <MapPin
              size={16}
              color="#3b82f6"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.heavySearchRow}>
          <MapPin size={20} color="#f43f5e" />
          <View style={styles.heavyInputArea}>
            <Text style={[styles.heavyLabel, { color: theme.subtext }]}>
              Going to
            </Text>
            <TextInput
              style={[styles.heavyValue, { color: theme.text }]}
              value={busTo}
              onChangeText={setBusTo}
              placeholder="Enter Destination"
              placeholderTextColor={theme.subtext}
            />
          </View>
        </View>

        <View
          style={[styles.solidDivider, { backgroundColor: theme.border }]}
        />

        <View style={styles.heavySearchRow}>
          <Calendar size={20} color="#10b981" />
          <View style={styles.heavyInputArea}>
            <Text style={[styles.heavyLabel, { color: theme.subtext }]}>
              Date of Journey
            </Text>
            <TextInput
              style={[styles.heavyValue, { color: theme.text }]}
              value={busDate}
              onChangeText={setBusDate}
              placeholder="Select Date"
              placeholderTextColor={theme.subtext}
            />
          </View>
          <View style={styles.quickDateRow}>
            <TouchableOpacity
              style={[styles.quickDateBtn, { backgroundColor: "#eff6ff" }]}
              onPress={() => setBusDate("Today")}
            >
              <Text style={[styles.quickDateText, { color: "#3b82f6" }]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickDateBtn,
                { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" },
              ]}
              onPress={() => setBusDate("Tomorrow")}
            >
              <Text style={[styles.quickDateText, { color: theme.text }]}>
                Tmrw
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.searchBusBtn, { backgroundColor: "#3b82f6" }]}
          activeOpacity={0.8}
          onPress={handleSearchBuses}
          disabled={isSearchingBuses}
        >
          {isSearchingBuses ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchBusText}>FIND BUSES</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionHeading, { color: theme.text }]}>
          {searchResults.length > 0 ? "Search Results" : "Trending Routes"}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {(searchResults.length > 0 ? searchResults : ticketsData?.buses?.routes || []).map((bus) => (
          <TouchableOpacity
            key={bus.id}
            style={[
              styles.busCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            activeOpacity={0.9}
            onPress={() => handleBooking(`${bus.operator} to ${bus.to}`)}
          >
            <View style={styles.busHeader}>
              <View>
                <Text style={[styles.operatorName, { color: theme.text }]}>
                  {bus.operator}
                </Text>
                <Text style={styles.busType}>{bus.type}</Text>
              </View>
              <View style={styles.busRating}>
                <Star
                  size={10}
                  color="#fff"
                  fill="#fff"
                  style={{ marginRight: 2 }}
                />
                <Text style={styles.busRatingText}>{bus.rating}</Text>
              </View>
            </View>

            <View style={styles.busTimeRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.busTime, { color: theme.text }]}>
                  {bus.departure}
                </Text>
                <Text style={styles.busCity}>{bus.from}</Text>
              </View>
              <View style={styles.busDurationBox}>
                <Text style={styles.busDurationText}>{bus.duration}</Text>
                <View style={styles.busLine}>
                  <View style={styles.busLineDot} />
                </View>
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.busTime, { color: theme.text }]}>
                  {bus.arrival}
                </Text>
                <Text style={styles.busCity}>{bus.to}</Text>
              </View>
            </View>

            <View style={[styles.busFooter, { borderTopColor: theme.border }]}>
              <View style={styles.amenities}>
                {bus.amenities?.map((am, i) => (
                  <View
                    key={i}
                    style={[
                      styles.amenityBadge,
                      { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" },
                    ]}
                  >
                    <Text
                      style={[styles.amenityText, { color: theme.subtext }]}
                    >
                      {am}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.busPriceSub}>Starts from</Text>
                <Text style={styles.busPrice}>{bus.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {searchResults.length > 0 && (
          <TouchableOpacity 
            style={{ padding: 12, alignItems: 'center' }}
            onPress={() => setSearchResults([])}
          >
            <Text style={{ color: '#3b82f6', fontWeight: '700' }}>Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const EventsSection = () => (
    <View style={styles.section}>
      {/* City Selector */}
      <View style={styles.eventCityHeader}>
        <Text style={[styles.eventCityTitle, { color: theme.text }]}>
          Events in
        </Text>
        <TouchableOpacity style={styles.eventCitySelector}>
          <Text style={styles.eventCitySelectorText}>Mumbai</Text>
          <MapPin size={16} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 24, paddingBottom: 32 }}>
        {ticketsData?.events?.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={[
              styles.eventCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            activeOpacity={0.9}
          >
            <View style={styles.eventImgWrapper}>
              <Image source={{ uri: event.img }} style={styles.eventImg} />
              <LinearGradient
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]}
                style={styles.eventGradient}
              />
              <View style={styles.eventCategoryBadge}>
                {event.category === "Music" ? (
                  <Mic2 size={12} color="#fff" />
                ) : (
                  <Users size={12} color="#fff" />
                )}
                <Text style={styles.eventCategoryText}>{event.category}</Text>
              </View>
            </View>
            <View style={styles.eventInfo}>
              <Text style={[styles.eventDate, { color: "#10b981" }]}>
                {event.date} • {event.time}
              </Text>
              <Text style={[styles.eventTitle, { color: theme.text }]}>
                {event.title}
              </Text>
              <Text
                style={[styles.eventVenue, { color: theme.subtext }]}
                numberOfLines={1}
              >
                {event.venue}
              </Text>

              <View
                style={[styles.eventFooter, { borderTopColor: theme.border }]}
              >
                <Text style={[styles.eventPrice, { color: theme.text }]}>
                  {event.price}
                </Text>
                <TouchableOpacity
                  style={[styles.bookBtn, { backgroundColor: "#10b981" }]}
                  onPress={() => handleBooking(event.title)}
                >
                  <Text style={styles.bookBtnText}>Buy Tickets</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />

      {/* Sticky Animated Header Box */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            backgroundColor: theme.card,
            opacity: headerOpacity,
            borderBottomColor: theme.border,
            borderBottomWidth: 1,
          },
        ]}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: isDark ? "#1e293b" : "#fff",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          MoveX{" "}
          <Text
            style={{
              color:
                activeTab === "bus"
                  ? "#3b82f6"
                  : activeTab === "events"
                    ? "#10b981"
                    : "#f43f5e",
            }}
          >
            Tickets
          </Text>
        </Text>
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: isDark ? "#1e293b" : "#fff",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
            },
          ]}
        >
          <SearchIcon size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TICKETS_CATEGORIES.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabBtn,
                isActive
                  ? { backgroundColor: tab.color }
                  : { backgroundColor: isDark ? "#1f2937" : "#f1f5f9" },
                !isActive && { borderWidth: 1, borderColor: theme.border },
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <tab.icon
                size={16}
                color={isActive ? "#fff" : theme.subtext}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  isActive ? { color: "#fff" } : { color: theme.subtext },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#f43f5e" />
          <Text
            style={{ marginTop: 12, color: theme.subtext, fontWeight: "600" }}
          >
            Loading world class experiences...
          </Text>
        </View>
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f43f5e"
            />
          }
        >
          {activeTab === "movies" && <MoviesSection />}
          {activeTab === "bus" && <BusSection />}
          {activeTab === "events" && <EventsSection />}
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 10,
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "android" ? 110 : 90,
    zIndex: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },

  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 4,
    gap: 12,
    zIndex: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
  },
  tabText: { fontSize: 13, fontWeight: "800" },

  section: { flex: 1, paddingTop: 8 },

  genreScroll: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 24,
    paddingRight: 32,
  },
  genrePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  genreText: { fontSize: 13, fontWeight: "700" },

  featuredScroll: { paddingHorizontal: 16, gap: 16, marginBottom: 32 },
  featuredCard: {
    width: width - 32,
    height: 450,
    borderRadius: 32,
    overflow: "hidden",
  },
  featuredGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  featuredContent: { position: "absolute", bottom: 30, left: 24, right: 24 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  featuredRating: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginRight: 6,
  },
  featuredVotes: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  featuredTitle: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 4,
  },
  featuredGenre: { color: "#fbbf24", fontSize: 14, fontWeight: "700" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    flexDirection: "row",
    alignItems: "center",
  },
  seeAll: {
    color: "#f43f5e",
    fontSize: 14,
    fontWeight: "800",
    alignItems: "center",
  },

  moviesScroll: { paddingHorizontal: 16, gap: 16, paddingBottom: 32 },
  movieCard: { width: 140 },
  movieImgContainer: {
    width: 140,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
  },
  movieImg: { width: "100%", height: "100%" },
  threeDBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  threeDBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  compactRatingBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  compactRatingText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  movieTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  movieGenre: { fontSize: 12, fontWeight: "500", paddingHorizontal: 4 },

  imaxBanner: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 32,
  },
  imaxGradient: { padding: 24, flexDirection: "row", alignItems: "center" },
  imaxTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 8,
  },
  imaxSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    width: "85%",
  },

  // BUS STYLES
  offersScroll: { paddingHorizontal: 16, gap: 16, marginBottom: 24 },
  offerCard: {
    width: width * 0.75,
    height: 80,
    borderRadius: 20,
    overflow: "hidden",
  },
  offerGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  offerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  offerTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },
  offerCodeBox: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offerCode: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  searchBox: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  heavySearchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  heavyInputArea: { marginLeft: 16, flex: 1 },
  heavyLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  heavyValue: { fontSize: 22, fontWeight: "900" },
  swapBtnContainer: { height: 30, justifyContent: "center" },
  dashedLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 10,
    borderLeftWidth: 1,
    borderStyle: "dashed",
  },
  heavySwapBtn: {
    position: "absolute",
    left: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  solidDivider: { height: 1, marginVertical: 8 },
  quickDateRow: { flexDirection: "row", gap: 8 },
  quickDateBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  quickDateText: { fontSize: 12, fontWeight: "800" },
  searchBusBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  searchBusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },

  busCard: { padding: 20, borderRadius: 24, borderWidth: 1 },
  busHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  operatorName: { fontSize: 16, fontWeight: "900", marginBottom: 4 },
  busRating: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  busRatingText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  busType: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  busTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  busTime: { fontSize: 24, fontWeight: "900", marginBottom: 4 },
  busCity: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  busDurationBox: { flex: 2, alignItems: "center", marginHorizontal: 16 },
  busDurationText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "700",
    marginBottom: 4,
  },
  busLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  busLineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#94a3b8",
  },
  busFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 16,
  },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 },
  amenityBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  amenityText: { fontSize: 10, fontWeight: "700" },
  busPriceSub: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 2,
  },
  busPrice: { fontSize: 24, fontWeight: "900", color: "#3b82f6" },

  // EVENTS STYLES
  eventCityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  eventCityTitle: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  eventCitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  eventCitySelectorText: {
    color: "#f43f5e",
    fontSize: 14,
    fontWeight: "800",
    marginRight: 6,
  },

  eventCard: { borderRadius: 28, borderWidth: 1, overflow: "hidden" },
  eventImgWrapper: { width: "100%", height: 220, position: "relative" },
  eventImg: { width: "100%", height: "100%" },
  eventGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  eventCategoryBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  eventCategoryText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
    textTransform: "uppercase",
  },
  eventInfo: { padding: 20 },
  eventDate: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  eventTitle: { fontSize: 20, fontWeight: "900", marginBottom: 8 },
  eventVenue: { fontSize: 14, fontWeight: "500", marginBottom: 20 },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 16,
  },
  eventPrice: { fontSize: 20, fontWeight: "900" },
  bookBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  bookBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
