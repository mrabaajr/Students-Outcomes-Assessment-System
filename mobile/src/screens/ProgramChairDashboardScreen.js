import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import AppScreen from "../components/layout/AppScreen";
import ActionCard from "../components/ui/ActionCard";
import InfoCard from "../components/ui/InfoCard";
import StatCard from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";
import { fetchProgramChairDashboardData } from "../services/mobileData";
import { colors } from "../theme/colors";

export default function ProgramChairDashboardScreen({ navigation }) {
  const { signOut } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchProgramChairDashboardData();
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
      eyebrow="Program Chair"
      title="Assessment command center"
      subtitle="Track outcomes, mapped courses, and sections from one mobile home base."
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
            <View style={styles.stack}>
              <ActionCard
                title="Course mapping"
                description="Browse mapped courses and their linked student outcomes."
                accent="#f59e0b"
                onPress={() => navigation.navigate("ProgramChairCourses")}
              />
              <ActionCard
                title="Classes overview"
                description="Review all sections and faculty assignments in one place."
                accent="#2563eb"
                onPress={() => navigation.navigate("ProgramChairClasses")}
              />
            </View>
          </InfoCard>

          <InfoCard title="Recent sections" rightText="Live">
            <View style={styles.stack}>
              {state.data.recentSections.map((section) => (
                <View key={section.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>
                      {section.courseCode} • {section.name}
                    </Text>
                    <Text style={styles.rowSub}>
                      {section.academicYear} • {section.semester}
                    </Text>
                  </View>
                  <Text style={styles.rowMeta}>{section.studentCount} students</Text>
                </View>
              ))}
            </View>
          </InfoCard>

          <InfoCard title="Mapped courses">
            <View style={styles.stack}>
              {state.data.topCourses.map((course) => (
                <View key={course.id} style={styles.coursePill}>
                  <Text style={styles.courseCode}>{course.code}</Text>
                  <Text style={styles.courseName}>{course.name}</Text>
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
    fontSize: 12,
    fontWeight: "700",
  },
  coursePill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    padding: 14,
  },
  courseCode: {
    color: colors.yellowAlt,
    fontSize: 12,
    fontWeight: "800",
  },
  courseName: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
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
