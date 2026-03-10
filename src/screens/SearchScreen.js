import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    FlatList, SafeAreaView, StatusBar, 
    StyleSheet, ActivityIndicator, Image 
} from 'react-native';
import { 
    ChevronLeft, Search as SearchIcon, X, 
    MapPin, Clock, ArrowRight, Utensils, 
    Pill, Zap, ShoppingBag 
} from 'lucide-react-native';
import api from '../services/api';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const RECENT_SEARCHES = [
    { id: '1', term: 'Burger King', type: 'FOOD' },
    { id: '2', term: 'Paracetamol 500mg', type: 'PHARMACY' },
    { id: '3', term: 'Pizza Hut', type: 'FOOD' }
];

const SUGGESTIONS = [
    { id: '1', title: 'Food Delivery', icon: Utensils, color: '#ef4444' },
    { id: '2', title: 'Medicines', icon: Pill, color: '#10b981' },
    { id: '3', title: 'Groceries', icon: ShoppingBag, color: '#f59e0b' },
    { id: '4', title: 'Pick & Drop', icon: Zap, color: '#3b82f6' }
];

export default function SearchScreen({ navigation }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, FOOD, PHARMACY

    useEffect(() => {
        if (query.length > 2) {
            const delayDebounceFn = setTimeout(() => {
                fetchResults();
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setResults([]);
        }
    }, [query, activeTab]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            // Mocking a global search across different vendor types
            const res = await api.get(`/vendors?search=${query}${activeTab !== 'ALL' ? `&type=${activeTab}` : ''}`);
            setResults(res.data.vendors || []);
        } catch (err) {
            console.log('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderResult = ({ item }) => (
        <TouchableOpacity 
            style={styles.resultCard}
            onPress={() => navigation.navigate('StoreMenu', { vendor: item })}
        >
            <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591' }} style={styles.resultImg} />
            <View style={styles.resultInfo}>
                <View style={styles.resultHeader}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>{item.type}</Text>
                    </View>
                </View>
                <Text style={styles.resultMeta}>{item.tags?.join(', ') || 'Various items'}</Text>
                <View style={styles.resultFooter}>
                    <Clock size={12} color="#94a3b8" />
                    <Text style={styles.footerText}>{item.time || '20-30 min'}</Text>
                    <View style={styles.dot} />
                    <Text style={styles.footerText}>Nearby</Text>
                </View>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.searchWrapper}>
                    <SearchIcon size={20} color="#94a3b8" />
                    <TextInput 
                        style={styles.input}
                        placeholder="Search for food, medicine, items..."
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        placeholderTextColor="#94a3b8"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <X size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.tabBar}>
                {['ALL', 'FOOD', 'PHARMACY'].map(tab => (
                    <TouchableOpacity 
                        key={tab} 
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Searching across the city...</Text>
                </View>
            ) : query.length === 0 ? (
                <FlatList 
                    data={RECENT_SEARCHES}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={() => (
                        <View style={{ padding: 20 }}>
                            <Text style={styles.sectionTitle}>TRENDING SEARCHES</Text>
                            <View style={styles.suggestionGrid}>
                                {SUGGESTIONS.map((s, i) => (
                                    <TouchableOpacity key={i} style={styles.suggestionItem}>
                                        <View style={[styles.suggestIconBox, { backgroundColor: s.color + '15' }]}>
                                            <s.icon size={24} color={s.color} />
                                        </View>
                                        <Text style={styles.suggestTitle}>{s.title}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={[styles.sectionTitle, { marginTop: 40 }]}>RECENT SEARCHES</Text>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.recentItem} onPress={() => setQuery(item.term)}>
                            <Clock size={18} color="#94a3b8" />
                            <Text style={styles.recentText}>{item.term}</Text>
                            <ArrowRight size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    )}
                />
            ) : results.length > 0 ? (
                <FlatList 
                    data={results}
                    keyExtractor={item => item._id}
                    renderItem={renderResult}
                    contentContainerStyle={{ padding: 20 }}
                />
            ) : (
                <View style={styles.centered}>
                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134065.png' }} style={styles.emptyImg} />
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptySub}>Try searching for something else</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    searchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', height: 52, borderRadius: 16, paddingHorizontal: 16 },
    input: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#1e293b' },
    tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 10 },
    tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
    activeTab: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    tabText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
    activeTabText: { color: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { marginTop: 16, color: '#64748b', fontWeight: '600' },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 20 },
    suggestionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },
    suggestionItem: { width: '47%', backgroundColor: '#fff', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    suggestIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    suggestTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
    recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    recentText: { flex: 1, marginLeft: 16, fontSize: 15, fontWeight: '600', color: '#475569' },
    resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    resultImg: { width: 60, height: 60, borderRadius: 12 },
    resultInfo: { flex: 1, marginLeft: 16 },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    resultName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    typeBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    typeText: { fontSize: 9, fontWeight: '800', color: '#2563EB' },
    resultMeta: { fontSize: 13, color: '#64748b', marginBottom: 8 },
    resultFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' },
    emptyImg: { width: 120, height: 120, marginBottom: 20, opacity: 0.5 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 4 }
});
