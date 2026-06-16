import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated, Dimensions, Platform, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const { width: SW, height: SH } = Dimensions.get("window");

const FEATURES = [
  { icon: "music",     label: "Artistas reais",         sub: "Pop, Trap, Funk, Sertanejo e muito mais" },
  { icon: "search",    label: "Busque qualquer cantor",  sub: "Drake, Anitta, Mc Hariel, Taylor Swift..." },
  { icon: "list",      label: "Playlists personalizadas", sub: "Crie e compartilhe com todos" },
  { icon: "shuffle",   label: "Shuffle e Repeat",        sub: "Controle total de reprodução" },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const { accent } = useTheme();
  const insets = useSafeAreaInsets();
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(50)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const poweredOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(350),
        Animated.parallel([
          Animated.spring(contentY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }),
          Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(poweredOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const go = () => router.replace("/(auth)/login");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[accent.primary + "55", accent.primary + "18", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      {/* Logo */}
      <Animated.View style={[
        styles.logoWrap,
        { marginTop: Platform.OS === "web" ? 80 : insets.top + 60 },
        { transform: [{ scale: logoScale }], opacity: logoOpacity },
      ]}>
        <View style={[styles.logoCircle, { backgroundColor: accent.primary, shadowColor: accent.primary }]}>
          <Feather name="headphones" size={46} color="#fff" />
        </View>
        <Text style={[styles.appName, { color: colors.foreground }]}>Nexus</Text>
        <Text style={[styles.appSub, { color: accent.primary }]}>MUSIC</Text>

        {/* Nexus AI powered badge */}
        <Animated.View style={[styles.poweredBadge, { backgroundColor: colors.card, borderColor: colors.border, opacity: poweredOpacity }]}>
          <View style={[styles.poweredDot, { backgroundColor: accent.primary }]} />
          <Text style={[styles.poweredTxt, { color: colors.mutedForeground }]}>
            Hospedado na{" "}
            <Text style={{ color: accent.primary, fontFamily: "Inter_700Bold" }}>Plataforma Nexus</Text>
            {" "}by{" "}
            <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold" }}>Nexus AI</Text>
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Features */}
      <Animated.View style={[styles.features, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>
        {FEATURES.map((f, i) => (
          <View key={i} style={[styles.featureRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.featureIcon, { backgroundColor: accent.primary + "22" }]}>
              <Feather name={f.icon as any} size={18} color={accent.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
              <Text style={[styles.featureSub, { color: colors.mutedForeground }]}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[
        styles.actions,
        { opacity: contentOpacity, paddingBottom: Platform.OS === "web" ? 48 : insets.bottom + 28 },
      ]}>
        <TouchableOpacity onPress={go} style={[styles.primaryBtn, { backgroundColor: accent.primary }]} activeOpacity={0.88}>
          <Text style={styles.primaryBtnTxt}>Começar a ouvir</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={go} style={[styles.secondaryBtn, { borderColor: accent.primary + "66" }]} activeOpacity={0.82}>
          <Text style={[styles.secondaryBtnTxt, { color: accent.primary }]}>Já tenho conta</Text>
        </TouchableOpacity>
        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          Ao continuar, você aceita os Termos de Uso e Privacidade
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  logoWrap: { alignItems: "center", gap: 6 },
  logoCircle: {
    width: 104, height: 104, borderRadius: 52,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.55, shadowRadius: 30, elevation: 22,
    marginBottom: 10,
  },
  appName: { fontSize: 44, fontFamily: "Inter_700Bold", letterSpacing: -1.5 },
  appSub: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 7, marginTop: -8 },
  poweredBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 14, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  poweredDot: { width: 7, height: 7, borderRadius: 3.5 },
  poweredTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  features: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 10, marginTop: 32 },
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 15, borderRadius: 18, borderWidth: 1,
  },
  featureIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  featureLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  featureSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  actions: { paddingHorizontal: 24, gap: 12 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    height: 56, borderRadius: 28,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 10,
  },
  primaryBtnTxt: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  secondaryBtn: { height: 50, borderRadius: 25, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  secondaryBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  legal: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular" },
});
