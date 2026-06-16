import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Dimensions, FlatList, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackItem } from "@/components/TrackItem";
import { TrackMenu } from "@/components/TrackMenu";
import { usePlayer } from "@/context/PlayerContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { searchTracks, Track } from "@/services/musicApi";

const { width: SW } = Dimensions.get("window");

const CATEGORIES = [
  { label: "Pop",         color1: "#C62828", color2: "#E53935", icon: "star" },
  { label: "Hip-Hop",    color1: "#4527A0", color2: "#7E57C2", icon: "mic" },
  { label: "Eletrônica", color1: "#0277BD", color2: "#29B6F6", icon: "zap" },
  { label: "Rock",       color1: "#BF360C", color2: "#FF7043", icon: "radio" },
  { label: "Jazz",       color1: "#E65100", color2: "#FFA726", icon: "music" },
  { label: "Acústico",   color1: "#2E7D32", color2: "#66BB6A", icon: "feather" },
  { label: "Ambiente",   color1: "#00695C", color2: "#26A69A", icon: "wind" },
  { label: "Clássico",   color1: "#4E342E", color2: "#A1887F", icon: "play-circle" },
  { label: "R&B",        color1: "#880E4F", color2: "#EC407A", icon: "heart" },
  { label: "Lo-fi",      color1: "#1A237E", color2: "#5C6BC0", icon: "headphones" },
  { label: "Brasil",     color1: "#1B5E20", color2: "#43A047", icon: "globe" },
  { label: "Latina",     color1: "#F57F17", color2: "#FFCA28", icon: "sun" },
  { label: "K-Pop",      color1: "#AD1457", color2: "#F06292", icon: "star" },
  { label: "Funk",       color1: "#6A1B9A", color2: "#AB47BC", icon: "volume-2" },
  { label: "Sertanejo",  color1: "#4E342E", color2: "#8D6E63", icon: "music" },
  { label: "Reggae",     color1: "#1B5E20", color2: "#FDD835", icon: "sun" },
];

const TILE_W = (SW - 48) / 2;

const POPULAR_ARTISTS = [
  "Drake", "Taylor Swift", "Bad Bunny", "The Weeknd", "Billie Eilish",
  "Anitta", "Eminem", "Rihanna", "Ariana Grande", "Post Malone",
  "Dua Lipa", "Ed Sheeran", "Beyoncé", "Coldplay", "Mc Hariel",
  "Ludmilla", "Matuê", "Xamã", "WC no Beat",
];

interface CategoryTileProps {
  label: string;
  color1: string;
  color2: string;
  icon: string;
  onPress: () => void;
  active: boolean;
}

function CategoryTile({ label, color1, color2, icon, onPress, active }: CategoryTileProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[styles.tile, { width: TILE_W }]}>
      <LinearGradient
        colors={[color1, color2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.tileGrad, active && styles.tileActive]}
      >
        <Text style={styles.tileLabel}>{label}</Text>
        <View style={styles.tileIconWrap}>
          <Feather name={icon as any} size={36} color="rgba(255,255,255,0.35)" />
        </View>
        {active && (
          <View style={styles.tileCheck}>
            <Feather name="check" size={14} color="#fff" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const colors = useColors();
  const { accent } = useTheme();
  const insets = useSafeAreaInsets();
  const { play, currentTrack, isPlaying } = usePlayer();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [catTracks, setCatTracks] = useState<Track[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const r = await searchTracks(q.trim(), 40);
    setResults(r);
    setSearching(false);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim()) {
      setSearching(true);
      debounceRef.current = setTimeout(() => doSearch(query), 500);
    } else {
      setResults([]);
      setSearching(false);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const selectCategory = async (cat: typeof CATEGORIES[0]) => {
    if (activeCategory === cat.label) { setActiveCategory(null); setCatTracks([]); return; }
    setActiveCategory(cat.label);
    setCatLoading(true);
    const tracks = await searchTracks(cat.label.toLowerCase(), 30);
    setCatTracks(tracks);
    setCatLoading(false);
  };

  const clearSearch = () => { setQuery(""); setResults([]); };
  const bottomPad = (Platform.OS === "ios" ? insets.bottom + 49 : Platform.OS === "web" ? 80 : 49) + 88;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Buscar</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Artistas, músicas, gêneros..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searching ? (
            <ActivityIndicator size="small" color={accent.primary} />
          ) : query.length > 0 ? (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {query.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>
                {results.length} resultado{results.length !== 1 ? "s" : ""} para "{query}"
              </Text>
            ) : null
          }
          ListEmptyComponent={
            !searching ? (
              <View style={styles.emptyWrap}>
                <Feather name="search" size={56} color={colors.mutedForeground + "60"} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sem resultados</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Nenhuma música encontrada para "{query}".{"\n"}Tente outro termo.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              isActive={currentTrack?.id === item.id}
              isPlaying={currentTrack?.id === item.id && isPlaying}
              onPress={() => play(item, results)}
              onMore={() => setMenuTrack(item)}
            />
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
          {/* Popular artists chips */}
          <Text style={[styles.browseTitle, { color: colors.foreground }]}>Artistas populares</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }}
          >
            {POPULAR_ARTISTS.map(artist => (
              <TouchableOpacity
                key={artist}
                onPress={() => setQuery(artist)}
                style={[styles.artistChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.78}
              >
                <Feather name="user" size={13} color={accent.primary} />
                <Text style={[styles.artistChipTxt, { color: colors.foreground }]}>{artist}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Categories grid */}
          <Text style={[styles.browseTitle, { color: colors.foreground, marginTop: 20 }]}>Navegar por categoria</Text>
          <View style={styles.tilesGrid}>
            {CATEGORIES.map((cat) => (
              <CategoryTile
                key={cat.label}
                {...cat}
                active={activeCategory === cat.label}
                onPress={() => selectCategory(cat)}
              />
            ))}
          </View>

          {activeCategory && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.catResultsTitle, { color: colors.foreground }]}>{activeCategory}</Text>
              {catLoading ? (
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <ActivityIndicator color={accent.primary} size="large" />
                </View>
              ) : (
                catTracks.map((t) => (
                  <TrackItem
                    key={t.id}
                    track={t}
                    isActive={currentTrack?.id === t.id}
                    isPlaying={currentTrack?.id === t.id && isPlaying}
                    onPress={() => play(t, catTracks)}
                    onMore={() => setMenuTrack(t)}
                  />
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      <TrackMenu
        track={menuTrack}
        visible={!!menuTrack}
        onClose={() => setMenuTrack(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
  pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.6, paddingLeft: 4 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, height: 50, borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  resultsCount: { fontSize: 12, fontFamily: "Inter_400Regular", paddingHorizontal: 16, paddingVertical: 10 },
  emptyWrap: { alignItems: "center", gap: 12, paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  browseTitle: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: -0.2, paddingHorizontal: 16, marginBottom: 12 },
  artistChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  artistChipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  tilesGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8 },
  tile: { height: 96, borderRadius: 8, overflow: "hidden" },
  tileGrad: { flex: 1, padding: 14, justifyContent: "flex-end", overflow: "hidden" },
  tileActive: { opacity: 0.85 },
  tileLabel: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", zIndex: 1 },
  tileIconWrap: { position: "absolute", right: -6, top: -6 },
  tileCheck: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 10, padding: 3,
  },
  catResultsTitle: { fontSize: 20, fontFamily: "Inter_700Bold", paddingHorizontal: 16, marginBottom: 8 },
});
