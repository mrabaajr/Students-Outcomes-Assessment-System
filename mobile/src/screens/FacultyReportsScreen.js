import { useEffect, useMemo, useState } from "react";
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import StatCard from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";
import { fetchReportsDashboard } from "../services/reportsMobile";
import { colors } from "../theme/colors";

function toCsvField(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function getFlattenedReportRows(data) {
  if (!data) return [];

  const rows = [];

  (data.course_summary || []).forEach((course) => {
    rows.push({
      type: "Course Summary",
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

function getCourseChartRows(data) {
  return (data?.course_summary || []).map((course) => ({
    code: course.code,
    name: course.name,
    average: Number(course.avg) || 0,
    target: Number(course.target ?? 80) || 80,
    students: Number(course.students) || 0,
    passRate: Number(course.pass_rate) || 0,
    status: Number(course.avg) >= Number(course.target ?? 80) ? "target" : "below",
  }));
}

function CourseAverageChart({ rows }) {
  const maxValue = Math.max(100, ...rows.map((row) => Math.max(row.average, row.target)));

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Course Average vs Target</Text>
      <View style={styles.barChartArea}>
        <View style={styles.chartYAxis}>
          {[100, 75, 50, 25, 0].map((tick) => (
            <Text key={tick} style={styles.chartTick}>
              {tick}
            </Text>
          ))}
        </View>
        <View style={styles.barChartPlot}>
          <View style={styles.chartGridLine} />
          <View style={styles.barChartBars}>
            {rows.map((row) => {
              const avgHeight = `${Math.max(8, (row.average / maxValue) * 100)}%`;
              const targetHeight = `${Math.max(8, (row.target / maxValue) * 100)}%`;

              return (
                <View key={row.code} style={styles.barChartGroup}>
                  <View style={styles.barStack}>
                    <View style={[styles.targetBar, { height: targetHeight }]} />
                    <View style={[styles.averageBar, { height: avgHeight }]} />
                  </View>
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {row.code}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendAverageDot]} />
          <Text style={styles.legendText}>Average</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendTargetDot]} />
          <Text style={styles.legendText}>Target</Text>
        </View>
      </View>
    </View>
  );
}

function AttainmentDistributionChart({ rows }) {
  const attained = rows.filter((row) => row.status === "target").length;
  const below = Math.max(0, rows.length - attained);
  const total = rows.length;
  const attainedShare = total > 0 ? attained / total : 0.5;
  const belowShare = total > 0 ? below / total : 0.5;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Attainment Distribution</Text>
      <View style={styles.pieWrap}>
        <View style={styles.pieCircle}>
          <View style={[styles.pieTopHalf, { flex: attainedShare }]} />
          <View style={[styles.pieBottomHalf, { flex: belowShare }]} />
          <View style={styles.pieCenter} />
        </View>
        <View style={styles.pieCounts}>
          <Text style={styles.pieCountMid}>{attained} of {total || 0}</Text>
        </View>
        <Text style={[styles.edgeCount, styles.edgeCountTop]}>{attained}</Text>
        <Text style={[styles.edgeCount, styles.edgeCountBottom]}>{below}</Text>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendSuccessDot]} />
          <Text style={styles.legendText}>Target Attained: {attained}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDangerDot]} />
          <Text style={styles.legendText}>Below Target: {below}</Text>
        </View>
      </View>
    </View>
  );
}

function buildCsv(rows) {
  const header = [
    "Type",
    "Code",
    "Title",
    "Detail",
    "Instructor",
    "Students",
    "Average",
    "Pass Rate",
    "Conclusion",
    "School Year",
    "Course Filter",
    "Section Filter",
  ];

  const body = rows.map((row) =>
    [
      row.type,
      row.code,
      row.title,
      row.detail,
      row.instructor,
      row.students,
      row.average,
      row.passRate,
      row.conclusion,
      row.schoolYear,
      row.course,
      row.section,
    ]
      .map(toCsvField)
      .join(",")
  );

  return `${header.map(toCsvField).join(",")}\n${body.join("\n")}`;
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
        <h1>Faculty Reports</h1>
        <p class="sub">Course Level Summary</p>
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

export default function FacultyReportsScreen({ navigation }) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const payload = await fetchReportsDashboard();
        if (!cancelled) {
          setData(payload);
        }
      } catch (loadError) {
        const isAuthError =
          loadError.response?.status === 401 ||
          String(loadError.response?.data?.detail || loadError.message || "")
            .toLowerCase()
            .includes("token not valid");

        if (!cancelled && isAuthError) {
          await signOut();
          return;
        }

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
  }, [signOut]);

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
  const courseChartRows = useMemo(() => getCourseChartRows(data), [data]);

  async function handleViewPastReports() {
    navigation.navigate("FacultyPastReports");
  }

  async function handleExportCsv() {
    try {
      if (!exportRows.length) {
        Alert.alert("No data to export", "Load report data before exporting a CSV.");
        return;
      }

      const csv = buildCsv(exportRows);
      const fileUri = `${FileSystem.cacheDirectory}faculty-reports-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export summary CSV",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Export ready", "CSV file was created, but sharing is not available on this device.");
      }
    } catch (exportError) {
      Alert.alert("CSV export failed", exportError.message || "Unable to export summary CSV.");
    }
  }

  async function handleExportPdf() {
    try {
      if (!metricCards.length) {
        Alert.alert("No data to export", "Load report data before exporting a PDF.");
        return;
      }

      const html = buildPdfHtml({ metrics: metricCards, rows: exportRows });
      const pdf = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdf.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Export summary PDF",
        });
      } else {
        Alert.alert("Export ready", "PDF file was created, but sharing is not available on this device.");
      }
    } catch (exportError) {
      Alert.alert("PDF export failed", exportError.message || "Unable to export summary PDF.");
    }
  }

  return (
    <AppScreen
      eyebrow="Faculty Reports"
      title={"Assessment Reports\n& Performance Summary"}
      subtitle="Review your class-level assessment performance and course summaries using the same reports data as the website."
      enableScrollTopButton={true}
      heroFooter={
        <View style={styles.actionRow}>
          <Pressable onPress={handleViewPastReports} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>View Past Reports</Text>
          </Pressable>
          <Pressable onPress={handleExportPdf} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Export Summary PDF</Text>
          </Pressable>
          <Pressable onPress={handleExportCsv} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Export Summary CSV</Text>
          </Pressable>
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
          <View style={styles.statsGrid}>
            {metricCards.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </View>

          <View style={styles.chartRow}>
            <CourseAverageChart rows={courseChartRows} />
            <AttainmentDistributionChart rows={courseChartRows} />
          </View>

          <InfoCard title="Course-Level Assessment Summary">
            {(data.course_summary || []).length === 0 ? (
              <Text style={styles.mutedText}>No course data available. Save assessments first.</Text>
            ) : (
              (data.course_summary || []).map((course) => (
                <View key={course.code} style={styles.summaryRow}>
                  <View style={styles.summaryMain}>
                    <Text style={styles.summaryCode}>{course.code}</Text>
                    <Text style={styles.summaryName}>{course.name}</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>{course.students}</Text>
                    <Text style={styles.summaryLabel}>Students</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>{course.avg}%</Text>
                    <Text style={styles.summaryLabel}>Avg Score</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>{course.pass_rate}%</Text>
                    <Text style={styles.summaryLabel}>Pass Rate</Text>
                  </View>
                </View>
              ))
            )}
          </InfoCard>

          <InfoCard title="Course Assessment Basis">
            <View style={styles.basisRow}>
              <View style={styles.basisIcon}>
                <Text style={styles.basisIconText}>◫</Text>
              </View>
              <View style={styles.basisCopyBlock}>
                <Text style={styles.basisTitle}>This report uses your real assessment records.</Text>
                <Text style={styles.basisCopy}>
                  It summarizes course averages, section coverage, student counts, and student outcome attainment against the 80% benchmark.
                </Text>
              </View>
            </View>
          </InfoCard>
        </>
      ) : (
        <InfoCard title="Reports">
          <Text style={styles.mutedText}>No report data available.</Text>
        </InfoCard>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryActionText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  primaryActionText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
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
  chartRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 2,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: 280,
    flexGrow: 1,
    padding: 16,
  },
  chartTitle: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  barChartArea: {
    flexDirection: "row",
    height: 230,
  },
  chartYAxis: {
    justifyContent: "space-between",
    paddingRight: 6,
    width: 28,
  },
  chartTick: {
    color: colors.gray,
    fontSize: 10,
  },
  barChartPlot: {
    flex: 1,
    position: "relative",
  },
  chartGridLine: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    borderLeftColor: colors.graySoft,
    borderLeftWidth: 1,
    borderStyle: "dashed",
    bottom: 24,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  barChartBars: {
    bottom: 18,
    flexDirection: "row",
    justifyContent: "space-around",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  barChartGroup: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 8,
  },
  barStack: {
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    width: 36,
  },
  averageBar: {
    backgroundColor: colors.yellow,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    bottom: 0,
    position: "absolute",
    width: 14,
    zIndex: 2,
  },
  targetBar: {
    backgroundColor: colors.success,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    bottom: 0,
    position: "absolute",
    width: 14,
    zIndex: 1,
  },
  barLabel: {
    color: colors.gray,
    fontSize: 10,
    marginTop: 8,
    textAlign: "center",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  legendDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  legendAverageDot: {
    backgroundColor: colors.yellow,
  },
  legendTargetDot: {
    backgroundColor: colors.success,
  },
  legendSuccessDot: {
    backgroundColor: colors.success,
  },
  legendDangerDot: {
    backgroundColor: colors.danger,
  },
  legendText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  pieWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  pieCircle: {
    alignItems: "center",
    borderRadius: 999,
    height: 160,
    overflow: "hidden",
    position: "relative",
    width: 160,
  },
  pieTopHalf: {
    backgroundColor: colors.success,
    flex: 1,
    width: "100%",
  },
  pieBottomHalf: {
    backgroundColor: colors.danger,
    flex: 1,
    width: "100%",
  },
  pieCenter: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    height: 74,
    left: "50%",
    marginLeft: -37,
    marginTop: -37,
    position: "absolute",
    top: "50%",
    width: 74,
  },
  pieCounts: {
    alignItems: "center",
    height: 160,
    justifyContent: "center",
    position: "absolute",
    width: 160,
  },
  pieCount: {
    fontSize: 16,
    fontWeight: "800",
  },
  pieCountMid: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "700",
  },
  edgeCount: {
    fontSize: 16,
    fontWeight: "800",
    position: "absolute",
  },
  edgeCountTop: {
    color: colors.success,
    top: -8,
  },
  edgeCountBottom: {
    color: colors.danger,
    bottom: -8,
  },
  summaryRow: {
    alignItems: "center",
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
  },
  summaryMain: {
    flex: 1,
  },
  summaryCode: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  summaryName: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 3,
  },
  summaryStat: {
    alignItems: "center",
    minWidth: 68,
  },
  summaryValue: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  summaryLabel: {
    color: colors.gray,
    fontSize: 10,
    marginTop: 3,
    textTransform: "uppercase",
  },
  basisRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  basisIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  basisIconText: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: "700",
  },
  basisCopyBlock: {
    flex: 1,
  },
  basisTitle: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  basisCopy: {
    color: colors.gray,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
});