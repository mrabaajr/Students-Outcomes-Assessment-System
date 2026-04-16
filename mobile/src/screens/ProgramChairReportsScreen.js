import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import StatCard from "../components/ui/StatCard";
import { fetchReportsDashboard } from "../services/reportsMobile";
import { colors } from "../theme/colors";

function getFlattenedReportRows(data) {
  if (!data) return [];

  const rows = [];

  (data.course_summary || []).forEach((course) => {
    rows.push({
      type: "Program Summary",
      code: course.code,
      title: course.name,
      detail: course.instructor,
      instructor: course.instructor,
      students: course.students ?? "",
      average: course.avg ?? 0,
      passRate: course.pass_rate ?? 0,
      conclusion: "",
      schoolYear: "",
      course: course.code,
      section: "",
    });
  });

  return rows;
}

function buildPdfHtml({ metrics, rows }) {
  const cards = metrics
    .map(
      (metric) => `
        <div class="metric">
          <div class="metric-label">${metric.label}</div>
          <div class="metric-value">${metric.value}</div>
          <div class="metric-sub">${metric.sublabel}</div>
        </div>`
    )
    .join("");

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${row.type}</td>
          <td>${row.code}</td>
          <td>${row.title}</td>
          <td>${row.detail || ""}</td>
          <td>${row.students || ""}</td>
          <td>${row.average || 0}</td>
        </tr>`
    )
    .join("");

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          .sub { margin: 0 0 18px; color: #6b7280; }
          .grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
          .metric { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; width: 220px; }
          .metric-label { color: #6b7280; font-size: 12px; font-weight: 700; text-transform: uppercase; }
          .metric-value { font-size: 22px; font-weight: 800; margin-top: 8px; }
          .metric-sub { color: #4b5563; font-size: 12px; margin-top: 4px; }
          table { border-collapse: collapse; width: 100%; margin-top: 18px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #f9fafb; }
          .section { margin-top: 14px; font-size: 16px; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>Program Chair Reports</h1>
        <p class="sub">Program Performance Summary</p>
        <div class="grid">${cards}</div>
        <div class="section">Export Snapshot</div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Code</th>
              <th>Title</th>
              <th>Detail</th>
              <th>Students</th>
              <th>Average</th>
            </tr>
          </thead>
          <tbody>${tableRows || "<tr><td colspan='6'>No report rows available.</td></tr>"}</tbody>
        </table>
      </body>
    </html>
  `;
}

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

export default function ProgramChairReportsScreen({ navigation }) {
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

  const exportRows = useMemo(() => getFlattenedReportRows(data), [data]);

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

  function handleExportPdf() {
    try {
      if (!metricCards.length) {
        Alert.alert("No data to export", "Load report data before exporting a PDF.");
        return;
      }

      const html = buildPdfHtml({ metrics: metricCards, rows: exportRows });
      
      Print.printToFileAsync({ html }).then((pdf) => {
        if (Sharing.isAvailableAsync()) {
          Sharing.shareAsync(pdf.uri, {
            mimeType: "application/pdf",
            dialogTitle: "Export summary PDF",
          });
        } else {
          Alert.alert("Export ready", "PDF file was created, but sharing is not available on this device.");
        }
      }).catch((exportError) => {
        Alert.alert("PDF export failed", exportError.message || "Unable to export summary PDF.");
      });
    } catch (exportError) {
      Alert.alert("PDF export failed", exportError.message || "Unable to export summary PDF.");
    }
  }

  function handleViewPastReports() {
    navigation.navigate("ProgramChairPastReports");
  }

  return (
    <AppScreen
      eyebrow="Reports & Analytics"
      title={"Assessment Reports\n& Performance Summary"}
      subtitle="Overview of student outcomes and course performance across selected filters."
      enableScrollTopButton={true}
      heroFooter={
        <View style={styles.heroFooterWrap}>
          <View style={styles.heroActionsTop}>
            <Pressable onPress={handleViewPastReports} style={styles.heroSecondaryAction}>
              <Text style={styles.heroSecondaryActionText}>View Past Reports</Text>
            </Pressable>
            <Pressable onPress={handleExportPdf} style={styles.heroPrimaryAction}>
              <Text style={styles.heroPrimaryActionText}>Export as PDF</Text>
            </Pressable>
          </View>
        </View>
      }
    >
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
          <InfoCard title="Filters">
            <View style={styles.filterStack}>
              <View style={styles.filterBlock}>
                <Text style={styles.filterBlockLabel}>Student Outcomes</Text>
                <View style={styles.soChipRow}>
                  {(data?.filter_options?.student_outcomes || []).map((outcome) => {
                    const isSelected = String(filters.outcome) === String(outcome.id);
                    return (
                      <Pressable
                        key={outcome.id}
                        onPress={() => setFilters((prev) => ({ ...prev, outcome: isSelected ? "" : String(outcome.id) }))}
                        style={[styles.soChip, isSelected ? styles.soChipActive : null]}
                      >
                        <Text style={[styles.soChipText, isSelected ? styles.soChipTextActive : null]}>
                          SO {outcome.number}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

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
                label="School Year"
                onPress={() => openFilterPicker("schoolYear")}
                value={reportFilterConfigs.schoolYear.displayValue}
              />
            </View>
          </InfoCard>

          <View style={styles.statsGrid}>
            {metricCards.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </View>

          <InfoCard title="Assessment Results">
                {(data.so_summary_tables || []).length === 0 ? (
                  <Text style={styles.mutedText}>No SO summary tables available for the selected filters.</Text>
                ) : (
                  (data.so_summary_tables || []).map((table) => (
                    <View key={`table-${table.so_id}`} style={styles.assessmentResultsBlock}>
                      <View style={styles.assessmentHeader}>
                        <Text style={styles.assessmentTitle}>Summary Result of Direct Assessment</Text>
                        <Text style={styles.assessmentSubtitle}>SO {table.so_number}: {table.so_title}</Text>
                      </View>

                      <View style={styles.assessmentSection}>
                        <Text style={styles.assessmentSectionLabel}>Course Overview</Text>
                        <View style={styles.assessmentTable}>
                          <View style={styles.assessmentTableRow}>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>Course</Text>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>Class Size</Text>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>% GU</Text>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>Assessed</Text>
                          </View>
                          <View style={styles.assessmentTableRow}>
                            <Text style={styles.assessmentTableCell}>{table.program}</Text>
                            <Text style={styles.assessmentTableCell}>{table.totals?.class_size ?? "-"}</Text>
                            <Text style={styles.assessmentTableCell}>{table.totals?.percent_gu ?? "-"}%</Text>
                            <Text style={styles.assessmentTableCell}>{table.totals?.students_assessed ?? 0}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.assessmentSection}>
                        <Text style={styles.assessmentSectionLabel}>Program Objectives Performance</Text>
                        <View style={styles.assessmentIndicators}>
                          <View style={styles.assessmentIndicatorRow}>
                            <Text style={[styles.assessmentIndicatorCell, styles.assessmentTableHeader]}>Indicator</Text>
                            <Text style={[styles.assessmentIndicatorCell, styles.assessmentTableHeader]}>Met</Text>
                            <Text style={[styles.assessmentIndicatorCell, styles.assessmentTableHeader]}>%</Text>
                          </View>
                          {(table.indicators || []).map((indicator, idx) => (
                            <View key={`ind-${idx}`} style={styles.assessmentIndicatorRow}>
                              <Text style={styles.assessmentIndicatorCell}>P{idx + 1}</Text>
                              <Text style={styles.assessmentIndicatorCell}>{indicator.met ?? 0}</Text>
                              <Text style={styles.assessmentIndicatorCell}>{indicator.percent ?? 0}%</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <View style={styles.assessmentSection}>
                        <Text style={styles.assessmentSectionLabel}>Attainment Summary</Text>
                        <View style={styles.attainmentBox}>
                          <View style={styles.attainmentRow}>
                            <Text style={styles.attainmentLabel}>Attainment:</Text>
                            <Text style={styles.attainmentValue}>{table.totals?.attainment_percent ?? 0}%</Text>
                          </View>
                          <View style={styles.attainmentRow}>
                            <Text style={styles.attainmentLabel}>Target Level:</Text>
                            <Text style={styles.attainmentValue}>{table.totals?.target_level ?? 80}%</Text>
                          </View>
                          <View style={styles.attainmentRow}>
                            <Text style={styles.attainmentLabel}>Status:</Text>
                            <Text style={[styles.attainmentValue, (table.totals?.attainment_percent ?? 0) >= (table.totals?.target_level ?? 80) ? styles.attainmentMet : styles.attainmentNotMet]}>
                              {(table.totals?.attainment_percent ?? 0) >= (table.totals?.target_level ?? 80) ? "Met" : "Below Target"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {table.totals?.conclusion ? (
                        <View style={styles.assessmentSection}>
                          <Text style={styles.assessmentSectionLabel}>Conclusion</Text>
                          <Text style={styles.conclusionText}>{table.totals.conclusion}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))
                )}
              </InfoCard>

              <InfoCard title="SO Average Performance">
                {(data.so_performance || []).length === 0 ? (
                  <Text style={styles.mutedText}>No SO performance data available.</Text>
                ) : (
                  <View style={styles.chartContainer}>
                    <View style={styles.barChartRow}>
                      {(data.so_performance || []).map((item) => {
                        const maxValue = 100;
                        const itemHeight = ((item.avg ?? 0) / maxValue) * 150;
                        const isMet = (item.avg ?? 0) >= 80;
                        
                        return (
                          <View key={item.id} style={styles.barChartItem}>
                            <View style={styles.barWrapper}>
                              <View
                                style={[
                                  styles.bar,
                                  {
                                    height: itemHeight,
                                    backgroundColor: isMet ? colors.success : colors.danger,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.barLabel}>SO {item.number}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </InfoCard>

              <InfoCard title="SO Summary">
                {(data.so_performance || []).length === 0 ? (
                  <Text style={styles.mutedText}>No SO performance data available.</Text>
                ) : (
                  <View style={styles.summaryTable}>
                    <View style={styles.summaryTableRow}>
                      <Text style={[styles.summaryTableCell, styles.summaryTableHeader, { flex: 1.5 }]}>Name</Text>
                      <Text style={[styles.summaryTableCell, styles.summaryTableHeader]}>Avg</Text>
                      <Text style={[styles.summaryTableCell, styles.summaryTableHeader]}>Pass Rate</Text>
                      <Text style={[styles.summaryTableCell, styles.summaryTableHeader]}>Status</Text>
                    </View>
                    {(data.so_performance || []).map((item, idx) => (
                      <View key={item.id} style={[styles.summaryTableRow, idx < (data.so_performance?.length ?? 0) - 1 && styles.summaryTableRowBorder]}>
                        <Text style={[styles.summaryTableCell, { flex: 1.5 }]}>SO {item.number}</Text>
                        <Text style={styles.summaryTableCell}>{item.avg ?? 0}%</Text>
                        <Text style={styles.summaryTableCell}>{item.pass_rate ?? 0}%</Text>
                        <View style={styles.statusBadgeWrap}>
                          <Text
                            style={[
                              styles.statusBadge,
                              (item.avg ?? 0) >= 80 ? styles.statusBadgeMet : styles.statusBadgeNotMet,
                            ]}
                          >
                            {(item.avg ?? 0) >= 80 ? "✓ Met" : "✗ Not Met"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </InfoCard>
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
  heroFooterWrap: {
    gap: 12,
  },
  heroActionsTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heroPrimaryAction: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heroPrimaryActionText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  heroSecondaryAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heroSecondaryActionText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  filterStack: {
    gap: 10,
  },
  filterBlock: {
    gap: 8,
  },
  filterBlockLabel: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  soChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  soChip: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  soChipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  soChipText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  soChipTextActive: {
    color: colors.yellow,
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
  assessmentResultsBlock: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  assessmentHeader: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    marginBottom: 12,
    paddingBottom: 10,
  },
  assessmentTitle: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "800",
  },
  assessmentSubtitle: {
    color: colors.gray,
    fontSize: 13,
    marginTop: 4,
  },
  assessmentSection: {
    marginBottom: 14,
  },
  assessmentSectionLabel: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  assessmentTable: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  assessmentTableRow: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    flexDirection: "row",
  },
  assessmentTableCell: {
    color: colors.dark,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    padding: 10,
    textAlign: "center",
  },
  assessmentTableHeader: {
    backgroundColor: colors.surface,
    color: colors.gray,
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: 10,
  },
  assessmentIndicators: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  assessmentIndicatorRow: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    flexDirection: "row",
  },
  assessmentIndicatorCell: {
    color: colors.dark,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    padding: 10,
    textAlign: "center",
  },
  attainmentBox: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  attainmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  attainmentLabel: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "700",
  },
  attainmentValue: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  attainmentMet: {
    color: colors.success,
  },
  attainmentNotMet: {
    color: colors.danger,
  },
  conclusionText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  chartContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  barChartRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    width: "100%",
    height: 200,
    gap: 12,
  },
  barChartItem: {
    alignItems: "center",
    flex: 1,
  },
  barWrapper: {
    alignItems: "center",
    height: 150,
    justifyContent: "flex-end",
    width: "100%",
  },
  bar: {
    borderRadius: 4,
    width: "100%",
    minHeight: 10,
  },
  barLabel: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
  },
  summaryTable: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  summaryTableRowBorder: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
  },
  summaryTableCell: {
    color: colors.dark,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  summaryTableHeader: {
    backgroundColor: colors.surface,
    color: colors.gray,
    fontWeight: "800",
    paddingVertical: 10,
    textTransform: "uppercase",
    fontSize: 10,
  },
  statusBadgeWrap: {
    flex: 1,
    alignItems: "center",
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeMet: {
    backgroundColor: "#DCFCE7",
    color: "#15803D",
  },
  statusBadgeNotMet: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
  },
});
