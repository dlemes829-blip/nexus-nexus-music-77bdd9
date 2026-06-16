import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackItem } from "@/components/TrackItem";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import { usePlaylists, Playlist } from "@/context/PlaylistContext";

type Tab = "recentes" | "curtidas" | "playlists" | "fila";

function PlaylistCard({
  playlist,
  onPress,
  onShare,
  onDelete,
  colors,
  accent,
}: {
  playlist: Playlist;
  onPress: () => void;
  onShare: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useColors>;
  accent: { primary: string };
}) {
  const gradColors: [string, string][] = [
    ["#7C3AED", "#C026D3"],
    ["#0EA5E9", "#6366F1"],
    ["#F59E0B", "#EF4444"],
    ["#10B981", "#0EA5E9"],
    ["#EC4899", "#F97316"],
    ["#8B5CF6", "#06B6D4"],
  ];
  const ci = playlist.id.charCodeAt(3) % gradColors.length;
  const [c1, c2] = gradColors[ci];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[styles.plCard, { backgroundColor: colors.card }]}
    >
      <LinearGradient colors={[c1, c2]} style={styles.plArt} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Feather name="music" size={26} color="rgba(255,255,255,0.9)" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={[styles.plName, { color: colors.foreground }]} numberOfLines={1}>{playlist.name}</Text>
        <Text style={[styles.plCount, { color: colors.mutedForeground }]}>
          {playlist.tracks.length === 0 ? "Playlist vazia" : `${playlist.tracks.length} música${playlist.tracks.length !== 1 ? "s" : ""}`}
        </Text>
        {playlist.description ? (
          <Text style={[styles.plDesc, { color: colors.mutedForeground }]} numberOfLines={1}>{playlist.description}</Text>
        ) : null}
      </View>
      <View style={styles.plActions}>
        <TouchableOpacity onPress={onShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={[styles.plActionBtn, { backgroundColor: accent.primary + "18" }]}>
          <Feather name="share-2" size={15} color={accent.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={[styles.plActionBtn, { backgroundColor: "#EF444418" }]}>
          <Feather name="trash-2" size={15} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function LibraryScreen() {
  const colors = useColors();
  const { accent } = useTheme();
  const insets = useSafeAreaInsets();
  const { play, currentTrack, isPlaying, likedIds, recentTracks, queue } = usePlayer();
  const { playlists, createPlaylist, deletePlaylist, sharePlaylist, removeTrackFromPlaylist } = usePlaylists();

  const [activeTab, setActiveTab] = useState<Tab>("recentes");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const bottomPad = (Platform.OS === "ios" ? insets.bottom + 49 : Platform.OS === "web" ? 80 : 49) + 88;

  const TABS: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: "recentes",  label: "Recentes",  icon: "clock",   count: recentTracks.length },
    { id: "curtidas",  label: "Curtidas",  icon: "heart",   count: likedIds.size },
    { id: "playlists", label: "Playlists", icon: "list",    count: playlists.length },
    { id: "fila",      label: "Fila",      icon: "shuffle", count: queue.length },
  ];

  const tabData: { recentes: typeof recentTracks; curtidas: typeof recentTracks; playlists: never[]; fila: typeof queue } = {
    recentes: recentTracks,
    curtidas: recentTracks.filter((t) => likedIds.has(t.id)),
    playlists: [],
    fila: queue,
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setCreating(true);
    await createPlaylist(newPlaylistName, newPlaylistDesc || undefined);
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    setCreating(false);
    setCreateModalVisible(false);
  };

  const handleDeletePlaylist = (pl: Playlist) => {
    Alert.alert(
      "Excluir playlist",
      `Deseja excluir "${pl.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deletePlaylist(pl.id) },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[`${accent.primary}44`, colors.background]}
        style={[styles.headerGrad, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Biblioteca</Text>
          {activeTab === "playlists" && (
            <TouchableOpacity
              onPress={() => setCreateModalVisible(true)}
              style={[styles.iconBtn, { backgroundColor: `${accent.primary}22` }]}
            >
              <Feather name="plus" size={20} color={accent.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          {[
            { icon: "music",  label: `${recentTracks.length} tocadas`, color: accent.primary },
            { icon: "heart",  label: `${likedIds.size} curtidas`,      color: "#E91E63" },
            { icon: "list",   label: `${playlists.length} playlists`,  color: "#3F51B5" },
          ].map((s) => (
            <View key={s.label} style={[styles.statChip, { backgroundColor: `${s.color}20`, borderColor: `${s.color}44` }]}>
              <Feather name={s.icon as any} size={12} color={s.color} />
              <Text style={[styles.statTxt, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Liked songs hero card */}
      {activeTab !== "playlists" && (
        <TouchableOpacity
          style={[styles.likedCard, { backgroundColor: colors.card }]}
          onPress={() => setActiveTab("curtidas")}
          activeOpacity={0.85}
        >
          <LinearGradient colors={["#8B2FC9", "#E91E63"]} style={styles.likedArt} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Feather name="heart" size={32} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.likedTitle, { color: colors.foreground }]}>Músicas curtidas</Text>
            <Text style={[styles.likedCount, { color: colors.mutedForeground }]}>
              {likedIds.size === 0 ? "Nenhuma curtida ainda" : `${likedIds.size} música${likedIds.size !== 1 ? "s" : ""}`}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={[styles.tabItem, activeTab === t.id && { borderBottomColor: accent.primary, borderBottomWidth: 2 }]}
          >
            <Feather name={t.icon as any} size={14} color={activeTab === t.id ? accent.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: activeTab === t.id ? accent.primary : colors.mutedForeground }]}>
              {t.label}
            </Text>
            {t.count > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: activeTab === t.id ? accent.primary : colors.muted }]}>
                <Text style={[styles.tabBadgeTxt, { color: activeTab === t.id ? "#000" : colors.mutedForeground }]}>
                  {t.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Playlists tab */}
      {activeTab === "playlists" ? (
        selectedPlaylist ? (
          /* Playlist detail */
          <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
            <View style={styles.plDetailHeader}>
              <TouchableOpacity
                onPress={() => setSelectedPlaylist(null)}
                style={[styles.backBtn, { backgroundColor: colors.card }]}
              >
                <Feather name="arrow-left" size={18} color={colors.foreground} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.plDetailName, { color: colors.foreground }]}>{selectedPlaylist.name}</Text>
                <Text style={[styles.plDetailCount, { color: colors.mutedForeground }]}>
                  {selectedPlaylist.tracks.length} música{selectedPlaylist.tracks.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => sharePlaylist(selectedPlaylist)}
                style={[styles.shareBtn, { backgroundColor: accent.primary }]}
              >
                <Feather name="share-2" size={16} color="#fff" />
                <Text style={styles.shareBtnTxt}>Compartilhar</Text>
              </TouchableOpacity>
            </View>

            {selectedPlaylist.tracks.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="music" size={52} color={colors.mutedForeground + "50"} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Playlist vazia</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Toque em "+" em qualquer música para adicionar aqui
                </Text>
              </View>
            ) : (
              selectedPlaylist.tracks.map((t, i) => (
                <TrackItem
                  key={t.id + i}
                  track={t}
                  index={i}
                  showIndex={false}
                  isActive={currentTrack?.id === t.id}
                  isPlaying={currentTrack?.id === t.id && isPlaying}
                  onPress={() => play(t, selectedPlaylist.tracks)}
                  onMore={() => {
                    Alert.alert(t.title, t.artist, [
                      { text: "Remover da playlist", style: "destructive", onPress: () => removeTrackFromPlaylist(selectedPlaylist.id, t.id) },
                      { text: "Cancelar", style: "cancel" },
                    ]);
                  }}
                />
              ))
            )}
          </ScrollView>
        ) : (
          /* Playlists list */
          <ScrollView contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            {playlists.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="list" size={52} color={colors.mutedForeground + "50"} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhuma playlist</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Toque em "+" para criar sua primeira playlist e compartilhar com todos
                </Text>
                <TouchableOpacity
                  onPress={() => setCreateModalVisible(true)}
                  style={[styles.createBtn, { backgroundColor: accent.primary }]}
                >
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={styles.createBtnTxt}>Criar playlist</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {playlists.map((pl) => (
                  <PlaylistCard
                    key={pl.id}
                    playlist={pl}
                    onPress={() => setSelectedPlaylist(pl)}
                    onShare={() => sharePlaylist(pl)}
                    onDelete={() => handleDeletePlaylist(pl)}
                    colors={colors}
                    accent={accent}
                  />
                ))}
                <TouchableOpacity
                  onPress={() => setCreateModalVisible(true)}
                  style={[styles.newPlBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Feather name="plus-circle" size={18} color={accent.primary} />
                  <Text style={[styles.newPlBtnTxt, { color: accent.primary }]}>Nova playlist</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        )
      ) : (
        /* Recentes / Curtidas / Fila */
        <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
          {(tabData[activeTab] as typeof recentTracks).length === 0 ? (
            <View style={styles.emptyWrap}>
              <Feather name={TABS.find(t => t.id === activeTab)!.icon as any} size={52} color={colors.mutedForeground + "50"} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {activeTab === "recentes" ? "Histórico vazio" :
                 activeTab === "curtidas" ? "Nenhuma curtida" :
                 "Fila vazia"}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                {activeTab === "recentes" ? "Toque em uma música para começar" :
                 activeTab === "curtidas" ? "Curta músicas para vê-las aqui" :
                 "Adicione músicas à fila no player"}
              </Text>
            </View>
          ) : (
            (tabData[activeTab] as typeof recentTracks).map((t, i) => (
              <TrackItem
                key={t.id + i}
                track={t}
                index={i}
                showIndex={false}
                isActive={currentTrack?.id === t.id}
                isPlaying={currentTrack?.id === t.id && isPlaying}
                onPress={() => play(t, tabData[activeTab] as typeof recentTracks)}
                onMore={() => {}}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCreateModalVisible(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nova Playlist</Text>

            <View style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="music" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.modalInputText, { color: colors.foreground }]}
                placeholder="Nome da playlist"
                placeholderTextColor={colors.mutedForeground}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
                maxLength={50}
              />
            </View>

            <View style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="align-left" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.modalInputText, { color: colors.foreground }]}
                placeholder="Descrição (opcional)"
                placeholderTextColor={colors.mutedForeground}
                value={newPlaylistDesc}
                onChangeText={setNewPlaylistDesc}
                maxLength={100}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreatePlaylist}
              style={[styles.modalBtn, { backgroundColor: accent.primary, opacity: newPlaylistName.trim() ? 1 : 0.5 }]}
              disabled={!newPlaylistName.trim() || creating}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.modalBtnTxt}>Criar playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCreateModalVisible(false)}
              style={[styles.modalCancelBtn, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.modalCancelTxt, { color: colors.foreground }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: { paddingBottom: 16 },
  headerRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 16,
  },
  pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  likedCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 16, marginVertical: 12, padding: 14, borderRadius: 12,
  },
  likedArt: { width: 56, height: 56, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  likedTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  likedCount: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  tabsRow: {
    flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, marginHorizontal: 16,
  },
  tabItem: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tabBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, minWidth: 18, alignItems: "center" },
  tabBadgeTxt: { fontSize: 10, fontFamily: "Inter_700Bold" },
  emptyWrap: { alignItems: "center", gap: 10, paddingTop: 64, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  createBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
  },
  createBtnTxt: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  plCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 16, marginVertical: 5, padding: 14, borderRadius: 14,
  },
  plArt: { width: 56, height: 56, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  plName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  plCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  plDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  plActions: { flexDirection: "row", gap: 8 },
  plActionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  newPlBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 16, marginTop: 8, marginBottom: 16, height: 48, borderRadius: 14, borderWidth: 1,
  },
  newPlBtnTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  plDetailHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  plDetailName: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  plDetailCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  shareBtnTxt: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, paddingHorizontal: 20, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 20, textAlign: "center" },
  modalInput: {
    flexDirection: "row", alignItems: "center", gap: 10,
    height: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, marginBottom: 12,
  },
  modalInputText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  modalBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 52, borderRadius: 26, marginTop: 4,
  },
  modalBtnTxt: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  modalCancelBtn: { height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginTop: 10 },
  modalCancelTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
