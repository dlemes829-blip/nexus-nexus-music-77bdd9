import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const { accent } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmail = async () => {
    if (!email.includes("@")) { setError("Insira um e-mail válido"); return; }
    setLoading(true); setError("");
    try { await signIn(email, "email"); router.replace("/(tabs)"); } catch { setError("Erro ao entrar. Tente novamente."); }
    setLoading(false);
  };

  const handleSocial = async (method: "google" | "phone") => {
    setLoading(true); setError("");
    try { await signIn(method === "google" ? "user@google.com" : "+55119999", method); router.replace("/(tabs)"); } catch { setError("Erro ao entrar."); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[accent.primary + "40", colors.background]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.45 }} />

      <View style={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: accent.primary + "22" }]}>
            <Feather name="headphones" size={32} color={accent.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Bem-vindo ao Nexus</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>Entre para acessar sua música</Text>
        </View>

        <View style={styles.form}>
          {/* Email input */}
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="mail" size={18} color={colors.mutedForeground} style={{ marginLeft: 16 }} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="seu@email.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleEmail}
            />
          </View>

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

          <TouchableOpacity onPress={handleEmail} style={[styles.primaryBtn, { backgroundColor: accent.primary }]} activeOpacity={0.88} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnTxt}>Entrar com e-mail</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.divTxt, { color: colors.mutedForeground }]}>ou</Text>
            <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social */}
          <TouchableOpacity onPress={() => handleSocial("google")} style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.82}>
            <Feather name="globe" size={18} color="#4285F4" />
            <Text style={[styles.socialTxt, { color: colors.foreground }]}>Continuar com Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleSocial("phone")} style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.82}>
            <Feather name="smartphone" size={18} color={accent.primary} />
            <Text style={[styles.socialTxt, { color: colors.foreground }]}>Continuar com Telefone</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          Ao continuar, você aceita os Termos de Uso
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, gap: 24 },
  header: { alignItems: "center", gap: 10 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular" },
  form: { gap: 12 },
  inputWrap: { flexDirection: "row", alignItems: "center", height: 54, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  input: { flex: 1, paddingHorizontal: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  error: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  primaryBtn: { height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  primaryBtnTxt: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  divLine: { flex: 1, height: 1 },
  divTxt: { fontSize: 13, fontFamily: "Inter_400Regular" },
  socialBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 26, borderWidth: 1 },
  socialTxt: { fontSize: 15, fontFamily: "Inter_500Medium" },
  legal: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular" },
});
