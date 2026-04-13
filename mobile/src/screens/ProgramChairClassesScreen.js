import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { apiClient } from "../services/apiClient";
import { createFacultyAccount, updateFacultyAccount } from "../services/usersMobile";
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

function getSectionOwner(section, facultyMembers) {
  const sectionCode = String(section?.courseCode || "").toLowerCase();
  const sectionName = String(section?.name || "").toLowerCase();

  const owner = (Array.isArray(facultyMembers) ? facultyMembers : []).find((member) => {
    if (!Array.isArray(member?.courses)) return false;

    return member.courses.some((course) => {
      const courseCode = String(course?.code || course?.courseCode || course || "").toLowerCase();
      const sectionNames = Array.isArray(course?.sections)
        ? course.sections.map((entry) => String(entry || "").toLowerCase())
        : [];

      return courseCode === sectionCode || sectionNames.includes(sectionName);
    });
  });

  return owner ? { id: owner.id, name: owner.name || "Faculty member" } : null;
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

function FacultyAccountModal({ visible, saving, editingFaculty, sections, facultyMembers, onClose, onSave }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [showAssignedElsewhere, setShowAssignedElsewhere] = useState(false);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const assignedCourses = Array.isArray(editingFaculty?.courses) ? editingFaculty.courses : [];

  const allSections = Array.isArray(sections) ? sections : [];

  const availableSections = useMemo(() => {
    const normalized = courseSearch.trim().toLowerCase();

    return allSections
      .map((section) => {
        const owner = getSectionOwner(section, facultyMembers);
        const assignedToSelf = owner?.id === editingFaculty?.id;
        const assignedToOther = Boolean(owner && owner.id !== editingFaculty?.id);

        const matchesQuery =
          !normalized ||
          String(section.courseCode || "").toLowerCase().includes(normalized) ||
          String(section.courseName || "").toLowerCase().includes(normalized) ||
          String(section.name || "").toLowerCase().includes(normalized) ||
          String(owner?.name || "").toLowerCase().includes(normalized);

        return {
          ...section,
          owner,
          assignedToSelf,
          assignedToOther,
          selected: selectedSectionIds.includes(section.id),
          matchesQuery,
        };
      })
      .filter((section) => section.matchesQuery)
      .filter((section) => showAssignedElsewhere || !section.assignedToOther || section.assignedToSelf);
  }, [allSections, courseSearch, editingFaculty?.id, facultyMembers, selectedSectionIds, showAssignedElsewhere]);

  useEffect(() => {
    if (!visible) return;
    setFullName(editingFaculty?.name || "");
    setEmail(editingFaculty?.email || "");
    setDepartment(editingFaculty?.department || "");
    setCourseSearch("");
    setShowAssignedElsewhere(false);
    setShowCoursePicker(false);

    if (editingFaculty?.id) {
      const mappedSectionIds = allSections
        .filter((section) => getSectionOwner(section, facultyMembers)?.id === editingFaculty.id)
        .map((section) => section.id);
      setSelectedSectionIds(mappedSectionIds);
    } else {
      setSelectedSectionIds([]);
    }
  }, [allSections, editingFaculty, facultyMembers, visible]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalTitle}>{editingFaculty ? "Edit Faculty" : "Add Faculty"}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
          </View>
          {!editingFaculty ? (
            <Text style={styles.modalSubtitle}>Create a faculty account for section assignments.</Text>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            <Text style={styles.formFieldLabel}>Full Name</Text>
            <TextInput
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={colors.gray}
              style={[styles.modalInput, editingFaculty ? styles.modalInputEdit : null]}
              value={fullName}
            />

            <Text style={styles.formFieldLabel}>Email</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.gray}
              style={[styles.modalInput, editingFaculty ? styles.modalInputEdit : null]}
              value={email}
            />

            {editingFaculty ? (
              <>
                <View style={styles.coursesHeaderRow}>
                  <Text style={styles.formFieldLabel}>Courses</Text>
                  <Pressable onPress={() => setShowCoursePicker((current) => !current)} style={styles.addCourseButton}>
                    <Text style={styles.addCourseButtonText}>+ Add Course</Text>
                  </Pressable>
                </View>

                <View style={styles.modalCoursePanel}>
                  <TextInput
                    onChangeText={setCourseSearch}
                    placeholder="Search sections or current faculty owner"
                    placeholderTextColor={colors.gray}
                    style={styles.modalCourseSearchInput}
                    value={courseSearch}
                  />

                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotUnassigned]} />
                      <Text style={styles.legendText}>Unassigned</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotAssigned]} />
                      <Text style={styles.legendText}>Assigned to this faculty</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotOther]} />
                      <Text style={styles.legendText}>Assigned to another faculty</Text>
                    </View>
                  </View>

                  <Pressable onPress={() => setShowAssignedElsewhere((prev) => !prev)} style={styles.checkboxRow}>
                    <View style={[styles.checkboxBox, showAssignedElsewhere ? styles.checkboxBoxChecked : null]} />
                    <Text style={styles.checkboxText}>Show sections already assigned to another faculty</Text>
                  </Pressable>

                  {showCoursePicker ? (
                    <View style={styles.assignableSectionList}>
                      {availableSections.length === 0 ? (
                        <Text style={styles.helperText}>No sections match your search.</Text>
                      ) : (
                        availableSections.map((section) => {
                          const sectionLabel = `${section.courseCode} • ${section.name}`;
                          const sectionStatus = section.assignedToSelf
                            ? "Assigned"
                            : section.assignedToOther
                              ? `Owned by ${section.owner?.name || "another faculty"}`
                              : "Unassigned";

                          return (
                            <Pressable
                              key={`faculty-section-${section.id}`}
                              onPress={() => {
                                if (section.assignedToOther && !section.selected) return;
                                setSelectedSectionIds((current) =>
                                  current.includes(section.id)
                                    ? current.filter((id) => id !== section.id)
                                    : [...current, section.id]
                                );
                              }}
                              style={[
                                styles.assignableSectionItem,
                                section.selected ? styles.assignableSectionItemSelected : null,
                                section.assignedToOther && !section.selected
                                  ? styles.assignableSectionItemDisabled
                                  : null,
                              ]}
                            >
                              <View style={styles.assignableSectionInfo}>
                                <Text style={styles.assignableSectionTitle}>{sectionLabel}</Text>
                                <Text style={styles.assignableSectionMeta}>{sectionStatus}</Text>
                              </View>
                              <View
                                style={[
                                  styles.assignableSectionCheck,
                                  section.selected ? styles.assignableSectionCheckSelected : null,
                                ]}
                              />
                            </Pressable>
                          );
                        })
                      )}
                    </View>
                  ) : null}

                  {assignedCourses.length > 0 ? (
                    <View style={styles.modalCourseList}>
                      {assignedCourses.slice(0, 6).map((course, index) => {
                        const code = course?.code || course?.courseCode || `Course ${index + 1}`;
                        const name = course?.name || "";
                        return (
                          <View key={`${code}-${index}`} style={styles.modalCourseItem}>
                            <Text style={styles.modalCourseItemText}>{name ? `${code} - ${name}` : code}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              </>
            ) : (
              <TextInput
                onChangeText={setDepartment}
                placeholder="Department"
                placeholderTextColor={colors.gray}
                style={styles.modalInput}
                value={department}
              />
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalSecondaryButton} disabled={saving}>
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const parsedName = splitStudentName(fullName.trim());
                onSave({
                  id: editingFaculty?.id,
                  firstName: parsedName.firstName,
                  lastName: parsedName.lastName,
                  email: email.trim(),
                  department: department.trim(),
                  assignedSectionIds: selectedSectionIds,
                });
              }}
              style={[
                styles.modalPrimaryButton,
                editingFaculty ? styles.modalPrimaryButtonEdit : null,
                saving && styles.modalButtonDisabled,
              ]}
              disabled={saving}
            >
              <Text
                style={[
                  styles.modalPrimaryButtonText,
                  editingFaculty ? styles.modalPrimaryButtonTextEdit : null,
                ]}
              >
                {saving ? (editingFaculty ? "Updating..." : "Creating...") : editingFaculty ? "Update" : "Create"}
              </Text>
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
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [facultySaving, setFacultySaving] = useState(false);
  const [facultyCreatedVisible, setFacultyCreatedVisible] = useState(false);
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

  async function handleSaveFaculty(payloadData) {
    if (!payloadData.firstName || !payloadData.lastName || !payloadData.email) {
      Alert.alert("Missing fields", "First name, last name, and email are required.");
      return;
    }

    try {
      setFacultySaving(true);

      if (editingFaculty?.id) {
        await updateFacultyAccount(editingFaculty.id, payloadData);

        const desiredSectionIds = Array.isArray(payloadData.assignedSectionIds)
          ? payloadData.assignedSectionIds.map((value) => String(value))
          : [];
        const desiredSectionSet = new Set(desiredSectionIds);

        for (const section of payload.sections) {
          const owner = getSectionOwner(section, payload.faculty);
          const currentlyOwnedByEditingFaculty = owner?.id === editingFaculty.id;
          const shouldBeOwnedByEditingFaculty = desiredSectionSet.has(String(section.id));

          if (currentlyOwnedByEditingFaculty && !shouldBeOwnedByEditingFaculty) {
            await apiClient.patch(`/sections/${section.id}/`, { faculty_id: null });
          }

          if (!currentlyOwnedByEditingFaculty && shouldBeOwnedByEditingFaculty) {
            await apiClient.patch(`/sections/${section.id}/`, { faculty_id: editingFaculty.id });
          }
        }
      } else {
        await createFacultyAccount(payloadData);
      }
      await refreshClasses();
      setFacultyFormVisible(false);
      if (editingFaculty?.id) {
        Alert.alert("Faculty updated", "Faculty account details were updated successfully.");
      } else {
        setFacultyCreatedVisible(true);
      }
      setEditingFaculty(null);
    } catch (createError) {
      Alert.alert(
        editingFaculty?.id ? "Unable to update faculty" : "Unable to create faculty",
        createError.response?.data?.detail || createError.message || "Please try again."
      );
    } finally {
      setFacultySaving(false);
    }
  }

  function handleDeleteFaculty(member) {
    Alert.alert(
      "Delete faculty?",
      `${member.name} will be removed from faculty accounts and section assignments will be unlinked.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setFacultySaving(true);
              await apiClient.delete(`/users/${member.id}/`);
              await refreshClasses();
              Alert.alert("Faculty deleted", "The faculty account was removed successfully.");
            } catch (deleteError) {
              Alert.alert(
                "Unable to delete faculty",
                deleteError.response?.data?.detail || deleteError.message || "Please try again."
              );
            } finally {
              setFacultySaving(false);
            }
          },
        },
      ]
    );
  }

  return (
    <AppScreen
      eyebrow="Program Chair"
      title="Classes & faculty"
      subtitle="Review sections and faculty assignments in a compact mobile layout that keeps the same information hierarchy as the desktop view."
      showMeta={false}
      enableScrollTopButton={true}
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
                <InfoCard key={section.id}>
                  <View style={styles.sectionCardHeader}>
                    <View style={styles.badgeRow}>
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>{section.courseCode}</Text>
                      </View>
                      <View style={[styles.statusBadge, section.isActive ? styles.statusBadgeActive : styles.statusBadgeMuted]}>
                        <Text style={[styles.statusBadgeText, section.isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextMuted]}>
                          {section.isActive ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.courseName}>{section.courseName}</Text>
                    <Text style={styles.sectionLine}>{section.name}</Text>
                  </View>

                  <View style={styles.metaGrid}>
                    <Text style={styles.metaText}>{section.semester}</Text>
                    <Text style={styles.metaText}>{section.academicYear}</Text>
                    <Text style={styles.metaText}>{section.studentCount} students</Text>
                    <Text style={styles.metaText}>{assignedFaculty}</Text>
                  </View>

                  <Pressable onPress={() => handleImportCsv(section)} style={styles.importButton}>
                    <Text style={styles.importButtonText}>Import Students</Text>
                  </Pressable>

                  <View style={styles.sectionActionRow}>
                    <Pressable onPress={() => openSectionEditor(section)} style={styles.actionButtonSecondary}>
                      <Text style={styles.actionButtonSecondaryText}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDeleteSection(section)} style={styles.actionButtonDanger}>
                      <Text style={styles.actionButtonDangerText}>Delete</Text>
                    </Pressable>
                    <Pressable onPress={() => openStudentEditor(section, null)} style={styles.actionButtonPrimary}>
                      <Text style={styles.actionButtonPrimaryText}>Add Student</Text>
                    </Pressable>
                  </View>

                  <Pressable onPress={() => toggleSection(section.id)} style={styles.viewStudentsButton}>
                    <Text style={styles.viewStudentsText}>{isExpanded ? "Hide Students" : "View Students"}</Text>
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.roster}>
                      {students.length === 0 ? (
                        <Text style={styles.helperText}>No students enrolled yet.</Text>
                      ) : (
                        students.map((student, index) => {
                          const studentName = formatStudentName(student);
                          const studentId = student.student_id || student.studentId || student.id || "";
                          const studentCourse = formatStudentCourse(student, section);
                          const yearLevel = formatYearLevel(student.year_level || student.yearLevel);

                          return (
                            <View key={`${section.id}-${studentId || index}`} style={styles.studentRow}>
                              <View style={styles.studentMain}>
                                <Text style={styles.studentId}>{studentId}</Text>
                                <Text style={styles.studentName}>{studentName}</Text>
                                <Text style={styles.studentMeta}>
                                  {[studentCourse, yearLevel].filter(Boolean).join(" | ")}
                                </Text>
                              </View>
                              <View style={styles.rowActions}>
                                <Pressable onPress={() => openStudentEditor(section, student)} style={styles.rowActionButton}>
                                  <Text style={styles.rowActionText}>Edit</Text>
                                </Pressable>
                                <Pressable onPress={() => handleDeleteStudent(section, student)} style={styles.rowActionButtonDanger}>
                                  <Text style={styles.rowActionTextDanger}>Delete</Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })
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
            <Pressable
              onPress={() => {
                setEditingFaculty(null);
                setFacultyFormVisible(true);
              }}
              style={styles.addFacultyButton}
            >
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
                    <View style={styles.facultyCardActionRow}>
                      <Pressable
                        onPress={() => {
                          setEditingFaculty(member);
                          setFacultyFormVisible(true);
                        }}
                        style={styles.editFacultyButton}
                      >
                        <Text style={styles.editFacultyButtonText}>Edit Faculty</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteFaculty(member)}
                        style={styles.deleteFacultyButton}
                      >
                        <Text style={styles.deleteFacultyButtonText}>Delete</Text>
                      </Pressable>
                    </View>
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
        editingFaculty={editingFaculty}
        sections={payload.sections}
        facultyMembers={payload.faculty}
        onClose={() => {
          setFacultyFormVisible(false);
          setEditingFaculty(null);
        }}
        onSave={handleSaveFaculty}
      />

      <Modal animationType="fade" transparent visible={facultyCreatedVisible}>
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Faculty Created</Text>
            <Text style={styles.successMessage}>New faculty account was created successfully.</Text>
            <Pressable onPress={() => setFacultyCreatedVisible(false)} style={styles.successButton}>
              <Text style={styles.successButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    borderColor: colors.graySoft,
    borderRadius: 16,
    borderWidth: 1,
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
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  toggle: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    paddingVertical: 10,
  },
  toggleActive: {
    backgroundColor: colors.dark,
  },
  toggleText: {
    color: colors.gray,
    fontSize: 13,
    fontWeight: "700",
  },
  toggleTextActive: {
    color: colors.yellow,
  },
  stack: {
    gap: 16,
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
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  filterBlock: {
    marginTop: 10,
    gap: 6,
  },
  filterLabel: {
    color: colors.darkAlt,
    fontSize: 12,
    fontWeight: "800",
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
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
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
    borderRadius: 10,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addFacultyPlus: {
    color: colors.dark,
    fontSize: 16,
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
    backgroundColor: "#FFF7D6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  codeBadgeText: {
    color: "#B26B00",
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
    color: colors.darkAlt,
    fontSize: 12,
  },
  metaStrong: {
    color: colors.yellowAlt,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  facultyCardActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  editFacultyButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editFacultyButtonText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  deleteFacultyButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  deleteFacultyButtonText: {
    color: "#E11D48",
    fontSize: 12,
    fontWeight: "700",
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
    borderColor: colors.graySoft,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: "85%",
    padding: 18,
  },
  modalTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
  },
  modalTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCloseText: {
    color: colors.gray,
    fontSize: 24,
    lineHeight: 24,
    paddingHorizontal: 4,
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
  modalInputEdit: {
    borderRadius: 8,
    borderColor: colors.dark,
  },
  formFieldLabel: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  coursesHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  addCourseButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addCourseButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "500",
  },
  modalCoursePanel: {
    borderColor: colors.dark,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    padding: 10,
  },
  modalCourseSearchInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  legendDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  legendDotUnassigned: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderWidth: 1,
  },
  legendDotAssigned: {
    backgroundColor: colors.yellow,
  },
  legendDotOther: {
    backgroundColor: "#FDE68A",
    borderColor: "#FBBF24",
    borderWidth: 1,
  },
  legendText: {
    color: colors.dark,
    fontSize: 12,
  },
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  checkboxBox: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 3,
    borderWidth: 1,
    height: 12,
    width: 12,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  checkboxText: {
    color: colors.dark,
    fontSize: 12,
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
  modalCoursesWrap: {
    marginTop: 2,
  },
  modalCourseList: {
    gap: 8,
  },
  assignableSectionList: {
    gap: 8,
    marginBottom: 10,
  },
  assignableSectionItem: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  assignableSectionItemSelected: {
    borderColor: colors.dark,
    backgroundColor: "#F8FAFC",
  },
  assignableSectionItemDisabled: {
    opacity: 0.55,
  },
  assignableSectionInfo: {
    flex: 1,
    paddingRight: 10,
  },
  assignableSectionTitle: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  assignableSectionMeta: {
    color: colors.gray,
    fontSize: 11,
    marginTop: 2,
  },
  assignableSectionCheck: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    height: 16,
    width: 16,
  },
  assignableSectionCheckSelected: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  modalCourseItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalCourseItemText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "600",
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
    backgroundColor: colors.surface,
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
  modalActionsRight: {
    justifyContent: "flex-end",
  },
  modalSecondaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  modalSecondaryButtonEdit: {
    flex: 0,
    minWidth: 78,
    paddingHorizontal: 14,
  },
  modalSecondaryButtonText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  modalPrimaryButton: {
    backgroundColor: colors.yellow,
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  modalPrimaryButtonEdit: {
    backgroundColor: colors.dark,
    flex: 0,
    minWidth: 90,
    paddingHorizontal: 14,
  },
  modalPrimaryButtonText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  modalPrimaryButtonTextEdit: {
    color: colors.surface,
  },
  modalButtonDisabled: {
    opacity: 0.65,
  },
  sectionCardHeader: {
    gap: 4,
    marginBottom: 12,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  badgeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  courseName: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  sectionLine: {
    color: colors.gray,
    fontSize: 13,
  },
  importButton: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 999,
    marginBottom: 10,
    paddingVertical: 11,
  },
  importButtonText: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: "700",
  },
  sectionActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 2,
  },
  actionButtonSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 10,
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
    backgroundColor: colors.dark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonPrimaryText: {
    color: colors.yellow,
    fontSize: 12,
    fontWeight: "800",
  },
  viewStudentsButton: {
    alignItems: "center",
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    marginHorizontal: -18,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  viewStudentsText: {
    color: "#B26B00",
    fontSize: 12,
    fontWeight: "700",
  },
  roster: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 14,
    padding: 14,
  },
  studentRow: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 10,
  },
  studentMain: {
    flex: 1,
  },
  studentId: {
    color: "#B26B00",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 2,
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
  successOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  successCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.graySoft,
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    paddingHorizontal: 22,
    paddingVertical: 24,
    width: "100%",
    maxWidth: 360,
  },
  successIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(255, 194, 14, 0.2)",
    borderRadius: 999,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  successIcon: {
    color: colors.dark,
    fontSize: 28,
    fontWeight: "900",
  },
  successTitle: {
    color: colors.dark,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 14,
  },
  successMessage: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  successButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.yellow,
    borderRadius: 12,
    marginTop: 18,
    paddingVertical: 12,
  },
  successButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
});
