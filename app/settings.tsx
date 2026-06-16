import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import { THEME_ACCENTS } from "@/constants/theme";

export default function SettingsScreen() {
  const colors = useColors();
  const { accent, isDark, toggleDarkMode, setAccent } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="x" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Configurações</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Appearance */}
      <Section title="Aparência">
        <MenuItem
          icon={isDark ? "sun" : "moon"}
          label={isDark ? "Modo claro" : "Modo escuro"}
          sub={isDark ? "Tema escuro ativo — toque para alternar" : "Tema claro ativo — toque para alternar"}
          colors={colors}
          accent={accent.primary}
          onPress={toggleDarkMode}
        />
      </Section>

      {/* Accent colors */}
      <Section title="Cor de destaque">
        <View style={styles.colorGrid}>
          {THEME_ACCENTS.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => setAccent(a)}
              style={[styles.colorSwatch, { backgroundColor: a.primary }]}
              activeOpacity={0.82}
            >
              {accent.id === a.id && <Feather name="check" size={16} color="#000" />}
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.accentNames}>
          {THEME_ACCENTS.map((a) => (
            <View key={a.id} style={{ alignItems: "center", width: 44 }}>
              <View style={[styles.accentDot, { backgroundColor: a.primary, borderWidth: accent.id === a.id ? 2 : 0, borderColor: "#fff" }]} />
              {accent.id === a.id && <Text style={[styles.accentName, { color: accent.primary }]}>{a.name}</Text>}
            </View>
          ))}
        </View>
      </Section>

      {/* Audio */}
      <Section title="Áudio">
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Qualidade de streaming", value: "128kbps MP3" },
            { label: "Fonte de música", value: "Jamendo API" },
            { label: "Licença", value: "Creative Commons" },
            { label: "Áudio em background", value: "Ativado" },
            { label: "Controles de notificação", value: "Ativado" },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.infoLabel, { color: colors.foreground }]}>{row.label}</Text>
              <Text style={[styles.infoVal, { color: colors.mutedForeground }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* About */}
      <Section title="Sobre">
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Versão", value: "1.0.0" },
            { label: "Build", value: "2026.06" },
            { label: "Plataforma", value: Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : "Web" },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.infoLabel, { color: colors.foreground }]}>{row.label}</Text>
              <Text style={[styles.infoVal, { color: colors.mutedForeground }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function MenuItem({ icon, label, sub, colors, accent, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.75}
    >
      <View style={[styles.menuIcon, { backgroundColor: `${accent}1A` }]}>
        <Feather name={icon} size={18} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
        {sub ? <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{sub}</Text> : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 20,
  },
  headerBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginBottom: 10 },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 14, borderWidth: 1,
  },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 16, marginBottom: 8 },
  colorSwatch: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  accentNames: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, paddingBottom: 4 },
  accentDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 3 },
  accentName: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  infoCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 13, paddingHorizontal: 16 },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoVal: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
