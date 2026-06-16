import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, Dimensions,
  Platform, PanResponder,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import { EqualizerBars } from "@/components/EqualizerBars";

const { width: SW } = Dimensions.get("window");
const ART_SIZE = SW - 64;

function fmtMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtSecs(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

type ViewMode = "player" | "lyrics";

// ── EQ Vertical Slider ─────────────────────────────────────────────────────
function EQSlider({
  value, onChange, accent, colors,
}: {
  value: number; onChange: (v: number) => void;
  accent: string; colors: ReturnType<typeof useColors>;
}) {
  const TRACK_H = 100;
  const THUMB_H = 20;
  const MIN = -12; const MAX = 12;

  const offsetY = useRef<number>(((MAX - value) / (MAX - MIN)) * (TRACK_H - THUMB_H));
  const posAnim = useRef(new Animated.Value(offsetY.current)).current;

  useEffect(() => {
    const t = ((MAX - value) / (MAX - MIN)) * (TRACK_H - THUMB_H);
    offsetY.current = t;
    posAnim.setValue(t);
  }, [value]);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {},
    onPanResponderMove: (_, gs) => {
      const newY = Math.max(0, Math.min(TRACK_H - THUMB_H, offsetY.current + gs.dy));
      posAnim.setValue(newY);
    },
    onPanResponderRelease: (_, gs) => {
      const newY = Math.max(0, Math.min(TRACK_H - THUMB_H, offsetY.current + gs.dy));
      offsetY.current = newY;
      posAnim.setValue(newY);
      const newVal = Math.round(MAX - (newY / (TRACK_H - THUMB_H)) * (MAX - MIN));
      onChange(Math.max(MIN, Math.min(MAX, newVal)));
    },
  })).current;

  const fillH = posAnim.interpolate({
    inputRange: [0, TRACK_H - THUMB_H],
    outputRange: [TRACK_H, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={[eqStyles.sliderWrap, { height: TRACK_H + THUMB_H }]} {...pan.panHandlers}>
      <View style={[eqStyles.sliderTrack, { height: TRACK_H, backgroundColor: colors.elevated }]}>
        <Animated.View
          style={[eqStyles.sliderFill, { height: fillH, backgroundColor: value >= 0 ? accent : "#ff6b6b" }]}
        />
      </View>
      <Animated.View
        style={[eqStyles.sliderThumb, {
          transform: [{ translateY: posAnim }],
          backgroundColor: "#fff",
          shadowColor: value >= 0 ? accent : "#ff6b6b",
        }]}
      />
    </View>
  );
}

const eqStyles = StyleSheet.create({
  sliderWrap: { width: 28, alignItems: "center", position: "relative" },
  sliderTrack: { width: 4, borderRadius: 2, overflow: "hidden", justifyContent: "flex-end" },
  sliderFill: { width: 4, borderRadius: 2 },
  sliderThumb: {
    position: "absolute", width: 20, height: 20, borderRadius: 10,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
    top: 0,
  },
});

// ── EQ Panel ───────────────────────────────────────────────────────────────
function EQPanel({
  eqBands, onSet, onReset, colors, accent,
}: {
  eqBands: ReturnType<typeof usePlayer>["eqBands"];
  onSet: (i: number, v: number) => void;
  onReset: () => void;
  colors: ReturnType<typeof useColors>;
  accent: string;
}) {
  return (
    <View style={[eqPanelStyles.panel, { backgroundColor: `${colors.card}F0` }]}>
      <View style={eqPanelStyles.header}>
        <Text style={[eqPanelStyles.title, { color: colors.foreground }]}>🎛 Equalizador</Text>
        <TouchableOpacity onPress={onReset} style={[eqPanelStyles.resetBtn, { borderColor: colors.border }]}>
          <Text style={[eqPanelStyles.resetTxt, { color: colors.mutedForeground }]}>Reset</Text>
        </TouchableOpacity>
      </View>
      <View style={eqPanelStyles.bands}>
        {eqBands.map((band, i) => (
          <View key={band.label} style={eqPanelStyles.bandCol}>
            <Text style={[eqPanelStyles.dbVal, {
              color: band.value === 0 ? colors.mutedForeground : band.value > 0 ? accent : "#ff6b6b"
            }]}>
              {band.value > 0 ? `+${band.value}` : band.value}
            </Text>
            <EQSlider
              value={band.value}
              onChange={v => onSet(i, v)}
              accent={accent}
              colors={colors}
            />
            <Text style={[eqPanelStyles.bandLabel, { color: colors.mutedForeground }]}>
              {band.shortLabel}
            </Text>
          </View>
        ))}
      </View>
      <View style={eqPanelStyles.presets}>
        {[
          { name: "Flat",    vals: [0, 0, 0, 0, 0] },
          { name: "Bass↑",   vals: [9, 6, 0, -3, -2] },
          { name: "Vocal",   vals: [-2, 0, 5, 6, 3] },
          { name: "Electro", vals: [5, 2, -3, 2, 6] },
          { name: "Jazz",    vals: [3, 4, 2, 4, 3] },
        ].map(preset => (
          <TouchableOpacity
            key={preset.name}
            onPress={() => preset.vals.forEach((v, i) => onSet(i, v))}
            style={[eqPanelStyles.presetBtn, { backgroundColor: colors.elevated, borderColor: colors.border }]}
          >
            <Text style={[eqPanelStyles.presetTxt, { color: colors.foreground }]}>{preset.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const eqPanelStyles = StyleSheet.create({
  panel: { borderRadius: 20, padding: 18, marginHorizontal: 16, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 16, fontFamily: "Inter_700Bold" },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  resetTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },
  bands: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", marginBottom: 16 },
  bandCol: { alignItems: "center", rowGap: 6 },
  dbVal: { fontSize: 10, fontFamily: "Inter_700Bold", minWidth: 28, textAlign: "center" },
  bandLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  presets: { flexDirection: "row", columnGap: 6, flexWrap: "wrap", rowGap: 6 },
  presetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  presetTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

// ── Sleep Timer Button ──────────────────────────────────────────────────────
const SLEEP_OPTIONS: Array<number | null> = [null, 15, 30, 45, 60];

function SleepTimerBtn({
  sleepTimerMinutes, sleepTimerRemaining, onCycle, colors, accent,
}: {
  sleepTimerMinutes: number | null;
  sleepTimerRemaining: number | null;
  onCycle: () => void;
  colors: ReturnType<typeof useColors>;
  accent: string;
}) {
  const active = sleepTimerMinutes !== null;
  return (
    <TouchableOpacity
      onPress={onCycle}
      style={[styles.actionBtn, active && { backgroundColor: `${accent}22`, borderRadius: 10 }]}
    >
      <Feather name="moon" size={18} color={active ? accent : colors.mutedForeground} />
      {active && sleepTimerRemaining !== null && (
        <Text style={[styles.sleepTxt, { color: accent }]}>
          {fmtSecs(sleepTimerRemaining)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── Main Player Screen ──────────────────────────────────────────────────────
export default function PlayerScreen() {
  const colors = useColors();
  const { accent, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    currentTrack, isPlaying, position, duration, isLoading,
    isShuffle, repeatMode, isLiked, eqBands, sleepTimerMinutes, sleepTimerRemaining,
    pause, resume, next, previous, seekTo,
    toggleShuffle, toggleRepeat, toggleLike, addToQueue,
    setEqBand, resetEq, setSleepTimer,
  } = usePlayer();

  const [viewMode, setViewMode] = useState<ViewMode>("player");
  const [showEQ, setShowEQ] = useState(false);
  const [seekDragging, setSeekDragging] = useState(false);
  const [seekPos, setSeekPos] = useState(0);
  const artScale = useRef(new Animated.Value(0.87)).current;
  const artOpacity = useRef(new Animated.Value(0)).current;
  const seekBarW = useRef(SW - 64);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(artScale, {
        toValue: isPlaying ? 1 : 0.87,
        useNativeDriver: true, tension: 55, friction: 8,
      }),
      Animated.timing(artOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [isPlaying]);

  useEffect(() => {
    if (!seekDragging) setSeekPos(position);
  }, [position, seekDragging]);

  const progress = duration > 0 ? Math.min(1, seekPos / duration) : 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setSeekDragging(true),
      onPanResponderMove: (_, gs) => {
        const p = Math.min(1, Math.max(0, (gs.moveX - 32) / seekBarW.current));
        setSeekPos(p * duration);
      },
      onPanResponderRelease: (_, gs) => {
        const p = Math.min(1, Math.max(0, (gs.moveX - 32) / seekBarW.current));
        seekTo(p * duration);
        setSeekDragging(false);
      },
    })
  ).current;

  const handlePlayPause = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    isPlaying ? pause() : resume();
  };

  const cycleSleepTimer = () => {
    const idx = SLEEP_OPTIONS.indexOf(sleepTimerMinutes);
    const next = SLEEP_OPTIONS[(idx + 1) % SLEEP_OPTIONS.length];
    setSleepTimer(next);
  };

  if (!currentTrack) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.closeBtn, { paddingTop: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <Feather name="chevron-down" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Feather name="music" size={52} color={`${colors.mutedForeground}50`} />
          <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>Nenhuma música tocando</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Background: blurred artwork */}
      <Image
        source={{ uri: currentTrack.artworkUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={40}
      />
      <View style={[StyleSheet.absoluteFill, {
        backgroundColor: isDark ? "rgba(0,0,0,0.80)" : "rgba(245,245,250,0.85)"
      }]} />

      <View style={[styles.inner, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.topBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="chevron-down" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={[styles.topLabel, { color: colors.mutedForeground }]}>TOCANDO AGORA</Text>
            <Text style={[styles.topQueue, { color: colors.mutedForeground }]} numberOfLines={1}>
              {currentTrack.album || currentTrack.genre}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
              addToQueue(currentTrack);
            }}
            style={styles.topBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="more-horizontal" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* View mode switcher: Player / Letra / EQ */}
        <View style={styles.modeSwitcher}>
          {(["player", "lyrics"] as ViewMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => { setViewMode(m); if (m === "player") setShowEQ(false); }}
              style={[styles.modeBtn, viewMode === m && !showEQ && { backgroundColor: colors.elevated }]}
            >
              <Feather
                name={m === "player" ? "music" : "align-left"}
                size={14}
                color={viewMode === m && !showEQ ? accent.primary : colors.mutedForeground}
              />
              <Text style={[styles.modeTxt, {
                color: viewMode === m && !showEQ ? accent.primary : colors.mutedForeground
              }]}>
                {m === "player" ? "Player" : "Letra"}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => {
              setShowEQ(p => !p);
              if (viewMode !== "player") setViewMode("player");
              if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
            }}
            style={[styles.modeBtn, showEQ && { backgroundColor: colors.elevated }]}
          >
            <Feather name="sliders" size={14} color={showEQ ? accent.primary : colors.mutedForeground} />
            <Text style={[styles.modeTxt, { color: showEQ ? accent.primary : colors.mutedForeground }]}>EQ</Text>
          </TouchableOpacity>
        </View>

        {viewMode === "player" ? (
          <>
            {/* EQ Panel (shown when showEQ) */}
            {showEQ ? (
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
              >
                <EQPanel
                  eqBands={eqBands}
                  onSet={setEqBand}
                  onReset={resetEq}
                  colors={colors}
                  accent={accent.primary}
                />

                {/* Mini player in EQ mode */}
                <View style={[styles.miniPlayerRow, { backgroundColor: `${colors.card}CC`, borderColor: colors.border }]}>
                  <Image source={{ uri: currentTrack.artworkUrl }} style={styles.miniArt} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.miniTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {currentTrack.title}
                    </Text>
                    <Text style={[styles.miniArtist, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {currentTrack.artist}
                    </Text>
                  </View>
                  <View style={styles.miniControls}>
                    <TouchableOpacity onPress={previous} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name="skip-back" size={22} color={colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handlePlayPause}
                      style={[styles.miniPlayBtn, { backgroundColor: accent.primary }]}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#000" size="small" />
                      ) : (
                        <Feather name={isPlaying ? "pause" : "play"} size={16} color="#000" style={!isPlaying ? { marginLeft: 2 } : undefined} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={next} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name="skip-forward" size={22} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Seek bar in EQ mode */}
                <View style={[styles.seekSection, { marginTop: 8 }]}>
                  <View
                    style={styles.seekTouchArea}
                    {...panResponder.panHandlers}
                    onLayout={(e) => { seekBarW.current = e.nativeEvent.layout.width; }}
                  >
                    <View style={[styles.seekTrack, { backgroundColor: colors.elevated }]}>
                      <View style={[styles.seekFill, { width: `${progress * 100}%`, backgroundColor: accent.primary }]} />
                    </View>
                    <View style={[styles.seekThumb, { left: `${progress * 100}%`, backgroundColor: "#fff", shadowColor: accent.primary }]} />
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={[styles.timeTxt, { color: colors.mutedForeground }]}>{fmtMs(seekPos)}</Text>
                    <Text style={[styles.timeTxt, { color: colors.mutedForeground }]}>{fmtMs(duration)}</Text>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <>
                {/* Artwork */}
                <View style={styles.artContainer}>
                  <Animated.View style={[
                    styles.artShadow,
                    { shadowColor: accent.primary, transform: [{ scale: artScale }], opacity: artOpacity },
                  ]}>
                    <Image
                      source={{ uri: currentTrack.artworkUrl }}
                      style={styles.artwork}
                      contentFit="cover"
                      transition={400}
                    />
                    {isPlaying && (
                      <View style={styles.eqOverlay}>
                        <EqualizerBars color={accent.primary} size={24} isPlaying={isPlaying} />
                      </View>
                    )}
                    {sleepTimerMinutes !== null && (
                      <View style={[styles.sleepOverlay, { backgroundColor: `${accent.primary}33` }]}>
                        <Feather name="moon" size={14} color={accent.primary} />
                        <Text style={[styles.sleepOverlayTxt, { color: accent.primary }]}>
                          {sleepTimerRemaining !== null ? fmtSecs(sleepTimerRemaining) : ""}
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                </View>

                {/* Track info + like */}
                <View style={styles.infoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.trackTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {currentTrack.title}
                    </Text>
                    <Text style={[styles.trackArtist, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {currentTrack.artist}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={toggleLike}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.likeBtn}
                  >
                    <Feather
                      name="heart"
                      size={24}
                      color={isLiked ? accent.primary : colors.mutedForeground}
                    />
                  </TouchableOpacity>
                </View>

                {/* Seek bar */}
                <View style={styles.seekSection}>
                  <View
                    style={styles.seekTouchArea}
                    {...panResponder.panHandlers}
                    onLayout={(e) => { seekBarW.current = e.nativeEvent.layout.width; }}
                  >
                    <View style={[styles.seekTrack, { backgroundColor: colors.elevated }]}>
                      <View style={[styles.seekFill, { width: `${progress * 100}%`, backgroundColor: accent.primary }]} />
                    </View>
                    <View style={[styles.seekThumb, { left: `${progress * 100}%`, backgroundColor: "#fff", shadowColor: accent.primary }]} />
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={[styles.timeTxt, { color: colors.mutedForeground }]}>{fmtMs(seekPos)}</Text>
                    <Text style={[styles.timeTxt, { color: colors.mutedForeground }]}>{fmtMs(duration)}</Text>
                  </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                  <TouchableOpacity onPress={toggleShuffle} style={styles.sideCtrl}>
                    <Feather name="shuffle" size={22} color={isShuffle ? accent.primary : colors.mutedForeground} />
                    {isShuffle && <View style={[styles.dot, { backgroundColor: accent.primary }]} />}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={previous} style={styles.skipBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="skip-back" size={32} color={colors.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handlePlayPause} style={[styles.playBtn, { backgroundColor: "#fff" }]} activeOpacity={0.88}>
                    {isLoading ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <Feather name={isPlaying ? "pause" : "play"} size={30} color="#000" style={!isPlaying ? { marginLeft: 3 } : undefined} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={next} style={styles.skipBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="skip-forward" size={32} color={colors.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={toggleRepeat} style={styles.sideCtrl}>
                    <Feather name="repeat" size={22} color={repeatMode !== "none" ? accent.primary : colors.mutedForeground} />
                    {repeatMode === "one" && (
                      <View style={[styles.repeatOneBadge, { backgroundColor: accent.primary }]}>
                        <Text style={styles.repeatOneTxt}>1</Text>
                      </View>
                    )}
                    {repeatMode !== "none" && repeatMode !== "one" && (
                      <View style={[styles.dot, { backgroundColor: accent.primary }]} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Bottom actions */}
                <View style={styles.bottomActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, showEQ && { backgroundColor: `${accent.primary}22`, borderRadius: 10 }]}
                    onPress={() => setShowEQ(p => !p)}
                  >
                    <Feather name="sliders" size={18} color={showEQ ? accent.primary : colors.mutedForeground} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => addToQueue(currentTrack)}>
                    <Feather name="plus-square" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Feather name="share-2" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <SleepTimerBtn
                    sleepTimerMinutes={sleepTimerMinutes}
                    sleepTimerRemaining={sleepTimerRemaining}
                    onCycle={cycleSleepTimer}
                    colors={colors}
                    accent={accent.primary}
                  />
                </View>
              </>
            )}
          </>
        ) : (
          /* LYRICS VIEW */
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.lyricsCard, { backgroundColor: `${colors.card}CC` }]}>
              <View style={styles.lyricsHeader}>
                <Feather name="align-left" size={16} color={accent.primary} />
                <Text style={[styles.lyricsMeta, { color: colors.mutedForeground }]}>
                  {currentTrack.title} • {currentTrack.artist}
                </Text>
              </View>
              {currentTrack.lyrics ? (
                <Text style={[styles.lyricsText, { color: colors.foreground }]}>
                  {currentTrack.lyrics}
                </Text>
              ) : (
                <View style={styles.lyricsEmpty}>
                  <Feather name="music" size={40} color={`${colors.mutedForeground}60`} />
                  <Text style={[styles.lyricsEmptyTitle, { color: colors.foreground }]}>Letra não disponível</Text>
                  <Text style={[styles.lyricsEmptyDesc, { color: colors.mutedForeground }]}>
                    Aproveite a música! 🎵
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.trackInfoCard, { backgroundColor: `${colors.card}BB` }]}>
              <Image source={{ uri: currentTrack.artworkUrl }} style={styles.infoArt} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.foreground }]}>{currentTrack.title}</Text>
                <Text style={[styles.infoArtist, { color: colors.mutedForeground }]}>{currentTrack.artist}</Text>
                {currentTrack.album ? (
                  <Text style={[styles.infoMeta, { color: colors.mutedForeground }]}>💿 {currentTrack.album}</Text>
                ) : null}
                <Text style={[styles.infoMeta, { color: colors.mutedForeground }]}>🎵 {currentTrack.genre}</Text>
                <Text style={[styles.infoMeta, { color: colors.mutedForeground }]}>
                  ⏱ {Math.floor(currentTrack.duration / 60000)}:{String(Math.floor((currentTrack.duration % 60000) / 1000)).padStart(2, "0")}
                </Text>
                {currentTrack.tags?.length > 0 && (
                  <Text style={[styles.infoMeta, { color: colors.mutedForeground }]} numberOfLines={2}>
                    🏷 {currentTrack.tags.slice(0, 4).join(" • ")}
                  </Text>
                )}
              </View>
            </View>

            {/* Mini controls in lyrics mode */}
            <View style={[styles.miniPlayerRow, { backgroundColor: `${colors.card}CC`, borderColor: colors.border, marginTop: 8 }]}>
              <View style={{ flex: 1 }}>
                <View
                  style={[styles.seekTouchArea, { marginHorizontal: 0 }]}
                  {...panResponder.panHandlers}
                >
                  <View style={[styles.seekTrack, { backgroundColor: colors.elevated }]}>
                    <View style={[styles.seekFill, { width: `${progress * 100}%`, backgroundColor: accent.primary }]} />
                  </View>
                </View>
                <View style={[styles.timeRow, { marginTop: 4 }]}>
                  <Text style={[styles.timeTxt, { color: colors.mutedForeground }]}>{fmtMs(seekPos)}</Text>
                  <Text style={[styles.timeTxt, { color: colors.mutedForeground }]}>{fmtMs(duration)}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.controls, { marginTop: 8 }]}>
              <TouchableOpacity onPress={toggleShuffle} style={styles.sideCtrl}>
                <Feather name="shuffle" size={20} color={isShuffle ? accent.primary : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={previous} style={styles.skipBtn}>
                <Feather name="skip-back" size={28} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePlayPause} style={[styles.playBtn, { backgroundColor: "#fff" }]} activeOpacity={0.88}>
                {isLoading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Feather name={isPlaying ? "pause" : "play"} size={26} color="#000" style={!isPlaying ? { marginLeft: 3 } : undefined} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={next} style={styles.skipBtn}>
                <Feather name="skip-forward" size={28} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleRepeat} style={styles.sideCtrl}>
                <Feather name="repeat" size={20} color={repeatMode !== "none" ? accent.primary : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", rowGap: 12 },
  emptyTxt: { fontSize: 16, fontFamily: "Inter_400Regular" },
  inner: { flex: 1 },
  closeBtn: { paddingHorizontal: 20 },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 6,
  },
  topBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  topLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  topQueue: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, maxWidth: 180 },
  modeSwitcher: {
    flexDirection: "row", alignSelf: "center",
    borderRadius: 20, overflow: "hidden", marginBottom: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  modeBtn: { flexDirection: "row", alignItems: "center", columnGap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  modeTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  artContainer: { alignItems: "center", justifyContent: "center", flex: 1, marginVertical: 4 },
  artShadow: {
    borderRadius: 8, overflow: "hidden",
    shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.6, shadowRadius: 40, elevation: 28,
  },
  artwork: { width: ART_SIZE, height: ART_SIZE, borderRadius: 8 },
  eqOverlay: {
    position: "absolute", bottom: 16, right: 16,
    backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 8, padding: 8,
  },
  sleepOverlay: {
    position: "absolute", top: 12, right: 12,
    flexDirection: "row", alignItems: "center", columnGap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  sleepOverlayTxt: { fontSize: 11, fontFamily: "Inter_700Bold" },
  infoRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 32, paddingTop: 16, paddingBottom: 8, columnGap: 12,
  },
  trackTitle: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  trackArtist: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 3 },
  likeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  seekSection: { paddingHorizontal: 32, marginBottom: 12 },
  seekTouchArea: { height: 36, justifyContent: "center", position: "relative" },
  seekTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  seekFill: { height: 4, borderRadius: 2 },
  seekThumb: {
    position: "absolute", top: "50%", width: 16, height: 16, borderRadius: 8,
    marginTop: -8, marginLeft: -8,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
  },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  timeTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  controls: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, marginBottom: 16,
  },
  sideCtrl: { width: 46, height: 46, alignItems: "center", justifyContent: "center", position: "relative" },
  skipBtn: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  playBtn: {
    width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 14,
  },
  dot: { width: 4, height: 4, borderRadius: 2, position: "absolute", bottom: 4, alignSelf: "center" },
  repeatOneBadge: {
    position: "absolute", top: 4, right: 4,
    width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center",
  },
  repeatOneTxt: { color: "#000", fontSize: 8, fontFamily: "Inter_700Bold" },
  bottomActions: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 32 },
  actionBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  sleepTxt: { fontSize: 9, fontFamily: "Inter_700Bold", marginTop: 2 },
  miniPlayerRow: {
    flexDirection: "row", alignItems: "center", columnGap: 12,
    marginHorizontal: 16, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 4,
  },
  miniArt: { width: 44, height: 44, borderRadius: 6 },
  miniTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  miniArtist: { fontSize: 12, fontFamily: "Inter_400Regular" },
  miniControls: { flexDirection: "row", alignItems: "center", columnGap: 14 },
  miniPlayBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  // Lyrics
  lyricsCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  lyricsHeader: { flexDirection: "row", alignItems: "center", columnGap: 8, marginBottom: 16 },
  lyricsMeta: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  lyricsText: { fontSize: 16, fontFamily: "Inter_500Medium", lineHeight: 30 },
  lyricsEmpty: { alignItems: "center", rowGap: 12, paddingVertical: 32 },
  lyricsEmptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  lyricsEmptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  trackInfoCard: { flexDirection: "row", columnGap: 14, padding: 16, borderRadius: 16, alignItems: "flex-start" },
  infoArt: { width: 72, height: 72, borderRadius: 8 },
  infoTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 3 },
  infoArtist: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  infoMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
});
