import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { fetchFacultyClasses, fetchSectionDetails } from "../services/mobileData";
import { colors } from "../theme/colors";

export default function FacultyClassesScreen() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [rosters, setRosters] = useState({});
  const [rosterLoadingId, setRosterLoadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchFacultyClasses();
        if (!cancelled) {
          setClasses(data);
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

  const filteredClasses = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return classes.filter((item) => {
      if (!normalized) return true;

      return (
        item.courseCode.toLowerCase().includes(normalized) ||
        item.courseName.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized) ||
        item.academicYear.toLowerCase().includes(normalized)
      );
    });
  }, [classes, query]);

  async function handleToggle(sectionId) {
    if (expandedId === sectionId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(sectionId);

    if (rosters[sectionId]) {
      return;
    }

    try {
      setRosterLoadingId(sectionId);
      const detail = await fetchSectionDetails(sectionId);
      setRosters((prev) => ({ ...prev, [sectionId]: detail.students || [] }));
    } catch (detailError) {
      setRosters((prev) => ({
        ...prev,
        [sectionId]: [{ id: "error", name: detailError.message || "Failed to load students." }],
      }));
    } finally {
      setRosterLoadingId((current) => (current === sectionId ? null : current));
    }
  }

  return (
    <AppScreen
      eyebrow="Faculty"
      title="My classes"
      subtitle="Open assigned sections and inspect the roster straight from your phone."
    >
      <InfoCard title="Search">
        <TextInput
          onChangeText={setQuery}
          placeholder="Search course, section, or school year"
          placeholderTextColor="#7b8a86"
          style={styles.input}
          value={query}
        />
        <Text style={styles.helperText}>
          Showing {filteredClasses.length} of {classes.length} classes
        </Text>
      </InfoCard>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.yellow} />
          <Text style={styles.helperText}>Loading classes...</Text>
        </View>
      ) : error ? (
        <InfoCard title="Unable to load classes">
          <Text style={styles.error}>{error}</Text>
        </InfoCard>
      ) : filteredClasses.length === 0 ? (
        <InfoCard title="No classes found">
          <Text style={styles.helperText}>Try a different search term.</Text>
        </InfoCard>
      ) : (
        filteredClasses.map((item) => {
          const isExpanded = expandedId === item.id;
          const roster = rosters[item.id] || [];
          const isLoadingRoster = rosterLoadingId === item.id;

          return (
            <InfoCard key={item.id} title={`${item.courseCode} • ${item.name}`}>
              <View style={styles.metaStack}>
                <Text style={styles.metaText}>{item.courseName}</Text>
                <Text style={styles.metaText}>
                  {item.academicYear} • {item.semester}
                </Text>
                <Text style={styles.metaStrong}>{item.studentCount} enrolled students</Text>
              </View>

              <Pressable onPress={() => handleToggle(item.id)} style={styles.rosterButton}>
                <Text style={styles.rosterButtonText}>
                  {isExpanded ? "Hide roster" : "View roster"}
                </Text>
              </Pressable>

              {isExpanded ? (
                <View style={styles.roster}>
                  {isLoadingRoster ? (
                    <ActivityIndicator color="#0f766e" />
                  ) : roster.length === 0 ? (
                    <Text style={styles.helperText}>No students loaded for this section.</Text>
                  ) : (
                    roster.map((student) => (
                      <View key={`${item.id}-${student.id}`} style={styles.studentRow}>
                        <View style={styles.studentMain}>
                          <Text style={styles.studentName}>{student.name}</Text>
                          {"studentId" in student ? (
                            <Text style={styles.studentMeta}>
                              {student.studentId}
                              {student.program || student.yearLevel
                                ? ` • ${[
                                    student.program,
                                    student.yearLevel ? `Year ${student.yearLevel}` : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}`
                                : ""}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              ) : null}
            </InfoCard>
          );
        })
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 15,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  helperText: {
    color: colors.gray,
    fontSize: 13,
  },
  centered: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
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
  rosterButton: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 14,
    marginTop: 14,
    paddingVertical: 12,
  },
  rosterButtonText: {
    color: colors.yellow,
    fontSize: 14,
    fontWeight: "700",
  },
  roster: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    gap: 10,
    marginTop: 14,
    padding: 14,
  },
  studentRow: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  studentMain: {
    flex: 1,
  },
  studentName: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "700",
  },
  studentMeta: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 4,
  },
});
