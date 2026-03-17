import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save } from "lucide-react";

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
    "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E] focus:bg-[#FFFCF3]";
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

        {draftTable.courses.map((course) => (
          <div key={`course-block-${course.course_id}`} className="overflow-hidden rounded-2xl border border-[#D9D2C6] bg-white">
            <div className="border-b border-[#ECE5D8] bg-[#F7F1E4] px-4 py-3 text-sm font-semibold text-[#231F20]">
              {course.course_name} Indicator Breakdown
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm text-[#231F20]">
                <thead className="bg-[#FCF8EE]">
                  <tr>
                    <th className="border-b border-[#ECE5D8] px-4 py-3 text-left font-semibold">Course</th>
                    <th className="border-b border-[#ECE5D8] px-4 py-3 text-center font-semibold">Performance Indicator</th>
                    <th className="border-b border-[#ECE5D8] px-4 py-3 text-center font-semibold">Distribution (i)</th>
                    <th className="border-b border-[#ECE5D8] px-4 py-3 text-center font-semibold">Students Answered</th>
                    <th className="border-b border-[#ECE5D8] px-4 py-3 text-center font-semibold">Got 80% or Higher</th>
                    <th className="border-b border-[#ECE5D8] px-4 py-3 text-center font-semibold">Pij</th>
                  </tr>
                </thead>
                <tbody>
                  {course.indicators.map((indicator, index) => (
                    <tr key={indicator.indicator_id} className="even:bg-[#FFFCF7]">
                      {index === 0 && (
                        <td rowSpan={course.indicators.length} className="border-b border-[#F1EADF] px-3 py-2 align-middle">
                          <EditableInput
                            value={course.course_name}
                            onChange={(value) => setCourseField(course.course_id, "course_name", value)}
                          />
                        </td>
                      )}
                      <td className="border-b border-[#F1EADF] px-3 py-2">
                        <EditableInput
                          align="center"
                          value={indicator.indicator_label}
                          onChange={(value) =>
                            setIndicatorField(course.course_id, indicator.indicator_id, "indicator_label", value)
                          }
                        />
                      </td>
                      <td className="border-b border-[#F1EADF] px-3 py-2">
                        <EditableInput
                          align="center"
                          value={formatNumberInput(indicator.distribution)}
                          onChange={(value) =>
                            setIndicatorField(course.course_id, indicator.indicator_id, "distribution", value)
                          }
                        />
                      </td>
                      <td className="border-b border-[#F1EADF] px-3 py-2">
                        <EditableInput
                          type="number"
                          align="center"
                          value={indicator.answered_count}
                          onChange={(value) =>
                            setIndicatorField(course.course_id, indicator.indicator_id, "answered_count", value)
                          }
                        />
                      </td>
                      <td className="border-b border-[#F1EADF] px-3 py-2">
                        <EditableInput
                          type="number"
                          align="center"
                          value={indicator.satisfactory_count}
                          onChange={(value) =>
                            setIndicatorField(course.course_id, indicator.indicator_id, "satisfactory_count", value)
                          }
                        />
                      </td>
                      <td className="border-b border-[#F1EADF] px-3 py-2">
                        <EditableInput
                          align="center"
                          value={formatNumberInput(indicator.weighted_value)}
                          onChange={(value) =>
                            setIndicatorField(course.course_id, indicator.indicator_id, "weighted_value", value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#F7F1E4]">
                    <td colSpan={5} className="px-4 py-3 text-right font-semibold">
                      Course Weighted Total
                    </td>
                    <td className="px-3 py-2">
                      <EditableInput
                        align="center"
                        value={formatNumberInput(course.weighted_total)}
                        onChange={(value) => setCourseField(course.course_id, "weighted_total", value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}

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
