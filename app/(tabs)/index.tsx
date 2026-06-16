import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated, Dimensions, FlatList,
  Platform, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackCard } from "@/components/TrackCard";
import { TrackItem } from "@/components/TrackItem";
import { TrackMenu } from "@/components/TrackMenu";
import { usePlayer } from "@/context/PlayerContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  fetchTrending, fetchForYou, fetchNewReleases, fetchViralTikTok,
  fetchElectronic, fetchRock, fetchHipHop, fetchJazz, fetchLoFi,
  fetchChill, Track,
} from "@/services/musicApi";

const { width: SW } = Dimensions.get("window");

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
};

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

interface Section {
  id: string;
  title: string;
  emoji: string;
  data: Track[];
  layout: "card" | "list";
}

function QuickGrid({ tracks, current, playing, onPlay, colors, accent }: {
  tracks: Track[]; current: Track | null; playing: boolean;
  onPlay: (t: Track) => void; colors: ReturnType<typeof useColors>; accent: { primary: string };
}) {
  const items = tracks.slice(0, 6);
  if (!items.length) return null;
  const colW = (SW - 32 - 8) / 2;
  return (
    <View style={styles.quickGrid}>
      {items.map(t => {
        const active = current?.id === t.id;
        return (
          <TouchableOpacity
            key={t.id} onPress={() => onPlay(t)} activeOpacity={0.76}
            style={[styles.quickItem, { width: colW, backgroundColor: active ? colors.elevated : colors.card }]}
          >
            <Image source={{ uri: t.artworkUrl }} style={styles.quickArt} contentFit="cover" transition={200} />
            <Text numberOfLines={1} style={[styles.quickTitle, { color: active ? accent.primary : colors.foreground }]}>
              {t.title}
            </Text>
            {active && playing && (
              <View style={[styles.quickDot, { backgroundColor: accent.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function GenreChip({ label, emoji, active, onPress, accent, colors }: {
  label: string; emoji: string; active: boolean;
  onPress: () => void; accent: { primary: string }; colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, {
        backgroundColor: active ? accent.primary : colors.card,
        borderColor: active ? accent.primary : colors.border,
      }]}
    >
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={[styles.chipLabel, { color: active ? "#000" : colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const GENRE_CHIPS = [
  { id: "all",        label: "Tudo",     emoji: "🎵" },
  { id: "viral",      label: "Viral",    emoji: "🔥" },
  { id: "hiphop",     label: "Hip-Hop",  emoji: "🎤" },
  { id: "lofi",       label: "Lo-Fi",    emoji: "☕" },
  { id: "electronic", label: "Dance",    emoji: "⚡" },
  { id: "jazz",       label: "Jazz",     emoji: "🎷" },
  { id: "chill",      label: "Chill",    emoji: "🌊" },
  { id: "indie",      label: "Indie",    emoji: "🎸" },
];

export default function HomeScreen() {
  const colors = useColors();
  const { accent } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { play, currentTrack, isPlaying, recentTracks } = usePlayer();

  const [sections, setSections] = useState<Section[]>([]);
  const [quickTracks, setQuickTracks] = useState<Track[]>([]);
  const [activeChip, setActiveChip] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 70], outputRange: [0, 1], extrapolate: "clamp" });

  const buildSections = async (chip = "all"): Promise<Section[]> => {
    if (chip === "viral") {
      const viral = await fetchViralTikTok(30);
      const lofi = await fetchLoFi(20);
      return [
        { id: "viral", title: "Viral TikTok", emoji: "🔥", data: viral, layout: "card" as const },
        { id: "lofi",  title: "Lo-Fi & Chill", emoji: "☕", data: lofi, layout: "card" as const },
      ].filter(s => s.data.length > 0);
    }
    if (chip === "hiphop") {
      const hh = await fetchHipHop(30);
      return [{ id: "hiphop", title: "Hip-Hop & Trap", emoji: "🎤", data: hh, layout: "card" as const }].filter(s => s.data.length > 0);
    }
    if (chip === "lofi") {
      const lf = await fetchLoFi(30);
      const chill = await fetchChill(20);
      return [
        { id: "lofi",  title: "Lo-Fi Beats",  emoji: "☕", data: lf,    layout: "card" as const },
        { id: "chill", title: "Chill & Relax", emoji: "🌊", data: chill, layout: "card" as const },
      ].filter(s => s.data.length > 0);
    }
    if (chip === "electronic") {
      const el = await fetchElectronic(30);
      return [{ id: "electronic", title: "Electronic & Dance", emoji: "⚡", data: el, layout: "card" as const }].filter(s => s.data.length > 0);
    }
    if (chip === "jazz") {
      const jazz = await fetchJazz(30);
      return [{ id: "jazz", title: "Jazz & Blues", emoji: "🎷", data: jazz, layout: "card" as const }].filter(s => s.data.length > 0);
    }
    if (chip === "chill") {
      const chill = await fetchChill(30);
      return [{ id: "chill", title: "Chill & Ambiente", emoji: "🌊", data: chill, layout: "card" as const }].filter(s => s.data.length > 0);
    }
    if (chip === "indie") {
      const rock = await fetchRock(30);
      return [{ id: "indie", title: "Indie & Alternativo", emoji: "🎸", data: rock, layout: "card" as const }].filter(s => s.data.length > 0);
    }

    const [trending, forYou, viral, newR, electronic, hiphop, jazz, lofi] = await Promise.all([
      fetchTrending(20),
      fetchForYou(20),
      fetchViralTikTok(20),
      fetchNewReleases(16),
      fetchElectronic(16),
      fetchHipHop(16),
      fetchJazz(16),
      fetchLoFi(16),
    ]);

    const built: Section[] = [];
    if (trending.length)   built.push({ id: "trending",   title: "Em Alta Agora",   emoji: "📈", data: trending,   layout: "card" });
    if (viral.length)      built.push({ id: "viral",      title: "Viral TikTok",    emoji: "🔥", data: viral,      layout: "card" });
    if (forYou.length)     built.push({ id: "foryou",     title: "Para Você",       emoji: "💚", data: forYou,     layout: "list" });
    if (hiphop.length)     built.push({ id: "hiphop",     title: "Hip-Hop & Trap",  emoji: "🎤", data: hiphop,     layout: "card" });
    if (lofi.length)       built.push({ id: "lofi",       title: "Lo-Fi & Chill",   emoji: "☕", data: lofi,       layout: "card" });
    if (electronic.length) built.push({ id: "electronic", title: "Eletrônica",      emoji: "⚡", data: electronic, layout: "list" });
    if (jazz.length)       built.push({ id: "jazz",       title: "Jazz & Blues",    emoji: "🎷", data: jazz,       layout: "card" });
    if (newR.length)       built.push({ id: "new",        title: "Descobertas",     emoji: "✨", data: newR,       layout: "list" });
    return built.filter(s => s.data.length > 0);
  };

  const load = async (refresh = false, chip = activeChip) => {
    const [trending] = await Promise.all([fetchTrending(20)]);
    const quick = recentTracks.length >= 4 ? recentTracks : shuffle(trending).slice(0, 6);
    setQuickTracks(quick.slice(0, 6));

    const built = await buildSections(chip);
    setSections(built);
    if (refresh) setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onChipPress = (chip: string) => {
    setActiveChip(chip);
    setSections([]);
    load(false, chip);
  };

  const onRefresh = () => {
    setRefreshing(true);
    load(true, activeChip);
  };

  const bottomPad = (Platform.OS === "ios" ? insets.bottom + 49 : Platform.OS === "web" ? 80 : 49) + 88;
  const firstName = (user?.name || "Ouvinte").split(" ")[0];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[styles.stickyBar, {
          paddingTop: insets.top,
          backgroundColor: colors.background,
          opacity: headerOpacity,
          borderBottomColor: colors.border,
          pointerEvents: "none",
        }]}
      >
        <Text style={[styles.stickyTitle, { color: colors.foreground }]}>{greeting()}</Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent.primary} colors={[accent.primary]} />
        }
      >
        <LinearGradient
          colors={[`${accent.primary}55`, `${accent.primary}11`, colors.background]}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.greetLabel, { color: colors.foreground }]}>{greeting()},</Text>
              <Text style={[styles.greetName, { color: colors.foreground }]}>{firstName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              style={[styles.headerBtn, { backgroundColor: `${accent.primary}22` }]}
            >
              <Feather name="settings" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <QuickGrid
            tracks={quickTracks}
            current={currentTrack}
            playing={isPlaying}
            onPlay={t => play(t, quickTracks)}
            colors={colors}
            accent={accent}
          />
        </LinearGradient>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {GENRE_CHIPS.map(chip => (
            <GenreChip
              key={chip.id}
              label={chip.label}
              emoji={chip.emoji}
              active={activeChip === chip.id}
              onPress={() => onChipPress(chip.id)}
              accent={accent}
              colors={colors}
            />
          ))}
        </ScrollView>

        {sections[0]?.data[0] && (() => {
          const ft = sections[0].data[0];
          return (
            <View style={styles.featWrap}>
              <TouchableOpacity
                style={styles.featCard}
                onPress={() => play(ft, sections[0].data)}
                activeOpacity={0.88}
              >
                <Image source={{ uri: ft.artworkUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.93)"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0.2 }}
                  end={{ x: 0, y: 1 }}
                />
                <View style={styles.featMeta}>
                  <View style={[styles.featBadge, { backgroundColor: accent.primary }]}>
                    <Text style={styles.featBadgeTxt}>
                      {sections[0].emoji} {sections[0].title.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.featTitle} numberOfLines={2}>{ft.title}</Text>
                  <Text style={styles.featArtist} numberOfLines={1}>{ft.artist}</Text>
                  <View style={[styles.featPlayBtn, { backgroundColor: accent.primary }]}>
                    <Feather name="play" size={14} color="#000" />
                    <Text style={styles.featPlayTxt}>Ouvir agora</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })()}

        {sections.map(sec => (
          <View key={sec.id} style={styles.secWrap}>
            <View style={styles.secHeader}>
              <Text style={[styles.secTitle, { color: colors.foreground }]}>
                {sec.emoji} {sec.title}
              </Text>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.seeAll, { color: accent.primary }]}>Ver tudo</Text>
              </TouchableOpacity>
            </View>

            {sec.layout === "card" ? (
              <FlatList
                data={sec.data}
                keyExtractor={t => t.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, columnGap: 14 }}
                renderItem={({ item }) => (
                  <TrackCard
                    track={item}
                    isActive={currentTrack?.id === item.id}
                    isPlaying={currentTrack?.id === item.id && isPlaying}
                    onPress={() => play(item, sec.data)}
                  />
                )}
              />
            ) : (
              <View>
                {sec.data.slice(0, 6).map((item, index) => (
                  <TrackItem
                    key={item.id}
                    track={item}
                    index={index}
                    showIndex
                    isActive={currentTrack?.id === item.id}
                    isPlaying={currentTrack?.id === item.id && isPlaying}
                    onPress={() => play(item, sec.data)}
                    onMore={() => setMenuTrack(item)}
                  />
                ))}
              </View>
            )}
          </View>
        ))}
      </Animated.ScrollView>

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
  stickyBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    paddingBottom: 10, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  hero: { paddingBottom: 24 },
  headerRow: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 22,
  },
  greetLabel: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  greetName: { fontSize: 17, fontFamily: "Inter_400Regular", opacity: 0.7, marginTop: 2 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 4 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, rowGap: 8, columnGap: 8 },
  quickItem: { flexDirection: "row", alignItems: "center", borderRadius: 6, overflow: "hidden", height: 54 },
  quickArt: { width: 54, height: 54 },
  quickTitle: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold", paddingHorizontal: 10 },
  quickDot: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  chipsScroll: { marginBottom: 8 },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 12, columnGap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", columnGap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, borderWidth: 1,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  featWrap: { paddingHorizontal: 16, marginBottom: 8 },
  featCard: { height: 220, borderRadius: 16, overflow: "hidden" },
  featMeta: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 18 },
  featBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: "flex-start", marginBottom: 8 },
  featBadgeTxt: { color: "#000", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  featTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  featArtist: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3, marginBottom: 12 },
  featPlayBtn: { flexDirection: "row", alignItems: "center", columnGap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, alignSelf: "flex-start" },
  featPlayTxt: { color: "#000", fontSize: 13, fontFamily: "Inter_700Bold" },
  secWrap: { marginBottom: 30 },
  secHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 14,
  },
  secTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
