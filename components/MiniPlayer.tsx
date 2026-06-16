import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator, Animated, Platform, Pressable,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { usePlayer } from "@/context/PlayerContext";
import { useTheme } from "@/context/ThemeContext";

export function MiniPlayer() {
  const colors = useColors();
  const { accent, isDark } = useTheme();
  const { currentTrack, isPlaying, isLoading, pause, resume, next, position, duration } = usePlayer();
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(120)).current;
  const artScale = useRef(new Animated.Value(0.95)).current;

  const TAB_H = Platform.OS === "web" ? 84 : 49 + (Platform.OS === "ios" ? insets.bottom : 0);

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: currentTrack ? 0 : 120,
      useNativeDriver: true,
      tension: 80,
      friction: 11,
    }).start();
  }, [!!currentTrack]);

  useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1 : 0.88,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isPlaying]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const bg = isDark ? "#181818" : "#FFFFFF";

  return (
    <Animated.View style={[styles.wrapper, { bottom: TAB_H + 8, transform: [{ translateY: slideY }] }]}>
      <Pressable onPress={() => router.push("/player")} style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}>
        <View style={[styles.card, { backgroundColor: bg }]}>
          {/* Progress line */}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent.primary }]} />
          </View>

          <View style={styles.row}>
            {/* Artwork */}
            <Animated.View style={[styles.artWrap, { transform: [{ scale: artScale }] }]}>
              <Image source={{ uri: currentTrack.artworkUrl }} style={styles.art} contentFit="cover" transition={250} />
            </Animated.View>

            {/* Info */}
            <View style={styles.info}>
              <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{currentTrack.title}</Text>
              <Text numberOfLines={1} style={[styles.artist, { color: colors.mutedForeground }]}>{currentTrack.artist}</Text>
            </View>

            {/* Controls */}
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); isPlaying ? pause() : resume(); }}
              style={styles.controlBtn}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              {isLoading
                ? <ActivityIndicator size="small" color={colors.foreground} />
                : <Feather name={isPlaying ? "pause" : "play"} size={24} color={colors.foreground} style={!isPlaying ? { marginLeft: 2 } : undefined} />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); next(); }}
              style={styles.controlBtn}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Feather name="skip-forward" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 8, right: 8, zIndex: 999 },
  card: {
    borderRadius: 12, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 18,
  },
  progressTrack: { height: 2 },
  progressFill: { height: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  artWrap: { borderRadius: 4, overflow: "hidden" },
  art: { width: 46, height: 46, borderRadius: 4 },
  info: { flex: 1 },
  title: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  artist: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  controlBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});
