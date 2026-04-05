import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/AuthContext";

export default function DashboardScreen() {
  const { signOut, session, user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>SOAS Mobile</Text>
        <Text style={styles.subtitle}>
          The mobile shell is ready. Next we can port your dashboard, classes, courses,
          assessments, and reports screen by screen.
        </Text>

        <View style={styles.panel}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{user?.email || "Current user"}</Text>
          <Text style={styles.meta}>Role: {session.userRole || "unknown"}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>Suggested next screens</Text>
          <Text style={styles.listItem}>1. Login flow refinement</Text>
          <Text style={styles.listItem}>2. Program chair dashboard</Text>
          <Text style={styles.listItem}>3. Faculty dashboard</Text>
          <Text style={styles.listItem}>4. Courses and classes</Text>
        </View>

        <Pressable onPress={signOut} style={styles.button}>
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    color: "#0f172a",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 12,
  },
  subtitle: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  label: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  value: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    color: "#64748b",
    marginTop: 6,
  },
  listItem: {
    color: "#334155",
    fontSize: 15,
    marginBottom: 6,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 14,
    marginTop: "auto",
    paddingVertical: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
