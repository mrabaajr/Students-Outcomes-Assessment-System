import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import {
  fetchStudentOutcomesMobile,
  saveStudentOutcomesMobile,
} from "../services/studentOutcomes";
import { colors } from "../theme/colors";

const BLACK = "#000000";
const WHITE = "#FFFFFF";
const YELLOW = "#FFC20E";

function OutcomeFormModal({
  visible,
  editingOutcome,
  nextNumber,
  onClose,
  onSave,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setTitle(editingOutcome?.title || `TIP SO ${nextNumber}`);
    setDescription(editingOutcome?.description || "");
  }, [editingOutcome, nextNumber, visible]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {editingOutcome ? "Edit Student Outcome" : "Add New Student Outcome"}
          </Text>
          <Text style={styles.modalSubtitle}>Fill in the outcome details below.</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Outcome title</Text>
            <TextInput
              onChangeText={setTitle}
              placeholder="e.g. T.I.P. SO 1"
              placeholderTextColor="rgba(0,0,0,0.45)"
              style={styles.modalInput}
              value={title}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              multiline
              onChangeText={setDescription}
              placeholder="Describe the student outcome..."
              placeholderTextColor="rgba(0,0,0,0.45)"
              style={[styles.modalInput, styles.modalTextarea]}
              textAlignVertical="top"
              value={description}
            />
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                onSave({
                  id: editingOutcome?.id || `new_${Date.now()}`,
                  number: editingOutcome?.number || nextNumber,
                  title: title.trim(),
                  description: description.trim(),
                  indicators: editingOutcome?.indicators || [],
                })
              }
              style={[
                styles.primaryButton,
                (!title.trim() || !description.trim()) && styles.disabledButton,
              ]}
              disabled={!title.trim() || !description.trim()}
            >
              <Text style={styles.primaryButtonText}>
                {editingOutcome ? "Save Changes" : "Add SO"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function IndicatorEditModal({ visible, indicator, saving, onClose, onSave }) {
  const [description, setDescription] = useState("");

  useEffect(() => {
    setDescription(indicator?.description || "");
  }, [indicator, visible]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit Performance Indicator</Text>
          <Text style={styles.modalSubtitle}>Update the PI description for this Student Outcome.</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Performance indicator description</Text>
            <TextInput
              multiline
              onChangeText={setDescription}
              placeholder="Describe this performance indicator..."
              placeholderTextColor="rgba(0,0,0,0.45)"
              style={[styles.modalInput, styles.modalTextarea]}
              textAlignVertical="top"
              value={description}
            />
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(description.trim())}
              style={[styles.primaryButton, (!description.trim() || saving) && styles.disabledButton]}
              disabled={!description.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color={BLACK} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Save PI</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function IndicatorAddModal({ visible, saving, onClose, onSave }) {
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (visible) {
      setDescription("");
    }
  }, [visible]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Performance Indicator</Text>
          <Text style={styles.modalSubtitle}>Create a new PI for this Student Outcome.</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Performance indicator description</Text>
            <TextInput
              multiline
              onChangeText={setDescription}
              placeholder="Describe this performance indicator..."
              placeholderTextColor="rgba(0,0,0,0.45)"
              style={[styles.modalInput, styles.modalTextarea]}
              textAlignVertical="top"
              value={description}
            />
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(description.trim())}
              style={[styles.primaryButton, (!description.trim() || saving) && styles.disabledButton]}
              disabled={!description.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color={BLACK} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Add PI</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeleteConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIconWrap}>
            <Text style={styles.confirmIcon}>!</Text>
          </View>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>

          <View style={styles.modalActions}>
            <Pressable onPress={onCancel} style={styles.secondaryButton} disabled={loading}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.deletePrimaryButton, loading && styles.disabledButton]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <Text style={styles.deletePrimaryButtonText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProgramChairStudentOutcomesScreen({ navigation }) {
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [deletingOutcome, setDeletingOutcome] = useState(null);

  const filterOptions = useMemo(
    () => [
      { label: "All Outcomes", value: "all" },
      { label: "With Indicators", value: "withIndicators" },
      { label: "Without Indicators", value: "withoutIndicators" },
    ],
    []
  );

  async function loadOutcomes(refresh = false) {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await fetchStudentOutcomesMobile();
      setOutcomes(data);
    } catch (loadError) {
      setError(loadError.response?.data?.detail || loadError.message || "Failed to load student outcomes.");
    } finally {
      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchStudentOutcomesMobile();
        if (!cancelled) {
          setOutcomes(data);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.response?.data?.detail || loadError.message || "Failed to load student outcomes.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOutcomes = useMemo(() => {
    const text = query.trim().toLowerCase();
    return outcomes.filter((item) => {
      const haystack = `${item.title} ${item.description} SO ${item.number}`.toLowerCase();
      const matchesText = !text || haystack.includes(text);
      const indicatorsCount = item.indicators?.length || 0;
      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "withIndicators" && indicatorsCount > 0) ||
        (selectedFilter === "withoutIndicators" && indicatorsCount === 0);

      return matchesText && matchesFilter;
    });
  }, [outcomes, query, selectedFilter]);

  const activeFilterLabel =
    filterOptions.find((option) => option.value === selectedFilter)?.label || "All Outcomes";

  const nextNumber = useMemo(() => {
    const usedNumbers = new Set(outcomes.map((item) => item.number));
    let candidate = 1;
    while (usedNumbers.has(candidate)) candidate += 1;
    return candidate;
  }, [outcomes]);

  const totalIndicators = useMemo(
    () => outcomes.reduce((sum, outcome) => sum + (outcome.indicators?.length || 0), 0),
    [outcomes]
  );

  const totalCriteria = useMemo(
    () =>
      outcomes.reduce(
        (sum, outcome) =>
          sum +
          (outcome.indicators || []).reduce(
            (innerSum, indicator) => innerSum + (indicator.criteria?.length || 0),
            0
          ),
        0
      ),
    [outcomes]
  );

  function handleSaveLocal(outcome) {
    setOutcomes((prev) => {
      const exists = prev.some((item) => item.id === outcome.id);
      const next = exists
        ? prev.map((item) => (item.id === outcome.id ? outcome : item))
        : [...prev, outcome];

      return [...next].sort((a, b) => a.number - b.number);
    });
    setHasUnsavedChanges(true);
    setFormVisible(false);
    setEditingOutcome(null);
  }

  async function handleSaveBackend() {
    try {
      setSaving(true);
      setError("");
      const saved = await saveStudentOutcomesMobile(outcomes);
      setOutcomes(saved.sort((a, b) => a.number - b.number));
      setHasUnsavedChanges(false);
    } catch (saveError) {
      setError(saveError.response?.data?.detail || saveError.message || "Failed to save student outcomes.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(outcome) {
    setDeletingOutcome(outcome);
  }

  function confirmDeleteOutcome() {
    if (!deletingOutcome) return;

    setOutcomes((prev) => prev.filter((item) => item.id !== deletingOutcome.id));
    setHasUnsavedChanges(true);
    setDeletingOutcome(null);
  }

  return (
    <>
      <AppScreen
        eyebrow="Outcomes Management"
        title="Student Outcomes"
        titleStyle={styles.screenTitle}
        subtitle="Define and manage student outcomes, performance indicators, and evaluation criteria for your program assessment."
        showMeta={false}
        enableScrollTopButton={true}
        heroFooter={
          <Pressable
            onPress={() => {
              setEditingOutcome(null);
              setFormVisible(true);
            }}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ ADD NEW SO</Text>
          </Pressable>
        }
      >
        <InfoCard>
          <View style={styles.controlCard}>
            <View style={styles.controlHeaderRow}>
              <Text style={styles.controlEyebrow}>Outcomes Workspace</Text>
              <Text style={styles.controlStatus}>{hasUnsavedChanges ? "Unsaved" : "Synced"}</Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricChip}>
                <Text style={styles.metricValue}>{outcomes.length}</Text>
                <Text style={styles.metricLabel}>Outcomes</Text>
              </View>
              <View style={styles.metricChip}>
                <Text style={styles.metricValue}>{totalIndicators}</Text>
                <Text style={styles.metricLabel}>Indicators</Text>
              </View>
              <View style={styles.metricChip}>
                <Text style={styles.metricValue}>{totalCriteria}</Text>
                <Text style={styles.metricLabel}>Criteria</Text>
              </View>
            </View>

            <View style={styles.toolbarRow}>
              <TextInput
                onChangeText={setQuery}
                placeholder="Search outcome title or description"
                placeholderTextColor="rgba(0,0,0,0.45)"
                style={styles.searchInput}
                value={query}
              />
              <Pressable onPress={() => loadOutcomes(true)} style={styles.refreshButton}>
                {refreshing ? (
                  <ActivityIndicator color={BLACK} size="small" />
                ) : (
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.toolbarRow}>
              <Pressable
                onPress={() => setFilterPickerVisible(true)}
                style={styles.filterDropdownButton}
              >
                <Text style={styles.filterDropdownButtonText}>Filters: {activeFilterLabel}</Text>
                <Text style={styles.filterDropdownChevron}>▾</Text>
              </Pressable>
            </View>

            <View style={[styles.actionRow, styles.saveRow]}>
              {hasUnsavedChanges ? (
                <Pressable
                  onPress={handleSaveBackend}
                  style={[styles.saveButton, saving && styles.disabledButton]}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={WHITE} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </Pressable>
              ) : (
                <View style={styles.savedPill}>
                  <Text style={styles.savedPillText}>All changes saved</Text>
                </View>
              )}
            </View>
          </View>
        </InfoCard>

        <View style={styles.actionRow}>
          <Text style={styles.resultsText}>
            Showing {filteredOutcomes.length} of {outcomes.length} outcomes
          </Text>
        </View>

        {error ? (
          <InfoCard title="Error">
            <Text style={styles.errorText}>{error}</Text>
          </InfoCard>
        ) : null}

        {loading ? (
          <InfoCard title="Loading">
            <Text style={styles.mutedText}>Loading student outcomes...</Text>
          </InfoCard>
        ) : filteredOutcomes.length === 0 ? (
          <InfoCard title="No Student Outcomes Yet">
            <Text style={styles.mutedText}>
              {query.trim()
                ? "No outcomes match your search."
                : "No student outcomes yet. Tap \"ADD NEW SO\" to get started."}
            </Text>
          </InfoCard>
        ) : (
          filteredOutcomes.map((outcome) => {
            const criteriaCount = outcome.indicators.reduce(
              (sum, indicator) => sum + Math.max(indicator.criteria.length, 1),
              0
            );

            return (
              <InfoCard key={outcome.id}>
                <View style={styles.outcomeAccentBar} />
                <View style={styles.cardTop}>
                  <View style={styles.numberBox}>
                    <Text style={styles.numberText}>{outcome.number}</Text>
                  </View>
                  <View style={styles.cardMain}>
                    <Text style={styles.outcomeTitle}>{outcome.title}</Text>
                    <Text style={styles.outcomeDescription}>{outcome.description}</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() =>
                      navigation.navigate("ProgramChairOutcomeRubric", {
                        outcome,
                      })
                    }
                    style={styles.ghostButton}
                  >
                    <Text style={styles.ghostButtonText}>Open Rubric</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setEditingOutcome(outcome);
                      setFormVisible(true);
                    }}
                    style={styles.ghostButton}
                  >
                    <Text style={styles.ghostButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(outcome)} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                </View>

                {outcome.indicators.length > 0 ? (
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Performance Indicators & Criteria</Text>
                    <Text style={styles.summaryText}>
                      {outcome.indicators.length} indicator{outcome.indicators.length === 1 ? "" : "s"} • {criteriaCount} criteria columns
                    </Text>
                    <View style={styles.indicatorList}>
                      {outcome.indicators.map((indicator, index) => (
                        <View key={indicator.id} style={styles.indicatorCard}>
                          <Text style={styles.indicatorTitle}>PI {index + 1}</Text>
                          <Text style={styles.indicatorDescription}>{indicator.description}</Text>
                          <View style={styles.criteriaList}>
                            {(indicator.criteria || []).slice(0, 2).map((criterion, criterionIndex) => (
                              <Text key={criterion.id} style={styles.criteriaItem}>
                                PC {criterionIndex + 1}: {criterion.name}
                              </Text>
                            ))}
                            {(indicator.criteria || []).length === 0 ? (
                              <Text style={styles.criteriaItem}>No criteria</Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No performance indicators yet.</Text>
                  </View>
                )}
              </InfoCard>
            );
          })
        )}
      </AppScreen>

      <OutcomeFormModal
        editingOutcome={editingOutcome}
        nextNumber={nextNumber}
        onClose={() => {
          setFormVisible(false);
          setEditingOutcome(null);
        }}
        onSave={handleSaveLocal}
        visible={formVisible}
      />

      <DeleteConfirmModal
        visible={Boolean(deletingOutcome)}
        title="Delete Student Outcome?"
        message={
          deletingOutcome
            ? `This will remove ${deletingOutcome.title} and its rubric details.`
            : ""
        }
        onCancel={() => setDeletingOutcome(null)}
        onConfirm={confirmDeleteOutcome}
      />

      <Modal animationType="fade" transparent visible={filterPickerVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filters</Text>
            <Text style={styles.modalSubtitle}>Choose which outcomes to show.</Text>

            <View style={styles.filterOptionList}>
              {filterOptions.map((option) => {
                const selected = selectedFilter === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setSelectedFilter(option.value);
                      setFilterPickerVisible(false);
                    }}
                    style={[styles.filterOptionButton, selected ? styles.filterOptionButtonActive : null]}
                  >
                    <Text style={[styles.filterOptionText, selected ? styles.filterOptionTextActive : null]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setFilterPickerVisible(false)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function ProgramChairOutcomeRubricScreen({ route }) {
  const initialOutcome = route.params?.outcome;
  const [outcome, setOutcome] = useState(initialOutcome);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [editingVisible, setEditingVisible] = useState(false);
  const [addingVisible, setAddingVisible] = useState(false);
  const [savingIndicator, setSavingIndicator] = useState(false);
  const [error, setError] = useState("");
  const [deletingIndicator, setDeletingIndicator] = useState(null);

  async function handleSaveIndicator(nextDescription) {
    if (!editingIndicator) return;

    try {
      setSavingIndicator(true);
      setError("");

      const allOutcomes = await fetchStudentOutcomesMobile();
      const updatedOutcomes = allOutcomes.map((item) => {
        if (String(item.id) !== String(outcome.id)) return item;

        return {
          ...item,
          indicators: (item.indicators || []).map((indicator) =>
            String(indicator.id) === String(editingIndicator.id)
              ? { ...indicator, description: nextDescription }
              : indicator
          ),
        };
      });

      const savedOutcomes = await saveStudentOutcomesMobile(updatedOutcomes);
      const savedCurrent = savedOutcomes.find((item) => String(item.id) === String(outcome.id));

      if (savedCurrent) {
        setOutcome(savedCurrent);
      }

      setEditingVisible(false);
      setEditingIndicator(null);
    } catch (saveError) {
      setError(saveError.response?.data?.detail || saveError.message || "Failed to save indicator changes.");
    } finally {
      setSavingIndicator(false);
    }
  }

  async function handleAddIndicator(nextDescription) {
    try {
      setSavingIndicator(true);
      setError("");

      const allOutcomes = await fetchStudentOutcomesMobile();
      const updatedOutcomes = allOutcomes.map((item) => {
        if (String(item.id) !== String(outcome.id)) return item;

        const indicators = item.indicators || [];
        const nextNumber = indicators.reduce((max, indicator) => Math.max(max, indicator.number || 0), 0) + 1;

        return {
          ...item,
          indicators: [
            ...indicators,
            {
              id: `new_pi_${Date.now()}`,
              number: nextNumber,
              description: nextDescription,
              criteria: [],
            },
          ],
        };
      });

      const savedOutcomes = await saveStudentOutcomesMobile(updatedOutcomes);
      const savedCurrent = savedOutcomes.find((item) => String(item.id) === String(outcome.id));

      if (savedCurrent) {
        setOutcome(savedCurrent);
      }

      setAddingVisible(false);
    } catch (saveError) {
      setError(saveError.response?.data?.detail || saveError.message || "Failed to add performance indicator.");
    } finally {
      setSavingIndicator(false);
    }
  }

  function handleDeleteIndicator(indicatorToDelete) {
    setDeletingIndicator(indicatorToDelete);
  }

  async function confirmDeleteIndicator() {
    if (!deletingIndicator) return;

    try {
      setSavingIndicator(true);
      setError("");

      const allOutcomes = await fetchStudentOutcomesMobile();
      const updatedOutcomes = allOutcomes.map((item) => {
        if (String(item.id) !== String(outcome.id)) return item;

        const nextIndicators = (item.indicators || [])
          .filter((indicator) => String(indicator.id) !== String(deletingIndicator.id))
          .map((indicator, index) => ({
            ...indicator,
            number: index + 1,
          }));

        return {
          ...item,
          indicators: nextIndicators,
        };
      });

      const savedOutcomes = await saveStudentOutcomesMobile(updatedOutcomes);
      const savedCurrent = savedOutcomes.find((item) => String(item.id) === String(outcome.id));

      if (savedCurrent) {
        setOutcome(savedCurrent);
      }

      setDeletingIndicator(null);
    } catch (saveError) {
      setError(saveError.response?.data?.detail || saveError.message || "Failed to delete performance indicator.");
    } finally {
      setSavingIndicator(false);
    }
  }

  return (
    <AppScreen
      eyebrow="Rubric"
      title={outcome.title}
      subtitle={outcome.description}
      showMeta={false}
      heroFooter={
        <Pressable
          onPress={() => setAddingVisible(true)}
          style={styles.addPiButton}
        >
          <Text style={styles.addPiButtonText}>Add Performance Indicator</Text>
        </Pressable>
      }
    >
      {error ? (
        <InfoCard title="Error">
          <Text style={styles.errorText}>{error}</Text>
        </InfoCard>
      ) : null}

      <InfoCard title={`SO ${outcome.number}`}>
        {outcome.indicators.length === 0 ? (
          <Text style={styles.mutedText}>No performance indicators yet.</Text>
        ) : (
          outcome.indicators.map((indicator, index) => (
            <View key={indicator.id} style={styles.rubricCard}>
              <View style={styles.rubricHeaderRow}>
                <Text style={styles.rubricLabel}>PI {index + 1}</Text>
                <View style={styles.rubricActions}>
                  <Pressable
                    onPress={() => {
                      setEditingIndicator(indicator);
                      setEditingVisible(true);
                    }}
                    style={styles.editPiButton}
                    disabled={savingIndicator}
                  >
                    <Text style={styles.editPiButtonText}>Edit PI</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteIndicator(indicator)}
                    style={styles.deletePiButton}
                    disabled={savingIndicator}
                  >
                    <Text style={styles.deletePiButtonText}>Delete PI</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.rubricTitle}>{indicator.description}</Text>
              {indicator.criteria.length > 0 ? (
                indicator.criteria.map((criterion, criterionIndex) => (
                  <View key={criterion.id} style={styles.criterionRow}>
                    <View style={styles.criterionBadgePill}>
                      <Text style={styles.criterionBadge}>PC {criterionIndex + 1}</Text>
                    </View>
                    <Text style={styles.criterionText}>{criterion.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.mutedText}>No criteria for this indicator.</Text>
              )}
            </View>
          ))
        )}
      </InfoCard>

      <IndicatorEditModal
        indicator={editingIndicator}
        onClose={() => {
          setEditingVisible(false);
          setEditingIndicator(null);
        }}
        onSave={handleSaveIndicator}
        saving={savingIndicator}
        visible={editingVisible}
      />

      <IndicatorAddModal
        onClose={() => setAddingVisible(false)}
        onSave={handleAddIndicator}
        saving={savingIndicator}
        visible={addingVisible}
      />

      <DeleteConfirmModal
        visible={Boolean(deletingIndicator)}
        title="Delete Performance Indicator?"
        message="This will remove the indicator and its criteria."
        loading={savingIndicator}
        onCancel={() => setDeletingIndicator(null)}
        onConfirm={confirmDeleteIndicator}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  controlCard: {
    backgroundColor: WHITE,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  controlHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  controlEyebrow: {
    color: "#B26B00",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  controlStatus: {
    backgroundColor: "#FFF7D6",
    borderRadius: 999,
    color: BLACK,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  metricChip: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 64,
    padding: 10,
  },
  metricValue: {
    color: BLACK,
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    color: colors.gray,
    fontSize: 11,
    marginTop: 4,
  },
  toolbarRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    color: BLACK,
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: BLACK,
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 46,
    minWidth: 96,
    paddingHorizontal: 14,
  },
  refreshButtonText: {
    color: YELLOW,
    fontSize: 13,
    fontWeight: "800",
  },
  filterDropdownButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterDropdownButtonText: {
    color: BLACK,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    marginRight: 6,
  },
  filterDropdownChevron: {
    color: BLACK,
    fontSize: 16,
    fontWeight: "700",
  },
  filterOptionList: {
    gap: 10,
    marginTop: 16,
  },
  filterOptionButton: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterOptionButtonActive: {
    backgroundColor: BLACK,
    borderColor: BLACK,
  },
  filterOptionText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: "700",
  },
  filterOptionTextActive: {
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  saveRow: {
    justifyContent: "flex-end",
  },
  addButton: {
    alignItems: "center",
    backgroundColor: YELLOW,
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 170,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addButtonText: {
    color: BLACK,
    fontSize: 13,
    fontWeight: "800",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: BLACK,
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "800",
  },
  savedPill: {
    alignItems: "center",
    backgroundColor: YELLOW,
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 170,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  savedPillText: {
    color: BLACK,
    fontSize: 12,
    fontWeight: "700",
  },
  resultsText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.55,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  mutedText: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
  },
  cardTop: {
    flexDirection: "row",
    gap: 14,
  },
  outcomeAccentBar: {
    backgroundColor: YELLOW,
    borderRadius: 999,
    height: 4,
    marginBottom: 12,
    width: 44,
  },
  numberBox: {
    alignItems: "center",
    backgroundColor: BLACK,
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  numberText: {
    color: YELLOW,
    fontSize: 22,
    fontWeight: "800",
  },
  cardMain: {
    flex: 1,
  },
  outcomeTitle: {
    color: BLACK,
    fontSize: 17,
    fontWeight: "800",
  },
  outcomeDescription: {
    color: colors.darkAlt,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
  },
  ghostButton: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ghostButtonText: {
    color: BLACK,
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: "#E11D48",
    fontSize: 13,
    fontWeight: "700",
  },
  summaryBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    marginTop: 16,
    padding: 12,
  },
  summaryLabel: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryText: {
    color: colors.gray,
    fontSize: 13,
    marginTop: 6,
  },
  indicatorList: {
    gap: 10,
    marginTop: 10,
  },
  indicatorCard: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  indicatorTitle: {
    color: "#B26B00",
    fontSize: 12,
    fontWeight: "800",
  },
  indicatorDescription: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 4,
  },
  criteriaList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    gap: 4,
  },
  criteriaItem: {
    color: colors.darkAlt,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    marginTop: 16,
    padding: 12,
  },
  emptyText: {
    color: colors.gray,
    fontSize: 13,
    fontStyle: "italic",
  },
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    borderColor: colors.graySoft,
    borderWidth: 1,
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    padding: 20,
  },
  modalTitle: {
    color: BLACK,
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: BLACK,
    fontSize: 14,
    marginTop: 6,
  },
  fieldBlock: {
    marginTop: 14,
  },
  fieldLabel: {
    color: BLACK,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    color: BLACK,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalTextarea: {
    minHeight: 120,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderWidth: 1,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: YELLOW,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: "800",
  },
  confirmCard: {
    backgroundColor: WHITE,
    borderColor: colors.graySoft,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    padding: 20,
  },
  confirmIconWrap: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: YELLOW,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  confirmIcon: {
    color: BLACK,
    fontSize: 18,
    fontWeight: "900",
  },
  confirmTitle: {
    color: BLACK,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center",
  },
  confirmMessage: {
    color: BLACK,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  deletePrimaryButton: {
    alignItems: "center",
    backgroundColor: BLACK,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  deletePrimaryButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "800",
  },
  rubricCard: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  addPiButton: {
    alignSelf: "flex-start",
    backgroundColor: YELLOW,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addPiButtonText: {
    color: BLACK,
    fontSize: 12,
    fontWeight: "800",
  },
  rubricHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  rubricActions: {
    flexDirection: "row",
    gap: 8,
  },
  rubricLabel: {
    alignSelf: "flex-start",
    backgroundColor: BLACK,
    borderRadius: 999,
    color: YELLOW,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editPiButton: {
    backgroundColor: YELLOW,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editPiButtonText: {
    color: BLACK,
    fontSize: 12,
    fontWeight: "700",
  },
  deletePiButton: {
    backgroundColor: WHITE,
    borderColor: BLACK,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deletePiButtonText: {
    color: BLACK,
    fontSize: 12,
    fontWeight: "700",
  },
  rubricTitle: {
    color: BLACK,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  criterionRow: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255,194,14,0.14)",
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    padding: 8,
  },
  criterionBadgePill: {
    backgroundColor: YELLOW,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  criterionBadge: {
    color: BLACK,
    fontSize: 11,
    fontWeight: "800",
  },
  criterionText: {
    color: BLACK,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
