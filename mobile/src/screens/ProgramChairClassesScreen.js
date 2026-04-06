import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { fetchProgramChairClasses } from "../services/mobileData";
import { colors } from "../theme/colors";

export default function ProgramChairClassesScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState({ sections: [], faculty: [] });
  const [mode, setMode] = useState("sections");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchProgramChairClasses();
        if (!cancelled) {
          setPayload(data);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.response?.data?.detail || loadError.message || "Failed to load classes.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSections = useMemo(
    () => payload.sections.filter((section) => section.isActive).length,
    [payload.sections]
  );

  return (
    <AppScreen
      eyebrow="Program Chair"
      title="Classes overview"
      subtitle="Review all sections and faculty assignments without opening the desktop site."
    >
      <InfoCard title="Overview">
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{payload.sections.length}</Text>
            <Text style={styles.summaryLabel}>Sections loaded</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{activeSections}</Text>
            <Text style={styles.summaryLabel}>Active sections</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{payload.faculty.length}</Text>
            <Text style={styles.summaryLabel}>Faculty members</Text>
          </View>
        </View>
      </InfoCard>

      <InfoCard title="View">
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setMode("sections")}
            style={[styles.toggle, mode === "sections" ? styles.toggleActive : null]}
          >
            <Text style={[styles.toggleText, mode === "sections" ? styles.toggleTextActive : null]}>
              Sections
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("faculty")}
            style={[styles.toggle, mode === "faculty" ? styles.toggleActive : null]}
          >
            <Text style={[styles.toggleText, mode === "faculty" ? styles.toggleTextActive : null]}>
              Faculty
            </Text>
          </Pressable>
        </View>
      </InfoCard>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.yellow} />
          <Text style={styles.helperText}>Loading classes...</Text>
        </View>
      ) : error ? (
        <InfoCard title="Unable to load data">
          <Text style={styles.error}>{error}</Text>
        </InfoCard>
      ) : mode === "sections" ? (
        payload.sections.map((section) => (
          <InfoCard key={section.id} title={`${section.courseCode} • ${section.name}`}>
            <View style={styles.metaStack}>
              <Text style={styles.metaText}>Course: {section.courseName}</Text>
              <Text style={styles.metaText}>School year: {section.academicYear}</Text>
              <Text style={styles.metaText}>Semester: {section.semester}</Text>
              <Text style={styles.metaText}>Students: {section.studentCount}</Text>
              <Text style={styles.metaStrong}>{section.isActive ? "Active" : "Inactive"}</Text>
            </View>
          </InfoCard>
        ))
      ) : (
        payload.faculty.map((member) => (
          <InfoCard key={member.id} title={member.name}>
            <View style={styles.metaStack}>
              <Text style={styles.metaText}>{member.email || "No email on record"}</Text>
              <Text style={styles.metaStrong}>
                Assigned courses: {Array.isArray(member.courses) ? member.courses.length : 0}
              </Text>
            </View>
          </InfoCard>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    flex: 1,
    minWidth: "30%",
    padding: 14,
  },
  summaryValue: {
    color: colors.dark,
    fontSize: 24,
    fontWeight: "800",
  },
  summaryLabel: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggle: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  toggleActive: {
    backgroundColor: colors.dark,
  },
  toggleText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  toggleTextActive: {
    color: colors.yellow,
  },
  centered: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
  },
  helperText: {
    color: colors.gray,
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 21,
  },
  metaStack: {
    gap: 6,
  },
  metaText: {
    color: colors.dark,
    fontSize: 14,
  },
  metaStrong: {
    color: colors.yellowAlt,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
});
