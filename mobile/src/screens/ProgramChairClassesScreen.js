import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { apiClient } from "../services/apiClient";
import { createFacultyAccount } from "../services/usersMobile";
import { fetchProgramChairClasses } from "../services/mobileData";
import { colors } from "../theme/colors";

function parseYearLevelLabel(value) {
  if (!value && value !== 0) return "";

  const normalized = String(value).trim();
  if (!normalized) return "";

  const match = normalized.match(/\d+/);
  if (!match) return normalized;

  return match[0];
}

function splitStudentName(fullName) {
  const value = String(fullName || "").trim();
  if (!value) {
    return { firstName: "", lastName: "" };
  }

  const parts = value.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) || "",
  };
}

function normalizeApiList(data) {
  if (Array.isArray(data)) return data;
  return data?.results || [];
}

function SectionFormModal({ visible, section, facultyOptions, saving, onClose, onSave }) {
  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [facultyId, setFacultyId] = useState("");
  const [facultyDropdownOpen, setFacultyDropdownOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setName(section?.name || "");
    setSemester(section?.semester || "");
    setAcademicYear(section?.academicYear || section?.schoolYear || "");
    setIsActive(section?.isActive !== false);

    const matchedFaculty = facultyOptions.find((faculty) => faculty.name === section?.facultyName);
    setFacultyId(matchedFaculty ? String(matchedFaculty.id) : "");
    setFacultyDropdownOpen(false);
  }, [facultyOptions, section, visible]);

  const selectedFacultyLabel =
    facultyOptions.find((faculty) => String(faculty.id) === facultyId)?.name || "Unassigned";

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit Section</Text>
          <Text style={styles.modalSubtitle}>Update the section details and assignment.</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            <TextInput
              onChangeText={setName}
              placeholder="Section name"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={name}
            />
            <TextInput
              onChangeText={setSemester}
              placeholder="Semester"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={semester}
            />
            <TextInput
              onChangeText={setAcademicYear}
              placeholder="School year"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={academicYear}
            />

            <Text style={styles.modalSectionLabel}>Status</Text>
            <View style={styles.modalChipRow}>
              {[
                { label: "Active", value: true },
                { label: "Inactive", value: false },
              ].map((option) => {
                const selected = isActive === option.value;

                return (
                  <Pressable
                    key={option.label}
                    onPress={() => setIsActive(option.value)}
                    style={[styles.modalChip, selected ? styles.modalChipSelected : null]}
                  >
                    <Text style={[styles.modalChipText, selected ? styles.modalChipTextSelected : null]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.modalSectionLabel}>Faculty</Text>
            <Pressable
              onPress={() => setFacultyDropdownOpen((current) => !current)}
              style={styles.dropdownButton}
            >
              <Text style={styles.dropdownButtonText}>{selectedFacultyLabel}</Text>
              <Text style={styles.dropdownChevron}>{facultyDropdownOpen ? "▲" : "▼"}</Text>
            </Pressable>

            {facultyDropdownOpen ? (
              <View style={styles.dropdownList}>
                <Pressable
                  onPress={() => {
                    setFacultyId("");
                    setFacultyDropdownOpen(false);
                  }}
                  style={[styles.dropdownItem, !facultyId ? styles.dropdownItemSelected : null]}
                >
                  <Text style={[styles.dropdownItemText, !facultyId ? styles.dropdownItemTextSelected : null]}>
                    Unassigned
                  </Text>
                </Pressable>

                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                  {facultyOptions.map((faculty) => {
                    const selected = facultyId === String(faculty.id);

                    return (
                      <Pressable
                        key={faculty.id}
                        onPress={() => {
                          setFacultyId(String(faculty.id));
                          setFacultyDropdownOpen(false);
                        }}
                        style={[styles.dropdownItem, selected ? styles.dropdownItemSelected : null]}
                      >
                        <Text style={[styles.dropdownItemText, selected ? styles.dropdownItemTextSelected : null]}>
                          {faculty.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalSecondaryButton} disabled={saving}>
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                onSave({
                  name: name.trim(),
                  semester: semester.trim(),
                  academicYear: academicYear.trim(),
                  isActive,
                  facultyId: facultyId ? Number(facultyId) : null,
                })
              }
              style={[styles.modalPrimaryButton, saving && styles.modalButtonDisabled]}
              disabled={saving}
            >
              <Text style={styles.modalPrimaryButtonText}>{saving ? "Saving..." : "Save Changes"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StudentFormModal({ visible, sectionName, student, saving, onClose, onSave }) {
  const [studentId, setStudentId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState("");

  useEffect(() => {
    if (!visible) return;

    const parsedName = splitStudentName(student?.name || "");
    setStudentId(student?.studentId || "");
    setFirstName(parsedName.firstName || "");
    setLastName(parsedName.lastName || "");
    setProgram(student?.course || student?.program || "");
    setYearLevel(parseYearLevelLabel(student?.yearLevel || student?.year_level || ""));
  }, [student, visible]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{student ? "Edit Student" : "Add Student"}</Text>
          <Text style={styles.modalSubtitle}>
            {sectionName ? `For ${sectionName}` : "Enter the student details below."}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            <TextInput
              onChangeText={setStudentId}
              placeholder="Student ID"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={studentId}
            />
            <TextInput
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={firstName}
            />
            <TextInput
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={lastName}
            />
            <TextInput
              onChangeText={setProgram}
              placeholder="Course / program"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={program}
            />
            <TextInput
              keyboardType="number-pad"
              onChangeText={setYearLevel}
              placeholder="Year level"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={yearLevel}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalSecondaryButton} disabled={saving}>
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                onSave({
                  studentId: studentId.trim(),
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  program: program.trim(),
                  yearLevel: yearLevel.trim(),
                })
              }
              style={[styles.modalPrimaryButton, saving && styles.modalButtonDisabled]}
              disabled={saving}
            >
              <Text style={styles.modalPrimaryButtonText}>{saving ? "Saving..." : "Save Student"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FacultyAccountModal({ visible, saving, onClose, onSave }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    if (!visible) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setDepartment("");
  }, [visible]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Faculty</Text>
          <Text style={styles.modalSubtitle}>Create a faculty account for section assignments.</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            <TextInput
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={firstName}
            />
            <TextInput
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={lastName}
            />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={email}
            />
            <TextInput
              onChangeText={setDepartment}
              placeholder="Department"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={department}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalSecondaryButton} disabled={saving}>
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                onSave({
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  email: email.trim(),
                  department: department.trim(),
                })
              }
              style={[styles.modalPrimaryButton, saving && styles.modalButtonDisabled]}
              disabled={saving}
            >
              <Text style={styles.modalPrimaryButtonText}>{saving ? "Creating..." : "Create"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProgramChairClassesScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState({ sections: [], faculty: [] });
  const [mode, setMode] = useState("sections");
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [sectionFormVisible, setSectionFormVisible] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [studentFormVisible, setStudentFormVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentSection, setStudentSection] = useState(null);
  const [studentSaving, setStudentSaving] = useState(false);
  const [facultyFormVisible, setFacultyFormVisible] = useState(false);
  const [facultySaving, setFacultySaving] = useState(false);
  const [sectionQuery, setSectionQuery] = useState("");
  const [facultyQuery, setFacultyQuery] = useState("");
  const [sectionStatus, setSectionStatus] = useState("All Statuses");
  const [sectionCourse, setSectionCourse] = useState("All Courses");
  const [sectionYear, setSectionYear] = useState("All School Years");
  const [sectionSemester, setSectionSemester] = useState("All Semesters");
  const [sectionFilterPickerVisible, setSectionFilterPickerVisible] = useState(false);
  const [activeSectionFilter, setActiveSectionFilter] = useState("status");

  useEffect(() => {
    let cancelled = false;

    async function loadClasses() {
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

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!expandedSectionId && payload.sections.length > 0) {
      setExpandedSectionId(payload.sections[0].id);
    }
  }, [expandedSectionId, payload.sections]);

  const activeSections = useMemo(
    () => payload.sections.filter((section) => section.isActive).length,
    [payload.sections]
  );

  const inactiveSections = payload.sections.length - activeSections;

  const sectionFilterOptions = useMemo(() => {
    const courses = ["All Courses", ...new Set(payload.sections.map((section) => section.courseCode).filter(Boolean))];
    const schoolYears = [
      "All School Years",
      ...new Set(payload.sections.map((section) => section.academicYear).filter(Boolean)),
    ];
    const semesters = ["All Semesters", ...new Set(payload.sections.map((section) => section.semester).filter(Boolean))];

    return { courses, schoolYears, semesters };
  }, [payload.sections]);

  const sectionFilterConfigs = useMemo(
    () => ({
      status: {
        label: "Status",
        value: sectionStatus,
        options: ["All Statuses", "Active", "Inactive"],
        setter: setSectionStatus,
      },
      course: {
        label: "Course",
        value: sectionCourse,
        options: sectionFilterOptions.courses,
        setter: setSectionCourse,
      },
      schoolYear: {
        label: "School Year",
        value: sectionYear,
        options: sectionFilterOptions.schoolYears,
        setter: setSectionYear,
      },
      semester: {
        label: "Semester",
        value: sectionSemester,
        options: sectionFilterOptions.semesters,
        setter: setSectionSemester,
      },
    }),
    [sectionCourse, sectionFilterOptions.courses, sectionFilterOptions.schoolYears, sectionFilterOptions.semesters, sectionSemester, sectionStatus, sectionYear]
  );

  const facultyFilterOptions = useMemo(() => {
    const courses = [
      "All Faculty",
      ...new Set(
        payload.faculty.flatMap((member) =>
          Array.isArray(member.courses)
            ? member.courses
                .map((course) => course?.code || course?.courseCode || course)
                .filter(Boolean)
            : []
        )
      ),
    ];

    return { courses };
  }, [payload.faculty]);

  const filteredSections = useMemo(() => {
    const normalized = sectionQuery.trim().toLowerCase();

    return payload.sections.filter((section) => {
      const matchesSearch =
        !normalized ||
        section.courseCode.toLowerCase().includes(normalized) ||
        section.courseName.toLowerCase().includes(normalized) ||
        section.name.toLowerCase().includes(normalized) ||
        section.semester.toLowerCase().includes(normalized) ||
        section.academicYear.toLowerCase().includes(normalized);

      const matchesStatus =
        sectionStatus === "All Statuses" ||
        (sectionStatus === "Active" && section.isActive) ||
        (sectionStatus === "Inactive" && !section.isActive);
      const matchesCourse = sectionCourse === "All Courses" || section.courseCode === sectionCourse;
      const matchesYear = sectionYear === "All School Years" || section.academicYear === sectionYear;
      const matchesSemester =
        sectionSemester === "All Semesters" || section.semester === sectionSemester;

      return matchesSearch && matchesStatus && matchesCourse && matchesYear && matchesSemester;
    });
  }, [payload.sections, sectionCourse, sectionQuery, sectionSemester, sectionStatus, sectionYear]);

  const filteredFaculty = useMemo(() => {
    const normalized = facultyQuery.trim().toLowerCase();

    return payload.faculty.filter((member) => {
      const courseCodes = Array.isArray(member.courses)
        ? member.courses.map((course) => course?.code || course?.courseCode || course).filter(Boolean)
        : [];

      return (
        !normalized ||
        member.name.toLowerCase().includes(normalized) ||
        (member.email || "").toLowerCase().includes(normalized) ||
        courseCodes.some((courseCode) => String(courseCode).toLowerCase().includes(normalized))
      );
    });
  }, [facultyQuery, payload.faculty]);

  const resetSectionFilters = () => {
    setSectionQuery("");
    setSectionStatus("All Statuses");
    setSectionCourse("All Courses");
    setSectionYear("All School Years");
    setSectionSemester("All Semesters");
  };

  const resetFacultyFilters = () => {
    setFacultyQuery("");
  };

  function openSectionFilterPicker(key) {
    setActiveSectionFilter(key);
    setSectionFilterPickerVisible(true);
  }

  function handleSectionFilterSelect(value) {
    const config = sectionFilterConfigs[activeSectionFilter];
    if (config?.setter) {
      config.setter(value);
    }
    setSectionFilterPickerVisible(false);
  }

  function handleUnavailableAction(actionLabel) {
    Alert.alert("Mobile UI only", `${actionLabel} is not wired in the mobile app yet.`);
  }

  function formatYearLevel(yearLevel) {
    if (!yearLevel && yearLevel !== 0) return "";

    const value = String(yearLevel).trim();
    if (!value) return "";

    const lower = value.toLowerCase();
    if (lower.includes("year")) return value;

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return value;

    const suffix = numeric % 10 === 1 && numeric % 100 !== 11
      ? "st"
      : numeric % 10 === 2 && numeric % 100 !== 12
        ? "nd"
        : numeric % 10 === 3 && numeric % 100 !== 13
          ? "rd"
          : "th";

    return `${numeric}${suffix} Year`;
  }

  function formatStudentName(student) {
    return (
      [student.first_name, student.last_name].filter(Boolean).join(" ").trim() ||
      student.name ||
      "Unnamed student"
    );
  }

  function formatStudentCourse(student, section) {
    return student.program || student.course || section.courseCode || "";
  }

  function getAssignedFaculty(section) {
    const sectionCode = String(section.courseCode || "").toLowerCase();
    const sectionName = String(section.name || "").toLowerCase();

    const assigned = payload.faculty.find((member) => {
      if (!Array.isArray(member.courses)) return false;

      return member.courses.some((course) => {
        const courseCode = String(course?.code || course?.courseCode || course || "").toLowerCase();
        const sectionNames = Array.isArray(course?.sections)
          ? course.sections.map((entry) => String(entry).toLowerCase())
          : [];

        return courseCode === sectionCode || sectionNames.includes(sectionName);
      });
    });

    return assigned?.name || "No faculty assigned";
  }

  function toggleSection(sectionId) {
    setExpandedSectionId((current) => (current === sectionId ? null : sectionId));
  }

  function openSectionEditor(section) {
    setEditingSection(section);
    setSectionFormVisible(true);
  }

  function openStudentEditor(section, student) {
    setStudentSection(section);
    setEditingStudent(student || null);
    setStudentFormVisible(true);
  }

  async function refreshClasses() {
    const data = await fetchProgramChairClasses();
    setPayload(data);
  }

  async function handleSaveSection(data) {
    if (!editingSection) return;

    try {
      setSectionSaving(true);
      await apiClient.patch(`/sections/${editingSection.id}/`, {
        name: data.name,
        semester: data.semester,
        academic_year: data.academicYear,
        is_active: data.isActive,
        faculty_id: data.facultyId,
      });
      await refreshClasses();
      setSectionFormVisible(false);
      setEditingSection(null);
    } catch (saveError) {
      Alert.alert("Unable to save section", saveError.response?.data?.detail || saveError.message || "Please try again.");
    } finally {
      setSectionSaving(false);
    }
  }

  async function handleDeleteSection(section) {
    Alert.alert("Delete section?", `Delete ${section.courseCode} - ${section.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/sections/${section.id}/`);
            await refreshClasses();
          } catch (deleteError) {
            Alert.alert(
              "Unable to delete section",
              deleteError.response?.data?.detail || deleteError.message || "Please try again."
            );
          }
        },
      },
    ]);
  }

  async function handleImportCsv(section) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.name || `${section.courseCode}-${section.name}.csv`,
        type: asset.mimeType || "text/csv",
      });

      const response = await apiClient.post(`/sections/${section.id}/import-csv/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshClasses();
      Alert.alert(
        "CSV imported",
        `${response.data.created || 0} created, ${response.data.updated || 0} updated, ${response.data.skipped || 0} skipped.`
      );
    } catch (importError) {
      Alert.alert(
        "Unable to import CSV",
        importError.response?.data?.error || importError.response?.data?.detail || importError.message || "Please try again."
      );
    }
  }

  async function findEnrollmentId(sectionId, studentId) {
    const response = await apiClient.get("/enrollments/");
    const enrollments = normalizeApiList(response.data);

    const match = enrollments.find((enrollment) => {
      const enrollmentStudentId = String(enrollment.student?.id || enrollment.student || enrollment.student_id || "");
      const enrollmentSectionId = String(enrollment.section?.id || enrollment.section || "");
      return enrollmentStudentId === String(studentId) && enrollmentSectionId === String(sectionId);
    });

    return match?.id || null;
  }

  async function handleSaveStudent(data) {
    if (!studentSection) return;

    try {
      setStudentSaving(true);

      if (!data.studentId || !data.firstName || !data.lastName || !data.program || !data.yearLevel) {
        throw new Error("Please complete all student fields.");
      }

      const yearLevelValue = Number.parseInt(data.yearLevel, 10);
      if (Number.isNaN(yearLevelValue)) {
        throw new Error("Year level must be a number.");
      }

      const studentsResponse = await apiClient.get("/students/");
      const students = normalizeApiList(studentsResponse.data);
      const existingStudent = students.find((item) => String(item.student_id) === data.studentId);

      let studentId = existingStudent?.id;
      if (existingStudent) {
        await apiClient.patch(`/students/${existingStudent.id}/`, {
          student_id: data.studentId,
          first_name: data.firstName,
          last_name: data.lastName,
          program: data.program,
          year_level: yearLevelValue,
        });
      } else {
        const createStudentResponse = await apiClient.post("/students/", {
          student_id: data.studentId,
          first_name: data.firstName,
          last_name: data.lastName,
          program: data.program,
          year_level: yearLevelValue,
        });
        studentId = createStudentResponse.data.id;
      }

      const enrollmentId = await findEnrollmentId(studentSection.id, studentId);
      if (enrollmentId) {
        await apiClient.patch(`/enrollments/${enrollmentId}/`, {
          student: studentId,
          section: studentSection.id,
        });
      } else {
        await apiClient.post("/enrollments/", {
          student: studentId,
          section: studentSection.id,
        });
      }

      await refreshClasses();
      setStudentFormVisible(false);
      setEditingStudent(null);
      setStudentSection(null);
    } catch (studentError) {
      Alert.alert(
        "Unable to save student",
        studentError.response?.data?.detail || studentError.message || "Please try again."
      );
    } finally {
      setStudentSaving(false);
    }
  }

  async function handleDeleteStudent(section, student) {
    Alert.alert("Delete student?", `${student.name} will be removed from ${section.name}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const enrollmentId = await findEnrollmentId(section.id, student.id);
            if (!enrollmentId) {
              throw new Error("Enrollment record not found.");
            }

            await apiClient.delete(`/enrollments/${enrollmentId}/`);
            await refreshClasses();
          } catch (deleteError) {
            Alert.alert(
              "Unable to delete student",
              deleteError.response?.data?.detail || deleteError.message || "Please try again."
            );
          }
        },
      },
    ]);
  }

  async function handleCreateFaculty(payloadData) {
    if (!payloadData.firstName || !payloadData.lastName || !payloadData.email) {
      Alert.alert("Missing fields", "First name, last name, and email are required.");
      return;
    }

    try {
      setFacultySaving(true);
      await createFacultyAccount(payloadData);
      await refreshClasses();
      setFacultyFormVisible(false);
      Alert.alert("Faculty created", "New faculty account was created successfully.");
    } catch (createError) {
      Alert.alert(
        "Unable to create faculty",
        createError.response?.data?.detail || createError.message || "Please try again."
      );
    } finally {
      setFacultySaving(false);
    }
  }

  return (
    <AppScreen
      eyebrow="Program Chair"
      title="Classes & faculty"
      subtitle="Review sections and faculty assignments in a compact mobile layout that keeps the same information hierarchy as the desktop view."
    >
      <InfoCard title="Overview" rightText={`${payload.sections.length} sections`}>
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
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{inactiveSections}</Text>
            <Text style={styles.summaryLabel}>Inactive sections</Text>
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
        <View style={styles.stack}>
          <InfoCard title="Search and filters">
            <TextInput
              onChangeText={setSectionQuery}
              placeholder="Search section, course, year, or semester"
              placeholderTextColor="#7b8a86"
              style={styles.input}
              value={sectionQuery}
            />

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Status</Text>
              <Pressable style={styles.dropdownButton} onPress={() => openSectionFilterPicker("status")}>
                <Text style={styles.dropdownButtonText}>{sectionStatus}</Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </Pressable>
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Course</Text>
              <Pressable style={styles.dropdownButton} onPress={() => openSectionFilterPicker("course")}>
                <Text style={styles.dropdownButtonText}>{sectionCourse}</Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </Pressable>
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>School year</Text>
              <Pressable style={styles.dropdownButton} onPress={() => openSectionFilterPicker("schoolYear")}>
                <Text style={styles.dropdownButtonText}>{sectionYear}</Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </Pressable>
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Semester</Text>
              <Pressable style={styles.dropdownButton} onPress={() => openSectionFilterPicker("semester")}>
                <Text style={styles.dropdownButtonText}>{sectionSemester}</Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </Pressable>
            </View>

            <View style={styles.filterFooter}>
              <Text style={styles.helperText}>
                Showing {filteredSections.length} of {payload.sections.length} sections
              </Text>
              <Pressable onPress={resetSectionFilters} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
            </View>
          </InfoCard>

          {filteredSections.length === 0 ? (
            <InfoCard title="No sections found">
              <Text style={styles.helperText}>Try adjusting or clearing your filters.</Text>
            </InfoCard>
          ) : (
            filteredSections.map((section) => {
              const students = Array.isArray(section.students) ? section.students : [];
              const isExpanded = expandedSectionId === section.id;
              const assignedFaculty = getAssignedFaculty(section);

              return (
                <InfoCard key={section.id} title={section.courseName} rightText={section.isActive ? "Active" : "Inactive"}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionIdentity}>
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>{section.courseCode}</Text>
                      </View>
                      <Text style={styles.sectionName}>{section.name}</Text>
                      <Text style={styles.sectionMeta}>{section.courseName}</Text>
                      <Text style={styles.sectionMeta}>{assignedFaculty}</Text>
                    </View>

                    <View style={styles.sectionRightColumn}>
                      <Text style={styles.sectionMeta}>{section.semester}</Text>
                      <Text style={styles.sectionMeta}>{section.academicYear}</Text>
                      <View style={styles.studentCountBadge}>
                        <Text style={styles.studentCountBadgeText}>{section.studentCount} students</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable onPress={() => openSectionEditor(section)} style={styles.actionButtonSecondary}>
                      <Text style={styles.actionButtonSecondaryText}>Edit Section</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDeleteSection(section)} style={styles.actionButtonDanger}>
                      <Text style={styles.actionButtonDangerText}>Delete</Text>
                    </Pressable>
                    <Pressable onPress={() => handleImportCsv(section)} style={styles.actionButtonOutline}>
                      <Text style={styles.actionButtonOutlineText}>Import CSV</Text>
                    </Pressable>
                    <Pressable onPress={() => openStudentEditor(section, null)} style={styles.actionButtonPrimary}>
                      <Text style={styles.actionButtonPrimaryText}>Add Student</Text>
                    </Pressable>
                  </View>

                  <Pressable onPress={() => toggleSection(section.id)} style={styles.rosterToggle}>
                    <Text style={styles.rosterToggleText}>{isExpanded ? "Hide students" : "View students"}</Text>
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.tableShell}>
                      {students.length === 0 ? (
                        <Text style={styles.helperText}>No students enrolled yet.</Text>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.table}>
                            <View style={styles.tableHeaderRow}>
                              <Text style={[styles.tableHeaderCell, styles.columnIndex]}>#</Text>
                              <Text style={[styles.tableHeaderCell, styles.columnName]}>Name</Text>
                              <Text style={[styles.tableHeaderCell, styles.columnId]}>Student ID</Text>
                              <Text style={[styles.tableHeaderCell, styles.columnCourse]}>Course</Text>
                              <Text style={[styles.tableHeaderCell, styles.columnYear]}>Year Level</Text>
                              <Text style={[styles.tableHeaderCell, styles.columnActions]}>Actions</Text>
                            </View>

                            {students.map((student, index) => {
                              const studentName = formatStudentName(student);
                              const studentId = student.student_id || student.studentId || student.id || "";
                              const studentCourse = formatStudentCourse(student, section);
                              const yearLevel = formatYearLevel(student.year_level || student.yearLevel);

                              return (
                                <View key={`${section.id}-${studentId || index}`} style={styles.tableRow}>
                                  <Text style={[styles.tableCell, styles.columnIndex]}>{index + 1}</Text>
                                  <Text style={[styles.tableCell, styles.columnName]}>{studentName}</Text>
                                  <Text style={[styles.tableCell, styles.columnId]}>{studentId}</Text>
                                  <Text style={[styles.tableCell, styles.columnCourse]}>{studentCourse}</Text>
                                  <Text style={[styles.tableCell, styles.columnYear]}>{yearLevel}</Text>
                                  <View style={[styles.tableCell, styles.columnActions, styles.rowActions]}>
                                    <Pressable onPress={() => openStudentEditor(section, student)} style={styles.rowActionButton}>
                                      <Text style={styles.rowActionText}>Edit</Text>
                                    </Pressable>
                                    <Pressable onPress={() => handleDeleteStudent(section, student)} style={styles.rowActionButtonDanger}>
                                      <Text style={styles.rowActionTextDanger}>Delete</Text>
                                    </Pressable>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </ScrollView>
                      )}
                    </View>
                  ) : null}
                </InfoCard>
              );
            })
          )}
        </View>
      ) : (
        <View style={styles.stack}>
          <View style={styles.facultyHeaderRow}>
            <Text style={styles.facultyHeaderTitle}>Faculty members</Text>
            <Pressable onPress={() => setFacultyFormVisible(true)} style={styles.addFacultyButton}>
              <Text style={styles.addFacultyPlus}>+</Text>
              <Text style={styles.addFacultyText}>Add Faculty</Text>
            </Pressable>
          </View>

          <InfoCard title="Search faculty">
            <TextInput
              onChangeText={setFacultyQuery}
              placeholder="Search name, email, or course"
              placeholderTextColor="#7b8a86"
              style={styles.input}
              value={facultyQuery}
            />

            <View style={styles.filterFooter}>
              <Text style={styles.helperText}>
                Showing {filteredFaculty.length} of {payload.faculty.length} faculty members
              </Text>
              <Pressable onPress={resetFacultyFilters} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
            </View>
          </InfoCard>

          {filteredFaculty.length === 0 ? (
            <InfoCard title="No faculty found">
              <Text style={styles.helperText}>Try a different search term.</Text>
            </InfoCard>
          ) : (
            filteredFaculty.map((member) => {
              const assignedCourses = Array.isArray(member.courses) ? member.courses : [];

              return (
                <InfoCard key={member.id} title={member.name} rightText={`${assignedCourses.length} courses`}>
                  <View style={styles.metaStack}>
                    <Text style={styles.metaText}>{member.email || "No email on record"}</Text>
                    <Text style={styles.metaStrong}>
                      Assigned courses: {assignedCourses.length}
                    </Text>
                    {assignedCourses.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {assignedCourses.slice(0, 6).map((course, index) => {
                          const courseCode = course?.code || course?.courseCode || course || `Course ${index + 1}`;

                          return (
                            <View key={`${member.id}-${courseCode}-${index}`} style={styles.courseBadge}>
                              <Text style={styles.courseBadgeText}>{courseCode}</Text>
                            </View>
                          );
                        })}
                      </ScrollView>
                    ) : null}
                  </View>
                </InfoCard>
              );
            })
          )}
        </View>
      )}

      <Modal animationType="fade" transparent visible={sectionFilterPickerVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{sectionFilterConfigs[activeSectionFilter]?.label || "Select"}</Text>
              <Pressable onPress={() => setSectionFilterPickerVisible(false)} style={styles.pickerCloseButton}>
                <Text style={styles.pickerCloseText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.pickerList}>
              {(sectionFilterConfigs[activeSectionFilter]?.options || []).map((option) => {
                const selected = sectionFilterConfigs[activeSectionFilter]?.value === option;
                return (
                  <Pressable
                    key={`${activeSectionFilter}-${option}`}
                    onPress={() => handleSectionFilterSelect(option)}
                    style={[styles.pickerOption, selected ? styles.pickerOptionSelected : null]}
                  >
                    <Text style={[styles.pickerOptionText, selected ? styles.pickerOptionTextSelected : null]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SectionFormModal
        visible={sectionFormVisible}
        section={editingSection}
        facultyOptions={payload.faculty}
        saving={sectionSaving}
        onClose={() => {
          setSectionFormVisible(false);
          setEditingSection(null);
        }}
        onSave={handleSaveSection}
      />

      <StudentFormModal
        visible={studentFormVisible}
        sectionName={studentSection?.name || ""}
        student={editingStudent}
        saving={studentSaving}
        onClose={() => {
          setStudentFormVisible(false);
          setEditingStudent(null);
          setStudentSection(null);
        }}
        onSave={handleSaveStudent}
      />

      <FacultyAccountModal
        visible={facultyFormVisible}
        saving={facultySaving}
        onClose={() => setFacultyFormVisible(false)}
        onSave={handleCreateFaculty}
      />
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
    minWidth: "45%",
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
  stack: {
    gap: 14,
  },
  centered: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
  },
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
  filterBlock: {
    marginTop: 10,
  },
  filterLabel: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  chipText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: colors.yellow,
  },
  filterFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
  },
  resetButton: {
    backgroundColor: colors.dark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  resetButtonText: {
    color: colors.yellow,
    fontSize: 12,
    fontWeight: "700",
  },
  facultyHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  facultyHeaderTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
  },
  addFacultyButton: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addFacultyPlus: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 18,
  },
  addFacultyText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "800",
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
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  codeBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.yellow,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  codeBadgeText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "800",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeActive: {
    backgroundColor: "#DCFCE7",
  },
  statusBadgeMuted: {
    backgroundColor: "#E5E7EB",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statusBadgeTextActive: {
    color: "#166534",
  },
  statusBadgeTextMuted: {
    color: "#4B5563",
  },
  sectionName: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "800",
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
  courseBadge: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  courseBadgeText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    maxHeight: "85%",
    padding: 18,
  },
  modalTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: colors.gray,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  modalScroll: {
    paddingBottom: 4,
    paddingTop: 14,
  },
  modalInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalSectionLabel: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 2,
    textTransform: "uppercase",
  },
  modalChipRow: {
    gap: 8,
    marginBottom: 12,
  },
  modalChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalChipSelected: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  modalChipText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  modalChipTextSelected: {
    color: colors.yellow,
  },
  dropdownButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownButtonText: {
    color: colors.dark,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  dropdownChevron: {
    color: colors.gray,
    fontSize: 12,
    marginLeft: 8,
  },
  dropdownList: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  dropdownScroll: {
    maxHeight: 170,
  },
  dropdownItem: {
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemSelected: {
    backgroundColor: colors.dark,
  },
  dropdownItemText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  dropdownItemTextSelected: {
    color: colors.yellow,
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
  pickerOptionSelected: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  pickerOptionText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  pickerOptionTextSelected: {
    color: colors.yellow,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalSecondaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  modalSecondaryButtonText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  modalPrimaryButton: {
    backgroundColor: colors.yellow,
    borderRadius: 14,
    flex: 1,
    paddingVertical: 12,
  },
  modalPrimaryButtonText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  modalButtonDisabled: {
    opacity: 0.65,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  sectionIdentity: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  sectionRightColumn: {
    alignItems: "flex-end",
    gap: 4,
  },
  sectionMeta: {
    color: colors.gray,
    fontSize: 12,
    lineHeight: 17,
  },
  studentCountBadge: {
    alignSelf: "flex-end",
    backgroundColor: "#FFE9B0",
    borderRadius: 999,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  studentCountBadgeText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  actionButtonSecondary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonSecondaryText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  actionButtonDanger: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonDangerText: {
    color: "#E11D48",
    fontSize: 12,
    fontWeight: "700",
  },
  actionButtonOutline: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonOutlineText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  actionButtonPrimary: {
    backgroundColor: colors.yellow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonPrimaryText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "800",
  },
  rosterToggle: {
    alignItems: "center",
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
  },
  rosterToggleText: {
    color: colors.yellowAlt,
    fontSize: 12,
    fontWeight: "800",
  },
  tableShell: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    marginTop: 12,
    overflow: "hidden",
    padding: 0,
  },
  table: {
    minWidth: 620,
  },
  tableHeaderRow: {
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tableHeaderCell: {
    color: colors.gray,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tableRow: {
    alignItems: "center",
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  tableCell: {
    color: colors.dark,
    fontSize: 12,
    paddingRight: 8,
  },
  columnIndex: {
    width: 34,
  },
  columnName: {
    width: 180,
    fontWeight: "700",
  },
  columnId: {
    width: 110,
  },
  columnCourse: {
    width: 90,
  },
  columnYear: {
    width: 110,
  },
  columnActions: {
    width: 110,
  },
  rowActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  rowActionButton: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rowActionButtonDanger: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rowActionText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "700",
  },
  rowActionTextDanger: {
    color: "#E11D48",
    fontSize: 11,
    fontWeight: "700",
  },
});
