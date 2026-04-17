import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { apiClient } from "../services/apiClient";
import { fetchFacultyClasses, fetchSectionDetails } from "../services/mobileData";
import { colors } from "../theme/colors";

export default function FacultyClassesScreen() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("card");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedYear, setSelectedYear] = useState("All School Years");
  const [selectedSection, setSelectedSection] = useState("All Sections");
  const [expandedId, setExpandedId] = useState(null);
  const [rosters, setRosters] = useState({});
  const [rosterLoadingId, setRosterLoadingId] = useState(null);
  const [importingSectionId, setImportingSectionId] = useState(null);
  const [importChoiceVisible, setImportChoiceVisible] = useState(false);
  const [importChoiceSection, setImportChoiceSection] = useState(null);
  const [manualVisible, setManualVisible] = useState(false);
  const [manualSection, setManualSection] = useState(null);
  const [manualNames, setManualNames] = useState("");
  const [manualProgram, setManualProgram] = useState("");
  const [manualYearLevel, setManualYearLevel] = useState("1");
  const [manualLoading, setManualLoading] = useState(false);

  async function refreshClasses() {
    const data = await fetchFacultyClasses();
    setClasses(data);
  }

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

  const filterOptions = useMemo(() => {
    const courses = Array.from(new Set(classes.map((item) => item.courseCode).filter(Boolean)));
    const years = Array.from(new Set(classes.map((item) => item.academicYear).filter(Boolean)));
    const sections = Array.from(new Set(classes.map((item) => item.name).filter(Boolean)));

    return {
      courses: ["All Courses", ...courses],
      schoolYears: ["All School Years", ...years],
      sectionNames: ["All Sections", ...sections],
    };
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return classes.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.isActive) ||
        (statusFilter === "inactive" && !item.isActive);

      const matchesCourse = selectedCourse === "All Courses" || item.courseCode === selectedCourse;
      const matchesYear = selectedYear === "All School Years" || item.academicYear === selectedYear;
      const matchesSection = selectedSection === "All Sections" || item.name === selectedSection;

      if (!matchesStatus || !matchesCourse || !matchesYear || !matchesSection) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        item.courseCode.toLowerCase().includes(normalized) ||
        item.courseName.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized) ||
        item.academicYear.toLowerCase().includes(normalized)
      );
    });
  }, [classes, query, selectedCourse, selectedSection, selectedYear, statusFilter]);

  const activeCount = useMemo(
    () => filteredClasses.filter((item) => item.isActive).length,
    [filteredClasses]
  );
  const inactiveCount = filteredClasses.length - activeCount;

  function resetFilters() {
    setQuery("");
    setStatusFilter("active");
    setSelectedCourse("All Courses");
    setSelectedYear("All School Years");
    setSelectedSection("All Sections");
  }

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

  function toCsvField(value) {
    const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
    return `"${text.replace(/"/g, '""')}"`;
  }

  function buildManualCsv(section) {
    const lines = manualNames
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const rows = lines.map((line, index) => {
      const parts = line.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || "Student";
      const lastName = parts.slice(1).join(" ") || "Unknown";
      const studentId = `M-${section.id}-${Date.now().toString().slice(-6)}-${index + 1}`;

      return {
        student_id: studentId,
        first_name: firstName,
        last_name: lastName,
        program: (manualProgram || section.courseCode || "Unassigned Program").trim(),
        year_level: manualYearLevel,
      };
    });

    const header = ["student_id", "first_name", "last_name", "program", "year_level"];
    const csvBody = rows
      .map((row) =>
        [row.student_id, row.first_name, row.last_name, row.program, row.year_level]
          .map((cell) => toCsvField(cell))
          .join(",")
      )
      .join("\n");

    return {
      rowCount: rows.length,
      csv: `${header.join(",")}\n${csvBody}`,
    };
  }

  async function uploadCsvForSection(section, csvUri, fileName) {
    const formData = new FormData();
    formData.append("file", {
      uri: csvUri,
      name: fileName,
      type: "text/csv",
    });

    return apiClient.post(`/sections/${section.id}/import-csv/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async function handleImportCsv(section) {
    try {
      setImportingSectionId(section.id);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error("Could not read selected CSV file.");
      }

      const response = await uploadCsvForSection(
        section,
        asset.uri,
        asset.name || `${section.courseCode}-${section.name}.csv`
      );

      await refreshClasses();
      setRosters((prev) => {
        const next = { ...prev };
        delete next[section.id];
        return next;
      });
      Alert.alert(
        "CSV Imported",
        `${response.data.created || 0} created, ${response.data.updated || 0} updated, ${response.data.skipped || 0} skipped.`
      );
    } catch (importError) {
      Alert.alert(
        "Unable to import CSV",
        importError.response?.data?.error || importError.response?.data?.detail || importError.message || "Please try again."
      );
    } finally {
      setImportingSectionId((current) => (current === section.id ? null : current));
    }
  }

  function openManualEntry(section) {
    setManualSection(section);
    setManualNames("");
    setManualProgram(section.courseCode || "");
    setManualYearLevel("1");
    setManualVisible(true);
  }

  async function handleSubmitManual() {
    if (!manualSection) {
      return;
    }

    const lineCount = manualNames
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean).length;

    if (!lineCount) {
      Alert.alert("Missing names", "Enter at least one student name, one per line.");
      return;
    }

    try {
      setManualLoading(true);
      const built = buildManualCsv(manualSection);
      const filePath = `${FileSystem.cacheDirectory}manual-${manualSection.id}-${Date.now()}.csv`;

      await FileSystem.writeAsStringAsync(filePath, built.csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const response = await uploadCsvForSection(
        manualSection,
        filePath,
        `manual-${manualSection.courseCode}-${manualSection.name}.csv`
      );

      await refreshClasses();
      setRosters((prev) => {
        const next = { ...prev };
        delete next[manualSection.id];
        return next;
      });

      setManualVisible(false);
      Alert.alert(
        "Students Imported",
        `${built.rowCount} names prepared. ${response.data.created || 0} created, ${response.data.updated || 0} updated, ${response.data.skipped || 0} skipped.`
      );
    } catch (manualError) {
      Alert.alert(
        "Unable to import manual list",
        manualError.response?.data?.error || manualError.response?.data?.detail || manualError.message || "Please try again."
      );
    } finally {
      setManualLoading(false);
    }
  }

  function handleOpenImport(section) {
    if (!section.isActive || importingSectionId) {
      return;
    }

    setImportChoiceSection(section);
    setImportChoiceVisible(true);
  }

  return (
    <AppScreen
      eyebrow="Faculty Portal"
      title="My Classes"
      subtitle="View only the sections assigned to you. Active classes are actionable, while inactive classes stay visible for reference only."
      showMeta={false}
      enableScrollTopButton={true}
    >
      <InfoCard title="View Mode">
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setViewMode("card")}
            style={[styles.segmentButton, viewMode === "card" ? styles.segmentActive : null]}
          >
            <Text style={[styles.segmentText, viewMode === "card" ? styles.segmentTextActive : null]}>
              Card View
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode("list")}
            style={[styles.segmentButton, viewMode === "list" ? styles.segmentActive : null]}
          >
            <Text style={[styles.segmentText, viewMode === "list" ? styles.segmentTextActive : null]}>
              List View
            </Text>
          </Pressable>
        </View>
      </InfoCard>

      <InfoCard title="Search & Filters">
        <TextInput
          onChangeText={setQuery}
          placeholder="Course, section, year, or student"
          placeholderTextColor={colors.darkAlt}
          style={styles.input}
          value={query}
        />

        <View style={styles.filterStack}>
          <View>
            <Text style={styles.filterLabel}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <FilterChip
                label="Active Only"
                selected={statusFilter === "active"}
                onPress={() => setStatusFilter("active")}
              />
              <FilterChip
                label="All Classes"
                selected={statusFilter === "all"}
                onPress={() => setStatusFilter("all")}
              />
              <FilterChip
                label="Inactive Only"
                selected={statusFilter === "inactive"}
                onPress={() => setStatusFilter("inactive")}
              />
            </ScrollView>
          </View>

          <View>
            <Text style={styles.filterLabel}>Course</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {filterOptions.courses.map((course) => (
                <FilterChip
                  key={course}
                  label={course}
                  selected={selectedCourse === course}
                  onPress={() => setSelectedCourse(course)}
                />
              ))}
            </ScrollView>
          </View>

          <View>
            <Text style={styles.filterLabel}>School Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {filterOptions.schoolYears.map((year) => (
                <FilterChip
                  key={year}
                  label={year}
                  selected={selectedYear === year}
                  onPress={() => setSelectedYear(year)}
                />
              ))}
            </ScrollView>
          </View>

          <View>
            <Text style={styles.filterLabel}>Section</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {filterOptions.sectionNames.map((sectionName) => (
                <FilterChip
                  key={sectionName}
                  label={sectionName}
                  selected={selectedSection === sectionName}
                  onPress={() => setSelectedSection(sectionName)}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.helperText}>
            Showing <Text style={styles.helperStrong}>{filteredClasses.length}</Text> of{" "}
            <Text style={styles.helperStrong}>{classes.length}</Text> assigned classes
          </Text>
          <Text style={styles.helperText}>
            Active: <Text style={styles.helperStrong}>{activeCount}</Text>  Inactive:{" "}
            <Text style={styles.helperStrong}>{inactiveCount}</Text>
          </Text>
        </View>

        <Pressable onPress={resetFilters} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset Filters</Text>
        </Pressable>
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
          <Text style={styles.helperText}>Try adjusting or clearing your filters.</Text>
        </InfoCard>
      ) : viewMode === "card" ? (
        filteredClasses.map((item) => {
          const isExpanded = expandedId === item.id;
          const roster = rosters[item.id] || [];
          const isLoadingRoster = rosterLoadingId === item.id;

          return (
            <InfoCard key={item.id}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  <Text style={styles.codeBadge}>{item.courseCode}</Text>
                  <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusBadgeText, item.isActive ? styles.statusActiveText : styles.statusInactiveText]}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.courseName}>{item.courseName}</Text>
                <Text style={styles.sectionName}>{item.name}</Text>
              </View>

              <View style={styles.metaGrid}>
                <Text style={styles.metaText}>{item.semester}</Text>
                <Text style={styles.metaText}>{item.academicYear}</Text>
                <Text style={styles.metaText}>{item.studentCount} students</Text>
              </View>

              <Pressable
                disabled={!item.isActive}
                onPress={() => handleOpenImport(item)}
                style={[
                  styles.importButton,
                  !item.isActive ? styles.importButtonDisabled : null,
                  importingSectionId === item.id ? styles.importButtonBusy : null,
                ]}
              >
                <Text
                  style={[
                    styles.importButtonText,
                    !item.isActive ? styles.importButtonTextDisabled : null,
                  ]}
                >
                  {item.isActive
                    ? importingSectionId === item.id
                      ? "Importing..."
                      : "Import Students"
                    : "View Only"}
                </Text>
              </Pressable>

              <Pressable onPress={() => handleToggle(item.id)} style={styles.viewStudentsButton}>
                <Text style={styles.viewStudentsText}>
                  {isExpanded ? "Hide Students" : "View Students"}
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
                          <Text style={styles.studentId}>{student.studentId || student.id}</Text>
                          <Text style={styles.studentName}>{student.name}</Text>
                          {"studentId" in student ? (
                            <Text style={styles.studentMeta}>
                              {[student.program, student.yearLevel ? `Year ${student.yearLevel}` : ""]
                                .filter(Boolean)
                                .join(" | ")}
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
      ) : (
        filteredClasses.map((item) => {
          const isExpanded = expandedId === item.id;
          const roster = rosters[item.id] || [];
          const isLoadingRoster = rosterLoadingId === item.id;

          return (
            <InfoCard key={item.id}>
              <View style={styles.listRowTop}>
                <View style={styles.listTitleWrap}>
                  <Text style={styles.listCourseCode}>{item.courseCode}</Text>
                  <Text style={styles.listCourseName}>{item.courseName}</Text>
                  <Text style={styles.listSection}>{item.name}</Text>
                </View>
                <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
                  <Text style={[styles.statusBadgeText, item.isActive ? styles.statusActiveText : styles.statusInactiveText]}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              <Text style={styles.listMetaLine}>
                {item.semester}  |  {item.academicYear}  |  {item.studentCount} students
              </Text>

              <Pressable onPress={() => handleToggle(item.id)} style={styles.listToggleButton}>
                <Text style={styles.listToggleButtonText}>
                  {isExpanded ? "Hide Students" : "View Students"}
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

      <Modal
        animationType="fade"
        transparent
        visible={importChoiceVisible}
        onRequestClose={() => setImportChoiceVisible(false)}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.choiceCard}>
            <Text style={styles.choiceTitle}>Import Students</Text>
            <Text style={styles.choiceSubtitle}>
              {importChoiceSection
                ? `${importChoiceSection.courseCode} • ${importChoiceSection.name}`
                : "Choose how you want to import students."}
            </Text>

            <View style={styles.choiceButtonStack}>
              <Pressable
                style={styles.choicePrimaryButton}
                onPress={() => {
                  if (!importChoiceSection) return;
                  setImportChoiceVisible(false);
                  handleImportCsv(importChoiceSection);
                }}
              >
                <Text style={styles.choicePrimaryButtonText}>Import via CSV File</Text>
              </Pressable>

              <Pressable
                style={styles.choiceSecondaryButton}
                onPress={() => {
                  if (!importChoiceSection) return;
                  setImportChoiceVisible(false);
                  openManualEntry(importChoiceSection);
                }}
              >
                <Text style={styles.choiceSecondaryButtonText}>Import Names Manually</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.choiceCancelButton}
              onPress={() => setImportChoiceVisible(false)}
            >
              <Text style={styles.choiceCancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={manualVisible} onRequestClose={() => setManualVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Manual Student Import</Text>
            <Text style={styles.modalSubtitle}>
              {manualSection
                ? `${manualSection.courseCode} • ${manualSection.name}`
                : "Enter students one per line."}
            </Text>

            <Text style={styles.modalLabel}>Student names (one per line)</Text>
            <TextInput
              multiline
              onChangeText={setManualNames}
              placeholder="Juan Dela Cruz&#10;Maria Santos"
              placeholderTextColor={colors.gray}
              style={styles.modalMultilineInput}
              textAlignVertical="top"
              value={manualNames}
            />

            <Text style={styles.modalLabel}>Program</Text>
            <TextInput
              onChangeText={setManualProgram}
              placeholder="BS Computer Engineering"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
              value={manualProgram}
            />

            <Text style={styles.modalLabel}>Year level</Text>
            <View style={styles.yearChipRow}>
              {["1", "2", "3", "4"].map((year) => (
                <Pressable
                  key={year}
                  onPress={() => setManualYearLevel(year)}
                  style={[styles.yearChip, manualYearLevel === year ? styles.yearChipSelected : null]}
                >
                  <Text
                    style={[
                      styles.yearChipText,
                      manualYearLevel === year ? styles.yearChipTextSelected : null,
                    ]}
                  >
                    Year {year}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => {
                  if (!manualLoading) {
                    setManualVisible(false);
                  }
                }}
                style={styles.modalSecondaryButton}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSubmitManual} style={styles.modalPrimaryButton}>
                <Text style={styles.modalPrimaryButtonText}>
                  {manualLoading ? "Importing..." : "Import Now"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

function FilterChip({ label, onPress, selected }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected ? styles.chipSelected : null]}>
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segmentedControl: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: colors.dark,
  },
  segmentText: {
    color: colors.gray,
    fontSize: 13,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: colors.yellow,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 15,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  filterStack: {
    gap: 12,
    marginBottom: 10,
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
    paddingRight: 6,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  chipText: {
    color: colors.darkAlt,
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: colors.yellow,
  },
  statRow: {
    gap: 4,
    marginTop: 4,
  },
  helperText: {
    color: colors.gray,
    fontSize: 13,
  },
  helperStrong: {
    color: colors.dark,
    fontWeight: "800",
  },
  resetButton: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 999,
    marginTop: 12,
    paddingVertical: 10,
  },
  resetButtonText: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: "700",
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
  cardHeader: {
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
  codeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF7D6",
    borderRadius: 8,
    color: "#B26B00",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusActive: {
    backgroundColor: "#DCFCE7",
  },
  statusInactive: {
    backgroundColor: "#E5E7EB",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusActiveText: {
    color: "#166534",
  },
  statusInactiveText: {
    color: "#4B5563",
  },
  courseName: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  sectionName: {
    color: colors.gray,
    fontSize: 13,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  metaText: {
    color: colors.darkAlt,
    fontSize: 12,
  },
  importButton: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 999,
    marginBottom: 10,
    paddingVertical: 11,
  },
  importButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
  importButtonBusy: {
    opacity: 0.7,
  },
  importButtonText: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: "700",
  },
  importButtonTextDisabled: {
    color: colors.gray,
  },
  viewStudentsButton: {
    alignItems: "center",
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  viewStudentsText: {
    color: "#B26B00",
    fontSize: 12,
    fontWeight: "700",
  },
  listRowTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  listTitleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  listCourseCode: {
    color: "#B26B00",
    fontSize: 11,
    fontWeight: "800",
  },
  listCourseName: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  listSection: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 2,
  },
  listMetaLine: {
    color: colors.darkAlt,
    fontSize: 12,
    marginBottom: 10,
  },
  listToggleButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF7D6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listToggleButtonText: {
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
  modalBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdropCenter: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  choiceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    width: "100%",
  },
  choiceTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
  },
  choiceSubtitle: {
    color: colors.gray,
    fontSize: 13,
    marginTop: 6,
  },
  choiceButtonStack: {
    gap: 10,
    marginTop: 16,
  },
  choicePrimaryButton: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 999,
    paddingVertical: 13,
  },
  choicePrimaryButtonText: {
    color: colors.yellow,
    fontSize: 14,
    fontWeight: "800",
  },
  choiceSecondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 13,
  },
  choiceSecondaryButtonText: {
    color: colors.darkAlt,
    fontSize: 14,
    fontWeight: "700",
  },
  choiceCancelButton: {
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 10,
  },
  choiceCancelButtonText: {
    color: colors.gray,
    fontSize: 13,
    fontWeight: "700",
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    maxHeight: "88%",
    paddingBottom: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  modalTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: colors.gray,
    fontSize: 13,
    marginTop: 6,
  },
  modalLabel: {
    color: colors.darkAlt,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 14,
    textTransform: "uppercase",
  },
  modalInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalMultilineInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 14,
    maxHeight: 220,
    minHeight: 120,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  yearChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  yearChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  yearChipSelected: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  yearChipText: {
    color: colors.darkAlt,
    fontSize: 12,
    fontWeight: "700",
  },
  yearChipTextSelected: {
    color: colors.yellow,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  modalSecondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 11,
  },
  modalSecondaryButtonText: {
    color: colors.darkAlt,
    fontSize: 13,
    fontWeight: "700",
  },
  modalPrimaryButton: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 999,
    flex: 1,
    paddingVertical: 11,
  },
  modalPrimaryButtonText: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: "800",
  },
});
