import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { useAuth } from "../context/AuthContext";
import { fetchProgramChairDashboardData } from "../services/mobileData";
import { colors } from "../theme/colors";

export default function ProgramChairDashboardScreen({ navigation }) {
  const { user, signOut } = useAuth();
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
        const isAuthError =
          error.response?.status === 401 ||
          String(error.response?.data?.detail || error.message || "").toLowerCase().includes("token not valid");

        if (isAuthError) {
          await signOut();
          return;
        }

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

  const chairName = useMemo(() => {
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    if (fullName) return fullName;
    if (user?.name) return user.name;
    return "Program Chair";
  }, [user?.first_name, user?.last_name, user?.name]);

  const sectionRows = state.data?.recentSections || [];
  const maxStudents = useMemo(() => {
    const highest = sectionRows.reduce((max, section) => Math.max(max, Number(section.studentCount) || 0), 0);
    return highest || 1;
  }, [sectionRows]);

  const activityFeed = useMemo(
    () =>
      sectionRows.slice(0, 4).map((section, index) => ({
        id: `${section.id}-activity`,
        title: index % 2 === 0 ? "Assessment monitor" : "Section update",
        detail:
          index % 2 === 0
            ? `${section.courseCode} • Review submissions for ${section.name}`
            : `${section.courseCode} • ${section.studentCount} students enrolled`,
        time: `${index + 1} hr ago`,
      })),
    [sectionRows]
  );

  const quickActions = [
    {
      key: "student-outcomes",
      title: "Student Outcomes",
      description: "Open outcomes list and manage rubric criteria.",
      accent: "#0ea5a4",
      onPress: () => navigation.navigate("ProgramChairStudentOutcomes"),
    },
    {
      key: "assessments",
      title: "Assessments",
      description: "Open assessment entries and monitor grading.",
      accent: "#f59e0b",
      onPress: () => navigation.navigate("ProgramChairAssessments"),
    },
    {
      key: "classes",
      title: "Classes",
      description: "View sections and faculty assignments.",
      accent: "#2563eb",
      onPress: () => navigation.navigate("ProgramChairClasses"),
    },
    {
      key: "courses",
      title: "Course mapping",
      description: "Inspect mapped courses and linked outcomes.",
      accent: "#16a34a",
      onPress: () => navigation.navigate("ProgramChairCourses"),
    },
    {
      key: "reports",
      title: "Reports",
      description: "Open program-wide assessment summaries.",
      accent: "#a855f7",
      onPress: () => navigation.navigate("ProgramChairReports"),
    },
  ];

  const stats = state.data?.stats || [];

  return (
    <AppScreen
      title="Student Outcomes Assessment dashboard"
      subtitle="Manage program-level classes, mapped courses, and assessment performance from one place."
      showMeta={false}
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
          <InfoCard>
            <View style={styles.heroBlock}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>PROGRAM CHAIR PORTAL</Text>
              </View>
              <Text style={styles.heroTitle}>Welcome, {chairName}</Text>
              <Text style={styles.heroSubtitle}>
                Monitor the health of sections, guide faculty progress, and review student outcome coverage quickly.
              </Text>
              <View style={styles.heroActions}>
                <Pressable style={styles.heroPrimaryAction} onPress={() => navigation.navigate("ProgramChairClasses")}>
                  <Text style={styles.heroPrimaryActionText}>View Classes</Text>
                </Pressable>
                <Pressable style={styles.heroSecondaryAction} onPress={() => navigation.navigate("ProgramChairReports")}>
                  <Text style={styles.heroSecondaryActionText}>View Reports</Text>
                </Pressable>
              </View>
            </View>
          </InfoCard>

          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={stat.label} style={styles.statTile}>
                <View style={styles.statTopRow}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <View style={styles.statDeltaChip}>
                    <Text style={styles.statDeltaText}>{index % 2 === 0 ? "+5%" : "-3%"}</Text>
                  </View>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statSublabel}>{stat.sublabel}</Text>
              </View>
            ))}
          </View>

          <InfoCard title="Quick actions">
            <View style={styles.quickActionGrid}>
              {quickActions.map((action) => (
                <Pressable key={action.key} onPress={action.onPress} style={styles.quickActionCard}>
                  <View style={[styles.quickActionDot, { backgroundColor: action.accent }]} />
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionDescription}>{action.description}</Text>
                </Pressable>
              ))}
            </View>
          </InfoCard>

          <View style={styles.bottomGrid}>
            <InfoCard title="Recent sections" rightText="Live">
              <View style={styles.stack}>
                {sectionRows.map((section) => {
                  const widthPercent = Math.max(
                    8,
                    Math.round(((Number(section.studentCount) || 0) / maxStudents) * 100)
                  );

                  return (
                    <View key={section.id} style={styles.sectionRow}>
                      <View style={styles.rowHeader}>
                        <Text style={styles.rowTitle}>
                          {section.courseCode} • {section.name}
                        </Text>
                        <Text style={styles.rowMeta}>{section.studentCount} students</Text>
                      </View>
                      <Text style={styles.rowSub}>
                        {section.academicYear} • {section.semester}
                      </Text>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${widthPercent}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </InfoCard>

            <InfoCard title="Recent activity">
              <View style={styles.stack}>
                {activityFeed.map((item) => (
                  <View key={item.id} style={styles.activityRow}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityMain}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      <Text style={styles.activityDetail}>{item.detail}</Text>
                    </View>
                    <Text style={styles.activityTime}>{item.time}</Text>
                  </View>
                ))}
              </View>
            </InfoCard>
            </View>
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
    gap: 10,
  },
  heroBlock: {
    backgroundColor: colors.dark,
    borderRadius: 18,
    padding: 14,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 194, 14, 0.18)",
    borderRadius: 999,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: colors.yellow,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  heroActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  heroPrimaryAction: {
    backgroundColor: colors.yellow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  heroPrimaryActionText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "800",
  },
  heroSecondaryAction: {
    backgroundColor: "#374151",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  heroSecondaryActionText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  statTile: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minWidth: "46%",
    padding: 12,
  },
  statTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    color: colors.gray,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statDeltaChip: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statDeltaText: {
    color: "#15803D",
    fontSize: 9,
    fontWeight: "700",
  },
  statValue: {
    color: colors.dark,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 6,
  },
  statSublabel: {
    color: colors.gray,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  quickActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickActionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minWidth: "46%",
    padding: 12,
  },
  quickActionDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  quickActionTitle: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },
  quickActionDescription: {
    color: colors.gray,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  bottomGrid: {
    gap: 12,
  },
  stack: {
    gap: 12,
  },
  sectionRow: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  rowHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rowTitle: {
    color: colors.dark,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  rowSub: {
    color: colors.gray,
    fontSize: 11,
  },
  rowMeta: {
    color: colors.darkAlt,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 10,
  },
  progressTrack: {
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 6,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#16A34A",
    borderRadius: 999,
    height: "100%",
  },
  activityRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  activityDot: {
    backgroundColor: colors.yellow,
    borderRadius: 999,
    height: 8,
    marginTop: 5,
    width: 8,
  },
  activityMain: {
    flex: 1,
  },
  activityTitle: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  activityDetail: {
    color: colors.gray,
    fontSize: 11,
    marginTop: 2,
  },
  activityTime: {
    color: colors.gray,
    fontSize: 10,
  },
});
