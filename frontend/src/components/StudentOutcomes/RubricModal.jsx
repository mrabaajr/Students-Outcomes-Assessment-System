import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { generateId } from "@/data/studentOutcomes";

const scrollbarStyle = `
  .rubric-table-container {
    position: relative;
    overflow-x: scroll !important;
    overflow-y: hidden !important;
  }
  .rubric-table-container::-webkit-scrollbar {
    height: 10px !important;
  }
  .rubric-table-container::-webkit-scrollbar-track {
    background: #e5e5e5;
    border-radius: 4px;
  }
  .rubric-table-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
    min-width: 40px;
  }
  .rubric-table-container::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  .rubric-table-container {
    scrollbar-width: auto;
    scrollbar-color: #888 #e5e5e5;
  }
`;

export function RubricModal({ open, onOpenChange, studentOutcome, onSave }) {
  const [indicators, setIndicators] = useState(studentOutcome.indicators);
  const [editingPIId, setEditingPIId] = useState(null);
  const [editingPIText, setEditingPIText] = useState("");
  const [addingPI, setAddingPI] = useState(false);
  const [newPIText, setNewPIText] = useState("");
  const [editingCriterion, setEditingCriterion] = useState(null);
  const [editingCriterionText, setEditingCriterionText] = useState("");
  const [addingCriterionToPI, setAddingCriterionToPI] = useState(null);
  const [newCriterionText, setNewCriterionText] = useState("");

  useEffect(() => {
    setIndicators(studentOutcome.indicators);
    setEditingPIId(null);
    setEditingPIText("");
    setAddingPI(false);
    setNewPIText("");
    setEditingCriterion(null);
    setEditingCriterionText("");
    setAddingCriterionToPI(null);
    setNewCriterionText("");
  }, [studentOutcome, open]);

  const addPI = () => {
    if (!newPIText.trim()) return;
    setIndicators((prev) => [...prev, { id: generateId(), description: newPIText.trim(), criteria: [] }]);
    setNewPIText(""); setAddingPI(false);
  };
  const updatePI = (id) => {
    if (!editingPIText.trim()) return;
    setIndicators((prev) => prev.map((pi) => pi.id === id ? { ...pi, description: editingPIText.trim() } : pi));
    setEditingPIId(null);
  };
  const deletePI = (id) => { setIndicators((prev) => prev.filter((pi) => pi.id !== id)); };
  const addCriterion = (piId) => {
    if (!newCriterionText.trim()) return;
    setIndicators((prev) => prev.map((pi) => pi.id === piId ? { ...pi, criteria: [...pi.criteria, { id: generateId(), name: newCriterionText.trim() }] } : pi));
    setNewCriterionText(""); setAddingCriterionToPI(null);
  };
  const updateCriterion = (piId, criterionId) => {
    if (!editingCriterionText.trim()) return;
    setIndicators((prev) => prev.map((pi) => pi.id === piId ? { ...pi, criteria: pi.criteria.map((c) => c.id === criterionId ? { ...c, name: editingCriterionText.trim() } : c) } : pi));
    setEditingCriterion(null);
  };
  const deleteCriterion = (piId, criterionId) => {
    setIndicators((prev) => prev.map((pi) => pi.id === piId ? { ...pi, criteria: pi.criteria.filter((c) => c.id !== criterionId) } : pi));
  };
  const handleSave = () => { onSave({ ...studentOutcome, indicators }); onOpenChange(false); };

  const maxCriteria = Math.max(...indicators.map((pi) => pi.criteria.length), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <style>{scrollbarStyle}</style>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto border border-[#D1D5DB] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#231F20]">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#231F20] text-sm font-bold text-[#FFC20E]">{studentOutcome.number}</span>
              {studentOutcome.title} - Rubric
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B6B6B]">{studentOutcome.description}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {indicators.length === 0 && !addingPI ? (
            <div className="rounded-lg border-2 border-dashed border-[#D1D5DB] bg-[#FAFAF7] p-8 text-center">
              <p className="mb-3 text-[#6B6B6B]">No performance indicators yet.</p>
              <Button onClick={() => setAddingPI(true)} size="sm" className="bg-[#FFC20E] text-[#231F20] hover:bg-[#FFC20E]/90"><Plus className="mr-1 h-4 w-4" /> Add First Indicator</Button>
            </div>
          ) : (
            <div className="rubric-table-container rounded-lg border border-[#D1D5DB] bg-white" style={{ minHeight: '300px', display: 'block', overflow: 'auto' }}>
              <table className="border-collapse text-sm" style={{ width: `${(indicators.length * 220) + 140}px`, minWidth: `calc(100% + 20px)` }}>
                <thead>
                  <tr className="bg-[#231F20]">
                    <th className="w-[120px] border-b border-r border-[#D1D5DB] px-3 py-2.5 text-left text-xs font-bold text-white">Criteria</th>
                    {indicators.map((pi, idx) => (
                      <th key={pi.id} className="min-w-[200px] border-b border-r border-[#D1D5DB] px-3 py-2.5 text-left text-xs font-bold text-white last:border-r-0">
                        <div className="flex items-center justify-between gap-2">
                          <span>PI {idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditingPIId(pi.id); setEditingPIText(pi.description); }} className="rounded p-1 text-[#D1D5DB] hover:bg-[#3A3A3A] hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => deletePI(pi.id)} className="rounded p-1 text-[#FCA5A5] hover:bg-[#7F1D1D]/20 hover:text-[#FECACA]"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="w-10 border-b border-[#D1D5DB] px-2 py-2.5">
                      <button onClick={() => { setAddingPI(true); setNewPIText(""); }} className="rounded p-1 text-[#D1D5DB] hover:bg-[#3A3A3A] hover:text-white" title="Add Performance Indicator"><Plus className="h-4 w-4" /></button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[#F5F5F5]">
                    <td className="border-b border-r border-[#D1D5DB] px-3 py-2 text-xs font-medium">
                      <span className="inline-block rounded bg-[#FFF8DB] px-1.5 py-0.5 text-[11px] font-semibold text-[#231F20]">Description</span>
                    </td>
                    {indicators.map((pi) => (
                      <td key={pi.id} className="border-b border-r border-[#D1D5DB] px-3 py-2 text-xs leading-relaxed text-[#231F20] align-top last:border-r-0">
                        {editingPIId === pi.id ? (
                          <div className="flex gap-1">
                            <Textarea value={editingPIText} onChange={(e) => setEditingPIText(e.target.value)} className="min-h-[60px] border-[#D1D5DB] bg-white text-xs text-[#231F20]" autoFocus />
                            <div className="flex flex-col gap-1">
                              <button onClick={() => updatePI(pi.id)} className="rounded bg-[#231F20] p-1 text-white hover:bg-[#3A3A3A]"><Check className="h-3 w-3" /></button>
                              <button onClick={() => setEditingPIId(null)} className="rounded border border-[#D1D5DB] bg-white p-1 text-[#231F20] hover:bg-[#F5F5F5]"><X className="h-3 w-3" /></button>
                            </div>
                          </div>
                        ) : (<span>{pi.description}</span>)}
                      </td>
                    ))}
                    <td className="border-b border-[#D1D5DB]" />
                  </tr>
                  {Array.from({ length: maxCriteria }).map((_, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-[#FFFDF2]">
                      <td className="border-b border-r border-[#D1D5DB] px-3 py-2 text-xs font-medium text-[#6B6B6B]">
                        <span className="inline-block rounded bg-[#FFF8DB] px-1.5 py-0.5 text-[11px] font-semibold text-[#231F20]">PC {rowIdx + 1}</span>
                      </td>
                      {indicators.map((pi) => {
                        const pc = pi.criteria[rowIdx];
                        if (!pc) {
                          const isFirstEmpty = rowIdx === pi.criteria.length;
                          return (
                            <td key={`${pi.id}-${rowIdx}`} className="border-b border-r border-[#D1D5DB] px-3 py-2 text-xs text-[#A5A8AB] last:border-r-0">
                              {isFirstEmpty && addingCriterionToPI !== pi.id && (
                                <button onClick={() => { setAddingCriterionToPI(pi.id); setNewCriterionText(""); }} className="flex items-center gap-1 text-xs font-medium text-[#231F20] hover:underline"><Plus className="h-3 w-3" /> Add</button>
                              )}
                            </td>
                          );
                        }
                        const isEditing = editingCriterion?.piId === pi.id && editingCriterion?.criterionId === pc.id;
                        return (
                          <td key={pc.id} className="border-b border-r border-[#D1D5DB] px-3 py-2 text-xs text-[#231F20] last:border-r-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Input value={editingCriterionText} onChange={(e) => setEditingCriterionText(e.target.value)} className="h-7 border-[#D1D5DB] bg-white text-xs text-[#231F20]" onKeyDown={(e) => e.key === "Enter" && updateCriterion(pi.id, pc.id)} autoFocus />
                                <button onClick={() => updateCriterion(pi.id, pc.id)} className="rounded bg-[#231F20] p-1 text-white hover:bg-[#3A3A3A]"><Check className="h-3 w-3" /></button>
                                <button onClick={() => setEditingCriterion(null)} className="rounded border border-[#D1D5DB] bg-white p-1 text-[#231F20] hover:bg-[#F5F5F5]"><X className="h-3 w-3" /></button>
                              </div>
                            ) : (
                              <div className="group/cell flex items-center justify-between gap-2">
                                <span>{pc.name}</span>
                                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/cell:opacity-100">
                                  <button onClick={() => { setEditingCriterion({ piId: pi.id, criterionId: pc.id }); setEditingCriterionText(pc.name); }} className="rounded p-0.5 text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#231F20]"><Pencil className="h-3 w-3" /></button>
                                  <button onClick={() => deleteCriterion(pi.id, pc.id)} className="rounded p-0.5 text-[#B91C1C] hover:bg-[#FEE2E2]"><Trash2 className="h-3 w-3" /></button>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="border-b border-[#D1D5DB]" />
                    </tr>
                  ))}
                  <tr>
                    <td className="border-r border-[#D1D5DB] px-3 py-2" />
                    {indicators.map((pi) => (
                      <td key={pi.id} className="border-r border-[#D1D5DB] px-3 py-2 last:border-r-0">
                        {addingCriterionToPI === pi.id ? (
                          <div className="flex items-center gap-1">
                            <Input value={newCriterionText} onChange={(e) => setNewCriterionText(e.target.value)} placeholder="Criterion name..." className="h-7 border-[#D1D5DB] bg-white text-xs text-[#231F20]" onKeyDown={(e) => e.key === "Enter" && addCriterion(pi.id)} autoFocus />
                            <button onClick={() => addCriterion(pi.id)} className="rounded bg-[#231F20] p-1 text-white hover:bg-[#3A3A3A]"><Check className="h-3 w-3" /></button>
                            <button onClick={() => setAddingCriterionToPI(null)} className="rounded border border-[#D1D5DB] bg-white p-1 text-[#231F20] hover:bg-[#F5F5F5]"><X className="h-3 w-3" /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setAddingCriterionToPI(pi.id); setNewCriterionText(""); }} className="flex items-center gap-1 text-xs font-medium text-[#231F20] hover:underline"><Plus className="h-3 w-3" /> Add Criterion</button>
                        )}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {addingPI && (
            <div className="mt-4 rounded-lg border border-[#D1D5DB] bg-[#FAFAF7] p-4">
              <label className="text-sm font-medium text-[#231F20]">New Performance Indicator Description</label>
              <Textarea value={newPIText} onChange={(e) => setNewPIText(e.target.value)} placeholder="Describe the performance indicator..." className="mt-1 min-h-[80px] border-[#D1D5DB] bg-white text-[#231F20]" />
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={addPI} disabled={!newPIText.trim()} className="bg-[#FFC20E] text-[#231F20] hover:bg-[#FFC20E]/90"><Check className="mr-1 h-3 w-3" /> Add</Button>
                <Button size="sm" variant="outline" onClick={() => setAddingPI(false)} className="border-[#D1D5DB] bg-white text-[#231F20] hover:bg-[#F5F5F5]">Cancel</Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#D1D5DB] bg-white text-[#231F20] hover:bg-[#F5F5F5]">Cancel</Button>
          <Button onClick={handleSave} className="bg-[#FFC20E] text-[#231F20] hover:bg-[#FFC20E]/90">Save Rubric</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
