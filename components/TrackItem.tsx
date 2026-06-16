import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import { Track } from "@/services/musicApi";
import { EqualizerBars } from "./EqualizerBars";

interface Props {
  track: Track;
  isActive?: boolean;
  isPlaying?: boolean;
  index?: number;
  showIndex?: boolean;
  onPress: () => void;
  onMore?: () => void;
}

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function TrackItem({ track, isActive, isPlaying, index, showIndex, onPress, onMore }: Props) {
  const colors = useColors();
  const { accent } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      <View style={styles.left}>
        {showIndex && !isActive ? (
          <Text style={[styles.idx, { color: colors.mutedForeground }]}>{(index ?? 0) + 1}</Text>
        ) : (
          <View style={styles.artWrap}>
            <Image
              source={{ uri: track.artworkUrl }}
              style={styles.art}
              contentFit="cover"
              transition={120}
            />
            {isActive && isPlaying ? (
              <View style={[styles.artOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                <EqualizerBars color={accent.primary} size={16} isPlaying={isPlaying} />
              </View>
            ) : isActive ? (
              <View style={[styles.artOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                <Feather name="pause" size={14} color={accent.primary} />
              </View>
            ) : null}
          </View>
        )}
        <View style={styles.info}>
          <Text numberOfLines={1} style={[styles.title, { color: isActive ? accent.primary : colors.foreground }]}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={[styles.artist, { color: colors.mutedForeground }]}>
            {track.artist}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.dur, { color: colors.mutedForeground }]}>{fmtMs(track.duration)}</Text>
        {onMore && (
          <TouchableOpacity onPress={onMore} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="more-horizontal" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 8,
  },
  left: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  idx: { width: 20, textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular" },
  artWrap: { width: 48, height: 48, borderRadius: 4, overflow: "hidden" },
  art: { width: 48, height: 48 },
  artOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  title: { fontSize: 14, fontFamily: "Inter_500Medium", letterSpacing: -0.1 },
  artist: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  right: { flexDirection: "row", alignItems: "center", gap: 12 },
  dur: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
