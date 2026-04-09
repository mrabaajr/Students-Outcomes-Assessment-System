import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import AppScreen from "../components/layout/AppScreen";
import ActionCard from "../components/ui/ActionCard";
import InfoCard from "../components/ui/InfoCard";
import StatCard from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";
import { fetchFacultyDashboardData } from "../services/mobileData";
import { colors } from "../theme/colors";

export default function FacultyDashboardScreen({ navigation }) {
  const { signOut } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchFacultyDashboardData();
        if (!cancelled) {
          setState({ loading: false, error: "", data });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error.response?.data?.detail || error.message || "Failed to load dashboard.",
            data: null,
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppScreen
      eyebrow="Faculty"
      title="Teaching dashboard"
      subtitle="Stay on top of your assigned sections, student counts, and the classes you can act on."
      footer={
        <Pressable onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      }
    >
      {state.loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.yellow} />
          <Text style={styles.muted}>Loading dashboard...</Text>
        </View>
      ) : state.error ? (
        <InfoCard title="Dashboard unavailable">
          <Text style={styles.error}>{state.error}</Text>
        </InfoCard>
      ) : (
        <>
          <View style={styles.statsGrid}>
            {state.data.stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </View>

          <InfoCard title="Quick actions">
            <ActionCard
              title="My classes"
              description="Open your assigned classes and drill into their student rosters."
              accent="#2563eb"
              onPress={() => navigation.navigate("FacultyClasses")}
            />
          </InfoCard>

          <InfoCard title="Assigned sections" rightText="Live">
            <View style={styles.stack}>
              {state.data.sections.map((section) => (
                <View key={section.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>
                      {section.courseCode} • {section.name}
                    </Text>
                    <Text style={styles.rowSub}>
                      {section.academicYear} • {section.semester}
                    </Text>
                  </View>
                  <Text style={styles.rowMeta}>{section.studentCount}</Text>
                </View>
              ))}
            </View>
          </InfoCard>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
  },
  muted: {
    color: colors.gray,
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 21,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  stack: {
    gap: 12,
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 12,
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "700",
  },
  rowSub: {
    color: colors.gray,
    fontSize: 13,
    marginTop: 3,
  },
  rowMeta: {
    color: colors.yellowAlt,
    fontSize: 18,
    fontWeight: "800",
  },
  signOut: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 16,
    paddingVertical: 16,
  },
  signOutText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
});
