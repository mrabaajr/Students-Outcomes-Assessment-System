import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import StatCard from "../components/ui/StatCard";
import { fetchReportsDashboard } from "../services/reportsMobile";
import { colors } from "../theme/colors";

const DEFAULT_REPORT_FILTERS = {
  schoolYear: "",
  course: "",
  section: "",
  outcome: "",
};

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

function formatListValue(value) {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string" || typeof item === "number") return String(item);
        return String(item.number || item.name || item.code || item.title || "");
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return String(value.number || value.name || value.code || value.title || "");
}

function formatTableNumber(value, fractionDigits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(fractionDigits);
}

function buildSoIndicatorRows(table) {
  const grouped = new Map();

  (table?.courses || []).forEach((course) => {
    (course.indicators || []).forEach((indicator, index) => {
      const key = String(indicator.indicator_id || indicator.indicator_label || index);
      const current = grouped.get(key) || {
        label: indicator.indicator_label || `P${index + 1}`,
        answeredCount: 0,
        satisfactoryCount: 0,
      };

      current.answeredCount += Number(indicator.answered_count) || 0;
      current.satisfactoryCount += Number(indicator.satisfactory_count) || 0;
      grouped.set(key, current);
    });
  });

  return Array.from(grouped.values()).map((row) => ({
    ...row,
    percent:
      row.answeredCount > 0
        ? ((row.satisfactoryCount / row.answeredCount) * 100).toFixed(2)
        : "0.00",
  }));
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
  const [reportLevel, setReportLevel] = useState("course");
  const [filters, setFilters] = useState(DEFAULT_REPORT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [activeFilterKey, setActiveFilterKey] = useState("schoolYear");
  const [editableSoOverview, setEditableSoOverview] = useState({});

  async function loadReports(refresh = false) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const payload = await fetchReportsDashboard(filters);
      setData(payload);
    } catch (loadError) {
      setError(loadError.response?.data?.detail || loadError.message || "Failed to load reports.");
    } finally {
      if (refresh) {
        setRefreshing(false);
      }
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!cancelled) {
        await loadReports();
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  useEffect(() => {
    const nextState = {};
    (data?.so_summary_tables || []).forEach((table, index) => {
      const tableKey = String(table.so_id || table.so_number || index);
      nextState[tableKey] = {
        classSize: String(table.totals?.class_size ?? ""),
        percentCli: String(table.totals?.percent_gu ?? ""),
        studentsAnswered: String(table.totals?.students_assessed ?? ""),
        virtualClassSize: String(table.totals?.virtual_class_size ?? table.totals?.class_size ?? ""),
        program: String(table.program ?? ""),
        sourceAssessment: formatListValue(table.source_assessment || table.sources),
        timeCollection: String(table.time_data_collection || filters.schoolYear || ""),
      };
    });
    setEditableSoOverview(nextState);
  }, [data, filters.schoolYear]);

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

  function clearAllFilters() {
    setFilters(DEFAULT_REPORT_FILTERS);
  }

  function handleSoOverviewEdit(tableKey, field, value) {
    setEditableSoOverview((prev) => ({
      ...prev,
      [tableKey]: {
        ...(prev[tableKey] || {}),
        [field]: value,
      },
    }));
  }

  function handleSoTableReset(table, tableKey) {
    setEditableSoOverview((prev) => ({
      ...prev,
      [tableKey]: {
        ...(prev[tableKey] || {}),
        classSize: String(table.totals?.class_size ?? ""),
        percentCli: String(table.totals?.percent_gu ?? ""),
        studentsAnswered: String(table.totals?.students_assessed ?? ""),
        virtualClassSize: String(table.totals?.virtual_class_size ?? table.totals?.class_size ?? ""),
        program: String(table.program ?? ""),
        sourceAssessment: formatListValue(table.source_assessment || table.sources),
        timeCollection: String(table.time_data_collection || filters.schoolYear || ""),
      },
    }));
  }

  function handleSoTableSave() {
    Alert.alert("Saved", "SO-level edits are saved locally on this mobile view.");
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
      onRefresh={() => loadReports(true)}
      refreshing={refreshing}
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
              <View style={styles.levelToggleRow}>
                <Pressable
                  onPress={() => setReportLevel("so")}
                  style={[styles.levelToggleChip, reportLevel === "so" ? styles.levelToggleChipActive : null]}
                >
                  <Text style={[styles.levelToggleText, reportLevel === "so" ? styles.levelToggleTextActive : null]}>
                    SO Level
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setReportLevel("course")}
                  style={[styles.levelToggleChip, reportLevel === "course" ? styles.levelToggleChipActive : null]}
                >
                  <Text
                    style={[styles.levelToggleText, reportLevel === "course" ? styles.levelToggleTextActive : null]}
                  >
                    Course Level
                  </Text>
                </Pressable>
              </View>

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

              <View style={styles.filterActionsRow}>
                <Pressable onPress={clearAllFilters} style={styles.clearFiltersButton}>
                  <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
                </Pressable>
              </View>
            </View>
          </InfoCard>

          <View style={styles.statsGrid}>
            {metricCards.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </View>

          {reportLevel === "so" ? (
            <>
              <InfoCard title="Assessment Results">
                {(data.so_summary_tables || []).length === 0 ? (
                  <Text style={styles.mutedText}>No SO summary tables available for the selected filters.</Text>
                ) : (
                  (data.so_summary_tables || []).map((table) => (
                    <View key={`table-${table.so_id}`} style={styles.assessmentResultsBlock}>
                      {(() => {
                        const tableKey = String(table.so_id || table.so_number || "");
                        const editable = editableSoOverview[tableKey] || {};
                        const courseRows = table.courses || [];
                        const indicatorRows = buildSoIndicatorRows(table);
                        return (
                          <>
                      <View style={styles.assessmentTopRow}>
                        <Text style={styles.assessmentPill}>SO {table.so_number} Summary</Text>
                        <View style={styles.assessmentTopActions}>
                          <Pressable onPress={() => handleSoTableReset(table, tableKey)} style={styles.assessmentMiniButton}>
                            <Text style={styles.assessmentMiniButtonText}>Reset</Text>
                          </Pressable>
                          <Pressable onPress={handleSoTableSave} style={[styles.assessmentMiniButton, styles.assessmentMiniButtonPrimary]}>
                            <Text style={[styles.assessmentMiniButtonText, styles.assessmentMiniButtonPrimaryText]}>Save</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.assessmentHeader}>
                        <Text style={styles.assessmentTitle}>Summary Result of Direct Assessment</Text>
                        <Text style={styles.assessmentSubtitle}>SO {table.so_number}: {table.so_title}</Text>
                      </View>

                      <View style={styles.assessmentMetaGrid}>
                        <View style={styles.assessmentMetaCol}>
                          <Text style={styles.assessmentMetaLabel}>Program</Text>
                          <TextInput
                            style={styles.assessmentMetaInput}
                            value={editable.program}
                            onChangeText={(value) => handleSoOverviewEdit(tableKey, "program", value)}
                          />
                        </View>
                        <View style={styles.assessmentMetaCol}>
                          <Text style={styles.assessmentMetaLabel}>Source of Assessment</Text>
                          <TextInput
                            style={styles.assessmentMetaInput}
                            value={editable.sourceAssessment}
                            onChangeText={(value) => handleSoOverviewEdit(tableKey, "sourceAssessment", value)}
                          />
                        </View>
                      </View>

                      <View style={styles.assessmentMetaGrid}>
                        <View style={[styles.assessmentMetaCol, styles.assessmentMetaColFull]}>
                          <Text style={styles.assessmentMetaLabel}>Time of Data Collection</Text>
                          <TextInput
                            style={styles.assessmentMetaInput}
                            value={editable.timeCollection}
                            onChangeText={(value) => handleSoOverviewEdit(tableKey, "timeCollection", value)}
                          />
                        </View>
                      </View>

                      <View style={styles.assessmentSection}>
                        <Text style={styles.assessmentSectionLabel}>Course Overview</Text>
                        <View style={styles.assessmentTable}>
                          <View style={styles.assessmentTableRow}>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>Course</Text>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>Class Size</Text>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>% of CLI</Text>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>Students Answered</Text>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>Virtual Class Size</Text>
                          </View>
                          {courseRows.length === 0 ? (
                            <View style={styles.assessmentTableRow}>
                              <Text style={styles.assessmentTableEmpty}>No course overview data available.</Text>
                            </View>
                          ) : (
                            courseRows.map((course) => (
                              <View key={`course-row-${table.so_id}-${course.course_id}`} style={styles.assessmentTableRow}>
                                <Text style={styles.assessmentTableCell}>
                                  {course.course_code || course.course_name || "-"}
                                </Text>
                                <Text style={styles.assessmentTableCell}>
                                  {formatTableNumber(course.actual_class_size, 0)}
                                </Text>
                                <Text style={styles.assessmentTableCell}>
                                  {formatTableNumber((Number(course.cli) || 0) * 100)}%
                                </Text>
                                <Text style={styles.assessmentTableCell}>
                                  {formatTableNumber(course.answered_count, 0)}
                                </Text>
                                <Text style={styles.assessmentTableCell}>
                                  {formatTableNumber(course.virtual_class_size)}
                                </Text>
                              </View>
                            ))
                          )}
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
                          {indicatorRows.length === 0 ? (
                            <View style={styles.assessmentIndicatorRow}>
                              <Text style={styles.assessmentTableEmpty}>No indicator performance data available.</Text>
                            </View>
                          ) : (
                            indicatorRows.map((indicator) => (
                              <View key={`ind-${table.so_id}-${indicator.label}`} style={styles.assessmentIndicatorRow}>
                                <Text style={styles.assessmentIndicatorCell}>{indicator.label}</Text>
                                <Text style={styles.assessmentIndicatorCell}>{indicator.satisfactoryCount}</Text>
                                <Text style={styles.assessmentIndicatorCell}>{indicator.percent}%</Text>
                              </View>
                            ))
                          )}
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
                          </>
                        );
                      })()}
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
            <InfoCard title="Course-Level Summary">
              {(data.course_summary || []).length === 0 ? (
                <Text style={styles.mutedText}>No course-level summary available for the selected filters.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.courseLevelTableWrap}>
                    <View style={styles.courseLevelHeaderRow}>
                      <Text style={[styles.courseLevelHeaderText, styles.courseCodeCol]}>Code</Text>
                      <Text style={[styles.courseLevelHeaderText, styles.courseNameCol]}>Course Name</Text>
                      <Text style={[styles.courseLevelHeaderText, styles.courseInstructorCol]}>Instructor</Text>
                      <Text style={[styles.courseLevelHeaderText, styles.courseLinkedSoCol]}>Linked SOs</Text>
                      <Text style={[styles.courseLevelHeaderText, styles.courseMetricCol]}>Students</Text>
                      <Text style={[styles.courseLevelHeaderText, styles.courseMetricCol]}>Avg Score</Text>
                      <Text style={[styles.courseLevelHeaderText, styles.courseMetricCol]}>Pass Rate</Text>
                    </View>

                    {(data.course_summary || []).map((course, index) => {
                      const linkedOutcomes = course.linked_sos || course.outcomes || [];
                      return (
                        <View
                          key={`course-summary-${course.id || course.code || index}`}
                          style={[styles.courseLevelDataRow, index < (data.course_summary || []).length - 1 ? styles.courseLevelDataRowBorder : null]}
                        >
                          <Text style={[styles.courseLevelCellText, styles.courseCodeCol]}>{course.code || "-"}</Text>
                          <Text style={[styles.courseLevelCellText, styles.courseNameCol]}>{course.name || "-"}</Text>
                          <Text style={[styles.courseLevelCellText, styles.courseInstructorCol]}>{course.instructor || "-"}</Text>
                          <View style={[styles.courseLinkedSoCol, styles.courseLinkedSoWrap]}>
                            {linkedOutcomes.length > 0 ? (
                              linkedOutcomes.map((so, soIndex) => (
                                <View key={`linked-so-${course.id || course.code}-${soIndex}`} style={styles.courseSoTag}>
                                  <Text style={styles.courseSoTagText}>
                                    {typeof so === "string" ? so : `SO ${so.number || so}`}
                                  </Text>
                                </View>
                              ))
                            ) : (
                              <Text style={styles.courseLevelCellMuted}>-</Text>
                            )}
                          </View>
                          <Text style={[styles.courseLevelCellText, styles.courseMetricCol]}>{course.students ?? 0}</Text>
                          <Text style={[styles.courseLevelCellText, styles.courseMetricCol]}>{course.avg ?? 0}%</Text>
                          <Text style={[styles.courseLevelPassRate, styles.courseMetricCol]}>{course.pass_rate ?? 0}%</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
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
  levelToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 2,
  },
  levelToggleChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  levelToggleChipActive: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
  },
  levelToggleText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "700",
  },
  levelToggleTextActive: {
    color: colors.dark,
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
  filterActionsRow: {
    alignItems: "flex-end",
    marginTop: 4,
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
  clearFiltersButton: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clearFiltersButtonText: {
    color: colors.dark,
    fontSize: 12,
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
  courseLevelTableWrap: {
    minWidth: 780,
    borderColor: colors.graySoft,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  courseLevelHeaderRow: {
    backgroundColor: colors.surfaceMuted,
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  courseLevelHeaderText: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  courseLevelDataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
  },
  courseLevelDataRowBorder: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
  },
  courseCodeCol: {
    width: 78,
  },
  courseNameCol: {
    width: 190,
  },
  courseInstructorCol: {
    width: 120,
  },
  courseLinkedSoCol: {
    width: 180,
  },
  courseMetricCol: {
    width: 70,
    textAlign: "center",
  },
  courseLevelCellText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "600",
  },
  courseLevelCellMuted: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "600",
  },
  courseLinkedSoWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  courseSoTag: {
    backgroundColor: "#FFF8E1",
    borderColor: "rgba(255, 194, 14, 0.45)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  courseSoTagText: {
    color: colors.dark,
    fontSize: 10,
    fontWeight: "800",
  },
  courseLevelPassRate: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
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
  assessmentTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  assessmentPill: {
    backgroundColor: "#FFF8E1",
    borderColor: "rgba(255, 194, 14, 0.55)",
    borderRadius: 999,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  assessmentTopActions: {
    flexDirection: "row",
    gap: 6,
  },
  assessmentMiniButton: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  assessmentMiniButtonPrimary: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  assessmentMiniButtonText: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "800",
  },
  assessmentMiniButtonPrimaryText: {
    color: colors.surface,
  },
  assessmentMetaGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  assessmentMetaCol: {
    flex: 1,
    gap: 4,
  },
  assessmentMetaColFull: {
    flex: 1,
  },
  assessmentMetaLabel: {
    color: colors.gray,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  assessmentMetaInput: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  assessmentTableEmpty: {
    color: colors.gray,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    padding: 10,
    textAlign: "center",
  },
  assessmentTableInputCell: {
    flex: 1,
    padding: 6,
  },
  assessmentTableInput: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 6,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 6,
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
