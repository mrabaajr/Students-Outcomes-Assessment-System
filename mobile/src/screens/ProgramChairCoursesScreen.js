import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useMemo, useState } from "react";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { fetchProgramChairCourses } from "../services/mobileData";
import { colors } from "../theme/colors";

export default function ProgramChairCoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchProgramChairCourses();
        if (!cancelled) {
          setCourses(data);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.response?.data?.detail || loadError.message || "Failed to load courses.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const semesters = useMemo(
    () => ["All", ...new Set(courses.map((course) => course.semester).filter(Boolean))],
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesQuery =
        !normalized ||
        course.code.toLowerCase().includes(normalized) ||
        course.name.toLowerCase().includes(normalized) ||
        String(course.curriculum).toLowerCase().includes(normalized);
      const matchesSemester =
        selectedSemester === "All" || course.semester === selectedSemester;

      return matchesQuery && matchesSemester;
    });
  }, [courses, query, selectedSemester]);

  return (
    <AppScreen
      eyebrow="Program Chair"
      title="Courses and mappings"
      subtitle="Browse mapped courses and quickly inspect the outcome coverage already available in your backend."
    >
      <InfoCard title="Filters">
        <View style={styles.stack}>
          <TextInput
            onChangeText={setQuery}
            placeholder="Search code, name, or curriculum"
            placeholderTextColor="#7b8a86"
            style={styles.input}
            value={query}
          />
          <View style={styles.chips}>
            {semesters.map((semester) => (
              <Pressable
                key={semester}
                onPress={() => setSelectedSemester(semester)}
                style={[
                  styles.chip,
                  selectedSemester === semester ? styles.chipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedSemester === semester ? styles.chipTextActive : null,
                  ]}
                >
                  {semester}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.helperText}>
            Showing {filteredCourses.length} of {courses.length} courses
          </Text>
        </View>
      </InfoCard>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.yellow} />
          <Text style={styles.helperText}>Loading courses...</Text>
        </View>
      ) : error ? (
        <InfoCard title="Unable to load courses">
          <Text style={styles.error}>{error}</Text>
        </InfoCard>
      ) : filteredCourses.length === 0 ? (
        <InfoCard title="No courses found">
          <Text style={styles.helperText}>Try changing your search or semester filter.</Text>
        </InfoCard>
      ) : (
        filteredCourses.map((course) => (
          <InfoCard key={course.id} title={`${course.code} • ${course.name}`}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaText}>Curriculum: {course.curriculum}</Text>
              <Text style={styles.metaText}>Semester: {course.semester}</Text>
              <Text style={styles.metaText}>Academic year: {course.academicYear}</Text>
              <Text style={styles.metaText}>Year level: {course.yearLevel}</Text>
              <Text style={styles.metaStrong}>
                Linked outcomes: {Array.isArray(course.mappedSOs) ? course.mappedSOs.length : 0}
              </Text>
            </View>
          </InfoCard>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.dark,
  },
  chipText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: colors.yellow,
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
  metaBlock: {
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
    marginTop: 6,
  },
});
