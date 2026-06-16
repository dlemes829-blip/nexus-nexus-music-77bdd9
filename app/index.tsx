import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function RootIndex() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator /></View>;
  }
  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }
  return <Redirect href="/(tabs)" />;
}
