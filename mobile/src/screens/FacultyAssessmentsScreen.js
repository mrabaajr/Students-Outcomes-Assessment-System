import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import {
  fetchFacultyAssessmentScreenData,
  fetchAssessmentSummaries,
  loadAssessmentGrades,
  saveAssessmentGrades,
} from "../services/assessmentMobile";
import { fetchSectionDetails } from "../services/mobileData";
import { colors } from "../theme/colors";

function statusColors(status) {
  if (status === "assessed") {
    return {
      backgroundColor: "#dcfce7",
      borderColor: "#86efac",
      color: "#15803d",
      label: "Assessed",
    };
  }
  if (status === "incomplete") {
    return {
      backgroundColor: "#fef3c7",
      borderColor: "#fcd34d",
      color: "#b45309",
      label: "Incomplete",
    };
  }
  return {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
    color: "#4b5563",
    label: "Not Yet Assessed",
  };
}

function toCsvField(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function buildAssessmentCsv(rows) {
  const header = [
    "Course Code",
    "Course Name",
    "Section",
    "Semester",
    "School Year",
    "Student Outcome",
    "Status",
    "Graded Students",
    "Total Students",
    "Faculty",
  ];

  const csvRows = rows.map((row) =>
    [
      row.courseCode,
      row.courseName,
      row.sectionName,
      row.semester,
      row.schoolYear,
      row.soCode,
      row.statusLabel,
      row.gradedStudents,
      row.totalStudents,
      row.facultyName,
    ]
      .map(toCsvField)
      .join(",")
  );

  return `${header.map(toCsvField).join(",")}\n${csvRows.join("\n")}`;
}

export default function FacultyAssessmentsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentOutcomes, setStudentOutcomes] = useState([]);
  const [sections, setSections] = useState([]);
  const [courseMappings, setCourseMappings] = useState({});
  const [selectedSOIds, setSelectedSOIds] = useState([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState("");
  const [selectedSectionName, setSelectedSectionName] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [summaryMap, setSummaryMap] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchFacultyAssessmentScreenData();
        if (cancelled) return;
        setStudentOutcomes(data.studentOutcomes);
        setSections(data.sections);
        setCourseMappings(data.courseMappings);
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError.response?.data?.detail || loadError.message || "Failed to load assessment data.");
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      const mappedSOs = courseMappings[section.courseCode] || [];
      const matchesSO =
        selectedSOIds.length === 0 ||
        selectedSOIds.some((selectedId) => mappedSOs.some((soId) => parseInt(soId, 10) === parseInt(selectedId, 10)));
      const matchesCourse = !selectedCourseCode || section.courseCode === selectedCourseCode;
      const matchesSection = !selectedSectionName || section.name === selectedSectionName;
      const matchesSemester = !selectedSemester || section.semester === selectedSemester;
      const matchesYear = !selectedSchoolYear || section.schoolYear === selectedSchoolYear;

      return matchesSO && matchesCourse && matchesSection && matchesSemester && matchesYear;
    });
  }, [
    sections,
    courseMappings,
    selectedSOIds,
    selectedCourseCode,
    selectedSectionName,
    selectedSemester,
    selectedSchoolYear,
  ]);

  const coursesForGrid = useMemo(() => {
    const grouped = new Map();

    filteredSections.forEach((section) => {
      if (!grouped.has(section.courseCode)) {
        grouped.set(section.courseCode, {
          id: section.courseCode,
          courseCode: section.courseCode,
          courseName: section.courseName,
          sections: [],
          studentCount: 0,
          assessmentStatus: "not-yet",
        });
      }

      const course = grouped.get(section.courseCode);
      course.sections.push(section);
      course.studentCount += Number(section.studentCount) || 0;
    });

    return Array.from(grouped.values());
  }, [filteredSections]);

  const sectionRequests = useMemo(() => {
    return filteredSections.flatMap((section) => {
      const mappedSOs = courseMappings[section.courseCode] || [];
      const relevantIds = selectedSOIds.length > 0 ? selectedSOIds : mappedSOs;
      return relevantIds.map((soId) => ({
        section_id: section.id,
        so_id: soId,
        school_year: section.schoolYear || "",
      }));
    });
  }, [filteredSections, courseMappings, selectedSOIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadSummaries() {
      try {
        const summaries = await fetchAssessmentSummaries(sectionRequests);
        if (cancelled) return;
        const next = {};
        summaries.forEach((summary) => {
          next[`${summary.section_id}:${summary.so_id}:${summary.school_year}`] = summary;
        });
        setSummaryMap(next);
      } catch {
        if (!cancelled) setSummaryMap({});
      }
    }

    if (sectionRequests.length > 0) {
      loadSummaries();
    } else {
      setSummaryMap({});
    }

    return () => {
      cancelled = true;
    };
  }, [sectionRequests]);

  const courseOptions = useMemo(() => {
    const map = new Map();
    sections.forEach((section) => {
      if (!map.has(section.courseCode)) map.set(section.courseCode, section.courseName);
    });
    return Array.from(map, ([code, name]) => ({ code, name }));
  }, [sections]);

  const sectionOptions = useMemo(
    () => [...new Set(filteredSections.map((section) => section.name))],
    [filteredSections]
  );
  const semesterOptions = useMemo(
    () => [...new Set(filteredSections.map((section) => section.semester).filter(Boolean))],
    [filteredSections]
  );
  const schoolYearOptions = useMemo(
    () => [...new Set(filteredSections.map((section) => section.schoolYear).filter(Boolean))],
    [filteredSections]
  );

  function clearAllFilters() {
    setSelectedSOIds([]);
    setSelectedCourseCode("");
    setSelectedSectionName("");
    setSelectedSemester("");
    setSelectedSchoolYear("");
  }

  const activeFilterCount = [
    selectedSOIds.length > 0,
    selectedCourseCode,
    selectedSectionName,
    selectedSemester,
    selectedSchoolYear,
  ].filter(Boolean).length;

  async function handleExportCsv() {
    try {
      const rows = filteredSections.flatMap((section) => {
        const mappedSOs = courseMappings[section.courseCode] || [];
        const relevantIds = selectedSOIds.length > 0 ? selectedSOIds : mappedSOs;

        return relevantIds.map((soId) => {
          const summary = summaryMap[`${section.id}:${soId}:${section.schoolYear || ""}`];
          const studentOutcome = studentOutcomes.find((item) => String(item.id) === String(soId));

          return {
            courseCode: section.courseCode,
            courseName: section.courseName,
            sectionName: section.name,
            semester: section.semester,
            schoolYear: section.schoolYear,
            soCode: studentOutcome?.code || `SO ${soId}`,
            statusLabel: statusColors(summary?.status).label,
            gradedStudents: summary?.graded_students ?? 0,
            totalStudents: summary?.total_students ?? section.studentCount ?? 0,
            facultyName: section.facultyName || "",
          };
        });
      });

      if (!rows.length) {
        Alert.alert("No data to export", "Use filters that return assessment rows before exporting.");
        return;
      }

      const csv = buildAssessmentCsv(rows);
      const fileUri = `${FileSystem.cacheDirectory}faculty-assessments-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export faculty assessments",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Export created", "CSV export was created, but sharing is not available on this device.");
      }
    } catch (exportError) {
      Alert.alert("Export failed", exportError.message || "Unable to export assessment CSV.");
    }
  }

  return (
    <AppScreen
      title={"SO\nAssessment"}
      subtitle="Filter by outcome, course, section, and term before opening a class for grading."
      heroFooter={
        <Pressable onPress={handleExportCsv} style={styles.exportButton}>
          <Text style={styles.exportButtonText}>Export CSV</Text>
        </Pressable>
      }
    >
      {loading ? (
        <InfoCard title="Loading">
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.yellow} />
            <Text style={styles.mutedText}>Loading assessment data...</Text>
          </View>
        </InfoCard>
      ) : error ? (
        <InfoCard title="Error">
          <Text style={styles.errorText}>{error}</Text>
        </InfoCard>
      ) : (
        <>
          <InfoCard title="Filters">
            <Text style={styles.filterLabel}>Student Outcomes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.soRow}>
                {studentOutcomes.map((outcome) => {
                  const active = selectedSOIds.includes(outcome.id);
                  return (
                    <Pressable
                      key={outcome.id}
                      onPress={() =>
                        setSelectedSOIds((prev) =>
                          active ? prev.filter((id) => id !== outcome.id) : [...prev, outcome.id]
                        )
                      }
                      style={[styles.soChip, active ? styles.soChipActive : null]}
                    >
                      <Text style={[styles.soChipText, active ? styles.soChipTextActive : null]}>
                        {outcome.code}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.optionSection}>
              <Text style={styles.filterLabel}>Quick filters</Text>
              <View style={styles.optionWrap}>
                {[{ label: "Course", value: selectedCourseCode || "All", options: courseOptions.map((item) => item.code), setter: setSelectedCourseCode },
                  { label: "Section", value: selectedSectionName || "All", options: sectionOptions, setter: setSelectedSectionName },
                  { label: "Semester", value: selectedSemester || "All", options: semesterOptions, setter: setSelectedSemester },
                  { label: "School Year", value: selectedSchoolYear || "All", options: schoolYearOptions, setter: setSelectedSchoolYear }].map((group) => (
                  <ScrollView key={group.label} horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.groupRow}>
                      <Text style={styles.groupLabel}>{group.label}</Text>
                      <Pressable onPress={() => group.setter("")} style={[styles.optionPill, group.value === "All" ? styles.optionPillActive : null]}>
                        <Text style={[styles.optionText, group.value === "All" ? styles.optionTextActive : null]}>All</Text>
                      </Pressable>
                      {group.options.map((option) => (
                        <Pressable
                          key={`${group.label}-${option}`}
                          onPress={() => group.setter(option)}
                          style={[styles.optionPill, group.value === option ? styles.optionPillActive : null]}
                        >
                          <Text style={[styles.optionText, group.value === option ? styles.optionTextActive : null]}>
                            {option}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                ))}
              </View>
            </View>

            <View style={styles.filterFooter}>
              <Text style={styles.mutedText}>
                {activeFilterCount > 0 ? `${activeFilterCount} active filter(s)` : "No active filters"}
              </Text>
              {activeFilterCount > 0 ? (
                <Pressable onPress={clearAllFilters} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </Pressable>
              ) : null}
            </View>
          </InfoCard>

          <InfoCard title="Courses" rightText={`${coursesForGrid.length} total`}>
            {coursesForGrid.length === 0 ? (
              <Text style={styles.mutedText}>No courses found for the selected filters.</Text>
            ) : (
              coursesForGrid.map((course) => {
                const mappedIds = courseMappings[course.courseCode] || [];
                const courseSummaries = course.sections.flatMap((section) => {
                  const relevantIds = selectedSOIds.length > 0 ? selectedSOIds : mappedIds;
                  return relevantIds
                    .map((soId) => summaryMap[`${section.id}:${soId}:${section.schoolYear || ""}`])
                    .filter(Boolean);
                });

                let aggregateStatus = "not-yet";
                if (courseSummaries.some((item) => item.status === "incomplete")) {
                  aggregateStatus = "incomplete";
                } else if (
                  courseSummaries.length > 0 &&
                  courseSummaries.every((item) => item.status === "assessed")
                ) {
                  aggregateStatus = "assessed";
                }

                const badge = statusColors(aggregateStatus);

                return (
                  <Pressable
                    key={course.id}
                    onPress={() =>
                      navigation.navigate("FacultyAssessmentEntry", {
                        course,
                        studentOutcomes,
                        courseMappings,
                        summaryMap,
                      })
                    }
                    style={styles.courseCard}
                  >
                    <View style={styles.courseHeader}>
                      <View style={styles.courseMain}>
                        <Text style={styles.courseCode}>{course.courseCode}</Text>
                        <Text style={styles.courseName}>{course.courseName}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor, borderColor: badge.borderColor }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>

                    <Text style={styles.courseMeta}>
                      {course.studentCount} students • {course.sections.length} sections
                    </Text>

                    {mappedIds.length > 0 ? (
                      <View style={styles.mappedRow}>
                        {studentOutcomes
                          .filter((so) => mappedIds.includes(so.id))
                          .map((so) => (
                            <View key={so.id} style={styles.mappedPill}>
                              <Text style={styles.mappedPillText}>{so.code}</Text>
                            </View>
                          ))}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </InfoCard>
        </>
      )}
    </AppScreen>
  );
}

export function FacultyAssessmentEntryScreen({ route }) {
  const { course, studentOutcomes, courseMappings, summaryMap } = route.params;
  const [selectedSection, setSelectedSection] = useState(course.sections?.[0] || null);
  const [selectedSOId, setSelectedSOId] = useState(() => {
    const mapped = courseMappings[course.courseCode] || [];
    return mapped[0] || null;
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedSO = useMemo(
    () => studentOutcomes.find((item) => item.id === selectedSOId) || null,
    [studentOutcomes, selectedSOId]
  );

  const assessmentBases = useMemo(() => {
    if (!selectedSO?.performanceIndicators) return [];
    return selectedSO.performanceIndicators.flatMap((pi) => {
      if (pi.performanceCriteria?.length > 0) {
        return pi.performanceCriteria.map((pc) => ({
          key: `criterion:${pc.id}`,
          label: pc.name,
        }));
      }
      return [{ key: `indicator:${pi.id}`, label: pi.name || `PI ${pi.number}` }];
    });
  }, [selectedSO]);

  useEffect(() => {
    let cancelled = false;

    async function loadGradesForSelection() {
      if (!selectedSection || !selectedSO) {
        setStudents([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const sectionDetail = await fetchSectionDetails(selectedSection.id);
        const baseStudents = (sectionDetail.students || []).map((student) => ({
          ...student,
          grades: {},
        }));

        const savedGrades = await loadAssessmentGrades(
          selectedSection.id,
          selectedSO.id,
          selectedSection.schoolYear
        );

        const nextStudents = baseStudents.map((student) => ({
          ...student,
          grades: savedGrades[String(student.id)] || {},
        }));

        if (!cancelled) {
          setStudents(nextStudents);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.response?.data?.detail || loadError.message || "Failed to load grades.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGradesForSelection();
    return () => {
      cancelled = true;
    };
  }, [selectedSection, selectedSO]);

  function updateGrade(studentId, basisKey, value) {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? {
              ...student,
              grades: {
                ...student.grades,
                [basisKey]: value,
              },
            }
          : student
      )
    );
  }

  async function handleSave() {
    if (!selectedSection || !selectedSO) return;

    const grades = {};
    students.forEach((student) => {
      grades[student.id] = {};
      Object.entries(student.grades || {}).forEach(([key, score]) => {
        if (score !== null && score !== undefined && score !== "") {
          grades[student.id][key] = score;
        }
      });
    });

    try {
      setSaving(true);
      setError("");
      await saveAssessmentGrades({
        sectionId: selectedSection.id,
        soId: selectedSO.id,
        schoolYear: selectedSection.schoolYear,
        grades,
      });
    } catch (saveError) {
      setError(saveError.response?.data?.detail || saveError.message || "Failed to save assessment.");
    } finally {
      setSaving(false);
    }
  }

  const currentSummary =
    selectedSection && selectedSO
      ? summaryMap[`${selectedSection.id}:${selectedSO.id}:${selectedSection.schoolYear || ""}`]
      : null;

  return (
    <AppScreen eyebrow="Assessment Entry" title={course.courseCode} subtitle={course.courseName}>
      <InfoCard title="Selection">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.soRow}>
            {(course.sections || []).map((section) => (
              <Pressable
                key={section.id}
                onPress={() => setSelectedSection(section)}
                style={[styles.soChip, selectedSection?.id === section.id ? styles.soChipActive : null]}
              >
                <Text style={[styles.soChipText, selectedSection?.id === section.id ? styles.soChipTextActive : null]}>
                  {section.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionSpacer}>
          <View style={styles.soRow}>
            {(courseMappings[course.courseCode] || []).map((soId) => {
              const so = studentOutcomes.find((item) => item.id === soId);
              if (!so) return null;
              return (
                <Pressable
                  key={so.id}
                  onPress={() => setSelectedSOId(so.id)}
                  style={[styles.soChip, selectedSOId === so.id ? styles.soChipActive : null]}
                >
                  <Text style={[styles.soChipText, selectedSOId === so.id ? styles.soChipTextActive : null]}>
                    {so.code}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {selectedSection ? (
          <Text style={styles.mutedText}>
            {selectedSection.facultyName} • {selectedSection.semester} • {selectedSection.schoolYear}
          </Text>
        ) : null}

        {currentSummary ? (
          <View style={styles.summaryInline}>
            <Text style={styles.summaryInlineText}>
              Status: {statusColors(currentSummary.status).label}
            </Text>
            <Text style={styles.summaryInlineText}>
              Graded: {currentSummary.graded_students}/{currentSummary.total_students}
            </Text>
          </View>
        ) : null}
      </InfoCard>

      {loading ? (
        <InfoCard title="Loading">
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.yellow} />
            <Text style={styles.mutedText}>Loading grades...</Text>
          </View>
        </InfoCard>
      ) : selectedSO && students.length > 0 ? (
        <>
          <InfoCard title={selectedSO.title}>
            <Text style={styles.mutedText}>{selectedSO.description}</Text>
          </InfoCard>

          {students.map((student, index) => (
            <InfoCard key={student.id} title={`${index + 1}. ${student.name}`} rightText={student.studentId}>
              <View style={styles.studentGrades}>
                {assessmentBases.map((basis) => (
                  <View key={`${student.id}-${basis.key}`} style={styles.gradeRow}>
                    <Text style={styles.gradeLabel}>{basis.label}</Text>
                    <View style={styles.gradeOptions}>
                      {[1, 2, 3, 4, 5, 6].map((score) => {
                        const active = Number(student.grades?.[basis.key]) === score;
                        return (
                          <Pressable
                            key={`${basis.key}-${score}`}
                            onPress={() => updateGrade(student.id, basis.key, score)}
                            style={[styles.scoreChip, active ? styles.scoreChipActive : null]}
                          >
                            <Text style={[styles.scoreChipText, active ? styles.scoreChipTextActive : null]}>
                              {score}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </InfoCard>
          ))}

          {error ? (
            <InfoCard title="Error">
              <Text style={styles.errorText}>{error}</Text>
            </InfoCard>
          ) : null}

          <Pressable onPress={handleSave} style={[styles.saveAction, saving && styles.saveActionDisabled]} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.dark} /> : <Text style={styles.saveActionText}>Save Assessment</Text>}
          </Pressable>
        </>
      ) : (
        <InfoCard title="No assessment data">
          <Text style={styles.mutedText}>Choose a section and mapped student outcome to start grading.</Text>
        </InfoCard>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  mutedText: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
  },
  exportButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.yellow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  exportButtonText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  filterLabel: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  soRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  soChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  soChipActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellowAlt,
  },
  soChipText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  soChipTextActive: {
    color: colors.dark,
  },
  optionSection: {
    marginTop: 18,
  },
  optionWrap: {
    gap: 10,
  },
  groupRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingRight: 10,
  },
  groupLabel: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "700",
    width: 78,
  },
  optionPill: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionPillActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  optionText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  optionTextActive: {
    color: colors.yellow,
  },
  filterFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  clearButton: {
    backgroundColor: colors.yellow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clearButtonText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "800",
  },
  courseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  courseHeader: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  courseMain: {
    flex: 1,
  },
  courseCode: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
  },
  courseName: {
    color: colors.gray,
    fontSize: 13,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  courseMeta: {
    color: colors.dark,
    fontSize: 13,
    marginTop: 10,
  },
  mappedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  mappedPill: {
    backgroundColor: "#fff8db",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  mappedPillText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "800",
  },
  selectionSpacer: {
    marginTop: 10,
  },
  summaryInline: {
    gap: 4,
    marginTop: 12,
  },
  summaryInlineText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  studentGrades: {
    gap: 14,
  },
  gradeRow: {
    gap: 8,
  },
  gradeLabel: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  gradeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scoreChip: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minWidth: 38,
    paddingVertical: 10,
  },
  scoreChipActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellowAlt,
  },
  scoreChipText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  scoreChipTextActive: {
    color: colors.dark,
  },
  saveAction: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveActionDisabled: {
    opacity: 0.65,
  },
  saveActionText: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "800",
  },
});
