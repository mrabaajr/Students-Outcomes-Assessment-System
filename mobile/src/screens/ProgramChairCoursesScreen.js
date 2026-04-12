import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useMemo, useState } from "react";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { fetchProgramChairCourses } from "../services/mobileData";
import { fetchStudentOutcomesMobile } from "../services/studentOutcomes";
import { colors } from "../theme/colors";

export default function ProgramChairCoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All Semesters");
  const [selectedCurriculum, setSelectedCurriculum] = useState("All Curriculums");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("All Years");
  const [viewMode, setViewMode] = useState("Grid");
  const [customCurriculums, setCustomCurriculums] = useState([]);
  const [customAcademicYears, setCustomAcademicYears] = useState([]);
  const [studentOutcomes, setStudentOutcomes] = useState([]);
  const [loadingOutcomes, setLoadingOutcomes] = useState(false);

  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [curriculumModalVisible, setCurriculumModalVisible] = useState(false);
  const [schoolYearModalVisible, setSchoolYearModalVisible] = useState(false);
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("curriculum");
  const [coursePickerVisible, setCoursePickerVisible] = useState(false);
  const [coursePickerField, setCoursePickerField] = useState("curriculum");

  const [newCurriculum, setNewCurriculum] = useState("");
  const [newSchoolYear, setNewSchoolYear] = useState("");
  const [courseForm, setCourseForm] = useState({
    sourceCourseId: "",
    code: "",
    name: "",
    curriculum: "",
    academicYear: "",
    semester: "1st Semester",
    yearLevel: "",
    mappedSOs: [],
  });

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

  useEffect(() => {
    if (!courseModalVisible) return;

    let cancelled = false;

    async function loadOutcomes() {
      try {
        setLoadingOutcomes(true);
        const data = await fetchStudentOutcomesMobile();
        if (!cancelled) {
          setStudentOutcomes(data);
        }
      } catch {
        if (!cancelled) {
          setStudentOutcomes([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingOutcomes(false);
        }
      }
    }

    loadOutcomes();
    return () => {
      cancelled = true;
    };
  }, [courseModalVisible]);

  const semesters = useMemo(
    () => ["All Semesters", ...new Set(courses.map((course) => course.semester).filter(Boolean))],
    [courses]
  );

  const semesterOptions = ["1st Semester", "2nd Semester", "Summer"];
  const yearLevelOptions = ["1", "2", "3", "4", "5"];

  const curriculums = useMemo(
    () => [
      "All Curriculums",
      ...new Set([
        ...courses.map((course) => String(course.curriculum || "")).filter(Boolean),
        ...customCurriculums,
      ]),
    ],
    [courses, customCurriculums]
  );

  const academicYears = useMemo(
    () => [
      "All Years",
      ...new Set([
        ...courses.map((course) => String(course.academicYear || "")).filter(Boolean),
        ...customAcademicYears,
      ]),
    ],
    [courses, customAcademicYears]
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
        selectedSemester === "All Semesters" || course.semester === selectedSemester;
      const matchesCurriculum =
        selectedCurriculum === "All Curriculums" || String(course.curriculum) === selectedCurriculum;
      const matchesAcademicYear =
        selectedAcademicYear === "All Years" || String(course.academicYear) === selectedAcademicYear;

      return matchesQuery && matchesSemester && matchesCurriculum && matchesAcademicYear;
    });
  }, [courses, query, selectedSemester, selectedCurriculum, selectedAcademicYear]);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const activeCourses = courses.length;
    const mappedCourses = courses.filter((course) => Array.isArray(course.mappedSOs) && course.mappedSOs.length > 0).length;
    const averageCoverage = totalCourses > 0 ? Math.round((mappedCourses / totalCourses) * 100) : 0;

    return {
      totalCourses,
      activeCourses,
      mappedCourses,
      averageCoverage,
    };
  }, [courses]);

  const statTiles = [
    { key: "total", label: "Total Courses", value: stats.totalCourses, hint: "All registered" },
    { key: "active", label: "Active Courses", value: stats.activeCourses, hint: "In rotation" },
    { key: "mapped", label: "Mapped To SOs", value: stats.mappedCourses, hint: "Linked outcomes" },
    { key: "coverage", label: "Avg Coverage", value: `${stats.averageCoverage}%`, hint: "Across courses" },
  ];

  const matrixOutcomeNumbers = useMemo(() => {
    const fromOutcomes = studentOutcomes
      .map((outcome) => Number(outcome.number))
      .filter((value) => Number.isFinite(value));

    const fromCourses = courses.flatMap((course) =>
      Array.isArray(course.mappedSOs)
        ? course.mappedSOs.map((value) => Number(value)).filter((value) => Number.isFinite(value))
        : []
    );

    const merged = Array.from(new Set([...fromOutcomes, ...fromCourses])).sort((a, b) => a - b);
    return merged.length > 0 ? merged : [1, 2, 3, 4, 5, 6, 7];
  }, [studentOutcomes, courses]);

  function isMapped(course, outcomeNumber) {
    return Array.isArray(course.mappedSOs)
      ? course.mappedSOs.map((value) => Number(value)).includes(Number(outcomeNumber))
      : false;
  }

  function showSoon(message) {
    Alert.alert("Coming soon", message);
  }

  function openFilterPicker(type) {
    setActiveFilter(type);
    setFilterPickerVisible(true);
  }

  function openCoursePicker(field) {
    setCoursePickerField(field);
    setCoursePickerVisible(true);
  }

  const pickerTitle =
    activeFilter === "curriculum"
      ? "Select Curriculum"
      : activeFilter === "academicYear"
      ? "Select Academic Year"
      : "Select Semester";

  const pickerOptions =
    activeFilter === "curriculum"
      ? curriculums
      : activeFilter === "academicYear"
      ? academicYears
      : semesters;

  const selectedPickerValue =
    activeFilter === "curriculum"
      ? selectedCurriculum
      : activeFilter === "academicYear"
      ? selectedAcademicYear
      : selectedSemester;

  const coursePickerTitle =
    coursePickerField === "source"
      ? "Select Course From Database"
      : coursePickerField === "curriculum"
      ? "Select Curriculum"
      : coursePickerField === "academicYear"
      ? "Select Academic Year"
      : coursePickerField === "semester"
      ? "Select Semester"
      : "Select Year Level";

  const coursePickerOptions =
    coursePickerField === "source"
      ? [{ label: "Select course to autofill (optional)", value: "" }].concat(
          courses.map((course) => ({
            label: `${course.code} - ${course.name}`,
            value: String(course.id),
          }))
        )
      : coursePickerField === "curriculum"
      ? curriculums
          .filter((value) => value !== "All Curriculums")
          .map((value) => ({ label: value, value }))
      : coursePickerField === "academicYear"
      ? academicYears
          .filter((value) => value !== "All Years")
          .map((value) => ({ label: value, value }))
      : coursePickerField === "semester"
      ? semesterOptions.map((value) => ({ label: value, value }))
      : yearLevelOptions.map((value) => ({ label: value, value }));

  const selectedCoursePickerValue =
    coursePickerField === "source"
      ? courseForm.sourceCourseId
      : coursePickerField === "curriculum"
      ? courseForm.curriculum
      : coursePickerField === "academicYear"
      ? courseForm.academicYear
      : coursePickerField === "semester"
      ? courseForm.semester
      : courseForm.yearLevel;

  function handlePickerSelect(value) {
    if (activeFilter === "curriculum") {
      setSelectedCurriculum(value);
    } else if (activeFilter === "academicYear") {
      setSelectedAcademicYear(value);
    } else {
      setSelectedSemester(value);
    }

    setFilterPickerVisible(false);
  }

  function handleCoursePickerSelect(value) {
    if (coursePickerField === "source") {
      if (!value) {
        setCourseForm((prev) => ({ ...prev, sourceCourseId: "" }));
      } else {
        const sourceCourse = courses.find((course) => String(course.id) === String(value));
        if (sourceCourse) {
          setCourseForm((prev) => ({
            ...prev,
            sourceCourseId: String(sourceCourse.id),
            code: sourceCourse.code || prev.code,
            name: sourceCourse.name || prev.name,
            curriculum: String(sourceCourse.curriculum || prev.curriculum),
            academicYear: String(sourceCourse.academicYear || prev.academicYear),
            semester: sourceCourse.semester || prev.semester,
            yearLevel: String(sourceCourse.yearLevel || prev.yearLevel),
            mappedSOs: Array.isArray(sourceCourse.mappedSOs) ? sourceCourse.mappedSOs : prev.mappedSOs,
          }));
        }
      }
    } else {
      setCourseForm((prev) => ({ ...prev, [coursePickerField]: value }));
    }

    setCoursePickerVisible(false);
  }

  function toggleMappedOutcome(number) {
    setCourseForm((prev) => {
      const exists = prev.mappedSOs.includes(number);
      return {
        ...prev,
        mappedSOs: exists
          ? prev.mappedSOs.filter((item) => item !== number)
          : [...prev.mappedSOs, number],
      };
    });
  }

  function toggleMatrixCell(courseId, outcomeNumber) {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;

        const mapped = Array.isArray(course.mappedSOs) ? [...course.mappedSOs] : [];
        const normalized = mapped.map((value) => Number(value));
        const exists = normalized.includes(Number(outcomeNumber));

        return {
          ...course,
          mappedSOs: exists
            ? mapped.filter((value) => Number(value) !== Number(outcomeNumber))
            : [...mapped, Number(outcomeNumber)],
        };
      })
    );
  }

  function handleAddCurriculum() {
    const value = newCurriculum.trim();
    if (!value) return;

    const exists = curriculums.some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) {
      Alert.alert("Already exists", "That curriculum already exists.");
      return;
    }

    setCustomCurriculums((prev) => [value, ...prev]);
    setSelectedCurriculum(value);
    setCourseForm((prev) => ({ ...prev, curriculum: value }));
    setNewCurriculum("");
    setCurriculumModalVisible(false);
  }

  function handleAddSchoolYear() {
    const value = newSchoolYear.trim();
    if (!value) return;

    const exists = academicYears.some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) {
      Alert.alert("Already exists", "That school year already exists.");
      return;
    }

    setCustomAcademicYears((prev) => [value, ...prev]);
    setSelectedAcademicYear(value);
    setCourseForm((prev) => ({ ...prev, academicYear: value }));
    setNewSchoolYear("");
    setSchoolYearModalVisible(false);
  }

  function handleAddCourse() {
    const next = {
      code: courseForm.code.trim(),
      name: courseForm.name.trim(),
      curriculum: courseForm.curriculum.trim(),
      academicYear: courseForm.academicYear.trim(),
      semester: courseForm.semester,
      yearLevel: courseForm.yearLevel.trim(),
    };

    if (!next.code || !next.name || !next.curriculum || !next.academicYear || !next.yearLevel) {
      Alert.alert("Required fields", "Please fill in all required fields before saving.");
      return;
    }

    setCourses((prev) => [
      {
        id: `local_${Date.now()}`,
        ...next,
        mappedSOs: courseForm.mappedSOs,
      },
      ...prev,
    ]);

    setCourseForm({
      sourceCourseId: "",
      code: "",
      name: "",
      curriculum: next.curriculum,
      academicYear: next.academicYear,
      semester: "1st Semester",
      yearLevel: "",
      mappedSOs: [],
    });
    setSelectedCurriculum(next.curriculum);
    setSelectedAcademicYear(next.academicYear);
    setCourseModalVisible(false);
  }

  return (
    <>
      <AppScreen
        eyebrow="Program Chair"
        title="Course & SO Mapping System"
        subtitle="Manage courses and student outcome mappings from one mobile workspace."
        showMeta={false}
        enableScrollTopButton={true}
      >
      <InfoCard>
        <View style={styles.toolbarTop}>
          <Pressable onPress={() => setCourseModalVisible(true)} style={styles.primaryActionButton}>
            <Text style={styles.primaryActionButtonText}>+ Add Course</Text>
          </Pressable>
          <Pressable onPress={() => setCurriculumModalVisible(true)} style={styles.secondaryActionButton}>
            <Text style={styles.secondaryActionButtonText}>Add Curriculum</Text>
          </Pressable>
          <Pressable onPress={() => setSchoolYearModalVisible(true)} style={styles.secondaryActionButton}>
            <Text style={styles.secondaryActionButtonText}>Add School Year</Text>
          </Pressable>
        </View>

        <View style={styles.modeSwitchRow}>
          <Pressable
            onPress={() => setViewMode("Grid")}
            style={[styles.modePill, viewMode === "Grid" && styles.modePillActive]}
          >
            <Text style={[styles.modePillText, viewMode === "Grid" && styles.modePillTextActive]}>Grid</Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode("Matrix")}
            style={[styles.modePill, viewMode === "Matrix" && styles.modePillActive]}
          >
            <Text style={[styles.modePillText, viewMode === "Matrix" && styles.modePillTextActive]}>Matrix</Text>
          </Pressable>
        </View>
      </InfoCard>

      <InfoCard title="Filters" rightText="Smart search">
        <View style={styles.stack}>
          <TextInput
            onChangeText={setQuery}
            placeholder="Search code, name, or curriculum"
            placeholderTextColor="#7b8a86"
            style={styles.input}
            value={query}
          />

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Curriculum</Text>
            <Pressable style={styles.dropdownButton} onPress={() => openFilterPicker("curriculum")}>
              <Text style={styles.dropdownValue}>{selectedCurriculum}</Text>
              <Text style={styles.dropdownChevron}>▾</Text>
            </Pressable>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Academic Year</Text>
            <Pressable style={styles.dropdownButton} onPress={() => openFilterPicker("academicYear")}>
              <Text style={styles.dropdownValue}>{selectedAcademicYear}</Text>
              <Text style={styles.dropdownChevron}>▾</Text>
            </Pressable>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Semester</Text>
            <Pressable style={styles.dropdownButton} onPress={() => openFilterPicker("semester")}>
              <Text style={styles.dropdownValue}>{selectedSemester}</Text>
              <Text style={styles.dropdownChevron}>▾</Text>
            </Pressable>
          </View>

          <Text style={styles.helperText}>
            Showing {filteredCourses.length} of {courses.length} courses
          </Text>
        </View>
      </InfoCard>

      <View style={styles.statsGrid}>
        {statTiles.map((tile) => (
          <View key={tile.key} style={styles.statTile}>
            <Text style={styles.statLabel}>{tile.label}</Text>
            <Text style={styles.statValue}>{tile.value}</Text>
            <Text style={styles.statHint}>{tile.hint}</Text>
          </View>
        ))}
      </View>

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
      ) : viewMode === "Matrix" ? (
        <InfoCard title="Course-to-SO Mapping Matrix" rightText={`${matrixOutcomeNumbers.length} SO columns`}>
          <Text style={styles.matrixHint}>Tap cells to toggle mappings. Yellow cells are linked outcomes.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matrixScrollContent}>
            <View style={styles.matrixTable}>
              <View style={styles.matrixHeaderRow}>
                <View style={[styles.matrixCourseCell, styles.matrixHeaderCell]}>
                  <Text style={styles.matrixHeaderText}>Course</Text>
                </View>
                {matrixOutcomeNumbers.map((number) => (
                  <View key={`head-${number}`} style={[styles.matrixSOCell, styles.matrixHeaderCell]}>
                    <Text style={styles.matrixHeaderText}>{`SO ${number}`}</Text>
                  </View>
                ))}
              </View>

              {filteredCourses.map((course) => (
                <View key={`matrix-${course.id}`} style={styles.matrixDataRow}>
                  <View style={styles.matrixCourseCell}>
                    <Text style={styles.matrixCourseCode}>{course.code}</Text>
                    <Text numberOfLines={1} style={styles.matrixCourseName}>{course.name}</Text>
                  </View>

                  {matrixOutcomeNumbers.map((number) => {
                    const active = isMapped(course, number);
                    return (
                      <Pressable
                        key={`cell-${course.id}-${number}`}
                        onPress={() => toggleMatrixCell(course.id, number)}
                        style={[styles.matrixSOCell, styles.matrixDataCell, active && styles.matrixDataCellActive]}
                      >
                        <Text style={[styles.matrixCellText, active && styles.matrixCellTextActive]}>
                          {active ? "✓" : "×"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </InfoCard>
      ) : (
        filteredCourses.map((course) => (
          <InfoCard
            key={course.id}
            title={`${course.code} • ${course.name}`}
            rightText={viewMode}
          >
            <View style={styles.cardAccent} />
            <View style={styles.metaBlock}>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Curriculum</Text><Text style={styles.metaText}>{course.curriculum}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Semester</Text><Text style={styles.metaText}>{course.semester}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Academic year</Text><Text style={styles.metaText}>{course.academicYear}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Year level</Text><Text style={styles.metaText}>{course.yearLevel}</Text></View>
              <Text style={styles.metaStrong}>
                Linked outcomes: {Array.isArray(course.mappedSOs) ? course.mappedSOs.length : 0}
              </Text>

              {Array.isArray(course.mappedSOs) && course.mappedSOs.length > 0 ? (
                <View style={styles.soTagRow}>
                  {course.mappedSOs.slice(0, 6).map((so) => (
                    <View key={`${course.id}-${so}`} style={styles.soTag}>
                      <Text style={styles.soTagText}>{`SO ${so}`}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.rowActions}>
                <Pressable style={styles.cardActionButton} onPress={() => showSoon(`View details for ${course.code} is not available yet.`)}>
                  <Text style={styles.cardActionText}>View</Text>
                </Pressable>
                <Pressable style={styles.cardActionButton} onPress={() => showSoon(`Edit ${course.code} from mobile is not enabled yet.`)}>
                  <Text style={styles.cardActionText}>Edit</Text>
                </Pressable>
              </View>
            </View>
          </InfoCard>
        ))
      )}
      </AppScreen>

      <Modal animationType="fade" transparent visible={filterPickerVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{pickerTitle}</Text>
              <Pressable onPress={() => setFilterPickerVisible(false)} style={styles.pickerCloseButton}>
                <Text style={styles.pickerCloseText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.pickerList}>
              {pickerOptions.map((option) => (
                <Pressable
                  key={`${activeFilter}-${option}`}
                  onPress={() => handlePickerSelect(option)}
                  style={[styles.pickerOption, selectedPickerValue === option && styles.pickerOptionActive]}
                >
                  <Text style={[styles.pickerOptionText, selectedPickerValue === option && styles.pickerOptionTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={coursePickerVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{coursePickerTitle}</Text>
              <Pressable onPress={() => setCoursePickerVisible(false)} style={styles.pickerCloseButton}>
                <Text style={styles.pickerCloseText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.pickerList}>
              {coursePickerOptions.map((option) => (
                <Pressable
                  key={`${coursePickerField}-${option.value}`}
                  onPress={() => handleCoursePickerSelect(option.value)}
                  style={[styles.pickerOption, selectedCoursePickerValue === option.value && styles.pickerOptionActive]}
                >
                  <Text style={[styles.pickerOptionText, selectedCoursePickerValue === option.value && styles.pickerOptionTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={courseModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add New Course</Text>
              <Pressable onPress={() => setCourseModalVisible(false)} style={styles.closeModalButton}>
                <Text style={styles.closeModalText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScrollArea}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.fieldLegend}>Curriculum *</Text>
              <Pressable style={styles.dropdownButton} onPress={() => openCoursePicker("curriculum")}>
                <Text style={styles.dropdownValue}>{courseForm.curriculum || "Select Curriculum"}</Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </Pressable>

              <Text style={[styles.fieldLegend, styles.fieldGap]}>Course From Database</Text>
              <Pressable style={styles.dropdownButton} onPress={() => openCoursePicker("source")}>
                <Text style={styles.dropdownValue}>
                  {courseForm.sourceCourseId
                    ? (courses.find((course) => String(course.id) === String(courseForm.sourceCourseId))?.code || "Selected")
                    : "Select course to autofill (optional)"}
                </Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </Pressable>
              <Text style={styles.fieldHint}>Selecting a course fills fields below, but you can still edit them.</Text>

              <View style={styles.threeColumnRow}>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Academic Year *</Text>
                  <Pressable style={styles.dropdownButton} onPress={() => openCoursePicker("academicYear")}>
                    <Text style={styles.dropdownValue}>{courseForm.academicYear || "Select Academic Year"}</Text>
                    <Text style={styles.dropdownChevron}>▾</Text>
                  </Pressable>
                </View>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Semester *</Text>
                  <Pressable style={styles.dropdownButton} onPress={() => openCoursePicker("semester")}>
                    <Text style={styles.dropdownValue}>{courseForm.semester || "Select Semester"}</Text>
                    <Text style={styles.dropdownChevron}>▾</Text>
                  </Pressable>
                </View>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Year Level *</Text>
                  <Pressable style={styles.dropdownButton} onPress={() => openCoursePicker("yearLevel")}>
                    <Text style={styles.dropdownValue}>{courseForm.yearLevel || "Select Year Level"}</Text>
                    <Text style={styles.dropdownChevron}>▾</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.twoColumnRow}>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Course Code *</Text>
                  <TextInput
                    placeholder="CPE-101"
                    placeholderTextColor="#7b8a86"
                    style={styles.modalInput}
                    value={courseForm.code}
                    onChangeText={(value) => setCourseForm((prev) => ({ ...prev, code: value }))}
                  />
                </View>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Course Name *</Text>
                  <TextInput
                    placeholder="Simple Course Name"
                    placeholderTextColor="#7b8a86"
                    style={styles.modalInput}
                    value={courseForm.name}
                    onChangeText={(value) => setCourseForm((prev) => ({ ...prev, name: value }))}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLegend, styles.fieldGap]}>Map to Student Outcomes</Text>
              {loadingOutcomes ? (
                <ActivityIndicator size="small" color={colors.yellow} />
              ) : (
                <View style={styles.soChecklist}>
                  {studentOutcomes.map((outcome) => {
                    const checked = courseForm.mappedSOs.includes(outcome.number);
                    return (
                      <Pressable
                        key={outcome.id}
                        onPress={() => toggleMappedOutcome(outcome.number)}
                        style={[styles.soChecklistItem, checked && styles.soChecklistItemActive]}
                      >
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
                        </View>
                        <View style={styles.soChecklistTextWrap}>
                          <Text style={styles.soChecklistTitle}>{`SO ${outcome.number}: ${outcome.title}`}</Text>
                          <Text numberOfLines={2} style={styles.soChecklistDesc}>{outcome.description}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setCourseModalVisible(false)} style={styles.secondaryActionButton}>
                <Text style={styles.secondaryActionButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddCourse} style={styles.primaryActionButton}>
                <Text style={styles.primaryActionButtonText}>Save Course</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={curriculumModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Curriculum</Text>
            <Text style={styles.modalSubtitle}>Create a new curriculum option for filtering and course setup.</Text>
            <TextInput
              placeholder="Curriculum name"
              placeholderTextColor="#7b8a86"
              style={styles.modalInput}
              value={newCurriculum}
              onChangeText={setNewCurriculum}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setCurriculumModalVisible(false)} style={styles.secondaryActionButton}>
                <Text style={styles.secondaryActionButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddCurriculum} style={styles.primaryActionButton}>
                <Text style={styles.primaryActionButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={schoolYearModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add School Year</Text>
            <Text style={styles.modalSubtitle}>Create a school year option for filtering and course setup.</Text>
            <TextInput
              placeholder="School year (e.g. 2026-2027)"
              placeholderTextColor="#7b8a86"
              style={styles.modalInput}
              value={newSchoolYear}
              onChangeText={setNewSchoolYear}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSchoolYearModalVisible(false)} style={styles.secondaryActionButton}>
                <Text style={styles.secondaryActionButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddSchoolYear} style={styles.primaryActionButton}>
                <Text style={styles.primaryActionButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  toolbarTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryActionButton: {
    backgroundColor: colors.yellow,
    borderRadius: 14,
    elevation: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryActionButtonText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  secondaryActionButton: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryActionButtonText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modeSwitchRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  modePill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.graySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  modePillActive: {
    backgroundColor: colors.dark,
  },
  modePillText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  modePillTextActive: {
    color: colors.yellow,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
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
  filterSection: {
    gap: 6,
  },
  filterLabel: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
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
  },
  dropdownChevron: {
    color: colors.gray,
    fontSize: 14,
    fontWeight: "800",
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statTile: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: "47%",
    flex: 1,
    padding: 12,
  },
  statLabel: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statValue: {
    color: colors.dark,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 4,
  },
  statHint: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 4,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 21,
  },
  metaBlock: {
    gap: 6,
  },
  cardAccent: {
    backgroundColor: colors.yellow,
    borderRadius: 999,
    width: 40,
    height: 4,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  metaLabel: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "800",
  },
  metaText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
  metaStrong: {
    color: colors.yellowAlt,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
  },
  soTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  soTag: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.yellow,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  soTagText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "700",
  },
  rowActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  matrixHint: {
    color: colors.gray,
    fontSize: 12,
    marginBottom: 10,
  },
  matrixScrollContent: {
    paddingBottom: 4,
  },
  matrixTable: {
    borderWidth: 1,
    borderColor: colors.graySoft,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  matrixHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
  },
  matrixDataRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.graySoft,
  },
  matrixHeaderCell: {
    backgroundColor: colors.surfaceMuted,
  },
  matrixCourseCell: {
    width: 176,
    paddingHorizontal: 10,
    paddingVertical: 11,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: colors.graySoft,
  },
  matrixSOCell: {
    width: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: colors.graySoft,
    paddingVertical: 10,
  },
  matrixHeaderText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  matrixCourseCode: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  matrixCourseName: {
    color: colors.gray,
    fontSize: 11,
    marginTop: 2,
  },
  matrixDataCell: {
    backgroundColor: colors.surface,
  },
  matrixDataCellActive: {
    backgroundColor: "#fff3ca",
  },
  matrixCellText: {
    color: "#a4aaa7",
    fontSize: 15,
    fontWeight: "700",
  },
  matrixCellTextActive: {
    color: colors.dark,
  },
  cardActionButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardActionText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.graySoft,
    padding: 16,
    gap: 10,
  },
  modalCardLarge: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.graySoft,
    padding: 16,
    height: "90%",
    maxHeight: "92%",
  },
  modalScrollArea: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeModalButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  closeModalText: {
    color: colors.dark,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: "700",
  },
  fieldLegend: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  fieldGap: {
    marginTop: 10,
  },
  fieldHint: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 2,
  },
  threeColumnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  colItem: {
    flex: 1,
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
  modalTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: colors.gray,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  soChecklist: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  soChecklistItem: {
    flexDirection: "row",
    gap: 10,
    width: "48.5%",
    borderWidth: 1,
    borderColor: colors.graySoft,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.surface,
  },
  soChecklistItemActive: {
    borderColor: colors.yellow,
    backgroundColor: colors.surfaceMuted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.graySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
  },
  checkboxTick: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "900",
  },
  soChecklistTextWrap: {
    flex: 1,
  },
  soChecklistTitle: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  soChecklistDesc: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  modalChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  modalChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalChipActive: {
    backgroundColor: colors.dark,
  },
  modalChipText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  modalChipTextActive: {
    color: colors.yellow,
  },
});
