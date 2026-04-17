import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [activeFilterKey, setActiveFilterKey] = useState("outcome");

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

  const groupedSections = useMemo(() => {
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

  const filterConfigs = useMemo(
    () => ({
      outcome: {
        label: "Student Outcome",
        value: selectedSOIds.length > 0 ? String(selectedSOIds[0]) : "",
        displayValue:
          selectedSOIds.length > 0
            ? studentOutcomes.find((item) => String(item.id) === String(selectedSOIds[0]))?.code || "Selected"
            : "All Outcomes",
        options: [{ label: "All Outcomes", value: "" }].concat(
          studentOutcomes.map((item) => ({ label: item.code, value: String(item.id) }))
        ),
        onSelect: (value) => setSelectedSOIds(value ? [Number(value)] : []),
      },
      course: {
        label: "Course",
        value: selectedCourseCode,
        displayValue: selectedCourseCode || "All Courses",
        options: [{ label: "All Courses", value: "" }].concat(
          courseOptions.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.code }))
        ),
        onSelect: setSelectedCourseCode,
      },
      section: {
        label: "Section",
        value: selectedSectionName,
        displayValue: selectedSectionName || "All Sections",
        options: [{ label: "All Sections", value: "" }].concat(
          sectionOptions.map((item) => ({ label: item, value: item }))
        ),
        onSelect: setSelectedSectionName,
      },
      semester: {
        label: "Semester",
        value: selectedSemester,
        displayValue: selectedSemester || "All Semesters",
        options: [{ label: "All Semesters", value: "" }].concat(
          semesterOptions.map((item) => ({ label: item, value: item }))
        ),
        onSelect: setSelectedSemester,
      },
      schoolYear: {
        label: "School Year",
        value: selectedSchoolYear,
        displayValue: selectedSchoolYear || "All School Years",
        options: [{ label: "All School Years", value: "" }].concat(
          schoolYearOptions.map((item) => ({ label: item, value: item }))
        ),
        onSelect: setSelectedSchoolYear,
      },
    }),
    [
      courseOptions,
      schoolYearOptions,
      sectionOptions,
      selectedCourseCode,
      selectedSOIds,
      selectedSchoolYear,
      selectedSectionName,
      selectedSemester,
      semesterOptions,
      studentOutcomes,
    ]
  );

  function openFilterPicker(key) {
    setActiveFilterKey(key);
    setFilterPickerVisible(true);
  }

  function handleFilterSelect(value) {
    const config = filterConfigs[activeFilterKey];
    if (config?.onSelect) {
      config.onSelect(value);
    }
    setFilterPickerVisible(false);
  }

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

  const assessmentSnapshot = useMemo(() => {
    const keys = sectionRequests.map(
      (request) => `${request.section_id}:${request.so_id}:${request.school_year || ""}`
    );
    const summaries = keys.map((key) => summaryMap[key]).filter(Boolean);
    const assessed = summaries.filter((item) => item.status === "assessed").length;
    const completion = summaries.length > 0 ? Math.round((assessed / summaries.length) * 100) : 0;

    return {
      courses: groupedSections.length,
      sections: filteredSections.length,
      assessed,
      incomplete: summaries.filter((item) => item.status === "incomplete").length,
      completion,
    };
  }, [groupedSections.length, filteredSections.length, sectionRequests, summaryMap]);

  const exportRows = useMemo(() => {
    if (!selectedCourseCode) {
      return [];
    }

    const courseSections = filteredSections.filter((section) => section.courseCode === selectedCourseCode);

    return courseSections.flatMap((section) => {
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
  }, [courseMappings, filteredSections, selectedCourseCode, selectedSOIds, studentOutcomes, summaryMap]);

  async function handleExportCsv() {
    try {
      if (!selectedCourseCode) {
        Alert.alert("Select a course", "Choose a course before exporting the CSV.");
        return;
      }

      if (!exportRows.length) {
        Alert.alert("No data to export", "No assessment rows are available for the selected course.");
        return;
      }

      const csv = buildAssessmentCsv(exportRows);
      const fileUri = `${FileSystem.cacheDirectory}faculty-assessments-${String(selectedCourseCode).replace(/[^a-z0-9_-]/gi, "-")}-${Date.now()}.csv`;
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
      showMeta={false}
      enableScrollTopButton={true}
      heroFooter={
        <View style={styles.heroFooterWrap}>
          <View style={styles.heroActionRow}>
            <Pressable onPress={() => openFilterPicker("course")} style={styles.chooseCourseButton}>
              <Text style={styles.chooseCourseButtonText}>
                {selectedCourseCode ? `Selected: ${selectedCourseCode}` : "Choose Course"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleExportCsv}
              style={[styles.exportButton, !selectedCourseCode ? styles.exportButtonDisabled : null]}
              disabled={!selectedCourseCode}
            >
              <Text style={styles.exportButtonText}>Export Course CSV</Text>
            </Pressable>
          </View>
          <Text style={styles.heroHelperText}>Pick a course first, then export its assessment rows.</Text>
        </View>
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
            <View style={styles.filterCompactGrid}>
              {[
                { key: "outcome", label: "Outcome" },
                { key: "course", label: "Course" },
                { key: "section", label: "Section" },
                { key: "semester", label: "Semester" },
                { key: "schoolYear", label: "School Year" },
              ].map((item) => (
                <Pressable
                  key={item.key}
                  style={styles.filterCompactButton}
                  onPress={() => openFilterPicker(item.key)}
                >
                  <Text style={styles.filterCompactLabel}>{item.label}</Text>
                  <Text numberOfLines={1} style={styles.filterCompactValue}>
                    {filterConfigs[item.key].displayValue}
                    <Text style={styles.dropdownChevron}>▾</Text>
                  </Text>
                </Pressable>
              ))}
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

          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotTile}>
              <Text style={styles.snapshotLabel}>Courses</Text>
              <Text style={styles.snapshotValue}>{assessmentSnapshot.courses}</Text>
            </View>
            <View style={styles.snapshotTile}>
              <Text style={styles.snapshotLabel}>Sections</Text>
              <Text style={styles.snapshotValue}>{assessmentSnapshot.sections}</Text>
            </View>
            <View style={styles.snapshotTile}>
              <Text style={styles.snapshotLabel}>Assessed</Text>
              <Text style={styles.snapshotValue}>{assessmentSnapshot.assessed}</Text>
            </View>
            <View style={styles.snapshotTileHighlight}>
              <Text style={styles.snapshotLabelHighlight}>Completion</Text>
              <Text style={styles.snapshotValueHighlight}>{assessmentSnapshot.completion}%</Text>
            </View>
          </View>

          <InfoCard title="Courses" rightText={`${groupedSections.length} total`}>
            {groupedSections.length === 0 ? (
              <Text style={styles.mutedText}>No courses found for the selected filters.</Text>
            ) : (
              groupedSections.map((course) => {
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
                    <View style={styles.courseAccentBar} />
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

                    <View style={styles.courseMetaRow}>
                      <Text style={styles.courseMetaSoft}>Tap card to open assessment entry</Text>
                      <Text style={styles.courseMetaStrong}>{mappedIds.length} mapped SOs</Text>
                    </View>

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

                    <View style={styles.openCourseRow}>
                      <Text style={styles.openCourseText}>Open Assessment</Text>
                      <Text style={styles.openCourseArrow}>→</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </InfoCard>
        </>
      )}

      <Modal animationType="fade" transparent visible={filterPickerVisible}>
        <View style={styles.modalOverlaySoft}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{filterConfigs[activeFilterKey]?.label || "Select"}</Text>
              <Pressable onPress={() => setFilterPickerVisible(false)} style={styles.pickerCloseButton}>
                <Text style={styles.pickerCloseText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.pickerList}>
              {(filterConfigs[activeFilterKey]?.options || []).map((option) => {
                const selected = String(filterConfigs[activeFilterKey]?.value || "") === String(option.value);
                return (
                  <Pressable
                    key={`${activeFilterKey}-${option.value}`}
                    onPress={() => handleFilterSelect(option.value)}
                    style={[styles.pickerOption, selected && styles.pickerOptionActive]}
                  >
                    <Text style={[styles.pickerOptionText, selected && styles.pickerOptionTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

export function FacultyAssessmentEntryScreen({ route, navigation }) {
  const { course, studentOutcomes, courseMappings, summaryMap } = route.params;
  const [selectedSection, setSelectedSection] = useState(course.sections?.[0] || null);
  const [selectedSOId, setSelectedSOId] = useState(() => {
    const mapped = courseMappings[course.courseCode] || [];
    return mapped[0] || null;
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [liveSummary, setLiveSummary] = useState(null);
  const autosaveTimeoutRef = useRef(null);
  const hydratedSelectionRef = useRef(false);
  const lastSavedSignatureRef = useRef("");

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

  function buildGradesPayload(studentList) {
    const grades = {};
    studentList.forEach((student) => {
      grades[student.id] = {};
      Object.entries(student.grades || {}).forEach(([key, score]) => {
        if (score !== null && score !== undefined && score !== "") {
          grades[student.id][key] = score;
        }
      });
    });
    return grades;
  }

  function buildSaveSignature(section, so, studentList) {
    if (!section || !so) return "";
    return JSON.stringify({
      sectionId: section.id,
      soId: so.id,
      schoolYear: section.schoolYear || "",
      grades: buildGradesPayload(studentList),
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadGradesForSelection() {
      hydratedSelectionRef.current = false;
      clearTimeout(autosaveTimeoutRef.current);
      setSaveStatus("idle");
      setLiveSummary(
        selectedSection && selectedSO
          ? summaryMap[`${selectedSection.id}:${selectedSO.id}:${selectedSection.schoolYear || ""}`] || null
          : null
      );

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
          lastSavedSignatureRef.current = buildSaveSignature(selectedSection, selectedSO, nextStudents);
          hydratedSelectionRef.current = true;
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
  }, [selectedSection, selectedSO, summaryMap]);

  useEffect(() => {
    return () => {
      clearTimeout(autosaveTimeoutRef.current);
    };
  }, []);

  function updateGrade(studentId, basisKey, value) {
    setError("");
    setSaveStatus("pending");
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

  useEffect(() => {
    if (!selectedSection || !selectedSO || loading || !hydratedSelectionRef.current) {
      return undefined;
    }

    const nextSignature = buildSaveSignature(selectedSection, selectedSO, students);
    if (!nextSignature || nextSignature === lastSavedSignatureRef.current) {
      return undefined;
    }

    clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        setSaveStatus("saving");
        setError("");

        await saveAssessmentGrades({
          sectionId: selectedSection.id,
          soId: selectedSO.id,
          schoolYear: selectedSection.schoolYear,
          grades: buildGradesPayload(students),
        });

        lastSavedSignatureRef.current = nextSignature;
        setSaveStatus("saved");

        const summaries = await fetchAssessmentSummaries([
          {
            section_id: selectedSection.id,
            so_id: selectedSO.id,
            school_year: selectedSection.schoolYear || "",
          },
        ]);
        setLiveSummary(summaries[0] || null);
      } catch (saveError) {
        setSaveStatus("error");
        setError(saveError.response?.data?.detail || saveError.message || "Failed to save assessment.");
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => {
      clearTimeout(autosaveTimeoutRef.current);
    };
  }, [students, selectedSection, selectedSO, loading]);

  const currentSummary =
    selectedSection && selectedSO
      ? liveSummary || summaryMap[`${selectedSection.id}:${selectedSO.id}:${selectedSection.schoolYear || ""}`]
      : null;

  const autoSaveMessage =
    saveStatus === "saving"
      ? "Saving assessment automatically..."
      : saveStatus === "saved"
      ? "Assessment saved automatically."
      : saveStatus === "pending"
      ? "Saving your latest grade changes..."
      : saveStatus === "error"
      ? "Autosave failed. Changes will retry when you update a grade."
      : "Changes save automatically as you grade.";

  return (
    <AppScreen
      eyebrow="Assessment Entry"
      title={course.courseCode}
      subtitle={course.courseName}
      showMeta={false}
      enableScrollTopButton={true}
    >
      <InfoCard title="Selection">
        <View style={styles.entryTopRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.entryBackButton}>
            <Text style={styles.entryBackButtonText}>← Back to Assessments</Text>
          </Pressable>
        </View>

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
            <View style={[styles.summaryPill, styles.summaryPillStatus]}>
              <Text style={styles.summaryPillLabel}>Status</Text>
              <Text
                style={[
                  styles.summaryPillValue,
                  currentSummary.status === "assessed"
                    ? styles.summaryPillValueGood
                    : currentSummary.status === "incomplete"
                    ? styles.summaryPillValueWarn
                    : styles.summaryPillValueNeutral,
                ]}
              >
                {statusColors(currentSummary.status).label}
              </Text>
            </View>

            <View style={[styles.summaryPill, styles.summaryPillGraded]}>
              <Text style={styles.summaryPillLabel}>Graded</Text>
              <Text style={styles.summaryPillValue}>
                {currentSummary.graded_students}/{currentSummary.total_students}
              </Text>
            </View>
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

          <View
            style={[
              styles.autoSaveBanner,
              saveStatus === "error" ? styles.autoSaveBannerError : null,
            ]}
          >
            {saving ? <ActivityIndicator color={colors.dark} size="small" /> : null}
            <Text style={styles.autoSaveText}>{autoSaveMessage}</Text>
          </View>
        </>
      ) : (
        <InfoCard title="No assessment data">
          <Text style={styles.mutedText}>Choose a section and mapped student outcome to start grading.</Text>
        </InfoCard>
      )}

      <Modal animationType="fade" transparent visible={successVisible}>
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Saved Successfully</Text>
            <Text style={styles.successMessage}>
              Assessment grades have been saved to the system.
            </Text>
            <Pressable
              onPress={() => {
                setSuccessVisible(false);
                navigation.goBack();
              }}
              style={styles.successButton}
            >
              <Text style={styles.successButtonText}>Back To Assessments</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    marginBottom: 6,
  },
  filterDropdownStack: {
    gap: 10,
  },
  filterBlock: {
    gap: 6,
  },
  filterCompactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterCompactButton: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "47%",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterCompactLabel: {
    color: colors.gray,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  filterCompactValue: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  dropdownButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dropdownValue: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  dropdownChevron: {
    color: colors.gray,
    fontSize: 14,
    fontWeight: "800",
  },
  modalOverlaySoft: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 18,
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.graySoft,
    padding: 14,
    maxHeight: "70%",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pickerTitle: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "800",
  },
  pickerCloseButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pickerCloseText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  pickerList: {
    marginTop: 4,
  },
  pickerOption: {
    borderColor: colors.graySoft,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerOptionActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  pickerOptionText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  pickerOptionTextActive: {
    color: colors.yellow,
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
  snapshotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  snapshotTile: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  snapshotTileHighlight: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: colors.dark,
    borderColor: colors.dark,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  snapshotLabel: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  snapshotValue: {
    color: colors.dark,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  snapshotLabelHighlight: {
    color: "#ffe9a0",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  snapshotValueHighlight: {
    color: colors.yellow,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
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
  courseAccentBar: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.yellow,
    marginBottom: 10,
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
    fontWeight: "700",
  },
  courseMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  courseMetaSoft: {
    color: colors.gray,
    fontSize: 12,
    flex: 1,
  },
  courseMetaStrong: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "800",
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
  openCourseRow: {
    marginTop: 12,
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  openCourseText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  openCourseArrow: {
    color: colors.yellowAlt,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 18,
  },
  selectionSpacer: {
    marginTop: 10,
  },
  entryTopRow: {
    marginBottom: 10,
  },
  entryBackButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  entryBackButtonText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  summaryInline: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  summaryPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryPillStatus: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
  },
  summaryPillGraded: {
    backgroundColor: "#fff8db",
    borderColor: colors.yellow,
  },
  summaryPillLabel: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summaryPillValue: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryPillValueGood: {
    color: "#15803d",
  },
  summaryPillValueWarn: {
    color: "#b45309",
  },
  summaryPillValueNeutral: {
    color: "#4b5563",
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
  autoSaveBanner: {
    alignItems: "center",
    backgroundColor: "#fff8db",
    borderColor: colors.yellow,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  autoSaveBannerError: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
  },
  autoSaveText: {
    color: colors.dark,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
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
  successOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 24,
  },
  successCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.graySoft,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: "center",
  },
  successIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  successIcon: {
    color: colors.dark,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30,
  },
  successTitle: {
    color: colors.dark,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  successMessage: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  successButton: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 12,
    paddingVertical: 12,
  },
  successButtonText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  chooseCourseButtonText: {
    color: colors.surface, // white for visibility
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  heroHelperText: {
    color: colors.surface, // white for visibility
    fontSize: 13,
    marginTop: 10,
    marginBottom: 18,
  },
});
