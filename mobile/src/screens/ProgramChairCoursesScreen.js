import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useMemo, useState } from "react";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { apiClient } from "../services/apiClient";
import { fetchCurricula, fetchProgramChairCourses, fetchSchoolYears } from "../services/mobileData";
import { fetchStudentOutcomesMobile } from "../services/studentOutcomes";
import { colors } from "../theme/colors";

export default function ProgramChairCoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingOption, setSavingOption] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseDetailVisible, setCourseDetailVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [curriculumModalVisible, setCurriculumModalVisible] = useState(false);
  const [schoolYearModalVisible, setSchoolYearModalVisible] = useState(false);
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("curriculum");
  const [coursePickerVisible, setCoursePickerVisible] = useState(false);
  const [coursePickerField, setCoursePickerField] = useState("curriculum");
  const [databaseCourses, setDatabaseCourses] = useState([]);
  const [loadingDatabaseCourses, setLoadingDatabaseCourses] = useState(false);

  const [newCurriculum, setNewCurriculum] = useState("");
  const [newSchoolYear, setNewSchoolYear] = useState("");
  const [courseFormErrors, setCourseFormErrors] = useState({});
  const [courseForm, setCourseForm] = useState({
    sourceCourseId: "",
    code: "",
    name: "",
    curriculum: "",
    academicYear: "",
    semester: "1st Semester",
    yearLevel: "",
    credits: "3",
    mappedSOs: [],
  });

  function normalizeMappedSOs(values) {
    if (!Array.isArray(values)) return [];
    return values
      .map((value) => String(value))
      .filter((value, index, list) => value && list.indexOf(value) === index);
  }

  function normalizeFilterValue(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase();
  }

  function getUniqueOptions(values) {
    const seen = new Set();
    return values.filter((value) => {
      const normalized = normalizeFilterValue(value);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  function getErrorMessage(loadError, fallback) {
    const detail = loadError?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") {
      return Object.entries(detail)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join(" | ");
    }

    if (loadError?.response?.data && typeof loadError.response.data === "object") {
      return Object.entries(loadError.response.data)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join(" | ");
    }

    return loadError?.message || fallback;
  }

  async function loadCourses() {
    const data = await fetchProgramChairCourses();
    setCourses(data);
    return data;
  }

  async function refreshCourses() {
    try {
      setRefreshing(true);
      setError("");
      await loadCourses();
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load courses."));
    } finally {
      setRefreshing(false);
    }
  }

  function updateCourseForm(field, value) {
    setCourseForm((prev) => ({ ...prev, [field]: value }));
    setCourseFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateCourseForm(next) {
    const errors = {};

    if (!next.curriculum) errors.curriculum = "Curriculum is required.";
    if (!next.academicYear) errors.academicYear = "Academic year is required.";
    if (!next.semester) errors.semester = "Semester is required.";
    if (!next.yearLevel) errors.yearLevel = "Year level is required.";
    if (!next.code) errors.code = "Course code is required.";
    if (!next.name) errors.name = "Course name is required.";
    if (!next.credits) {
      errors.credits = "Credits is required.";
    } else if (!/^\d+$/.test(next.credits) || Number(next.credits) <= 0) {
      errors.credits = "Credits must be a positive whole number.";
    }

    return errors;
  }

  function mapBackendErrorsToForm(saveError) {
    const data = saveError?.response?.data;
    if (!data || typeof data !== "object") return {};

    const fieldMap = {
      curriculum: "curriculum",
      academic_year: "academicYear",
      semester: "semester",
      year_level: "yearLevel",
      code: "code",
      name: "name",
      credits: "credits",
      course: "sourceCourseId",
      mappedSOs: "mappedSOs",
    };

    return Object.entries(data).reduce((acc, [key, value]) => {
      const formKey = fieldMap[key];
      if (!formKey) return acc;
      acc[formKey] = Array.isArray(value) ? value.join(", ") : String(value);
      return acc;
    }, {});
  }

  const selectedCourseOutcomes = useMemo(() => {
    if (!selectedCourse) return [];

    return normalizeMappedSOs(selectedCourse.mappedSOs)
      .map((mappedId) =>
        studentOutcomes.find((outcome) => String(outcome.id) === String(mappedId))
      )
      .filter(Boolean);
  }, [selectedCourse, studentOutcomes]);

  const studentOutcomeMap = useMemo(
    () =>
      new Map(studentOutcomes.map((outcome) => [String(outcome.id), outcome])),
    [studentOutcomes]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [data, curriculaData, schoolYearsData] = await Promise.all([
          loadCourses(),
          fetchCurricula(),
          fetchSchoolYears(),
        ]);
        if (!cancelled) {
          setCourses(data);
          setCustomCurriculums(curriculaData);
          setCustomAcademicYears(schoolYearsData);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Failed to load courses."));
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDatabaseCourses() {
      if (!courseForm.curriculum) {
        setDatabaseCourses([]);
        return;
      }

      try {
        setLoadingDatabaseCourses(true);
        const response = await apiClient.get(`/courses/?curriculum=${encodeURIComponent(courseForm.curriculum)}`);
        const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
        if (!cancelled) {
          setDatabaseCourses(data);
        }
      } catch {
        if (!cancelled) {
          setDatabaseCourses([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingDatabaseCourses(false);
        }
      }
    }

    loadDatabaseCourses();
    return () => {
      cancelled = true;
    };
  }, [courseForm.curriculum]);

  const semesters = useMemo(
    () => ["All Semesters", ...getUniqueOptions(courses.map((course) => course.semester))],
    [courses]
  );

  const semesterOptions = ["1st Semester", "2nd Semester", "Summer"];
  const yearLevelOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  const curriculums = useMemo(
    () => [
      "All Curriculums",
      ...getUniqueOptions([
        ...courses.map((course) => String(course.curriculum || "")).filter(Boolean),
        ...customCurriculums,
      ]),
    ],
    [courses, customCurriculums]
  );

  const academicYears = useMemo(
    () => [
      "All Years",
      ...getUniqueOptions([
        ...courses.map((course) => String(course.academicYear || "")).filter(Boolean),
        ...customAcademicYears,
      ]),
    ],
    [courses, customAcademicYears]
  );

  const filteredCourses = useMemo(() => {
    const normalized = normalizeFilterValue(query);
    const normalizedSemester = normalizeFilterValue(selectedSemester);
    const normalizedCurriculum = normalizeFilterValue(selectedCurriculum);
    const normalizedAcademicYear = normalizeFilterValue(selectedAcademicYear);

    return courses.filter((course) => {
      const matchesQuery =
        !normalized ||
        normalizeFilterValue(course.code).includes(normalized) ||
        normalizeFilterValue(course.name).includes(normalized) ||
        normalizeFilterValue(course.curriculum).includes(normalized);
      const matchesSemester =
        normalizedSemester === normalizeFilterValue("All Semesters") ||
        normalizeFilterValue(course.semester) === normalizedSemester;
      const matchesCurriculum =
        normalizedCurriculum === normalizeFilterValue("All Curriculums") ||
        normalizeFilterValue(course.curriculum) === normalizedCurriculum;
      const matchesAcademicYear =
        normalizedAcademicYear === normalizeFilterValue("All Years") ||
        normalizeFilterValue(course.academicYear) === normalizedAcademicYear;

      return matchesQuery && matchesSemester && matchesCurriculum && matchesAcademicYear;
    });
  }, [courses, query, selectedSemester, selectedCurriculum, selectedAcademicYear]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(query.trim()) ||
      selectedCurriculum !== "All Curriculums" ||
      selectedAcademicYear !== "All Years" ||
      selectedSemester !== "All Semesters",
    [query, selectedCurriculum, selectedAcademicYear, selectedSemester]
  );

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

  const matrixOutcomes = useMemo(() => {
    if (studentOutcomes.length > 0) {
      return [...studentOutcomes].sort((a, b) => Number(a.number) - Number(b.number));
    }

    const fallbackOutcomeIds = Array.from(
      new Set(
        courses.flatMap((course) => (Array.isArray(course.mappedSOs) ? course.mappedSOs.map(String) : []))
      )
    );

    return fallbackOutcomeIds.map((id) => ({
      id,
      number: id,
      title: `Student Outcome ${id}`,
    }));
  }, [courses, studentOutcomes]);

  function getOutcomeLabel(outcomeId) {
    const outcome = studentOutcomeMap.get(String(outcomeId));
    return outcome ? `SO ${outcome.number}` : `SO ${outcomeId}`;
  }

  function isMapped(course, outcomeId) {
    return Array.isArray(course.mappedSOs)
      ? course.mappedSOs.map(String).includes(String(outcomeId))
      : false;
  }

  function openCourseDetails(course) {
    setSelectedCourse(course);
    setCourseDetailVisible(true);
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
          databaseCourses.map((course) => ({
            label: `${course.code || "No Code"} - ${course.name || "Untitled Course"}`,
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

  function handleClearFilters() {
    setQuery("");
    setSelectedCurriculum("All Curriculums");
    setSelectedAcademicYear("All Years");
    setSelectedSemester("All Semesters");
  }

  function handleCoursePickerSelect(value) {
    if (coursePickerField === "source") {
      if (!value) {
        setCourseForm((prev) => ({
          ...prev,
          sourceCourseId: "",
          code: "",
          name: "",
          semester: "1st Semester",
          yearLevel: "",
        }));
      } else {
        const sourceCourse = databaseCourses.find((course) => String(course.id) === String(value));
        if (sourceCourse) {
          setCourseForm((prev) => ({
            ...prev,
            sourceCourseId: String(sourceCourse.id),
            code: sourceCourse.code || prev.code,
            name: sourceCourse.name || prev.name,
            semester: sourceCourse.semester || prev.semester,
            yearLevel: String(sourceCourse.year_level || prev.yearLevel),
            credits: String(sourceCourse.credits || prev.credits),
          }));
        }
      }
    } else {
      setCourseForm((prev) => ({ ...prev, [coursePickerField]: value }));
    }

    setCoursePickerVisible(false);
  }

  function toggleMappedOutcome(outcomeId) {
    setCourseForm((prev) => {
      const normalized = normalizeMappedSOs(prev.mappedSOs);
      const key = String(outcomeId);
      const exists = normalized.includes(key);
      return {
        ...prev,
        mappedSOs: exists
          ? normalized.filter((item) => item !== key)
          : [...normalized, key],
      };
    });
  }

  async function toggleMatrixCell(courseId, outcomeId) {
    const target = courses.find((course) => String(course.id) === String(courseId));
    if (!target) {
      return;
    }

    const mapped = normalizeMappedSOs(target.mappedSOs);
    const key = String(outcomeId);
    const exists = mapped.includes(key);
    const nextMapped = exists ? mapped.filter((value) => value !== key) : [...mapped, key];

    setCourses((prev) =>
      prev.map((course) =>
        String(course.id) === String(courseId)
          ? {
              ...course,
              mappedSOs: nextMapped,
            }
          : course
      )
    );

    try {
      await apiClient.post(`/course-so-mappings/${courseId}/toggle_so/`, {
        so_id: Number(outcomeId),
        should_map: !exists,
      });
    } catch (saveError) {
      setCourses((prev) =>
        prev.map((course) =>
          String(course.id) === String(courseId)
            ? {
                ...course,
                mappedSOs: mapped,
              }
            : course
        )
      );

      Alert.alert(
        "Unable to save mapping",
        getErrorMessage(saveError, "Please try again.")
      );
    }
  }

  function openEditCourse(course) {
    setEditingCourse(course);
    setCourseFormErrors({});
    setCourseForm({
      sourceCourseId: course?.course ? String(course.course) : "",
      code: course?.code || "",
      name: course?.name || "",
      curriculum: String(course?.curriculum || ""),
      academicYear: String(course?.academicYear || ""),
      semester: course?.semester || "1st Semester",
      yearLevel: String(course?.yearLevel || ""),
      credits: String(course?.credits || 3),
      mappedSOs: normalizeMappedSOs(course?.mappedSOs),
    });
    setCourseModalVisible(true);
  }

  async function handleAddCurriculum() {
    const value = newCurriculum.trim();
    if (!value) return;

    const exists = curriculums.some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) {
      Alert.alert("Already exists", "That curriculum already exists.");
      return;
    }

    try {
      setSavingOption(true);
      const response = await apiClient.post("/curricula/", { year: value });
      const savedCurriculum = String(response.data?.year || value).trim();
      setCustomCurriculums((prev) => getUniqueOptions([savedCurriculum, ...prev]));
      setSelectedCurriculum(savedCurriculum);
      setCourseForm((prev) => ({ ...prev, curriculum: savedCurriculum }));
      setNewCurriculum("");
      setCurriculumModalVisible(false);
    } catch (saveError) {
      Alert.alert("Unable to add curriculum", getErrorMessage(saveError, "Please try again."));
    } finally {
      setSavingOption(false);
    }
  }

  async function handleAddSchoolYear() {
    const value = newSchoolYear.trim();
    if (!value) return;

    const exists = academicYears.some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) {
      Alert.alert("Already exists", "That school year already exists.");
      return;
    }

    try {
      setSavingOption(true);
      const response = await apiClient.post("/school-years/", { year: value });
      const savedSchoolYear = String(response.data?.year || value).trim();
      setCustomAcademicYears((prev) => getUniqueOptions([savedSchoolYear, ...prev]));
      setSelectedAcademicYear(savedSchoolYear);
      setCourseForm((prev) => ({ ...prev, academicYear: savedSchoolYear }));
      setNewSchoolYear("");
      setSchoolYearModalVisible(false);
    } catch (saveError) {
      Alert.alert("Unable to add school year", getErrorMessage(saveError, "Please try again."));
    } finally {
      setSavingOption(false);
    }
  }

  async function handleAddCourse() {
    const next = {
      code: courseForm.code.trim(),
      name: courseForm.name.trim(),
      curriculum: courseForm.curriculum.trim(),
      academicYear: courseForm.academicYear.trim(),
      semester: courseForm.semester,
      yearLevel: courseForm.yearLevel.trim(),
      credits: courseForm.credits.trim(),
      mappedSOs: normalizeMappedSOs(courseForm.mappedSOs),
    };

    const validationErrors = validateCourseForm(next);
    if (Object.keys(validationErrors).length > 0) {
      setCourseFormErrors(validationErrors);
      return;
    }

    setCourseFormErrors({});

    const payload = {
      course: courseForm.sourceCourseId ? Number(courseForm.sourceCourseId) : editingCourse?.course || null,
      code: next.code,
      name: next.name,
      curriculum: next.curriculum,
      academic_year: next.academicYear,
      semester: next.semester,
      year_level: next.yearLevel,
      credits: Number(next.credits),
      mappedSOs: next.mappedSOs,
    };

    try {
      setSavingCourse(true);

      if (editingCourse?.id) {
        await apiClient.put(`/course-so-mappings/${editingCourse.id}/`, payload);
      } else {
        await apiClient.post("/course-so-mappings/", payload);
      }

      const data = await loadCourses();
      setCourses(data);

      setCourseForm({
        sourceCourseId: "",
        code: "",
        name: "",
        curriculum: next.curriculum,
        academicYear: next.academicYear,
        semester: "1st Semester",
        yearLevel: "",
        credits: "3",
        mappedSOs: [],
      });
      setCourseFormErrors({});
      setSelectedCurriculum(next.curriculum);
      setSelectedAcademicYear(next.academicYear);
      setCourseModalVisible(false);
      setEditingCourse(null);
    } catch (saveError) {
      const backendFieldErrors = mapBackendErrorsToForm(saveError);
      if (Object.keys(backendFieldErrors).length > 0) {
        setCourseFormErrors(backendFieldErrors);
      } else {
        Alert.alert(
          editingCourse?.id ? "Unable to update course" : "Unable to save course",
          getErrorMessage(saveError, "Please try again.")
        );
      }
    } finally {
      setSavingCourse(false);
    }
  }

  function handleDeleteCourse(course) {
    Alert.alert(
      "Warning: Delete course mapping",
      `You are about to permanently remove the course mapping for ${course.code} in ${course.academicYear}.\n\nThis deletes the mapping record and its student outcome links for that term, which is why the action cannot be undone.\n\nThe base course record may still exist elsewhere, but this mapping entry will be gone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingCourseId(course.id);
              await apiClient.delete(`/course-so-mappings/${course.id}/`);
              setCourses((prev) => prev.filter((item) => String(item.id) !== String(course.id)));
              if (selectedCourse && String(selectedCourse.id) === String(course.id)) {
                setSelectedCourse(null);
                setCourseDetailVisible(false);
              }
            } catch (deleteError) {
              Alert.alert("Unable to delete course", getErrorMessage(deleteError, "Please try again."));
            } finally {
              setDeletingCourseId(null);
            }
          },
        },
      ]
    );
  }

  return (
    <>
      <AppScreen
        eyebrow="Program Chair"
        title="Course & SO Mapping System"
        subtitle="Manage courses and student outcome mappings from one mobile workspace."
        showMeta={false}
        enableScrollTopButton={true}
        onRefresh={refreshCourses}
        refreshing={refreshing}
      >
      <InfoCard>
        <View style={styles.toolbarTop}>
          <Pressable
            onPress={() => {
              setEditingCourse(null);
              setCourseForm({
                sourceCourseId: "",
                code: "",
                name: "",
                curriculum: "",
                academicYear: "",
                semester: "1st Semester",
                yearLevel: "",
                credits: "3",
                mappedSOs: [],
              });
              setCourseFormErrors({});
              setCourseModalVisible(true);
            }}
            style={styles.primaryActionButton}
          >
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

      <InfoCard title="Search and filters">
        <View style={styles.stack}>
          <Text style={styles.helperText}>Search and refine the course list by curriculum, year, and semester.</Text>

          <TextInput
            onChangeText={setQuery}
            placeholder="Search code, name, or curriculum"
            placeholderTextColor={colors.darkAlt}
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

          <View style={styles.filterFooter}>
            <Text style={styles.helperText}>
              Showing {filteredCourses.length} of {courses.length} courses
            </Text>
            {hasActiveFilters ? (
              <Pressable onPress={handleClearFilters} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
            ) : null}
          </View>
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
        <InfoCard title="Course-to-SO Mapping Matrix" rightText={`${matrixOutcomes.length} SO columns`}>
          <Text style={styles.matrixHint}>Tap cells to toggle mappings. Yellow cells are linked outcomes.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matrixScrollContent}>
            <View style={styles.matrixTable}>
              <View style={styles.matrixHeaderRow}>
                <View style={[styles.matrixCourseCell, styles.matrixHeaderCell]}>
                  <Text style={styles.matrixHeaderText}>Course</Text>
                </View>
                {matrixOutcomes.map((outcome) => (
                  <View key={`head-${outcome.id}`} style={[styles.matrixSOCell, styles.matrixHeaderCell]}>
                    <Text style={styles.matrixHeaderText}>{`SO ${outcome.number}`}</Text>
                  </View>
                ))}
              </View>

              {filteredCourses.map((course) => (
                <View key={`matrix-${course.id}`} style={styles.matrixDataRow}>
                  <View style={styles.matrixCourseCell}>
                    <Text style={styles.matrixCourseCode}>{course.code}</Text>
                    <Text numberOfLines={1} style={styles.matrixCourseName}>{course.name}</Text>
                  </View>

                  {matrixOutcomes.map((outcome) => {
                      const active = isMapped(course, outcome.id);
                      return (
                        <Pressable
                          key={`cell-${course.id}-${outcome.id}`}
                          onPress={() => toggleMatrixCell(course.id, outcome.id)}
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
                      <Text style={styles.soTagText}>{getOutcomeLabel(so)}</Text>
                    </View>
                    ))}
                </View>
              ) : null}

              <View style={styles.rowActions}>
                <Pressable style={styles.cardActionButton} onPress={() => openCourseDetails(course)}>
                  <Text style={styles.cardActionText}>View</Text>
                </Pressable>
                <Pressable style={styles.cardActionButton} onPress={() => openEditCourse(course)}>
                  <Text style={styles.cardActionText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={styles.cardActionButton}
                  onPress={() => handleDeleteCourse(course)}
                  disabled={deletingCourseId === course.id}
                >
                  <Text style={styles.cardActionText}>
                    {deletingCourseId === course.id ? "Deleting..." : "Delete"}
                  </Text>
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

      <Modal
        animationType="fade"
        transparent
        visible={courseDetailVisible}
        onRequestClose={() => setCourseDetailVisible(false)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeaderRow}>
              <View style={styles.detailHeaderGroup}>
                <View style={styles.detailIconWrap}>
                  <View style={styles.detailBookIcon}>
                    <View style={[styles.detailBookPage, styles.detailBookPageLeft]} />
                    <View style={styles.detailBookSpine} />
                    <View style={[styles.detailBookPage, styles.detailBookPageRight]} />
                  </View>
                </View>
                <View style={styles.detailHeaderTextWrap}>
                  <Text style={styles.detailTitle}>{selectedCourse?.code || "Course"}</Text>
                  <Text style={styles.detailSubtitle}>{selectedCourse?.name || "Untitled course"}</Text>
                </View>
              </View>

              <Pressable onPress={() => setCourseDetailVisible(false)} style={styles.detailCloseButton}>
                <Text style={styles.detailCloseText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.detailMetaRow}>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Semester</Text>
                <Text style={styles.detailMetaValue}>{selectedCourse?.semester || "Not set"}</Text>
              </View>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Academic Year</Text>
                <Text style={styles.detailMetaValue}>{selectedCourse?.academicYear || "Not set"}</Text>
              </View>
            </View>

            <Text style={styles.detailSectionTitle}>Mapped Student Outcomes</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScrollContent}>
              {loadingOutcomes ? (
                <View style={styles.detailLoadingRow}>
                  <ActivityIndicator size="small" color={colors.yellow} />
                  <Text style={styles.detailLoadingText}>Loading outcomes...</Text>
                </View>
              ) : selectedCourseOutcomes.length > 0 ? (
                selectedCourseOutcomes.map((outcome) => (
                  <View key={outcome.id} style={styles.detailOutcomeCard}>
                    <View style={styles.detailOutcomeBadge}>
                      <Text style={styles.detailOutcomeBadgeText}>{`SO ${outcome.number}`}</Text>
                    </View>
                    <View style={styles.detailOutcomeContent}>
                      <Text style={styles.detailOutcomeTitle}>{outcome.title}</Text>
                      <Text style={styles.detailOutcomeDescription}>{outcome.description}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.detailEmptyState}>
                  <Text style={styles.detailEmptyTitle}>No mapped outcomes yet.</Text>
                  <Text style={styles.detailEmptyText}>This course has not been linked to any student outcomes.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={courseModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{editingCourse ? "Edit Course" : "Add New Course"}</Text>
              <Pressable
                onPress={() => {
                  setCourseModalVisible(false);
                  setEditingCourse(null);
                  setCourseFormErrors({});
                }}
                style={styles.closeModalButton}
              >
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
              {courseFormErrors.curriculum ? <Text style={styles.fieldError}>{courseFormErrors.curriculum}</Text> : null}

              <Text style={[styles.fieldLegend, styles.fieldGap]}>Course From Database</Text>
              <Pressable style={styles.dropdownButton} onPress={() => openCoursePicker("source")}>
                <Text style={styles.dropdownValue}>
                  {courseForm.sourceCourseId
                    ? (databaseCourses.find((course) => String(course.id) === String(courseForm.sourceCourseId))?.code ||
                      "Selected")
                    : loadingDatabaseCourses
                    ? "Loading courses..."
                    : "Select course to autofill (optional)"}
                </Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </Pressable>
              <Text style={styles.fieldHint}>
                {courseForm.curriculum
                  ? "Selecting a course fills fields below, but you can still edit them."
                  : "Select a curriculum first to load saved courses from the database."}
              </Text>

              <View style={styles.threeColumnRow}>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Academic Year *</Text>
                  <Pressable style={styles.dropdownButton} onPress={() => openCoursePicker("academicYear")}>
                    <Text style={styles.dropdownValue}>{courseForm.academicYear || "Select Academic Year (e.g. 2026-2027)"}</Text>
                    <Text style={styles.dropdownChevron}>▾</Text>
                  </Pressable>
                  {courseFormErrors.academicYear ? <Text style={styles.fieldError}>{courseFormErrors.academicYear}</Text> : null}
                </View>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Semester *</Text>
                  <Pressable style={styles.dropdownButton} onPress={() => openCoursePicker("semester")}>
                    <Text style={styles.dropdownValue}>{courseForm.semester || "Select Semester (e.g. 1st Semester)"}</Text>
                    <Text style={styles.dropdownChevron}>▾</Text>
                  </Pressable>
                  {courseFormErrors.semester ? <Text style={styles.fieldError}>{courseFormErrors.semester}</Text> : null}
                </View>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Year Level *</Text>
                  <Pressable style={styles.dropdownButton} onPress={() => openCoursePicker("yearLevel")}>
                    <Text style={styles.dropdownValue}>{courseForm.yearLevel || "Select Year Level (e.g. 3rd Year)"}</Text>
                    <Text style={styles.dropdownChevron}>▾</Text>
                  </Pressable>
                  {courseFormErrors.yearLevel ? <Text style={styles.fieldError}>{courseFormErrors.yearLevel}</Text> : null}
                </View>
              </View>

              <View style={styles.threeColumnRow}>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Course Code *</Text>
                  <TextInput
                    placeholder="CPE-101"
                    placeholderTextColor={colors.darkAlt}
                    style={styles.modalInput}
                    value={courseForm.code}
                    onChangeText={(value) => updateCourseForm("code", value)}
                  />
                  {courseFormErrors.code ? <Text style={styles.fieldError}>{courseFormErrors.code}</Text> : null}
                </View>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Course Name *</Text>
                  <TextInput
                    placeholder="Simple Course Name"
                    placeholderTextColor={colors.darkAlt}
                    style={styles.modalInput}
                    value={courseForm.name}
                    onChangeText={(value) => updateCourseForm("name", value)}
                  />
                  {courseFormErrors.name ? <Text style={styles.fieldError}>{courseFormErrors.name}</Text> : null}
                </View>
                <View style={styles.colItem}>
                  <Text style={styles.fieldLegend}>Credits *</Text>
                  <TextInput
                    placeholder="e.g. 3"
                    placeholderTextColor="#7b8a86"
                    style={styles.modalInput}
                    value={courseForm.credits}
                    keyboardType="number-pad"
                    onChangeText={(value) => updateCourseForm("credits", value.replace(/[^0-9]/g, ""))}
                  />
                  {courseFormErrors.credits ? <Text style={styles.fieldError}>{courseFormErrors.credits}</Text> : null}
                </View>
              </View>

              <Text style={[styles.fieldLegend, styles.fieldGap]}>Map to Student Outcomes</Text>
              {loadingOutcomes ? (
                <ActivityIndicator size="small" color={colors.yellow} />
              ) : (
                <View style={styles.soChecklist}>
                  {studentOutcomes.map((outcome) => {
                    const checked = normalizeMappedSOs(courseForm.mappedSOs).includes(String(outcome.id));
                    return (
                      <Pressable
                        key={outcome.id}
                        onPress={() => toggleMappedOutcome(outcome.id)}
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
              <Pressable
                onPress={() => {
                  setCourseModalVisible(false);
                  setEditingCourse(null);
                }}
                style={styles.secondaryActionButton}
                disabled={savingCourse}
              >
                <Text style={styles.secondaryActionButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddCourse} style={styles.primaryActionButton} disabled={savingCourse}>
                <Text style={styles.primaryActionButtonText}>
                  {savingCourse ? "Saving..." : editingCourse ? "Update Course" : "Save Course"}
                </Text>
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
              placeholderTextColor={colors.darkAlt}
              style={styles.modalInput}
              value={newCurriculum}
              onChangeText={setNewCurriculum}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setCurriculumModalVisible(false)}
                style={styles.secondaryActionButton}
                disabled={savingOption}
              >
                <Text style={styles.secondaryActionButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddCurriculum} style={styles.primaryActionButton} disabled={savingOption}>
                <Text style={styles.primaryActionButtonText}>{savingOption ? "Saving..." : "Add"}</Text>
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
              placeholderTextColor={colors.darkAlt}
              style={styles.modalInput}
              value={newSchoolYear}
              onChangeText={setNewSchoolYear}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setSchoolYearModalVisible(false)}
                style={styles.secondaryActionButton}
                disabled={savingOption}
              >
                <Text style={styles.secondaryActionButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddSchoolYear} style={styles.primaryActionButton} disabled={savingOption}>
                <Text style={styles.primaryActionButtonText}>{savingOption ? "Saving..." : "Add"}</Text>
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
  filterFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  resetButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetButtonText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
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
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    maxHeight: "85%",
  },
  detailHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailHeaderGroup: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 12,
    paddingRight: 10,
  },
  detailIconWrap: {
    alignItems: "center",
    backgroundColor: "#FFF7D6",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  detailBookIcon: {
    height: 20,
    position: "relative",
    width: 22,
  },
  detailBookPage: {
    borderColor: colors.yellow,
    borderRadius: 2,
    borderWidth: 1.5,
    height: 16,
    position: "absolute",
    top: 1,
    width: 9,
  },
  detailBookPageLeft: {
    borderRightWidth: 0,
    left: 0,
  },
  detailBookPageRight: {
    borderLeftWidth: 0,
    left: 11,
  },
  detailBookSpine: {
    backgroundColor: colors.yellow,
    borderRadius: 1,
    height: 16,
    left: 10,
    position: "absolute",
    top: 1,
    width: 2,
  },
  detailHeaderTextWrap: {
    flex: 1,
  },
  detailTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
  },
  detailSubtitle: {
    color: colors.gray,
    fontSize: 13,
    marginTop: 2,
  },
  detailCloseButton: {
    alignItems: "center",
    borderColor: colors.yellow,
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  detailCloseText: {
    color: colors.dark,
    fontSize: 18,
    lineHeight: 18,
    fontWeight: "700",
  },
  detailMetaRow: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 16,
  },
  detailMetaItem: {
    flex: 1,
  },
  detailMetaLabel: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailMetaValue: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  detailSectionTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  detailScrollContent: {
    paddingBottom: 4,
  },
  detailLoadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 10,
  },
  detailLoadingText: {
    color: colors.gray,
    fontSize: 13,
  },
  detailOutcomeCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: "#F6D46B",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    padding: 10,
  },
  detailOutcomeBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.yellow,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  detailOutcomeBadgeText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "800",
  },
  detailOutcomeContent: {
    flex: 1,
  },
  detailOutcomeTitle: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  detailOutcomeDescription: {
    color: colors.gray,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  detailEmptyState: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  detailEmptyTitle: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  detailEmptyText: {
    color: colors.gray,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
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
  fieldError: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
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
