import { useCallback, useEffect, useMemo, useState } from "react";
function CriterionAddModal({ visible, saving, onClose, onSave }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (visible) setName("");
  }, [visible]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Criterion</Text>
          <Text style={styles.modalSubtitle}>Enter the criterion name.</Text>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Criterion name</Text>
            <TextInput
              onChangeText={setName}
              placeholder="e.g. Solve complex problems"
              placeholderTextColor="rgba(0,0,0,0.45)"
              style={styles.modalInput}
              value={name}
            />
          </View>
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(name.trim())}
              style={[styles.primaryButton, (!name.trim() || saving) && styles.disabledButton]}
              disabled={!name.trim() || saving}
            >
              <Text style={styles.primaryButtonText}>Add</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

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
  saving,
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
                (!title.trim() || !description.trim() || saving) && styles.disabledButton,
              ]}
              disabled={!title.trim() || !description.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color={BLACK} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {editingOutcome ? "Save Changes" : "Add SO"}
                </Text>
              )}
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

  const loadOutcomes = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await fetchStudentOutcomesMobile();
      setOutcomes(data);
      setHasUnsavedChanges(false);
    } catch (loadError) {
      setError(loadError.response?.data?.detail || loadError.message || "Failed to load student outcomes.");
    } finally {
      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadOutcomes();
  }, [loadOutcomes]);

  useFocusEffect(
    useCallback(() => {
      loadOutcomes(true);
    }, [loadOutcomes])
  );

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

  async function persistOutcomes(nextOutcomes, options = {}) {
    const { closeForm = false, clearDeleting = false } = options;

    try {
      setSaving(true);
      setError("");
      const saved = await saveStudentOutcomesMobile(nextOutcomes);
      setOutcomes(saved.sort((a, b) => a.number - b.number));
      setHasUnsavedChanges(false);
      if (closeForm) {
        setFormVisible(false);
        setEditingOutcome(null);
      }
      if (clearDeleting) {
        setDeletingOutcome(null);
      }
    } catch (saveError) {
      setError(saveError.response?.data?.detail || saveError.message || "Failed to save student outcomes.");
      setHasUnsavedChanges(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLocal(outcome) {
    const nextOutcomes = (() => {
      const exists = outcomes.some((item) => item.id === outcome.id);
      const next = exists
        ? outcomes.map((item) => (item.id === outcome.id ? outcome : item))
        : [...outcomes, outcome];

      return [...next].sort((a, b) => a.number - b.number);
    })();
    setOutcomes(nextOutcomes);
    setHasUnsavedChanges(true);
    await persistOutcomes(nextOutcomes, { closeForm: true });
  }

  async function handleSaveBackend() {
    await persistOutcomes(outcomes);
  }

  function handleDelete(outcome) {
    setDeletingOutcome(outcome);
  }

  async function confirmDeleteOutcome() {
    if (!deletingOutcome) return;

    const nextOutcomes = outcomes.filter((item) => item.id !== deletingOutcome.id);
    setOutcomes(nextOutcomes);
    setHasUnsavedChanges(true);
    await persistOutcomes(nextOutcomes, { clearDeleting: true });
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
        onRefresh={() => loadOutcomes(true)}
        refreshing={refreshing}
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
            const indicators = outcome.indicators || [];
            const criteriaCount = indicators.reduce(
              (sum, indicator) => sum + Math.max((indicator.criteria || []).length, 1),
              0
            );

            return (
              <InfoCard key={outcome.id}>
                <View style={styles.webOutcomeCard}>
                  <View style={styles.outcomeHeaderRow}>
                    <View style={styles.cardTop}>
                      <View style={styles.numberBoxCompact}>
                        <Text style={styles.numberTextCompact}>{outcome.number}</Text>
                      </View>
                      <View style={styles.cardMain}>
                        <Text style={styles.outcomeTitle}>{outcome.title}</Text>
                        <Text style={styles.outcomeDescription}>{outcome.description}</Text>
                      </View>
                    </View>

                    <View style={styles.iconActionRow}>
                      <Pressable
                        onPress={() =>
                          navigation.navigate("ProgramChairOutcomeRubric", {
                            outcome,
                          })
                        }
                        style={styles.iconActionButton}
                      >
                        <Feather name="eye" size={14} color="#6B7280" />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setEditingOutcome(outcome);
                          setFormVisible(true);
                        }}
                        style={styles.iconActionButton}
                      >
                        <Feather name="edit-2" size={14} color="#6B7280" />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(outcome)} style={styles.iconActionButton}>
                        <Feather name="trash-2" size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {indicators.length > 0 ? (
                  <View style={styles.tableSection}>
                    <Text style={styles.tableSectionLabel}>PERFORMANCE INDICATORS & CRITERIA</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScrollContent}>
                      <View style={[styles.piTable, { minWidth: Math.max(320, indicators.length * 210) }]}>
                        <View style={styles.tableTopBand}>
                          <Text style={styles.tableTopBandText}>PERFORMANCE INDICATOR</Text>
                        </View>

                        <View style={styles.tableIndicatorsRow}>
                          {indicators.map((indicator, index) => (
                            <View key={indicator.id} style={styles.tableCell}>
                              <Text style={styles.tableCellPi}>PI {index + 1}</Text>
                              <Text style={styles.tableCellText}>{indicator.description}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.tableCriteriaRow}>
                          {indicators.map((indicator) => {
                            const criteria = indicator.criteria || [];
                            return (
                              <View key={`criteria_${indicator.id}`} style={styles.tableCellCriteria}>
                                {criteria.length === 0 ? (
                                  <Text style={styles.tableCriteriaMuted}>No criteria</Text>
                                ) : (
                                  criteria.slice(0, 2).map((criterion, criterionIndex) => (
                                    <Text key={criterion.id} style={styles.tableCriteriaText}>
                                      PC {criterionIndex + 1}: {criterion.name}
                                    </Text>
                                  ))
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </ScrollView>
                    <Text style={styles.summaryText}>
                      {indicators.length} indicator{indicators.length === 1 ? "" : "s"} • {criteriaCount} criteria columns
                    </Text>
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
        saving={saving}
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
        loading={saving}
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

export function ProgramChairOutcomeRubricScreen({ navigation, route }) {
  const [inlineAdd, setInlineAdd] = useState({ indicatorId: null, rowIndex: null, value: "" });
  const [criterionModal, setCriterionModal] = useState({ visible: false, indicatorId: null, rowIndex: null });
  const { width: viewportWidth } = useWindowDimensions();
  const initialOutcome = route.params?.outcome;
  const [outcome, setOutcome] = useState(initialOutcome);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [editingVisible, setEditingVisible] = useState(false);
  const [addingVisible, setAddingVisible] = useState(false);
  const [savingIndicator, setSavingIndicator] = useState(false);
  const [error, setError] = useState("");
  const [deletingIndicator, setDeletingIndicator] = useState(null);

  async function saveCurrentOutcome(nextOutcome) {
    const allOutcomes = await fetchStudentOutcomesMobile();
    const updatedOutcomes = allOutcomes.map((item) =>
      String(item.id) === String(nextOutcome.id) ? nextOutcome : item
    );
    const savedOutcomes = await saveStudentOutcomesMobile(updatedOutcomes);
    return savedOutcomes.find((item) => String(item.id) === String(nextOutcome.id)) || nextOutcome;
  }

  async function confirmDeleteIndicator() {
    if (!deletingIndicator) return;
    try {
      setSavingIndicator(true);
      setError("");
      const nextOutcome = {
        ...outcome,
        indicators: (outcome.indicators || [])
          .filter((ind) => String(ind.id) !== String(deletingIndicator.id))
          .map((ind, idx) => ({ ...ind, number: idx + 1 })),
      };
      const savedCurrent = await saveCurrentOutcome(nextOutcome);
      setOutcome(savedCurrent);
      setDeletingIndicator(null);
    } catch (deleteError) {
      setError(deleteError.response?.data?.detail || deleteError.message || "Failed to delete indicator.");
    } finally {
      setSavingIndicator(false);
    }
  }

  async function handleSaveCriterion(criterionName) {
    if (!criterionModal.indicatorId || !criterionName) return;
    try {
      setSavingIndicator(true);
      setError("");
      const nextOutcome = {
        ...outcome,
        indicators: (outcome.indicators || []).map((indicator) => {
          if (String(indicator.id) !== String(criterionModal.indicatorId)) return indicator;
          const criteria = indicator.criteria ? [...indicator.criteria] : [];
          if (criterionModal.rowIndex != null && criteria.length > criterionModal.rowIndex) {
            criteria[criterionModal.rowIndex] = { id: `crit_${Date.now()}`, name: criterionName };
          } else {
            criteria.push({ id: `crit_${Date.now()}`, name: criterionName });
          }
          return { ...indicator, criteria };
        }),
      };
      const savedCurrent = await saveCurrentOutcome(nextOutcome);
      setOutcome(savedCurrent);
      setCriterionModal({ visible: false, indicatorId: null, rowIndex: null });
    } catch (saveError) {
      setError(saveError.response?.data?.detail || saveError.message || "Failed to add criterion.");
    } finally {
      setSavingIndicator(false);
    }
  }

  async function handleSaveIndicator(nextDescription) {
    if (!editingIndicator) return;

    try {
      setSavingIndicator(true);
      setError("");
      const nextOutcome = {
        ...outcome,
        indicators: (outcome.indicators || []).map((indicator) =>
          String(indicator.id) === String(editingIndicator.id)
            ? { ...indicator, description: nextDescription }
            : indicator
        ),
      };
      const savedCurrent = await saveCurrentOutcome(nextOutcome);
      setOutcome(savedCurrent);
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
      const indicators = outcome.indicators || [];
      const nextNumber = indicators.reduce((max, indicator) => Math.max(max, indicator.number || 0), 0) + 1;
      const nextOutcome = {
        ...outcome,
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
      const savedCurrent = await saveCurrentOutcome(nextOutcome);
      setOutcome(savedCurrent);
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

  const indicators = outcome?.indicators || [];
  const maxCriteriaRows = Math.max(2, ...indicators.map((indicator) => (indicator.criteria || []).length));
  const criteriaColWidth = 90;
  const plusColWidth = 48;
  const tableChromePadding = 64;
  const availablePiWidth = viewportWidth - criteriaColWidth - plusColWidth - tableChromePadding;
  const piColumnWidth = indicators.length <= 1
    ? Math.max(220, Math.min(320, availablePiWidth))
    : 260;

  function handleAddCriterion(indicatorId, rowIndex) {
    setInlineAdd({ indicatorId, rowIndex, value: "" });
  }

  function handleInlineChange(text) {
    setInlineAdd((prev) => ({ ...prev, value: text }));
  }

  async function handleInlineSave() {
    if (!inlineAdd.indicatorId || !inlineAdd.value.trim()) {
      setInlineAdd({ indicatorId: null, rowIndex: null, value: "" });
      return;
    }

    try {
      setSavingIndicator(true);
      setError("");
      const nextOutcome = {
        ...outcome,
        indicators: (outcome.indicators || []).map((ind) => {
          if (String(ind.id) !== String(inlineAdd.indicatorId)) return ind;
          const criteria = ind.criteria ? [...ind.criteria] : [];
          if (inlineAdd.rowIndex != null && criteria.length > inlineAdd.rowIndex) {
            criteria[inlineAdd.rowIndex] = { id: `crit_${Date.now()}`, name: inlineAdd.value.trim() };
          } else {
            criteria.push({ id: `crit_${Date.now()}`, name: inlineAdd.value.trim() });
          }
          return { ...ind, criteria };
        }),
      };
      const savedCurrent = await saveCurrentOutcome(nextOutcome);
      setOutcome(savedCurrent);
      setInlineAdd({ indicatorId: null, rowIndex: null, value: "" });
    } catch (saveError) {
      setError(saveError.response?.data?.detail || saveError.message || "Failed to save criterion.");
    } finally {
      setSavingIndicator(false);
    }
  }

  function handleInlineCancel() {
    setInlineAdd({ indicatorId: null, rowIndex: null, value: "" });
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

      <InfoCard>
        <View style={styles.rubricTopRow}>
          <View style={styles.rubricTopLeft}>
            <View style={styles.numberBoxCompact}>
              <Text style={styles.numberTextCompact}>{outcome.number}</Text>
            </View>
            <Text style={styles.rubricPanelTitle}>{outcome.title} - Rubric</Text>
          </View>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconActionButton}>
            <Text style={styles.rubricCloseText}>X</Text>
          </Pressable>
        </View>
        <Text numberOfLines={2} ellipsizeMode="tail" style={styles.rubricPanelSubtitle}>
          {outcome.description}
        </Text>

        {indicators.length === 0 ? (
          <Text style={styles.mutedText}>No performance indicators yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.rubricTableScrollContent}>
            <View
              style={[
                styles.rubricTable,
                {
                  minWidth: criteriaColWidth + indicators.length * piColumnWidth + plusColWidth,
                },
              ]}
            >
              <View style={styles.rubricTableHeaderRow}>
                <View style={[styles.rubricHeaderCell, styles.criteriaCol]}>
                  <Text style={styles.rubricHeaderCellText}>Criteria</Text>
                </View>
                {indicators.map((indicator, index) => (
                  <View key={`header_${indicator.id}`} style={[styles.piHeaderCol, { width: piColumnWidth }]}>
                    <View style={styles.piHeaderTitleRow}>
                      <Text style={styles.rubricHeaderCellText}>{`PI ${index + 1}`}</Text>
                      <View style={styles.piHeaderIcons}>
                        <Pressable
                          onPress={() => {
                            setEditingIndicator(indicator);
                            setEditingVisible(true);
                          }}
                          style={styles.piHeaderIconButton}
                        >
                          <Feather name="edit-2" size={12} color="#D1D5DB" />
                        </Pressable>
                        <Pressable onPress={() => handleDeleteIndicator(indicator)} style={styles.piHeaderIconButton}>
                          <Feather name="trash-2" size={12} color="#FCA5A5" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
                <Pressable onPress={() => setAddingVisible(true)} style={styles.plusHeaderCol}>
                  <Text style={styles.plusHeaderText}>+</Text>
                </Pressable>
              </View>

              <View style={styles.rubricTableBodyRow}>
                <View style={[styles.rubricBodyCell, styles.criteriaCol]}>
                  <View style={styles.criteriaChip}><Text style={styles.criteriaChipText}>Desc</Text></View>
                </View>
                {indicators.map((indicator) => (
                  <View key={`desc_${indicator.id}`} style={[styles.piBodyCol, { width: piColumnWidth }]}>
                    <Text style={styles.rubricBodyCellText}>
                      {indicator.description}
                    </Text>
                  </View>
                ))}
                <View style={styles.plusBodyCol} />
              </View>

              {Array.from({ length: maxCriteriaRows }).map((_, rowIndex) => (
                <View key={`row_${rowIndex}`} style={styles.rubricTableBodyRow}>
                  <View style={[styles.rubricBodyCell, styles.criteriaCol]}>
                    <View style={styles.criteriaChip}><Text style={styles.criteriaChipText}>{`PC ${rowIndex + 1}`}</Text></View>
                  </View>
                  {indicators.map((indicator) => {
                    const criterion = (indicator.criteria || [])[rowIndex];
                    const isInline = inlineAdd.indicatorId === indicator.id && inlineAdd.rowIndex === rowIndex;
                    return (
                      <View key={`criterion_${indicator.id}_${rowIndex}`} style={[styles.piBodyCol, { width: piColumnWidth }]}> 
                        {isInline ? (
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TextInput
                              style={[styles.rubricBodyCellText, { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 8, marginRight: 6 }]}
                              placeholder="Criterion name..."
                              value={inlineAdd.value}
                              onChangeText={handleInlineChange}
                              autoFocus
                            />
                            <Pressable onPress={handleInlineSave} style={{ backgroundColor: 'black', borderRadius: 6, padding: 4, marginRight: 4 }}>
                              <Text style={{ color: 'white', fontSize: 16 }}>✓</Text>
                            </Pressable>
                            <Pressable onPress={handleInlineCancel} style={{ backgroundColor: '#eee', borderRadius: 6, padding: 4 }}>
                              <Text style={{ color: 'black', fontSize: 16 }}>✗</Text>
                            </Pressable>
                          </View>
                        ) : criterion && criterion.name ? (
                          <Text style={styles.rubricBodyCellText}>{criterion.name}</Text>
                        ) : (
                          <Pressable onPress={() => handleAddCriterion(indicator.id, rowIndex)}>
                            <Text style={[styles.rubricBodyCellText, { color: BLACK }]}>+ Add</Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                  <View style={styles.plusBodyCol} />
                </View>
              ))}

              <View style={styles.rubricTableBodyRow}>
                <View style={[styles.rubricBodyCell, styles.criteriaCol]} />
                {indicators.map((indicator) => (
                  <View key={`add_${indicator.id}`} style={[styles.piBodyCol, { width: piColumnWidth }]}> 
                    <Pressable onPress={() => handleAddCriterion(indicator.id, (indicator.criteria || []).length)}>
                      <Text style={[styles.rubricBodyCellText, { color: BLACK }]}>+ Add Criterion</Text>
                    </Pressable>
                  </View>
                ))}
                <View style={styles.plusBodyCol} />
              </View>
            </View>
          </ScrollView>
        )}

        <View style={styles.rubricFooterActions}>
          <Pressable style={styles.rubricCancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.rubricCancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.rubricSaveBtn, savingIndicator && styles.disabledButton]}
            onPress={async () => {
              try {
                setSavingIndicator(true);
                setError("");
                const savedCurrent = await saveCurrentOutcome(outcome);
                setOutcome(savedCurrent);
              } catch (saveError) {
                setError(saveError.response?.data?.detail || saveError.message || "Failed to save rubric.");
              } finally {
                setSavingIndicator(false);
              }
            }}
            disabled={savingIndicator}
          >
            {savingIndicator ? (
              <ActivityIndicator color={BLACK} size="small" />
            ) : (
              <Text style={styles.rubricSaveBtnText}>Save Rubric</Text>
            )}
          </Pressable>
        </View>
      </InfoCard>

      <CriterionAddModal
        visible={criterionModal.visible}
        saving={savingIndicator}
        onClose={() => setCriterionModal({ visible: false, indicatorId: null, rowIndex: null })}
        onSave={handleSaveCriterion}
      />
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
    color: WHITE,
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
  webOutcomeCard: {
    borderColor: "rgba(0,0,0,0.16)",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  outcomeHeaderRow: {
    alignItems: "flex-start",
    backgroundColor: WHITE,
    borderBottomColor: "rgba(0,0,0,0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  numberBoxCompact: {
    alignItems: "center",
    backgroundColor: BLACK,
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  numberTextCompact: {
    color: YELLOW,
    fontSize: 18,
    fontWeight: "800",
  },
  iconActionRow: {
    flexDirection: "row",
    gap: 6,
    marginLeft: 8,
  },
  iconActionButton: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  tableSection: {
    backgroundColor: "#F3F4F6",
    padding: 10,
  },
  tableSectionLabel: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  tableScrollContent: {
    paddingTop: 8,
  },
  piTable: {
    backgroundColor: WHITE,
    borderColor: "rgba(0,0,0,0.16)",
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableTopBand: {
    alignItems: "center",
    backgroundColor: BLACK,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableTopBandText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tableIndicatorsRow: {
    flexDirection: "row",
  },
  tableCell: {
    borderRightColor: "#D1D5DB",
    borderRightWidth: 1,
    minWidth: 180,
    padding: 10,
  },
  tableCellPi: {
    color: "#9A6700",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 4,
  },
  tableCellText: {
    color: BLACK,
    fontSize: 12,
    lineHeight: 18,
  },
  tableCriteriaRow: {
    backgroundColor: "#F5EFD6",
    borderTopColor: "#D1D5DB",
    borderTopWidth: 1,
    flexDirection: "row",
  },
  tableCellCriteria: {
    borderRightColor: "#D1D5DB",
    borderRightWidth: 1,
    minWidth: 180,
    padding: 10,
  },
  tableCriteriaText: {
    color: BLACK,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  tableCriteriaMuted: {
    color: "#6B7280",
    fontSize: 11,
    fontStyle: "italic",
  },
  rubricTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rubricTopLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  rubricPanelTitle: {
    color: BLACK,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
  },
  rubricPanelSubtitle: {
    color: colors.darkAlt,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  rubricCloseText: {
    color: "#9CA3AF",
    fontSize: 22,
  },
  rubricTableScrollContent: {
    paddingBottom: 4,
  },
  rubricTable: {
    borderColor: "#D1D5DB",
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  rubricTableHeaderRow: {
    flexDirection: "row",
  },
  rubricHeaderCell: {
    alignItems: "center",
    backgroundColor: BLACK,
    borderRightColor: "#4B5563",
    borderRightWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 10,
  },
  criteriaCol: {
    minWidth: 90,
  },
  rubricHeaderCellText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "700",
  },
  piHeaderCol: {
    backgroundColor: BLACK,
    borderRightColor: "#4B5563",
    borderRightWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  piHeaderTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  piHeaderIcons: {
    flexDirection: "row",
    gap: 8,
  },
  piHeaderIconButton: {
    alignItems: "center",
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  plusHeaderCol: {
    alignItems: "center",
    backgroundColor: BLACK,
    justifyContent: "center",
    minWidth: 48,
  },
  plusHeaderText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "700",
  },
  rubricTableBodyRow: {
    flexDirection: "row",
  },
  rubricBodyCell: {
    alignItems: "center",
    backgroundColor: WHITE,
    borderRightColor: "#D1D5DB",
    borderRightWidth: 1,
    borderTopColor: "#D1D5DB",
    borderTopWidth: 1,
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  criteriaChip: {
    backgroundColor: "#F5EECF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  criteriaChipText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: "700",
  },
  piBodyCol: {
    backgroundColor: WHITE,
    borderRightColor: "#D1D5DB",
    borderRightWidth: 1,
    borderTopColor: "#D1D5DB",
    borderTopWidth: 1,
    alignItems: "flex-start",
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rubricBodyCellText: {
    color: BLACK,
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
    width: "100%",
  },
  plusBodyCol: {
    backgroundColor: WHITE,
    borderTopColor: "#D1D5DB",
    borderTopWidth: 1,
    minWidth: 48,
  },
  rubricFooterActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 12,
  },
  rubricCancelBtn: {
    alignItems: "center",
    backgroundColor: WHITE,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 90,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rubricCancelBtnText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: "600",
  },
  rubricSaveBtn: {
    alignItems: "center",
    backgroundColor: YELLOW,
    borderRadius: 8,
    minWidth: 122,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rubricSaveBtnText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: "800",
  },
  cardTop: {
    flexDirection: "row",
    flex: 1,
    gap: 10,
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
    color: colors.dark,
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
