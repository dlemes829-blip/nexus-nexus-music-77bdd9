import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert, Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePlaylists } from "@/context/PlaylistContext";
import { Track } from "@/services/musicApi";

interface TrackMenuProps {
  track: Track | null;
  visible: boolean;
  onClose: () => void;
}

export function TrackMenu({ track, visible, onClose }: TrackMenuProps) {
  const colors = useColors();
  const { accent } = useTheme();
  const { addToQueue, toggleLike, likedIds } = usePlayer();
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylists();
  const [showPlaylists, setShowPlaylists] = useState(false);

  if (!track) return null;

  const isLiked = likedIds.has(track.id);

  const handleAddToPlaylist = async (playlistId: string) => {
    await addTrackToPlaylist(playlistId, track);
    onClose();
    setShowPlaylists(false);
  };

  const handleNewPlaylist = () => {
    Alert.prompt(
      "Nova playlist",
      "Nome da playlist:",
      async (name) => {
        if (name?.trim()) {
          const pl = await createPlaylist(name.trim());
          await addTrackToPlaylist(pl.id, track);
          onClose();
          setShowPlaylists(false);
        }
      },
      "plain-text"
    );
  };

  const actions = [
    {
      icon: isLiked ? "heart" : "heart",
      label: isLiked ? "Remover dos curtidos" : "Curtir música",
      color: isLiked ? "#E91E63" : colors.foreground,
      onPress: () => { toggleLike(); onClose(); },
    },
    {
      icon: "list",
      label: "Adicionar à playlist",
      color: accent.primary,
      onPress: () => setShowPlaylists(true),
    },
    {
      icon: "plus-square",
      label: "Adicionar à fila",
      color: colors.foreground,
      onPress: () => { addToQueue(track); onClose(); },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {!showPlaylists ? (
            <>
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: colors.foreground }]} numberOfLines={1}>{track.title}</Text>
                <Text style={[styles.trackArtist, { color: colors.mutedForeground }]} numberOfLines={1}>{track.artist}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {actions.map((a) => (
                <TouchableOpacity key={a.label} style={styles.action} onPress={a.onPress} activeOpacity={0.75}>
                  <View style={[styles.actionIcon, { backgroundColor: `${a.color}18` }]}>
                    <Feather name={a.icon as any} size={19} color={a.color} />
                  </View>
                  <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
                  {a.label.includes("playlist") && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.muted }]}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={[styles.cancelTxt, { color: colors.foreground }]}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.trackInfo}>
                <TouchableOpacity onPress={() => setShowPlaylists(false)} style={styles.backRow}>
                  <Feather name="arrow-left" size={16} color={accent.primary} />
                  <Text style={[styles.trackTitle, { color: colors.foreground }]}>Escolher playlist</Text>
                </TouchableOpacity>
                <Text style={[styles.trackArtist, { color: colors.mutedForeground }]} numberOfLines={1}>{track.title}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.action} onPress={handleNewPlaylist} activeOpacity={0.75}>
                  <View style={[styles.actionIcon, { backgroundColor: `${accent.primary}20` }]}>
                    <Feather name="plus" size={19} color={accent.primary} />
                  </View>
                  <Text style={[styles.actionLabel, { color: accent.primary }]}>Criar nova playlist</Text>
                </TouchableOpacity>

                {playlists.map((pl) => (
                  <TouchableOpacity key={pl.id} style={styles.action} onPress={() => handleAddToPlaylist(pl.id)} activeOpacity={0.75}>
                    <View style={[styles.actionIcon, { backgroundColor: `${accent.primary}12` }]}>
                      <Feather name="music" size={17} color={accent.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actionLabel, { color: colors.foreground }]}>{pl.name}</Text>
                      <Text style={[styles.plCount, { color: colors.mutedForeground }]}>{pl.tracks.length} músicas</Text>
                    </View>
                    {pl.tracks.find(t => t.id === track.id) ? (
                      <Feather name="check" size={15} color={accent.primary} />
                    ) : null}
                  </TouchableOpacity>
                ))}

                {playlists.length === 0 && (
                  <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>
                    Nenhuma playlist ainda. Crie uma acima.
                  </Text>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.muted }]}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={[styles.cancelTxt, { color: colors.foreground }]}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  trackInfo: { marginBottom: 4 },
  trackTitle: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  trackArtist: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  action: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 11 },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  plCount: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  emptyNote: { textAlign: "center", fontSize: 13, fontFamily: "Inter_400Regular", paddingVertical: 20 },
  cancelBtn: { marginTop: 12, borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center" },
  cancelTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
