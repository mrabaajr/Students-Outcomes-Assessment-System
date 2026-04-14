import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
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
          <Text style={styles.modalSubtitle}>
            Fill in the outcome details below.
          </Text>

          <TextInput
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.gray}
            style={styles.modalInput}
            value={title}
          />
          <TextInput
            multiline
            onChangeText={setDescription}
            placeholder="Describe the student outcome..."
            placeholderTextColor={colors.gray}
            style={[styles.modalInput, styles.modalTextarea]}
            textAlignVertical="top"
            value={description}
          />

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

export default function ProgramChairStudentOutcomesScreen({ navigation }) {
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState(null);

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

  const nextNumber = useMemo(() => {
    const usedNumbers = new Set(outcomes.map((item) => item.number));
    let candidate = 1;
    while (usedNumbers.has(candidate)) candidate += 1;
    return candidate;
  }, [outcomes]);

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
    Alert.alert(
      "Delete Student Outcome?",
      `This will remove ${outcome.title} and its rubric details.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setOutcomes((prev) => prev.filter((item) => item.id !== outcome.id));
            setHasUnsavedChanges(true);
          },
        },
      ]
    );
  }

  return (
    <>
      <AppScreen
        eyebrow="Outcomes Management"
        title={"Student\nOutcomes"}
        subtitle="Define and manage student outcomes, performance indicators, and evaluation criteria for your program assessment."
      >
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => {
              setEditingOutcome(null);
              setFormVisible(true);
            }}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>ADD NEW SO</Text>
          </Pressable>

          {hasUnsavedChanges ? (
            <Pressable
              onPress={handleSaveBackend}
              style={[styles.saveButton, saving && styles.disabledButton]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </Pressable>
          ) : null}
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
        ) : outcomes.length === 0 ? (
          <InfoCard title="No Student Outcomes Yet">
            <Text style={styles.mutedText}>
              No student outcomes yet. Tap "ADD NEW SO" to get started.
            </Text>
          </InfoCard>
        ) : (
          outcomes.map((outcome) => {
            const criteriaCount = outcome.indicators.reduce(
              (sum, indicator) => sum + Math.max(indicator.criteria.length, 1),
              0
            );

            return (
              <InfoCard key={outcome.id}>
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
                    <Text style={styles.ghostButtonText}>Rubric</Text>
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
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                      <View style={styles.pillsRow}>
                        {outcome.indicators.map((indicator, index) => (
                          <View key={indicator.id} style={styles.indicatorPill}>
                            <Text style={styles.indicatorLabel}>PI {index + 1}</Text>
                            <Text style={styles.indicatorText} numberOfLines={2}>
                              {indicator.description}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
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
    </>
  );
}

export function ProgramChairOutcomeRubricScreen({ route }) {
  const { outcome } = route.params;

  return (
    <AppScreen
      eyebrow="Rubric"
      title={outcome.title}
      subtitle={outcome.description}
    >
      <InfoCard title={`SO ${outcome.number}`}>
        {outcome.indicators.length === 0 ? (
          <Text style={styles.mutedText}>No performance indicators yet.</Text>
        ) : (
          outcome.indicators.map((indicator, index) => (
            <View key={indicator.id} style={styles.rubricCard}>
              <Text style={styles.rubricLabel}>PI {index + 1}</Text>
              <Text style={styles.rubricTitle}>{indicator.description}</Text>
              {indicator.criteria.length > 0 ? (
                indicator.criteria.map((criterion, criterionIndex) => (
                  <View key={criterion.id} style={styles.criterionRow}>
                    <Text style={styles.criterionBadge}>PC {criterionIndex + 1}</Text>
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
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  addButton: {
    backgroundColor: colors.yellow,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  addButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: 12,
    justifyContent: "center",
    minWidth: 130,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "800",
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
  numberBox: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  numberText: {
    color: colors.yellow,
    fontSize: 22,
    fontWeight: "800",
  },
  cardMain: {
    flex: 1,
  },
  outcomeTitle: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: "800",
  },
  outcomeDescription: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  ghostButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ghostButtonText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700",
  },
  summaryBox: {
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 14,
  },
  summaryLabel: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryText: {
    color: colors.dark,
    fontSize: 13,
    marginTop: 6,
  },
  pillsScroll: {
    marginTop: 12,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 8,
  },
  indicatorPill: {
    backgroundColor: "#fff8db",
    borderColor: colors.graySoft,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    width: 180,
  },
  indicatorLabel: {
    color: colors.dark,
    fontSize: 11,
    fontWeight: "800",
  },
  indicatorText: {
    color: colors.dark,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  emptyBox: {
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 14,
  },
  emptyText: {
    color: colors.gray,
    fontSize: 13,
    fontStyle: "italic",
  },
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: colors.gray,
    fontSize: 14,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 15,
    marginTop: 16,
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
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  rubricCard: {
    borderBottomColor: colors.graySoft,
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
  },
  rubricLabel: {
    alignSelf: "flex-start",
    backgroundColor: colors.dark,
    borderRadius: 999,
    color: colors.yellow,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rubricTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 10,
  },
  criterionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  criterionBadge: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: "800",
    width: 34,
  },
  criterionText: {
    color: colors.gray,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
