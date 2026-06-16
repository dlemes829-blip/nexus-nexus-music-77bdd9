import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActionSheetIOS, Alert, Modal, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePlaylists } from "@/context/PlaylistContext";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";

export default function ProfileScreen() {
  const colors = useColors();
  const { accent, isDark, toggleDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut, updateUser } = useAuth();
  const { likedIds, recentTracks, queue } = usePlayer();
  const { playlists } = usePlaylists();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  const bottomPad = (Platform.OS === "ios" ? insets.bottom + 49 : Platform.OS === "web" ? 80 : 49) + 88;
  const letters = (user?.name || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const joined = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "";

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/welcome");
  };

  const requestPermission = async (type: "camera" | "gallery"): Promise<boolean> => {
    if (type === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Permita acesso à câmera nas configurações do seu dispositivo.");
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Permita acesso à galeria nas configurações do seu dispositivo.");
        return false;
      }
    }
    return true;
  };

  const pickFromGallery = async () => {
    setPhotoModalVisible(false);
    const granted = await requestPermission("gallery");
    if (!granted) return;
    setUploadingPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.85,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        await updateUser({ avatarUri: result.assets[0].uri });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a imagem.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const takePhoto = async () => {
    setPhotoModalVisible(false);
    const granted = await requestPermission("camera");
    if (!granted) return;
    setUploadingPhoto(true);
    try {
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      if (!result.canceled && result.assets[0]?.uri) {
        await updateUser({ avatarUri: result.assets[0].uri });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível usar a câmera.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    setPhotoModalVisible(false);
    await updateUser({ avatarUri: undefined });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "ios") {
      const options = user?.avatarUri
        ? ["Câmera", "Escolher da galeria", "Remover foto", "Cancelar"]
        : ["Câmera", "Escolher da galeria", "Cancelar"];
      const destructiveIndex = user?.avatarUri ? 2 : -1;
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined, title: "Foto de perfil" },
        (idx) => {
          if (idx === 0) takePhoto();
          else if (idx === 1) pickFromGallery();
          else if (idx === 2 && user?.avatarUri) removePhoto();
        }
      );
    } else {
      setPhotoModalVisible(true);
    }
  };

  const menuGroups = [
    {
      title: "Conta",
      items: [
        { icon: "image",              label: "Foto de perfil",     sub: user?.avatarUri ? "Foto personalizada" : "Sem foto",           onPress: handleAvatarPress },
        { icon: isDark ? "sun" : "moon", label: isDark ? "Modo claro" : "Modo escuro", sub: isDark ? "Tema escuro ativo" : "Tema claro ativo", onPress: toggleDarkMode },
      ],
    },
    {
      title: "Preferências",
      items: [
        { icon: "settings",  label: "Configurações",        sub: "Cor de destaque, áudio",              onPress: () => router.push("/settings") },
        { icon: "bell",      label: "Notificações",          sub: "Controles de mídia",                  onPress: () => {} },
        { icon: "info",      label: "Sobre o Nexus Music",   sub: "v2.0 • Deezer API + Archive.org CC",  onPress: () => {} },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={[`${accent.primary}55`, colors.background]}
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
      >
        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.85} style={styles.avatarContainer}>
          {user?.avatarUri ? (
            <Image source={{ uri: user.avatarUri }} style={[styles.avatar, styles.avatarImg]} contentFit="cover" transition={250} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: accent.primary }]}>
              <Text style={styles.avatarTxt}>{letters}</Text>
            </View>
          )}
          <View style={[styles.editBadge, { backgroundColor: accent.primary }]}>
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Feather name="camera" size={13} color="#000" />
            )}
          </View>
        </TouchableOpacity>

        <Text style={[styles.name, { color: colors.foreground }]}>{user?.name || "Ouvinte"}</Text>
        {user?.email ? <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.email}</Text> : null}
        {joined ? <Text style={[styles.since, { color: colors.mutedForeground }]}>Ouvinte desde {joined}</Text> : null}
        {user?.plan === "premium" && (
          <View style={[styles.premiumBadge, { backgroundColor: `${accent.primary}22`, borderColor: `${accent.primary}55` }]}>
            <Feather name="zap" size={11} color={accent.primary} />
            <Text style={[styles.premiumTxt, { color: accent.primary }]}>PREMIUM</Text>
          </View>
        )}
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { value: recentTracks.length, label: "Tocadas",   icon: "play-circle", color: accent.primary },
          { value: likedIds.size,        label: "Curtidas",  icon: "heart",       color: "#E91E63" },
          { value: playlists.length,     label: "Playlists", icon: "list",        color: "#3F51B5" },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Feather name={s.icon as any} size={20} color={s.color} />
            <Text style={[styles.statVal, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu groups */}
      {menuGroups.map((group) => (
        <View key={group.title} style={styles.menuGroup}>
          <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{group.title.toUpperCase()}</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {group.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                activeOpacity={0.72}
                style={[
                  styles.menuRow,
                  i < group.items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${accent.primary}18` }]}>
                  <Feather name={item.icon as any} size={17} color={accent.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                  {item.sub ? <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{item.sub}</Text> : null}
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Sign out */}
      <TouchableOpacity
        onPress={handleSignOut}
        style={[styles.signOut, { backgroundColor: `${colors.destructive}18`, borderColor: `${colors.destructive}44` }]}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.signOutTxt, { color: colors.destructive }]}>Sair da conta</Text>
      </TouchableOpacity>

      {/* ── Nexus AI branding footer ── */}
      <View style={[styles.nexusFooter, { borderColor: colors.border }]}>
        <LinearGradient
          colors={[accent.primary + "15", accent.primary + "05"]}
          style={styles.nexusGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.nexusRow}>
            <View style={[styles.nexusIcon, { backgroundColor: accent.primary }]}>
              <Feather name="zap" size={14} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nexusTitle, { color: colors.foreground }]}>
                Desenvolvido por{" "}
                <Text style={{ color: accent.primary }}>Nexus AI</Text>
              </Text>
              <Text style={[styles.nexusSub, { color: colors.mutedForeground }]}>
                Hospedado na Plataforma Nexus — infraestrutura construída para o futuro
              </Text>
            </View>
          </View>
          <View style={[styles.nexusDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.nexusVersion, { color: colors.mutedForeground }]}>
            Nexus Music v2.0 · Deezer API · Archive.org CC
          </Text>
        </LinearGradient>
      </View>

      {/* Android photo picker modal */}
      <Modal visible={photoModalVisible} transparent animationType="slide" onRequestClose={() => setPhotoModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPhotoModalVisible(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Foto de perfil</Text>
            <TouchableOpacity style={styles.modalOption} onPress={takePhoto} activeOpacity={0.75}>
              <View style={[styles.modalOptionIcon, { backgroundColor: `${accent.primary}20` }]}>
                <Feather name="camera" size={22} color={accent.primary} />
              </View>
              <View>
                <Text style={[styles.modalOptionLabel, { color: colors.foreground }]}>Tirar foto</Text>
                <Text style={[styles.modalOptionSub, { color: colors.mutedForeground }]}>Abrir câmera</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={pickFromGallery} activeOpacity={0.75}>
              <View style={[styles.modalOptionIcon, { backgroundColor: `${accent.primary}20` }]}>
                <Feather name="image" size={22} color={accent.primary} />
              </View>
              <View>
                <Text style={[styles.modalOptionLabel, { color: colors.foreground }]}>Escolher da galeria</Text>
                <Text style={[styles.modalOptionSub, { color: colors.mutedForeground }]}>Fotos e álbuns</Text>
              </View>
            </TouchableOpacity>
            {user?.avatarUri ? (
              <TouchableOpacity style={styles.modalOption} onPress={removePhoto} activeOpacity={0.75}>
                <View style={[styles.modalOptionIcon, { backgroundColor: `${colors.destructive}20` }]}>
                  <Feather name="trash-2" size={22} color={colors.destructive} />
                </View>
                <View>
                  <Text style={[styles.modalOptionLabel, { color: colors.destructive }]}>Remover foto</Text>
                  <Text style={[styles.modalOptionSub, { color: colors.mutedForeground }]}>Voltar ao avatar padrão</Text>
                </View>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.modalCancel, { backgroundColor: colors.muted }]} onPress={() => setPhotoModalVisible(false)} activeOpacity={0.75}>
              <Text style={[styles.modalCancelTxt, { color: colors.foreground }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { alignItems: "flex-start", paddingHorizontal: 24, paddingBottom: 28 },
  avatarContainer: { marginBottom: 14, position: "relative" },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
  },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarTxt: { color: "#fff", fontSize: 34, fontFamily: "Inter_700Bold" },
  editBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#000",
  },
  name: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  email: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  since: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  premiumBadge: {
    flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
  },
  premiumTxt: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  statCard: {
    flex: 1, alignItems: "center", gap: 4, paddingVertical: 16, borderRadius: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  menuGroup: { paddingHorizontal: 16, marginBottom: 16 },
  groupTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginBottom: 8 },
  menuCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  signOut: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    marginHorizontal: 16, height: 50, borderRadius: 12, borderWidth: 1, marginBottom: 20,
  },
  signOutTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  nexusFooter: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  nexusGrad: { padding: 16 },
  nexusRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  nexusIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 2 },
  nexusTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  nexusSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 16 },
  nexusDivider: { height: 1, marginVertical: 12 },
  nexusVersion: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingHorizontal: 20, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 20, textAlign: "center" },
  modalOption: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 14 },
  modalOptionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalOptionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalOptionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  modalCancel: { marginTop: 8, borderRadius: 12, height: 50, alignItems: "center", justifyContent: "center" },
  modalCancelTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
