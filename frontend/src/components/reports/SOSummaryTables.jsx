import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, RotateCcw, Save } from "lucide-react";
import FormulaEditorDialog, { DEFAULT_VARIABLES } from "./FormulaEditorDialog";

const DEFAULT_FORMULA = "(got80OrHigher / studentsAnswered) * distribution";
const clone = (value) => JSON.parse(JSON.stringify(value));
const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const fmt = (value, digits = 4) => num(value).toFixed(digits).replace(/\.?0+$/, "");
const targetStatement = (target) => `${target}% of the class gets satisfactory rating or higher`;
const conclusionText = (attainment, target) =>
  `${attainment.toFixed(2)}% of the class got satisfactory rating or higher. Thus, the level of attainment is ${attainment >= target ? "higher than" : "lower than"} the target level of ${target}%.`;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const evaluateFormula = (formula, variables, values) => {
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
};

const recalculateTable = (table, formula, variables) => {
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
        distribution: runtimeValues.distribution,
        answered_count: runtimeValues.studentsAnswered,
        satisfactory_count: runtimeValues.got80OrHigher,
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
  const weightedTotal = next.courses.reduce((sum, course) => sum + num(course.weighted_total), 0);
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
};

function TextInput({ value, onChange, type = "text", multiline = false }) {
  const className =
    "w-full rounded-md border border-[#E5DED0] bg-white px-3 py-2 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]";
  if (multiline) {
    return <textarea rows={3} className={className} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input type={type} className={className} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

function ReadOnlyCell({ value, align = "left", strong = false }) {
  return (
    <div
      className={`w-full rounded-md border border-[#E5DED0] bg-white px-3 py-2 text-sm text-[#231F20] ${
        align === "center" ? "text-center" : "text-left"
      } ${strong ? "font-semibold" : ""}`}
    >
      {value ?? "-"}
    </div>
  );
}

function SOSummaryCard({ table, onSaveTable, schoolYearOptions = [] }) {
  const uniqueSchoolYearOptions = useMemo(
    () => [...new Set((schoolYearOptions || []).filter(Boolean))],
    [schoolYearOptions]
  );
  const normalized = useMemo(
    () => recalculateTable(table, table.formula || DEFAULT_FORMULA, table.variables?.length ? table.variables : DEFAULT_VARIABLES),
    [table]
  );
  const [savedTable, setSavedTable] = useState(normalized);
  const [draftTable, setDraftTable] = useState(normalized);
  const [formula, setFormula] = useState(normalized.formula || DEFAULT_FORMULA);
  const [variables, setVariables] = useState(normalized.variables?.length ? normalized.variables : DEFAULT_VARIABLES);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getIndicatorKey = (indicator) => indicator.basis_key ?? String(indicator.indicator_id);

  useEffect(() => {
    setSavedTable(normalized);
    setDraftTable(normalized);
    setFormula(normalized.formula || DEFAULT_FORMULA);
    setVariables(normalized.variables?.length ? normalized.variables : DEFAULT_VARIABLES);
  }, [normalized]);

  const isSaved = JSON.stringify(draftTable) === JSON.stringify(savedTable);
  const customVariables = variables.filter((variable) => !DEFAULT_VARIABLES.some((item) => item.key === variable.key));

  const updateDraft = (updater, nextFormula = formula, nextVariables = variables) => {
    setDraftTable((current) => recalculateTable(typeof updater === "function" ? updater(clone(current)) : updater, nextFormula, nextVariables));
  };

  const saveCard = async () => {
    if (!onSaveTable) {
      setSavedTable(clone(draftTable));
      return;
    }
    setIsSaving(true);
    try {
      await onSaveTable({
        so_id: draftTable.so_id,
        so_number: draftTable.so_number,
        formula,
        variables,
        table_data: { ...draftTable, formula, variables },
      });
      setSavedTable(clone(draftTable));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="glass-card space-y-5 border border-[#D8D2C4] bg-white p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-[#E7D7A4] bg-[#FFF5D6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8A6A00]">
            SO {draftTable.so_number} Summary
          </div>
          <h2 className="mt-3 text-lg font-semibold text-[#231F20]">Summary Result of Direct Assessment on Student Outcome</h2>
          <p className="mt-2 text-sm text-[#4D4741]">
            SO {draftTable.so_number}. {draftTable.so_title}
            {draftTable.so_description ? `, ${draftTable.so_description}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setDraftTable(clone(savedTable)); setFormula(savedTable.formula || DEFAULT_FORMULA); setVariables(savedTable.variables?.length ? savedTable.variables : DEFAULT_VARIABLES); }} className="inline-flex items-center gap-2 rounded-lg border border-[#D7D0C2] bg-white px-3 py-2 text-sm font-medium text-[#4D4741]">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button type="button" disabled={isSaving} onClick={saveCard} className="inline-flex items-center gap-2 rounded-lg bg-[#231F20] px-3 py-2 text-sm font-medium text-white disabled:opacity-70">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <p className="text-xs font-medium text-[#7B746B]">{isSaved ? "Saved values are shown." : "You have unsaved changes in this card."}</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A817C]">Program</p>
          <TextInput value={draftTable.program} onChange={(value) => updateDraft((current) => ({ ...current, program: value }))} />
        </div>
        <div className="lg:col-span-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A817C]">Source of Assessment</p>
          <TextInput value={draftTable.source_assessment} onChange={(value) => updateDraft((current) => ({ ...current, source_assessment: value }))} />
        </div>
        <div className="lg:col-span-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A817C]">Time of Data Collection</p>
          <select
            value={draftTable.time_of_data_collection ?? ""}
            onChange={(event) => updateDraft((current) => ({ ...current, time_of_data_collection: event.target.value }))}
            className="w-full rounded-md border border-[#E5DED0] bg-white px-3 py-2 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
          >
            <option value="">Select School Year</option>
            {uniqueSchoolYearOptions.map((schoolYear) => (
              <option key={schoolYear} value={schoolYear}>
                {schoolYear}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D9D2C6]">
        <div className="bg-[#F7F1E4] px-4 py-3 text-sm font-semibold text-[#231F20]">Course Overview</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-[#FCF8EE] text-left">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3 text-center">Actual Class Size</th>
                <th className="px-4 py-3 text-center">% of CLI</th>
                <th className="px-4 py-3 text-center">Students Answered</th>
                <th className="px-4 py-3 text-center">Virtual Class Size</th>
              </tr>
            </thead>
            <tbody>
              {draftTable.courses.map((course) => (
                <tr key={course.course_id} className="border-t border-[#F1EADF]">
                  <td className="px-4 py-3"><ReadOnlyCell value={course.course_name} /></td>
                  <td className="px-4 py-3"><ReadOnlyCell value={course.actual_class_size} align="center" /></td>
                  <td className="px-4 py-3"><ReadOnlyCell value={fmt(course.cli)} align="center" /></td>
                  <td className="px-4 py-3"><ReadOnlyCell value={course.answered_count} align="center" /></td>
                  <td className="px-4 py-3"><ReadOnlyCell value={fmt(course.virtual_class_size)} align="center" strong /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D9D2C6]">
        <div className="flex items-center justify-between bg-[#F7F1E4] px-4 py-3">
          <span className="text-sm font-semibold text-[#231F20]">Indicator Breakdown</span>
          <button type="button" onClick={() => setFormulaOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-[#D7D0C2] bg-white px-3 py-2 text-sm font-medium text-[#4D4741]">
            <Pencil className="h-4 w-4" />
            Edit Formula
          </button>
        </div>
        <div className="space-y-4 p-4">
          {draftTable.courses.map((course) => (
            <div key={course.course_id} className="rounded-lg border border-[#ECE5D8]">
              <div className="border-b border-[#ECE5D8] bg-[#FCF8EE] px-4 py-3 font-medium text-[#231F20]">{course.course_name}</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="text-left text-[#6B6B6B]">
                      <th className="px-4 py-3">Indicator</th>
                      <th className="px-4 py-3">Distribution</th>
                      <th className="px-4 py-3">Answered</th>
                      <th className="px-4 py-3">80% or Higher</th>
                      {customVariables.map((variable) => <th key={variable.key} className="px-4 py-3">{variable.label}</th>)}
                      <th className="px-4 py-3">Pij</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.indicators.map((indicator) => (
                      <tr key={getIndicatorKey(indicator)} className="border-t border-[#F1EADF]">
                        <td className="px-4 py-3"><TextInput value={indicator.indicator_label} onChange={(value) => updateDraft((current) => ({ ...current, courses: current.courses.map((item) => item.course_id === course.course_id ? { ...item, indicators: item.indicators.map((row) => getIndicatorKey(row) === getIndicatorKey(indicator) ? { ...row, indicator_label: value } : row) } : item) }))} /></td>
                        <td className="px-4 py-3"><TextInput value={indicator.distribution} onChange={(value) => updateDraft((current) => ({ ...current, courses: current.courses.map((item) => item.course_id === course.course_id ? { ...item, indicators: item.indicators.map((row) => getIndicatorKey(row) === getIndicatorKey(indicator) ? { ...row, distribution: value } : row) } : item) }))} /></td>
                        <td className="px-4 py-3"><TextInput type="number" value={indicator.answered_count} onChange={(value) => updateDraft((current) => ({ ...current, courses: current.courses.map((item) => item.course_id === course.course_id ? { ...item, indicators: item.indicators.map((row) => getIndicatorKey(row) === getIndicatorKey(indicator) ? { ...row, answered_count: value } : row) } : item) }))} /></td>
                        <td className="px-4 py-3"><TextInput type="number" value={indicator.satisfactory_count} onChange={(value) => updateDraft((current) => ({ ...current, courses: current.courses.map((item) => item.course_id === course.course_id ? { ...item, indicators: item.indicators.map((row) => getIndicatorKey(row) === getIndicatorKey(indicator) ? { ...row, satisfactory_count: value } : row) } : item) }))} /></td>
                        {customVariables.map((variable) => (
                          <td key={variable.key} className="px-4 py-3">
                            <TextInput type="number" value={indicator[variable.key] || 0} onChange={(value) => updateDraft((current) => ({ ...current, courses: current.courses.map((item) => item.course_id === course.course_id ? { ...item, indicators: item.indicators.map((row) => getIndicatorKey(row) === getIndicatorKey(indicator) ? { ...row, [variable.key]: value } : row) } : item) }))} />
                          </td>
                        ))}
                        <td className="px-4 py-3 font-semibold">{fmt(indicator.weighted_value)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-[#ECE5D8] bg-[#FCF8EE] font-semibold">
                      <td colSpan={4 + customVariables.length} className="px-4 py-3 text-right">Course Weighted Total</td>
                      <td className="px-4 py-3">{fmt(course.weighted_total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-[#D9D2C6] bg-[#FCF8EE] px-4 py-3 text-sm font-semibold text-[#231F20]">% of the class who got satisfactory rating or higher</div>
        <div className="rounded-xl border border-[#D9D2C6] bg-white px-4 py-3 text-sm font-semibold text-[#231F20]">{draftTable.totals.attainment_percent}%</div>
        <div className="rounded-xl border border-[#D9D2C6] bg-[#FCF8EE] px-4 py-3 text-sm font-semibold text-[#231F20]">Target Level of attainment</div>
        <div className="rounded-xl border border-[#D9D2C6] bg-white px-4 py-3"><TextInput value={draftTable.totals.target_statement ?? targetStatement(draftTable.totals.target_level ?? 80)} onChange={(value) => updateDraft((current) => ({ ...current, totals: { ...current.totals, target_statement: value } }))} /></div>
        <div className="rounded-xl border border-[#D9D2C6] bg-[#FCF8EE] px-4 py-3 text-sm font-semibold text-[#231F20]">Conclusion</div>
        <div className="rounded-xl border border-[#D9D2C6] bg-white px-4 py-3"><TextInput multiline value={draftTable.totals.conclusion} onChange={(value) => updateDraft((current) => ({ ...current, totals: { ...current.totals, conclusion: value } }))} /></div>
      </div>

      <FormulaEditorDialog
        open={formulaOpen}
        onOpenChange={setFormulaOpen}
        formula={formula}
        onSave={(nextFormula) => {
          const normalizedFormula = nextFormula || DEFAULT_FORMULA;
          setFormula(normalizedFormula);
          updateDraft((current) => current, normalizedFormula, variables);
        }}
        variables={variables}
        onVariablesChange={(nextVariables) => {
          const normalizedVariables = nextVariables.length ? nextVariables : DEFAULT_VARIABLES;
          setVariables(normalizedVariables);
          updateDraft(
            (current) => ({
              ...current,
              courses: current.courses.map((course) => ({
                ...course,
                indicators: course.indicators.map((indicator) => {
                  const nextIndicator = { ...indicator };
                  normalizedVariables
                    .filter((variable) => !DEFAULT_VARIABLES.some((item) => item.key === variable.key))
                    .forEach((variable) => {
                      if (nextIndicator[variable.key] === undefined) nextIndicator[variable.key] = 0;
                    });
                  return nextIndicator;
                }),
              })),
            }),
            formula,
            normalizedVariables
          );
        }}
      />
    </section>
  );
}

export default function SOSummaryTables({ tables = [], onSaveTable, schoolYearOptions = [] }) {
  if (tables.length === 0) {
    return <div className="glass-card p-6 text-center text-[#6B6B6B]">No SO summary tables available for the selected filters.</div>;
  }

  return (
    <div className="space-y-6">
      {tables.map((table) => (
        <SOSummaryCard key={`${table.so_id}-${table.report_config_id ?? "default"}`} table={table} onSaveTable={onSaveTable} schoolYearOptions={schoolYearOptions} />
      ))}
    </div>
  );
}
