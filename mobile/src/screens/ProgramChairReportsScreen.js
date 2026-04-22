import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import StatCard from "../components/ui/StatCard";
import { fetchReportsDashboard, saveSummaryTable } from "../services/reportsMobile";
import { colors } from "../theme/colors";

const DEFAULT_REPORT_FILTERS = {
  schoolYear: "",
  course: "",
  section: "",
  outcome: "",
};

const DEFAULT_FORMULA = "(got80OrHigher / studentsAnswered) * distribution";
const DEFAULT_VARIABLES = [
  { key: "distribution", label: "Distribution (i)" },
  { key: "studentsAnswered", label: "Students Answered" },
  { key: "got80OrHigher", label: "Got 80% or Higher" },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const targetStatement = (target) => `${target}% of the class gets satisfactory rating or higher`;
const conclusionText = (attainment, target) =>
  `${attainment.toFixed(2)}% of the class got satisfactory rating or higher. Thus, the level of attainment is ${attainment >= target ? "higher than" : "lower than"} the target level of ${target}%.`;

function evaluateFormula(formula, variables, values) {
  let expression = (formula || DEFAULT_FORMULA).trim();
  (variables.length ? variables : DEFAULT_VARIABLES).forEach((variable) => {
    expression = expression.replace(
      new RegExp(`\\b${escapeRegExp(variable.key)}\\b`, "g"),
      `(${num(values[variable.key])})`
    );
  });
  if (/[A-Za-z_]/.test(expression) || !/^[0-9+\-*/().\s]+$/.test(expression)) {
    return 0;
  }
  try {
    const result = Function(`"use strict"; return (${expression});`)();
    return Number.isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

function recalculateTable(table, formula, variables) {
  const next = clone(table);
  const previousTotals = next.totals || {};
  const target = num(previousTotals.target_level, 80);
  const previousAutoConclusion = conclusionText(num(previousTotals.attainment_percent, 0), target);
  const previousAutoTarget = targetStatement(target);

  next.courses = (next.courses || []).map((course) => {
    const actual = num(course.actual_class_size);
    const cli = num(course.cli);
    const indicators = (course.indicators || []).map((indicator) => {
      const runtimeValues = {
        distribution: num(indicator.distribution),
        studentsAnswered: num(indicator.answered_count),
        got80OrHigher: num(indicator.satisfactory_count),
      };
      variables
        .filter((variable) => !DEFAULT_VARIABLES.some((item) => item.key === variable.key))
        .forEach((variable) => {
          runtimeValues[variable.key] = num(indicator[variable.key]);
        });
      return {
        ...indicator,
        weighted_value: Number(evaluateFormula(formula, variables, runtimeValues).toFixed(4)),
      };
    });
    const weightedTotal = indicators.reduce((sum, indicator) => sum + num(indicator.weighted_value), 0);
    return {
      ...course,
      actual_class_size: actual,
      cli,
      answered_count: num(course.answered_count),
      virtual_class_size: Number((actual * cli).toFixed(4)),
      weighted_total: Number(weightedTotal.toFixed(4)),
      indicators,
    };
  });

  const virtualTotal = next.courses.reduce((sum, course) => sum + num(course.virtual_class_size), 0);
  const weightedTotal = next.courses.reduce(
    (sum, course) => sum + (num(course.weighted_total) * num(course.cli)),
    0
  );
  const actualTotal = next.courses.reduce((sum, course) => sum + num(course.actual_class_size), 0);
  const attainment = virtualTotal > 0 ? Number(((weightedTotal / virtualTotal) * 100).toFixed(2)) : 0;
  const nextConclusion = conclusionText(attainment, target);
  const nextTarget = targetStatement(target);

  next.totals = {
    ...previousTotals,
    actual_student_total: actualTotal,
    virtual_class_size_total: Number(virtualTotal.toFixed(4)),
    weighted_satisfactory_total: Number(weightedTotal.toFixed(4)),
    attainment_percent: attainment,
    target_level: target,
    target_statement:
      !previousTotals.target_statement || previousTotals.target_statement === previousAutoTarget
        ? nextTarget
        : previousTotals.target_statement,
    conclusion:
      !previousTotals.conclusion || previousTotals.conclusion === previousAutoConclusion
        ? nextConclusion
        : previousTotals.conclusion,
  };
  next.formula = formula;
  next.variables = variables;
  return next;
}

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
  const [draftTables, setDraftTables] = useState({});
  const [savingTableKey, setSavingTableKey] = useState("");

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
      nextState[tableKey] = recalculateTable(
        {
          ...table,
          program: table.program ?? "",
          source_assessment: formatListValue(table.source_assessment || table.sources),
          time_of_data_collection: table.time_of_data_collection || table.time_data_collection || filters.schoolYear || "",
        },
        table.formula || DEFAULT_FORMULA,
        table.variables?.length ? table.variables : DEFAULT_VARIABLES
      );
    });
    setDraftTables(nextState);
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

  function updateDraftTable(tableKey, updater) {
    setDraftTables((prev) => {
      const current = prev[tableKey];
      if (!current) return prev;
      const nextTable = typeof updater === "function" ? updater(clone(current)) : updater;
      return {
        ...prev,
        [tableKey]: recalculateTable(
          nextTable,
          nextTable.formula || DEFAULT_FORMULA,
          nextTable.variables?.length ? nextTable.variables : DEFAULT_VARIABLES
        ),
      };
    });
  }

  function handleSoTableReset(table, tableKey) {
    setDraftTables((prev) => ({
      ...prev,
      [tableKey]: recalculateTable(
        {
          ...table,
          program: table.program ?? "",
          source_assessment: formatListValue(table.source_assessment || table.sources),
          time_of_data_collection: table.time_of_data_collection || table.time_data_collection || filters.schoolYear || "",
        },
        table.formula || DEFAULT_FORMULA,
        table.variables?.length ? table.variables : DEFAULT_VARIABLES
      ),
    }));
  }

  async function handleSoTableSave(tableKey) {
    const draftTable = draftTables[tableKey];
    if (!draftTable) return;

    try {
      setSavingTableKey(tableKey);
      await saveSummaryTable({
        so_id: draftTable.so_id,
        school_year: filters.schoolYear || "",
        course_id: filters.course || null,
        section_id: filters.section || null,
        formula: draftTable.formula || DEFAULT_FORMULA,
        variables: draftTable.variables?.length ? draftTable.variables : DEFAULT_VARIABLES,
        table_data: draftTable,
      });
      Alert.alert("Saved", `SO ${draftTable.so_number} summary changes were saved.`);
      await loadReports(true);
    } catch (saveError) {
      Alert.alert("Save failed", saveError.response?.data?.detail || saveError.message || "Unable to save summary changes.");
    } finally {
      setSavingTableKey("");
    }
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
                        const draftTable = draftTables[tableKey] || table;
                        const courseRows = draftTable.courses || [];
                        const customVariables = (draftTable.variables || DEFAULT_VARIABLES).filter(
                          (variable) => !DEFAULT_VARIABLES.some((item) => item.key === variable.key)
                        );
                        const getIndicatorKey = (indicator, index) =>
                          String(indicator.basis_key || indicator.indicator_id || indicator.indicator_label || index);
                        return (
                          <>
                      <View style={styles.assessmentTopRow}>
                        <Text style={styles.assessmentPill}>SO {draftTable.so_number} Summary</Text>
                        <View style={styles.assessmentTopActions}>
                          <Pressable onPress={() => handleSoTableReset(table, tableKey)} style={styles.assessmentMiniButton}>
                            <Text style={styles.assessmentMiniButtonText}>Reset</Text>
                          </Pressable>
                          <Pressable onPress={() => handleSoTableSave(tableKey)} style={[styles.assessmentMiniButton, styles.assessmentMiniButtonPrimary]}>
                            <Text style={[styles.assessmentMiniButtonText, styles.assessmentMiniButtonPrimaryText]}>
                              {savingTableKey === tableKey ? "Saving..." : "Save"}
                            </Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.assessmentHeader}>
                        <Text style={styles.assessmentTitle}>Summary Result of Direct Assessment</Text>
                        <Text style={styles.assessmentSubtitle}>SO {draftTable.so_number}: {draftTable.so_title}</Text>
                      </View>

                      <View style={styles.assessmentMetaGrid}>
                        <View style={styles.assessmentMetaCol}>
                          <Text style={styles.assessmentMetaLabel}>Program</Text>
                          <TextInput
                            style={styles.assessmentMetaInput}
                            value={draftTable.program ?? ""}
                            onChangeText={(value) => updateDraftTable(tableKey, (current) => ({ ...current, program: value }))}
                          />
                        </View>
                        <View style={styles.assessmentMetaCol}>
                          <Text style={styles.assessmentMetaLabel}>Source of Assessment</Text>
                          <TextInput
                            style={styles.assessmentMetaInput}
                            value={draftTable.source_assessment ?? ""}
                            onChangeText={(value) => updateDraftTable(tableKey, (current) => ({ ...current, source_assessment: value }))}
                          />
                        </View>
                      </View>

                      <View style={styles.assessmentMetaGrid}>
                        <View style={[styles.assessmentMetaCol, styles.assessmentMetaColFull]}>
                          <Text style={styles.assessmentMetaLabel}>Time of Data Collection</Text>
                          <TextInput
                            style={styles.assessmentMetaInput}
                            value={draftTable.time_of_data_collection ?? ""}
                            onChangeText={(value) => updateDraftTable(tableKey, (current) => ({ ...current, time_of_data_collection: value }))}
                          />
                        </View>
                      </View>

                      <View style={styles.assessmentSection}>
                        <Text style={styles.assessmentSectionLabel}>Course Overview</Text>
                        <View style={styles.assessmentTable}>
                          <View style={styles.assessmentTableRow}>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>Course</Text>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableHeader]}>Actual Class Size</Text>
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
                                  {formatTableNumber(course.cli, 4)}
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
                          <View style={styles.assessmentTableRow}>
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableFooterLabel]}>Total Virtual Class Size</Text>
                            <Text style={styles.assessmentTableCell} />
                            <Text style={styles.assessmentTableCell} />
                            <Text style={styles.assessmentTableCell} />
                            <Text style={[styles.assessmentTableCell, styles.assessmentTableFooterValue]}>
                              {formatTableNumber(draftTable.totals?.virtual_class_size_total)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.assessmentSection}>
                        <Text style={styles.assessmentSectionLabel}>Indicator Breakdown</Text>
                        {courseRows.map((course) => (
                          <View key={`course-indicators-${draftTable.so_id}-${course.course_id}`} style={styles.courseIndicatorBlock}>
                            <Text style={styles.courseIndicatorTitle}>{course.course_name}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              <View style={styles.assessmentIndicatorsWide}>
                                <View style={styles.assessmentIndicatorRow}>
                                  <Text style={[styles.assessmentIndicatorCell, styles.assessmentTableHeader]}>Indicator</Text>
                                  <Text style={[styles.assessmentIndicatorCell, styles.assessmentTableHeader]}>Distribution</Text>
                                  <Text style={[styles.assessmentIndicatorCell, styles.assessmentTableHeader]}>Answered</Text>
                                  <Text style={[styles.assessmentIndicatorCell, styles.assessmentTableHeader]}>80% or Higher</Text>
                                  {customVariables.map((variable) => (
                                    <Text key={`${course.course_id}-${variable.key}`} style={[styles.assessmentIndicatorCell, styles.assessmentTableHeader]}>
                                      {variable.label}
                                    </Text>
                                  ))}
                                  <Text style={[styles.assessmentIndicatorCell, styles.assessmentTableHeader]}>Pij</Text>
                                </View>
                                {(course.indicators || []).map((indicator, index) => (
                                  <View key={`ind-${draftTable.so_id}-${course.course_id}-${getIndicatorKey(indicator, index)}`} style={styles.assessmentIndicatorRow}>
                                    <View style={styles.assessmentTableInputCell}>
                                      <TextInput
                                        style={styles.assessmentTableInput}
                                        value={String(indicator.indicator_label ?? "")}
                                        onChangeText={(value) =>
                                          updateDraftTable(tableKey, (current) => ({
                                            ...current,
                                            courses: current.courses.map((item) =>
                                              item.course_id === course.course_id
                                                ? {
                                                    ...item,
                                                    indicators: item.indicators.map((row, rowIndex) =>
                                                      getIndicatorKey(row, rowIndex) === getIndicatorKey(indicator, index)
                                                        ? { ...row, indicator_label: value }
                                                        : row
                                                    ),
                                                  }
                                                : item
                                            ),
                                          }))
                                        }
                                      />
                                    </View>
                                    <View style={styles.assessmentTableInputCell}>
                                      <TextInput
                                        style={styles.assessmentTableInput}
                                        value={String(indicator.distribution ?? "")}
                                        keyboardType="decimal-pad"
                                        onChangeText={(value) =>
                                          updateDraftTable(tableKey, (current) => ({
                                            ...current,
                                            courses: current.courses.map((item) =>
                                              item.course_id === course.course_id
                                                ? {
                                                    ...item,
                                                    indicators: item.indicators.map((row, rowIndex) =>
                                                      getIndicatorKey(row, rowIndex) === getIndicatorKey(indicator, index)
                                                        ? { ...row, distribution: value }
                                                        : row
                                                    ),
                                                  }
                                                : item
                                            ),
                                          }))
                                        }
                                      />
                                    </View>
                                    <View style={styles.assessmentTableInputCell}>
                                      <TextInput
                                        style={styles.assessmentTableInput}
                                        value={String(indicator.answered_count ?? "")}
                                        keyboardType="number-pad"
                                        onChangeText={(value) =>
                                          updateDraftTable(tableKey, (current) => ({
                                            ...current,
                                            courses: current.courses.map((item) =>
                                              item.course_id === course.course_id
                                                ? {
                                                    ...item,
                                                    indicators: item.indicators.map((row, rowIndex) =>
                                                      getIndicatorKey(row, rowIndex) === getIndicatorKey(indicator, index)
                                                        ? { ...row, answered_count: value }
                                                        : row
                                                    ),
                                                  }
                                                : item
                                            ),
                                          }))
                                        }
                                      />
                                    </View>
                                    <View style={styles.assessmentTableInputCell}>
                                      <TextInput
                                        style={styles.assessmentTableInput}
                                        value={String(indicator.satisfactory_count ?? "")}
                                        keyboardType="number-pad"
                                        onChangeText={(value) =>
                                          updateDraftTable(tableKey, (current) => ({
                                            ...current,
                                            courses: current.courses.map((item) =>
                                              item.course_id === course.course_id
                                                ? {
                                                    ...item,
                                                    indicators: item.indicators.map((row, rowIndex) =>
                                                      getIndicatorKey(row, rowIndex) === getIndicatorKey(indicator, index)
                                                        ? { ...row, satisfactory_count: value }
                                                        : row
                                                    ),
                                                  }
                                                : item
                                            ),
                                          }))
                                        }
                                      />
                                    </View>
                                    {customVariables.map((variable) => (
                                      <View key={`${course.course_id}-${getIndicatorKey(indicator, index)}-${variable.key}`} style={styles.assessmentTableInputCell}>
                                        <TextInput
                                          style={styles.assessmentTableInput}
                                          value={String(indicator[variable.key] ?? 0)}
                                          keyboardType="decimal-pad"
                                          onChangeText={(value) =>
                                            updateDraftTable(tableKey, (current) => ({
                                              ...current,
                                              courses: current.courses.map((item) =>
                                                item.course_id === course.course_id
                                                  ? {
                                                      ...item,
                                                      indicators: item.indicators.map((row, rowIndex) =>
                                                        getIndicatorKey(row, rowIndex) === getIndicatorKey(indicator, index)
                                                          ? { ...row, [variable.key]: value }
                                                          : row
                                                      ),
                                                    }
                                                  : item
                                              ),
                                            }))
                                          }
                                        />
                                      </View>
                                    ))}
                                    <Text style={[styles.assessmentIndicatorCell, styles.assessmentComputedCell]}>
                                      {formatTableNumber(indicator.weighted_value, 4)}
                                    </Text>
                                  </View>
                                ))}
                                <View style={styles.assessmentIndicatorRow}>
                                  <Text style={[styles.assessmentIndicatorCell, styles.assessmentTableFooterLabel, { flex: 4 + customVariables.length }]}>
                                    Course Weighted Total
                                  </Text>
                                  <Text style={[styles.assessmentIndicatorCell, styles.assessmentTableFooterValue]}>
                                    {formatTableNumber(course.weighted_total, 4)}
                                  </Text>
                                </View>
                              </View>
                            </ScrollView>
                          </View>
                        ))}
                      </View>

                      <View style={styles.assessmentSection}>
                        <Text style={styles.assessmentSectionLabel}>Attainment Summary</Text>
                        <View style={styles.attainmentBox}>
                          <View style={styles.attainmentRow}>
                            <Text style={styles.attainmentLabel}>% of the class who got satisfactory rating or higher</Text>
                            <Text style={styles.attainmentValue}>{draftTable.totals?.attainment_percent ?? 0}%</Text>
                          </View>
                          <View style={styles.attainmentRow}>
                            <Text style={styles.attainmentLabel}>Target Level of attainment</Text>
                            <TextInput
                              style={[styles.assessmentMetaInput, styles.attainmentInput]}
                              value={String(draftTable.totals?.target_statement ?? targetStatement(draftTable.totals?.target_level ?? 80))}
                              onChangeText={(value) =>
                                updateDraftTable(tableKey, (current) => ({
                                  ...current,
                                  totals: { ...current.totals, target_statement: value },
                                }))
                              }
                            />
                          </View>
                        </View>
                      </View>

                      <View style={styles.assessmentSection}>
                        <Text style={styles.assessmentSectionLabel}>Conclusion</Text>
                        <TextInput
                          style={[styles.assessmentMetaInput, styles.conclusionInput]}
                          multiline
                          value={String(draftTable.totals?.conclusion ?? "")}
                          onChangeText={(value) =>
                            updateDraftTable(tableKey, (current) => ({
                              ...current,
                              totals: { ...current.totals, conclusion: value },
                            }))
                          }
                        />
                      </View>
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
  assessmentIndicatorsWide: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 760,
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
  assessmentComputedCell: {
    fontWeight: "800",
  },
  assessmentTableFooterLabel: {
    color: colors.dark,
    fontWeight: "800",
    textAlign: "right",
  },
  assessmentTableFooterValue: {
    color: colors.dark,
    fontWeight: "800",
  },
  courseIndicatorBlock: {
    marginBottom: 12,
  },
  courseIndicatorTitle: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
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
    gap: 8,
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
  attainmentInput: {
    marginTop: 2,
  },
  attainmentMet: {
    color: colors.success,
  },
  attainmentNotMet: {
    color: colors.danger,
  },
  conclusionInput: {
    minHeight: 88,
    textAlignVertical: "top",
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
