import { Image } from "expo-image";
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
  onPress: () => void;
  compact?: boolean;
}

export function TrackCard({ track, isActive, isPlaying, onPress, compact }: Props) {
  const colors = useColors();
  const { accent } = useTheme();
  const size = compact ? 130 : 160;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={[styles.card, { width: size }]}>
      <View style={[styles.artWrap, { width: size, height: size }]}>
        <Image
          source={{ uri: track.artworkUrl }}
          style={styles.artwork}
          contentFit="cover"
          transition={200}
        />
        {isActive && (
          <View style={[styles.activeOverlay, { backgroundColor: `${accent.primary}44` }]} />
        )}
        {isActive && isPlaying && (
          <View style={styles.eqWrap}>
            <EqualizerBars color={accent.primary} size={18} isPlaying={isPlaying} />
          </View>
        )}
      </View>
      <Text numberOfLines={1} style={[styles.title, { color: isActive ? accent.primary : colors.foreground }]}>
        {track.title}
      </Text>
      <Text numberOfLines={1} style={[styles.artist, { color: colors.mutedForeground }]}>
        {track.artist}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 4 },
  artWrap: {
    borderRadius: 6, overflow: "hidden", marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  artwork: { width: "100%", height: "100%" },
  activeOverlay: { ...StyleSheet.absoluteFillObject },
  eqWrap: { position: "absolute", bottom: 10, right: 10 },
  title: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: -0.1 },
  artist: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3 },
});
