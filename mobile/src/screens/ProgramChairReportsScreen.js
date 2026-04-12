import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import StatCard from "../components/ui/StatCard";
import { fetchReportsDashboard } from "../services/reportsMobile";
import { colors } from "../theme/colors";

function FilterRow({ label, value, onPress }) {
  return (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Pressable style={styles.dropdownButton} onPress={onPress}>
        <Text style={styles.dropdownValue}>{value}</Text>
        <Text style={styles.dropdownChevron}>▾</Text>
      </Pressable>
    </View>
  );
}

export default function ProgramChairReportsScreen() {
  const [reportMode, setReportMode] = useState("so");
  const [filters, setFilters] = useState({
    schoolYear: "",
    course: "",
    section: "",
    outcome: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [activeFilterKey, setActiveFilterKey] = useState("schoolYear");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const payload = await fetchReportsDashboard(filters);
        if (!cancelled) {
          setData(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.response?.data?.detail || loadError.message || "Failed to load reports.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const metricCards = useMemo(() => {
    const metrics = data?.metrics || {};
    return [
      {
        label: "Student Outcomes Assessed",
        value: String(metrics.total_student_outcomes ?? 0),
        sublabel: "Unique outcomes in the filtered report",
        accent: colors.yellow,
      },
      {
        label: "Courses Assessed",
        value: String(metrics.total_courses ?? 0),
        sublabel: "Courses included in this scope",
        accent: colors.info,
      },
      {
        label: "Avg Performance",
        value: `${metrics.avg_performance ?? 0}%`,
        sublabel: `${(metrics.avg_performance ?? 0) >= 80 ? "On target" : "Below target"} against the 80% line`,
        accent: (metrics.avg_performance ?? 0) >= 80 ? colors.success : colors.danger,
      },
      {
        label: "Students Assessed",
        value: String(metrics.total_students ?? 0),
        sublabel: "Distinct students in saved grades",
        accent: colors.yellowAlt,
      },
    ];
  }, [data]);

  const reportFilterConfigs = useMemo(
    () => ({
      schoolYear: {
        label: "School Year",
        value: filters.schoolYear,
        displayValue: filters.schoolYear || "All School Years",
        options: [{ label: "All School Years", value: "" }].concat(
          (data?.filter_options?.school_years || []).map((item) => ({ label: item, value: item }))
        ),
      },
      course: {
        label: "Course",
        value: filters.course,
        displayValue:
          filters.course
            ? (data?.filter_options?.courses || []).find((item) => String(item.id) === String(filters.course))?.code ||
              "Selected Course"
            : "All Courses",
        options: [{ label: "All Courses", value: "" }].concat(
          (data?.filter_options?.courses || []).map((item) => ({
            label: `${item.code} - ${item.name}`,
            value: String(item.id),
          }))
        ),
      },
      section: {
        label: "Section",
        value: filters.section,
        displayValue:
          filters.section
            ? (data?.filter_options?.sections || []).find((item) => String(item.id) === String(filters.section))?.name ||
              "Selected Section"
            : "All Sections",
        options: [{ label: "All Sections", value: "" }].concat(
          (data?.filter_options?.sections || []).map((item) => ({
            label: item.name,
            value: String(item.id),
          }))
        ),
      },
      outcome: {
        label: "Outcome",
        value: filters.outcome,
        displayValue:
          filters.outcome
            ? `SO ${(data?.filter_options?.student_outcomes || []).find(
                (item) => String(item.id) === String(filters.outcome)
              )?.number || ""}`
            : "All Outcomes",
        options: [{ label: "All Outcomes", value: "" }].concat(
          (data?.filter_options?.student_outcomes || []).map((item) => ({
            label: `SO ${item.number}`,
            value: String(item.id),
          }))
        ),
      },
    }),
    [data, filters.course, filters.outcome, filters.schoolYear, filters.section]
  );

  function openFilterPicker(key) {
    setActiveFilterKey(key);
    setFilterPickerVisible(true);
  }

  function handleFilterSelect(value) {
    setFilters((prev) => ({ ...prev, [activeFilterKey]: value }));
    setFilterPickerVisible(false);
  }

  return (
    <AppScreen
      eyebrow="Reports & Analytics"
      title={"Assessment Reports\n& Performance Summary"}
      subtitle="Review student outcome performance and course-level summaries using the same backend reports data as the website."
    >
      <InfoCard title="Report Mode">
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setReportMode("so")}
            style={[styles.modeButton, reportMode === "so" ? styles.modeButtonActive : null]}
          >
            <Text style={[styles.modeButtonText, reportMode === "so" ? styles.modeButtonTextActive : null]}>
              SO Level
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setReportMode("course")}
            style={[styles.modeButton, reportMode === "course" ? styles.modeButtonActive : null]}
          >
            <Text style={[styles.modeButtonText, reportMode === "course" ? styles.modeButtonTextActive : null]}>
              Course Level
            </Text>
          </Pressable>
        </View>
      </InfoCard>

      <InfoCard title="Filters">
        <View style={styles.filterStack}>
          <FilterRow
            label="School Year"
            onPress={() => openFilterPicker("schoolYear")}
            value={reportFilterConfigs.schoolYear.displayValue}
          />
          <FilterRow
            label="Course"
            onPress={() => openFilterPicker("course")}
            value={reportFilterConfigs.course.displayValue}
          />
          <FilterRow
            label="Section"
            onPress={() => openFilterPicker("section")}
            value={reportFilterConfigs.section.displayValue}
          />
          <FilterRow
            label="Outcome"
            onPress={() => openFilterPicker("outcome")}
            value={reportFilterConfigs.outcome.displayValue}
          />
        </View>
      </InfoCard>

      {loading ? (
        <InfoCard title="Loading">
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.yellow} />
            <Text style={styles.mutedText}>Loading report data...</Text>
          </View>
        </InfoCard>
      ) : error ? (
        <InfoCard title="Error">
          <Text style={styles.errorText}>{error}</Text>
        </InfoCard>
      ) : data ? (
        <>
          <View style={styles.statsGrid}>
            {metricCards.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </View>

          {reportMode === "so" ? (
            <>
              <InfoCard title="SO Summary Tables">
                {(data.so_summary_tables || []).length === 0 ? (
                  <Text style={styles.mutedText}>No SO summary tables available for the selected filters.</Text>
                ) : (
                  (data.so_summary_tables || []).map((table) => (
                    <View key={`table-${table.so_id}`} style={styles.reportCard}>
                      <Text style={styles.reportTitle}>SO {table.so_number}</Text>
                      <Text style={styles.reportSubtitle}>{table.so_title}</Text>
                      <Text style={styles.reportMeta}>Program: {table.program}</Text>
                      <Text style={styles.reportMeta}>Source: {table.source_assessment}</Text>
                      <Text style={styles.reportMeta}>
                        Attainment: {table.totals?.attainment_percent ?? 0}% • Target: {table.totals?.target_level ?? 80}%
                      </Text>
                      <Text style={styles.reportConclusion}>{table.totals?.conclusion}</Text>
                    </View>
                  ))
                )}
              </InfoCard>

              <InfoCard title="SO Performance">
                {(data.so_performance || []).length === 0 ? (
                  <Text style={styles.mutedText}>No SO performance data available.</Text>
                ) : (
                  (data.so_performance || []).map((item) => (
                    <View key={item.id} style={styles.performanceRow}>
                      <View style={styles.performanceMain}>
                        <Text style={styles.performanceTitle}>SO {item.number}</Text>
                        <Text style={styles.performanceSubtitle}>{item.name}</Text>
                      </View>
                      <View style={styles.performanceRight}>
                        <Text style={styles.performanceValue}>{item.avg}%</Text>
                        <Text style={[styles.performanceStatus, item.met ? styles.performanceMet : styles.performanceNotMet]}>
                          {item.met ? "Met" : "Not Met"}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </InfoCard>
            </>
          ) : (
            <InfoCard title="Course-Level Summary">
              {(data.course_summary || []).length === 0 ? (
                <Text style={styles.mutedText}>No course data available. Save assessments first.</Text>
              ) : (
                (data.course_summary || []).map((course) => (
                  <View key={course.code} style={styles.reportCard}>
                    <Text style={styles.reportTitle}>{course.code}</Text>
                    <Text style={styles.reportSubtitle}>{course.name}</Text>
                    <Text style={styles.reportMeta}>Instructor: {course.instructor}</Text>
                    <Text style={styles.reportMeta}>
                      Students: {course.students} • Avg: {course.avg}% • Pass rate: {course.pass_rate}%
                    </Text>
                    <View style={styles.courseSoRow}>
                      {(course.sos || []).map((so) => (
                        <View key={`${course.code}-so-${so}`} style={styles.mappedPill}>
                          <Text style={styles.mappedPillText}>SO {so}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </InfoCard>
          )}
        </>
      ) : (
        <InfoCard title="Reports">
          <Text style={styles.mutedText}>No report data available.</Text>
        </InfoCard>
      )}

      <Modal animationType="fade" transparent visible={filterPickerVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{reportFilterConfigs[activeFilterKey]?.label || "Select"}</Text>
              <Pressable onPress={() => setFilterPickerVisible(false)} style={styles.pickerCloseButton}>
                <Text style={styles.pickerCloseText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.pickerList}>
              {(reportFilterConfigs[activeFilterKey]?.options || []).map((option) => {
                const selected = String(reportFilterConfigs[activeFilterKey]?.value || "") === String(option.value);
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

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeButton: {
    backgroundColor: colors.darkAlt,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  modeButtonActive: {
    backgroundColor: colors.yellow,
  },
  modeButtonText: {
    color: colors.gray,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  modeButtonTextActive: {
    color: colors.dark,
  },
  filterStack: {
    gap: 10,
  },
  filterRow: {
    gap: 6,
  },
  filterLabel: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
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
    paddingVertical: 10,
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
  modalOverlay: {
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
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  reportCard: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    marginBottom: 14,
    paddingBottom: 14,
  },
  reportTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
  },
  reportSubtitle: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  reportMeta: {
    color: colors.gray,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  reportConclusion: {
    color: colors.dark,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  performanceRow: {
    alignItems: "center",
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
  },
  performanceMain: {
    flex: 1,
  },
  performanceTitle: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "800",
  },
  performanceSubtitle: {
    color: colors.gray,
    fontSize: 13,
    marginTop: 4,
  },
  performanceRight: {
    alignItems: "flex-end",
  },
  performanceValue: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
  },
  performanceStatus: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  performanceMet: {
    color: colors.success,
  },
  performanceNotMet: {
    color: colors.danger,
  },
  courseSoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
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
});
