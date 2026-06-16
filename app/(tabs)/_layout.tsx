import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { MiniPlayer } from "@/components/MiniPlayer";

function TabIcon({ name, color }: { name: keyof typeof Feather.glyphMap; color: string }) {
  return <Feather name={name} size={22} color={color} />;
}

export default function TabLayout() {
  const colors = useColors();
  const { accent, isDark } = useTheme();
  const { user, isLoading } = useAuth();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/(auth)/welcome");
    }
  }, [user, isLoading]);

  if (!user && !isLoading) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.foreground,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: "Inter_600SemiBold",
            marginTop: -2,
            marginBottom: 2,
          },
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            elevation: 0,
            height: isWeb ? 80 : undefined,
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={80}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: isDark ? "rgba(0,0,0,0.94)" : "rgba(248,248,250,0.96)" },
                ]}
              />
            ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Início",
            tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Buscar",
            tabBarIcon: ({ color }) => <TabIcon name="search" color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Biblioteca",
            tabBarIcon: ({ color }) => <TabIcon name="heart" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
