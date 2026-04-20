import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { useAuth } from "../context/AuthContext";
import { fetchReportsDashboard } from "../services/reportsMobile";
import { colors } from "../theme/colors";

function formatDateByIndex(index) {
  const month = String((index % 12) + 1).padStart(2, "0");
  const day = String(28 - (index % 8)).padStart(2, "0");
  return `2026-${month}-${day}`;
}

export default function FacultyPastReportsScreen({ navigation }) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [selectedType, setSelectedType] = useState("All Types");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const payload = await fetchReportsDashboard();
        const courseRows = payload?.course_summary || [];

        const generated = courseRows.map((course, index) => {
          const type = index % 3 === 0 ? "Course Detailed" : "Course Summary";
          const year = index % 2 === 0 ? "2025" : "2024";
          return {
            id: `${course.code}-${index}`,
            title:
              type === "Course Detailed"
                ? `${course.code} Detailed Report`
                : `${course.code} Assessment Summary`,
            subtitle: `${year} • ${type}`,
            type,
            year,
            status: "Completed",
            updatedAt: formatDateByIndex(index),
          };
        });

        if (!cancelled) {
          setReports(generated);
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
          setError(loadError.response?.data?.detail || loadError.message || "Failed to load past reports.");
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

  const yearOptions = useMemo(() => {
    const years = [...new Set(reports.map((item) => item.year))].sort((a, b) => Number(b) - Number(a));
    return ["All Years", ...years];
  }, [reports]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(reports.map((item) => item.type))];
    return ["All Types", ...types];
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();

    return reports.filter((item) => {
      const matchesQuery = !q || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
      const matchesYear = selectedYear === "All Years" || item.year === selectedYear;
      const matchesType = selectedType === "All Types" || item.type === selectedType;

      return matchesQuery && matchesYear && matchesType;
    });
  }, [reports, search, selectedYear, selectedType]);

  async function refreshPastReports() {
    try {
      setRefreshing(true);
      setError("");
      const payload = await fetchReportsDashboard();
      const courseRows = payload?.course_summary || [];

      const generated = courseRows.map((course, index) => {
        const type = index % 3 === 0 ? "Course Detailed" : "Course Summary";
        const year = index % 2 === 0 ? "2025" : "2024";
        return {
          id: `${course.code}-${index}`,
          title:
            type === "Course Detailed"
              ? `${course.code} Detailed Report`
              : `${course.code} Assessment Summary`,
          subtitle: `${year} â€¢ ${type}`,
          type,
          year,
          status: "Completed",
          updatedAt: formatDateByIndex(index),
        };
      });

      setReports(generated);
    } catch (loadError) {
      const isAuthError =
        loadError.response?.status === 401 ||
        String(loadError.response?.data?.detail || loadError.message || "")
          .toLowerCase()
          .includes("token not valid");

      if (isAuthError) {
        await signOut();
        return;
      }

      setError(loadError.response?.data?.detail || loadError.message || "Failed to load past reports.");
    } finally {
      setRefreshing(false);
    }
  }

  function handleView(item) {
    Alert.alert("View report", `${item.title}\n\nPreview screen can be added next.`);
  }

  function handleDownload(item) {
    Alert.alert("Download report", `${item.title}\n\nDownload can be connected to export next.`);
  }

  return (
    <AppScreen
      title={"Past\nReports"}
      subtitle="View and download previously submitted assessment reports."
      onRefresh={refreshPastReports}
      refreshing={refreshing}
      heroFooter={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Current Reports</Text>
        </Pressable>
      }
    >
      {loading ? (
        <InfoCard title="Loading">
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.yellow} />
            <Text style={styles.mutedText}>Loading past reports...</Text>
          </View>
        </InfoCard>
      ) : error ? (
        <InfoCard title="Error">
          <Text style={styles.errorText}>{error}</Text>
        </InfoCard>
      ) : (
        <>
          <InfoCard>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search reports by title or type..."
              placeholderTextColor={colors.gray}
              style={styles.searchInput}
            />

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Filter by year</Text>
              <View style={styles.filterRow}>
                {yearOptions.map((item) => {
                  const active = selectedYear === item;
                  return (
                    <Pressable
                      key={`year-${item}`}
                      onPress={() => setSelectedYear(item)}
                      style={[styles.filterChip, active ? styles.filterChipActive : null]}
                    >
                      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>Filter by type</Text>
              <View style={styles.filterRow}>
                {typeOptions.map((item) => {
                  const active = selectedType === item;
                  return (
                    <Pressable
                      key={`type-${item}`}
                      onPress={() => setSelectedType(item)}
                      style={[styles.filterChip, active ? styles.filterChipActive : null]}
                    >
                      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </InfoCard>

          <Text style={styles.resultsText}>Showing {filteredReports.length} reports</Text>

          {filteredReports.length === 0 ? (
            <InfoCard title="No reports found">
              <Text style={styles.mutedText}>Try a different search or filter combination.</Text>
            </InfoCard>
          ) : (
            filteredReports.map((item) => (
              <View key={item.id} style={styles.reportCard}>
                <View style={styles.reportLeft}>
                  <View style={styles.fileIconBox}>
                    <Text style={styles.fileIcon}>▤</Text>
                  </View>
                  <View style={styles.reportMain}>
                    <Text style={styles.reportTitle}>{item.title}</Text>
                    <Text style={styles.reportSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>

                <View style={styles.reportRight}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => handleView(item)} style={styles.iconButton}>
                      <Text style={styles.iconButtonText}>◉</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDownload(item)} style={styles.iconButton}>
                      <Text style={styles.iconButtonText}>↓</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    borderColor: colors.yellow,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: colors.yellow,
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
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  filterBlock: {
    marginTop: 14,
  },
  filterLabel: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  filterChipText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: colors.yellow,
  },
  resultsText: {
    color: colors.gray,
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: 2,
  },
  reportCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  reportLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    marginRight: 8,
  },
  fileIconBox: {
    alignItems: "center",
    backgroundColor: "#fff7d6",
    borderRadius: 10,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  fileIcon: {
    color: colors.yellowAlt,
    fontSize: 14,
    fontWeight: "700",
  },
  reportMain: {
    flex: 1,
  },
  reportTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
  },
  reportSubtitle: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 3,
  },
  reportRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusPill: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#fff7d6",
    borderRadius: 8,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  iconButtonText: {
    color: colors.yellowAlt,
    fontSize: 13,
    fontWeight: "800",
  },
});
