import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const DEFAULT_VARIABLES = [
  { key: "distribution", label: "Distribution (i)" },
  { key: "studentsAnswered", label: "Students Answered" },
  { key: "got80OrHigher", label: "Got 80% or Higher" },
];

const OPERATORS = ["+", "-", "*", "/", "(", ")"];

export default function FormulaEditorDialog({
  open,
  onOpenChange,
  formula: initialFormula = "",
  onSave,
  variables: initialVariables = [],
  onVariablesChange,
}) {
  const [formula, setFormula] = useState(initialFormula || "");
  const [variables, setVariables] = useState(initialVariables || DEFAULT_VARIABLES);
  const [newVarLabel, setNewVarLabel] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleOpen = (isOpen) => {
    if (isOpen) {
      setFormula(initialFormula || "");
      setVariables(initialVariables && initialVariables.length > 0 ? initialVariables : DEFAULT_VARIABLES);
    }
    onOpenChange(isOpen);
  };

  const insertAtCursor = (text) => {
    setFormula((prev) => prev + text);
  };

  const handleSave = () => {
    onSave(formula);
    onOpenChange(false);
  };

  const handleAddVariable = () => {
    const label = newVarLabel.trim();
    if (!label) return;
    const key = label.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    if (!key || variables.some((v) => v.key === key)) return;
    const newVariables = [...variables, { key, label }];
    setVariables(newVariables);
    onVariablesChange(newVariables);
    setNewVarLabel("");
    setShowAddForm(false);
  };

  const handleRemoveVariable = (key) => {
    if (DEFAULT_VARIABLES.some((v) => v.key === key)) return;
    const newVariables = variables.filter((v) => v.key !== key);
    setVariables(newVariables);
    onVariablesChange(newVariables);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg bg-white border border-[#D8D2C4] shadow-[0_18px_45px_rgba(35,31,32,0.08)]">
        <DialogHeader className="border-b border-[#E7E0D4] pb-4">
          <DialogTitle className="text-lg font-semibold text-[#231F20]">
            Customize Formula
          </DialogTitle>
          <p className="text-sm text-[#6B6B6B] mt-2">
            Build a custom formula using variables and operators. Example:{" "}
            <code className="rounded bg-[#F0EBE0] px-1.5 py-0.5 text-xs font-mono text-[#231F20]">
              (got80OrHigher / studentsAnswered) * distribution
            </code>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Variables */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#231F20]">
                Variables
              </p>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D7D0C2] bg-white px-2.5 py-1.5 text-xs font-medium text-[#4D4741] transition hover:bg-[#F8F5EE]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Variable
              </button>
            </div>

            {showAddForm && (
              <div className="flex items-end gap-2 mb-3 p-3 rounded-lg border border-[#E5DED0] bg-[#FFFCF3]">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A817C]">Label</label>
                  <input
                    className="w-full rounded-md border border-[#E5DED0] bg-white px-2 py-1.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E] focus:bg-[#FFFCF3]"
                    placeholder="e.g. Total Score"
                    value={newVarLabel}
                    onChange={(e) => setNewVarLabel(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleAddVariable}
                  className="rounded-lg border border-[#D7D0C2] bg-[#231F20] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#3A3535]"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {variables.map((v) => {
                const isUsed = formula.includes(v.key);
                const isCustom = !DEFAULT_VARIABLES.some((d) => d.key === v.key);
                return (
                  <div
                    key={v.key}
                    onClick={() => insertAtCursor(v.key)}
                    className={cn(
                      "cursor-pointer transition-colors rounded-full px-3 py-1.5 text-xs font-mono border flex items-center gap-1",
                      isUsed
                        ? "bg-[#FFC20E]/10 border-[#FFC20E]/30 text-[#8A6A00] hover:bg-[#FFC20E]/20"
                        : "border-[#E5DED0] bg-white text-[#4D4741] hover:bg-[#F8F5EE]"
                    )}
                  >
                    {v.key}
                    {isCustom && (
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer hover:text-[#8A6A00]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveVariable(v.key);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Variables Used */}
          {(() => {
            const usedVars = variables.filter((v) =>
              formula.includes(v.key)
            );
            return (
              <div>
                <p className="text-sm font-semibold text-[#231F20] mb-3">
                  Variables Used ({usedVars.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {usedVars.length > 0 ? (
                    usedVars.map((v) => (
                      <div
                        key={v.key}
                        className="flex flex-col gap-1 rounded-lg border border-[#FFC20E]/20 bg-[#FFC20E]/5 p-3"
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A817C]">
                          {v.label}
                        </span>
                        <span className="text-sm font-mono font-semibold text-[#8A6A00]">
                          {v.key}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 text-xs text-[#9B9B9B] italic">
                      Add variables to the formula to see them here.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Operators */}
          <div>
            <p className="text-sm font-semibold text-[#231F20] mb-3">
              Operators
            </p>
            <div className="flex gap-2 flex-wrap">
              {OPERATORS.map((op) => (
                <button
                  key={op}
                  onClick={() => insertAtCursor(` ${op} `)}
                  className="rounded-lg border border-[#D7D0C2] bg-white px-3 py-1.5 text-sm font-mono font-medium text-[#4D4741] transition hover:bg-[#F8F5EE]"
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Formula input */}
          <div>
            <p className="text-sm font-semibold text-[#231F20] mb-2">
              Formula
            </p>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-[#E5DED0] bg-white px-3 py-2 text-sm font-mono text-[#231F20] outline-none transition placeholder:text-[#B8AEA0] focus:border-[#FFC20E] focus:bg-[#FFFCF3]"
              placeholder="e.g. (got80OrHigher / studentsAnswered) * distribution"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
            />
          </div>

          {/* Clear */}
          <button
            onClick={() => setFormula("")}
            className="text-xs font-medium text-[#6B6B6B] transition hover:text-[#231F20]"
          >
            Clear formula
          </button>
        </div>

        <DialogFooter className="gap-2 border-t border-[#E7E0D4] pt-4 mt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-[#D7D0C2] bg-white px-3 py-2 text-sm font-medium text-[#4D4741] transition hover:bg-[#F8F5EE]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-[#231F20] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#3A3535]"
          >
            Save Formula
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
