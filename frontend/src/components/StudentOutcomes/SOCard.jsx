import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { generateId } from "@/data/studentOutcomes";

export function SOCard({ so, onEdit, onDelete, onOpenRubric }) {
  return (
    <div className="glass-card hover-lift overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#231F20] text-lg font-bold text-[#FFC20E]">
          {so.number}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-[#231F20]">{so.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#6B6B6B]">{so.description}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#231F20] hover:bg-[#F5F5F5] hover:text-[#231F20]"
            onClick={() => onOpenRubric(so)}
            title="View/Edit Rubric"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#231F20] hover:bg-[#F5F5F5] hover:text-[#231F20]"
            onClick={() => onEdit(so)}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#B91C1C] hover:bg-[#FEE2E2] hover:text-[#B91C1C]"
            onClick={() => onDelete(so.id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {so.indicators.length > 0 && (() => {
        const totalColumns = so.indicators.reduce((sum, pi) => sum + Math.max(pi.criteria.length, 1), 0);
        return (
          <div className="border-t border-[#E5E7EB] px-5 pb-5 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
              Performance Indicators &amp; Sub Performance Indicators
            </p>
            <div className="overflow-x-auto rounded-lg border border-[#D1D5DB] bg-white scrollbar-visible">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#231F20]">
                    <th
                      colSpan={totalColumns}
                      className="border-b border-[#D1D5DB] px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white"
                    >
                      Performance Indicator
                    </th>
                  </tr>
                  <tr className="bg-[#F5F5F5]">
                    {so.indicators.map((pi) => (
                      <td
                        key={pi.id}
                        colSpan={pi.criteria.length > 0 ? pi.criteria.length : 1}
                        className="border-b border-r border-[#D1D5DB] px-3 py-2.5 text-center text-xs leading-relaxed text-[#231F20] align-top last:border-r-0"
                      >
                        {pi.description}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-[#FFF8DB]">
                    {so.indicators.map((pi) => (
                      pi.criteria.length > 0 ? (
                        pi.criteria.map((pc) => (
                          <th
                            key={pc.id}
                            className="min-w-[120px] border-b border-r border-[#D1D5DB] px-3 py-2 text-center text-xs font-medium text-[#231F20] last:border-r-0"
                          >
                            {pc.name}
                          </th>
                        ))
                      ) : (
                        <th
                          key={`${pi.id}-empty`}
                          className="min-w-[120px] border-b border-r border-[#D1D5DB] px-3 py-2 text-center text-xs font-medium text-[#6B6B6B] last:border-r-0"
                        >
                          -
                        </th>
                      )
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        );
      })()}
      {so.indicators.length === 0 && (
        <div className="border-t border-[#E5E7EB] px-5 py-3">
          <p className="text-xs italic text-[#6B6B6B]">
            No performance indicators yet.{" "}
            <button onClick={() => onOpenRubric(so)} className="font-medium text-[#231F20] hover:text-[#000000] hover:underline">
              Add via Rubric
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

export function SOFormDialog({ open, onOpenChange, onSave, editingSO, nextNumber }) {
  const [title, setTitle] = useState(editingSO?.title ?? `TIP SO ${nextNumber}`);
  const [description, setDescription] = useState(editingSO?.description ?? "");

  useEffect(() => {
    setTitle(editingSO?.title ?? `TIP SO ${nextNumber}`);
    setDescription(editingSO?.description ?? "");
  }, [editingSO, nextNumber, open]);

  const handleSave = () => {
    if (!title.trim() || !description.trim()) return;
    onSave({
      id: editingSO?.id ?? generateId(),
      number: editingSO?.number ?? nextNumber,
      title: title.trim(),
      description: description.trim(),
      indicators: editingSO?.indicators ?? [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[#D1D5DB] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#231F20]">
            {editingSO ? "Edit Student Outcome" : "Add New Student Outcome"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B6B6B]">
            {editingSO ? "Update the student outcome details below." : "Fill in the details for the new student outcome."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-[#231F20]">Title</label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g., TIP SO 1"
              className="mt-1 border-[#D1D5DB] bg-white text-[#231F20]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#231F20]">Description</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the student outcome..."
              className="mt-1 min-h-[100px] border-[#D1D5DB] bg-white text-[#231F20]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#D1D5DB] bg-white text-[#231F20] hover:bg-[#F5F5F5]">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !description.trim()} className="bg-[#FFC20E] text-[#231F20] hover:bg-[#FFC20E]/90">
            {editingSO ? "Save Changes" : "Add SO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
