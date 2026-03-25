import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save, Plus, Pencil } from "lucide-react";
import FormulaEditorDialog, {
  DEFAULT_VARIABLES,
} from "./FormulaEditorDialog";

const STORAGE_PREFIX = "so-summary-table";

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const formatNumberInput = (value, digits = 4) => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return "0";
  return numericValue.toFixed(digits).replace(/\.?0+$/, "");
};

const mergeStoredTable = (baseTable, storedTable) => {
  if (!storedTable) return deepClone(baseTable);

  const merged = deepClone(baseTable);
  merged.program = storedTable.program ?? merged.program;
  merged.source_assessment = storedTable.source_assessment ?? merged.source_assessment;
  merged.time_of_data_collection = storedTable.time_of_data_collection ?? merged.time_of_data_collection;
  merged.totals.target_level = storedTable?.totals?.target_level ?? merged.totals.target_level;
  merged.totals.target_statement =
    storedTable?.totals?.target_statement ??
    merged.totals.target_statement ??
    `${merged.totals.target_level}% of the class gets satisfactory rating or higher`;
  merged.totals.conclusion = storedTable?.totals?.conclusion ?? merged.totals.conclusion;

  merged.courses = merged.courses.map((course) => {
    const storedCourse = storedTable?.courses?.find((item) => item.course_id === course.course_id);
    if (!storedCourse) return course;

    return {
      ...course,
      course_name: storedCourse.course_name ?? course.course_name,
      actual_class_size: storedCourse.actual_class_size ?? course.actual_class_size,
      cli: storedCourse.cli ?? course.cli,
      answered_count: storedCourse.answered_count ?? course.answered_count,
      virtual_class_size: storedCourse.virtual_class_size ?? course.virtual_class_size,
      weighted_total: storedCourse.weighted_total ?? course.weighted_total,
      indicators: course.indicators.map((indicator) => {
        const storedIndicator = storedCourse?.indicators?.find(
          (item) => item.indicator_id === indicator.indicator_id
        );
        if (!storedIndicator) return indicator;

        return {
          ...indicator,
          indicator_label: storedIndicator.indicator_label ?? indicator.indicator_label,
          distribution: storedIndicator.distribution ?? indicator.distribution,
          answered_count: storedIndicator.answered_count ?? indicator.answered_count,
          satisfactory_count: storedIndicator.satisfactory_count ?? indicator.satisfactory_count,
          weighted_value: storedIndicator.weighted_value ?? indicator.weighted_value,
        };
      }),
    };
  });

  merged.totals.attainment_percent =
    storedTable?.totals?.attainment_percent ?? merged.totals.attainment_percent;
  merged.totals.virtual_class_size_total =
    storedTable?.totals?.virtual_class_size_total ?? merged.totals.virtual_class_size_total;

  return merged;
};

function EditableInput({
  value,
  onChange,
  type = "text",
  align = "left",
  className = "",
  multiline = false,
}) {
  const baseClassName =
    "w-full box-border rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E] focus:bg-[#FFFCF3]";
  const alignClassName = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  if (multiline) {
    return (
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className={`${baseClassName} ${alignClassName} resize-y ${className}`}
      />
    );
  }

  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className={`${baseClassName} ${alignClassName} ${className}`}
    />
  );
}

function SOSummaryCard({ table }) {
  const storageKey = `${STORAGE_PREFIX}-${table.so_id}`;
  const initialTable = useMemo(() => {
    if (typeof window === "undefined") {
      return deepClone(table);
    }

    try {
      const storedValue = window.localStorage.getItem(storageKey);
      return mergeStoredTable(table, storedValue ? JSON.parse(storedValue) : null);
    } catch (error) {
      console.error("Failed to load saved SO summary table:", error);
      return deepClone(table);
    }
  }, [table, storageKey]);

  const [savedTable, setSavedTable] = useState(initialTable);
  const [draftTable, setDraftTable] = useState(initialTable);
  const [isSaved, setIsSaved] = useState(true);
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState(
    "(got80OrHigher / studentsAnswered) * distribution"
  );
  const [variables, setVariables] = useState(DEFAULT_VARIABLES);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [editingForm, setEditingForm] = useState(null);

  useEffect(() => {
    setSavedTable(initialTable);
    setDraftTable(initialTable);
    setIsSaved(true);
  }, [initialTable]);

  const updateDraft = (updater) => {
    setDraftTable((current) => {
      const next = typeof updater === "function" ? updater(deepClone(current)) : updater;
      setIsSaved(JSON.stringify(next) === JSON.stringify(savedTable));
      return next;
    });
  };

  const setCourseField = (courseId, field, value) => {
    updateDraft((current) => {
      current.courses = current.courses.map((course) =>
        course.course_id === courseId ? { ...course, [field]: value } : course
      );
      return current;
    });
  };

  const setIndicatorField = (courseId, indicatorId, field, value) => {
    updateDraft((current) => {
      current.courses = current.courses.map((course) => {
        if (course.course_id !== courseId) return course;

        return {
          ...course,
          indicators: course.indicators.map((indicator) =>
            indicator.indicator_id === indicatorId ? { ...indicator, [field]: value } : indicator
          ),
        };
      });
      return current;
    });
  };

  const customVariables = variables.filter(
    (v) => !DEFAULT_VARIABLES.some((d) => d.key === v.key)
  );

  const handleIndicatorEditStart = (courseId, indicator) => {
    setEditingIndicator({ courseId, indicatorId: indicator.indicator_id });
    setEditingForm({ ...indicator });
  };

  const handleIndicatorEditSave = (courseId, indicatorId) => {
    if (!editingForm) return;
    setIndicatorField(courseId, indicatorId, "indicator_label", editingForm.indicator_label);
    setIndicatorField(courseId, indicatorId, "distribution", editingForm.distribution);
    setIndicatorField(courseId, indicatorId, "answered_count", editingForm.answered_count);
    setIndicatorField(courseId, indicatorId, "satisfactory_count", editingForm.satisfactory_count);
    setIndicatorField(courseId, indicatorId, "weighted_value", editingForm.weighted_value);
    customVariables.forEach((v) => {
      if (editingForm[v.key] !== undefined) {
        setIndicatorField(courseId, indicatorId, v.key, editingForm[v.key]);
      }
    });
    setEditingIndicator(null);
    setEditingForm(null);
  };

  const handleIndicatorEditCancel = () => {
    setEditingIndicator(null);
    setEditingForm(null);
  };

  const handleDeleteIndicator = (courseId, indicatorId) => {
    updateDraft((current) => {
      current.courses = current.courses.map((course) => {
        if (course.course_id !== courseId) return course;
        return {
          ...course,
          indicators: course.indicators.filter((ind) => ind.indicator_id !== indicatorId),
        };
      });
      return current;
    });
  };

  const handleVariablesChange = (newVars) => {
    setVariables(newVars);
    const newCustomKeys = newVars
      .filter((v) => !DEFAULT_VARIABLES.some((d) => d.key === v.key))
      .map((v) => v.key);
    updateDraft((current) => {
      current.courses = current.courses.map((course) => ({
        ...course,
        indicators: course.indicators.map((indicator) => {
          const updated = { ...indicator };
          newCustomKeys.forEach((key) => {
            if (updated[key] === undefined) updated[key] = 0;
          });
          return updated;
        }),
      }));
      return current;
    });
  }

  const handleSave = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draftTable));
      setSavedTable(deepClone(draftTable));
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save SO summary table:", error);
    }
  };

  const handleReset = () => {
    setDraftTable(deepClone(savedTable));
    setIsSaved(true);
  };

  return (
    <section className="glass-card overflow-hidden border border-[#D8D2C4] bg-white/95 shadow-[0_18px_45px_rgba(35,31,32,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#E7E0D4] bg-[linear-gradient(135deg,#FFFDF8_0%,#F6F1E6_100%)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-[#E7D7A4] bg-[#FFF5D6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8A6A00]">
              SO {draftTable.so_number} Summary
            </div>
            <h2 className="text-lg font-semibold text-[#231F20]">
              Summary Result of Direct Assessment on Student Outcome
            </h2>
            <p className="max-w-4xl text-sm leading-6 text-[#4D4741]">
              SO {draftTable.so_number}. {draftTable.so_title}
              {draftTable.so_description ? `, ${draftTable.so_description}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D7D0C2] bg-white px-3 py-2 text-sm font-medium text-[#4D4741] transition hover:bg-[#F8F5EE]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-[#231F20] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3A3535]"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        <div className="text-xs font-medium text-[#7B746B]">
          {isSaved ? "Saved values are shown." : "You have unsaved changes in this card."}
        </div>
      </div>

      <div className="space-y-6 bg-[#FFFCF6] p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[#E5DED0] bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A817C]">Program</p>
            <EditableInput
              value={draftTable.program}
              onChange={(value) => updateDraft((current) => ({ ...current, program: value }))}
            />
          </div>
          <div className="rounded-xl border border-[#E5DED0] bg-white p-4 lg:col-span-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A817C]">Source of Assessment</p>
            <EditableInput
              value={draftTable.source_assessment}
              onChange={(value) =>
                updateDraft((current) => ({ ...current, source_assessment: value }))
              }
            />
          </div>
          <div className="rounded-xl border border-[#E5DED0] bg-white p-4 lg:col-span-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A817C]">Time of Data Collection</p>
            <EditableInput
              value={draftTable.time_of_data_collection}
              onChange={(value) =>
                updateDraft((current) => ({ ...current, time_of_data_collection: value }))
              }
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#D9D2C6] bg-white">
          <div className="border-b border-[#ECE5D8] bg-[#F7F1E4] px-4 py-3 text-sm font-semibold text-[#231F20]">
            Course Overview
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm text-[#231F20]">
              <thead className="bg-[#FCF8EE]">
                <tr>
                  <th className="border-b border-[#ECE5D8] px-4 py-3 text-left font-semibold">Courses</th>
                  <th className="border-b border-[#ECE5D8] px-4 py-3 text-center font-semibold">Actual Class Size</th>
                  <th className="border-b border-[#ECE5D8] px-4 py-3 text-center font-semibold">% of CLI</th>
                  <th className="border-b border-[#ECE5D8] px-4 py-3 text-center font-semibold">Students Answered</th>
                  <th className="border-b border-[#ECE5D8] px-4 py-3 text-center font-semibold">Virtual Class Size</th>
                </tr>
              </thead>
              <tbody>
                {draftTable.courses.map((course) => (
                  <tr key={course.course_id} className="even:bg-[#FFFCF7]">
                    <td className="border-b border-[#F1EADF] px-3 py-2">
                      <EditableInput
                        value={course.course_name}
                        onChange={(value) => setCourseField(course.course_id, "course_name", value)}
                      />
                    </td>
                    <td className="border-b border-[#F1EADF] px-3 py-2">
                      <EditableInput
                        type="number"
                        align="center"
                        value={course.actual_class_size}
                        onChange={(value) => setCourseField(course.course_id, "actual_class_size", value)}
                      />
                    </td>
                    <td className="border-b border-[#F1EADF] px-3 py-2">
                      <EditableInput
                        align="center"
                        value={formatNumberInput(course.cli)}
                        onChange={(value) => setCourseField(course.course_id, "cli", value)}
                      />
                    </td>
                    <td className="border-b border-[#F1EADF] px-3 py-2">
                      <EditableInput
                        type="number"
                        align="center"
                        value={course.answered_count}
                        onChange={(value) => setCourseField(course.course_id, "answered_count", value)}
                      />
                    </td>
                    <td className="border-b border-[#F1EADF] px-3 py-2">
                      <EditableInput
                        align="center"
                        value={formatNumberInput(course.virtual_class_size)}
                        onChange={(value) => setCourseField(course.course_id, "virtual_class_size", value)}
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#F7F1E4]">
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                    Total Virtual Class Size
                  </td>
                  <td className="px-3 py-2">
                    <EditableInput
                      align="center"
                      value={formatNumberInput(draftTable.totals.virtual_class_size_total)}
                      onChange={(value) =>
                        updateDraft((current) => ({
                          ...current,
                          totals: { ...current.totals, virtual_class_size_total: value },
                        }))
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#D9D2C6] bg-white">
          <div className="border-b border-[#ECE5D8] bg-[#F7F1E4] px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#231F20]">Indicator Breakdown</span>
            <button
              onClick={() => setFormulaDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D7D0C2] bg-white px-3 py-2 text-sm font-medium text-[#4D4741] transition hover:bg-[#F8F5EE]"
            >
              <Pencil className="h-4 w-4" />
              Edit Formula
            </button>
          </div>
          <div className="space-y-px bg-[#ECE5D8]">
            {draftTable.courses.map((course) => (
              <div key={`course-block-${course.course_id}`} className="bg-white border-b-2 border-[#D7D0C2] last:border-b-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm text-[#231F20]">
                    <thead className="bg-[#FCF8EE]">
                      <tr className="border-b border-[#D7D0C2]">
                        <th className="border-r border-[#ECE5D8] px-4 py-4 text-left font-semibold min-w-[140px]" rowSpan={1}>Course Name</th>
                        <th className="border-r border-[#ECE5D8] px-4 py-4 text-center font-semibold min-w-[100px]">Performance Indicator</th>
                        <th className="border-r border-[#ECE5D8] px-4 py-4 text-center font-semibold min-w-[140px]">Performance Indicators     (% Level of Distribution) (i)</th>
                        <th className="border-r border-[#ECE5D8] px-4 py-4 text-center font-semibold min-w-[120px]">No. of Students Who Answered per Indicator</th>
                        <th className="border-r border-[#ECE5D8] px-4 py-4 text-center font-semibold min-w-[140px]">Actual no. students who got 80% rating or higher (j)</th>
                        {customVariables.map((v) => (
                          <th key={v.key} className="border-r border-[#ECE5D8] px-4 py-4 text-center font-semibold min-w-[100px]">
                            {v.label}
                          </th>
                        ))}
                        <th className="border-r border-[#ECE5D8] px-4 py-4 text-center font-semibold min-w-[80px]">Pij</th>
                        <th className="px-4 py-4 text-center font-semibold min-w-[80px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.indicators.map((indicator, index) => {
                        const isEditing =
                          editingIndicator?.courseId === course.course_id &&
                          editingIndicator?.indicatorId === indicator.indicator_id;

                        return (
                          <tr key={indicator.indicator_id} className="border-b border-[#F1EADF] hover:bg-[#FFFBF5] transition">
                            {index === 0 && (
                              <td
                                rowSpan={course.indicators.length}
                                className="border-r border-[#ECE5D8] px-4 py-3 align-middle font-medium text-[#4D4741] min-w-[220px] w-[220px] hover:!bg-transparent select-none"
                              >
                                <div className="overflow-hidden">
                                  <EditableInput
                                    value={course.course_name}
                                    onChange={(value) =>
                                      setCourseField(course.course_id, "course_name", value)
                                    }
                                  />
                                </div>
                              </td>
                            )}
                            {isEditing && editingForm ? (
                              <>
                                <td className="border-r border-[#ECE5D8] px-4 py-2">
                                  <div className="flex items-center justify-center">
                                    <input
                                      className="h-9 w-28 rounded border border-[#D7D0C2] bg-white px-2 py-1 text-sm text-center"
                                      value={editingForm.indicator_label}
                                      onChange={(e) =>
                                        setEditingForm({
                                          ...editingForm,
                                          indicator_label: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="border-r border-[#ECE5D8] px-4 py-2">
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="number"
                                      step="0.1"
                                      className="h-9 w-24 rounded border border-[#D7D0C2] bg-white px-2 py-1 text-sm text-center"
                                      value={editingForm.distribution}
                                      onChange={(e) =>
                                        setEditingForm({
                                          ...editingForm,
                                          distribution: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="border-r border-[#ECE5D8] px-4 py-2">
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="number"
                                      className="h-9 w-24 rounded border border-[#D7D0C2] bg-white px-2 py-1 text-sm text-center"
                                      value={editingForm.answered_count}
                                      onChange={(e) =>
                                        setEditingForm({
                                          ...editingForm,
                                          answered_count: parseInt(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="border-r border-[#ECE5D8] px-4 py-2">
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="number"
                                      className="h-9 w-24 rounded border border-[#D7D0C2] bg-white px-2 py-1 text-sm text-center"
                                      value={editingForm.satisfactory_count}
                                      onChange={(e) =>
                                        setEditingForm({
                                          ...editingForm,
                                          satisfactory_count: parseInt(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </div>
                                </td>
                                {customVariables.map((v) => (
                                  <td key={v.key} className="border-r border-[#ECE5D8] px-4 py-2">
                                    <div className="flex items-center justify-center">
                                      <input
                                        type="number"
                                        className="h-9 w-24 rounded border border-[#D7D0C2] bg-white px-2 py-1 text-sm text-center"
                                        value={editingForm[v.key] || 0}
                                        onChange={(e) =>
                                          setEditingForm({
                                            ...editingForm,
                                            [v.key]: parseFloat(e.target.value) || 0,
                                          })
                                        }
                                      />
                                    </div>
                                  </td>
                                ))}
                                <td className="border-r border-[#ECE5D8] px-4 py-2 text-center">
                                  <div className="flex items-center justify-center h-9">
                                    <span className="font-semibold text-[#231F20]">
                                      {formatNumberInput(editingForm.weighted_value)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-center gap-1 h-9">
                                    <button
                                      onClick={() =>
                                        handleIndicatorEditSave(
                                          course.course_id,
                                          indicator.indicator_id
                                        )
                                      }
                                      className="rounded px-2 py-1 text-xs font-medium bg-[#231F20] text-white hover:bg-[#3A3535] transition"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleIndicatorEditCancel}
                                      className="rounded px-2 py-1 text-xs font-medium border border-[#D7D0C2] text-[#4D4741] hover:bg-[#F8F5EE] transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="border-r border-[#ECE5D8] px-4 py-3 text-center">
                                  <span className="font-medium text-[#231F20]">{indicator.indicator_label}</span>
                                </td>
                                <td className="border-r border-[#ECE5D8] px-4 py-3 text-center">
                                  <span className="text-[#231F20]">
                                    {formatNumberInput(indicator.distribution)}
                                  </span>
                                </td>
                                <td className="border-r border-[#ECE5D8] px-4 py-3 text-center">
                                  <span className="font-semibold text-[#231F20]">
                                    {indicator.answered_count}
                                  </span>
                                </td>
                                <td className="border-r border-[#ECE5D8] px-4 py-3 text-center">
                                  <span className="font-semibold text-[#231F20]">
                                    {indicator.satisfactory_count}
                                  </span>
                                </td>
                                {customVariables.map((v) => (
                                  <td
                                    key={v.key}
                                    className="border-r border-[#ECE5D8] px-4 py-3 text-center"
                                  >
                                    <span className="font-semibold text-[#231F20]">
                                      {indicator[v.key] || 0}
                                    </span>
                                  </td>
                                ))}
                                <td className="border-r border-[#ECE5D8] px-4 py-3 text-center">
                                  <span className="font-semibold text-[#231F20]">
                                    {formatNumberInput(indicator.weighted_value)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center">
                                    <button
                                      onClick={() =>
                                        handleIndicatorEditStart(course.course_id, indicator)
                                      }
                                      className="rounded p-1.5 text-[#8A817C] hover:bg-[#F1EADF] hover:text-[#231F20] transition"
                                      aria-label="Edit row"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                      <tr className="bg-[#F7F1E4] font-semibold border-t border-[#D7D0C2]">
                        <td colSpan={5} className="border-r border-[#ECE5D8] px-4 py-3 text-right">
                          Course Weighted Total
                        </td>
                        {customVariables.map((v) => (
                          <td key={v.key} className="border-r border-[#ECE5D8] px-4 py-3"></td>
                        ))}
                        <td className="border-r border-[#ECE5D8] px-4 py-3">
                          <div className="flex items-center justify-center">
                            <EditableInput
                              align="center"
                              value={formatNumberInput(course.weighted_total)}
                              onChange={(value) =>
                                setCourseField(course.course_id, "weighted_total", value)
                              }
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#D9D2C6] bg-white">
          <div className="border-b border-[#ECE5D8] bg-[#F7F1E4] px-4 py-3 text-sm font-semibold text-[#231F20]">
            Attainment Summary
          </div>
          <div className="grid gap-px bg-[#ECE5D8] sm:grid-cols-[320px_1fr]">
            <div className="bg-white px-4 py-3 text-sm font-semibold text-[#231F20]">
              % of the class who got satisfactory rating or higher
            </div>
            <div className="bg-white px-3 py-2">
              <EditableInput
                value={`${draftTable.totals.attainment_percent}`}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    totals: { ...current.totals, attainment_percent: value },
                  }))
                }
              />
            </div>

            <div className="bg-white px-4 py-3 text-sm font-semibold text-[#231F20]">
              Target Level of attainment
            </div>
            <div className="bg-white px-3 py-2">
              <EditableInput
                value={
                  draftTable.totals.target_statement ??
                  `${draftTable.totals.target_level}% of the class gets satisfactory rating or higher`
                }
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    totals: { ...current.totals, target_statement: value },
                  }))
                }
              />
            </div>

            <div className="bg-white px-4 py-3 text-sm font-semibold text-[#231F20]">
              Conclusion
            </div>
            <div className="bg-white px-3 py-2">
              <EditableInput
                multiline
                value={draftTable.totals.conclusion}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    totals: { ...current.totals, conclusion: value },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <FormulaEditorDialog
          open={formulaDialogOpen}
          onOpenChange={setFormulaDialogOpen}
          formula={selectedFormula}
          onSave={(formula) => setSelectedFormula(formula)}
          variables={variables}
          onVariablesChange={handleVariablesChange}
        />
      </div>
    </section>
  );
}

export default function SOSummaryTables({ tables = [] }) {
  if (tables.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-[#6B6B6B] py-12">
        <p className="text-sm">No SO summary tables available for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tables.map((table) => (
        <SOSummaryCard key={table.so_id} table={table} />
      ))}
    </div>
  );
}
