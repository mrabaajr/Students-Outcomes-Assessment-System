import { useMemo, useState, useEffect } from "react";
import { CalendarRange, FolderTree, Loader2, Plus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schoolYearPattern = /^\d{4}-\d{4}$/;

const SchoolYearManagementModal = ({
  open,
  onClose,
  schoolYears = [],
  sections = [],
  faculty = [],
  onAddSchoolYear,
  isSaving = false,
}) => {
  const [newSchoolYear, setNewSchoolYear] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNewSchoolYear("");
    setError("");
  }, [open]);

  const sectionsByYear = useMemo(() => {
    const grouped = schoolYears.reduce((acc, year) => {
      acc[year] = [];
      return acc;
    }, {});

    sections.forEach((section) => {
      const key = section.schoolYear || "Unassigned";
      if (!grouped[key]) grouped[key] = [];

      const assignedFaculty = faculty.find((member) =>
        member.courses.some(
          (course) => course.code === section.courseCode && course.sections.includes(section.name)
        )
      );

      grouped[key].push({
        ...section,
        facultyName: assignedFaculty?.name || "No faculty assigned",
      });
    });

    return Object.entries(grouped).sort(([a], [b]) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return a.localeCompare(b);
    });
  }, [faculty, schoolYears, sections]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const normalizedYear = newSchoolYear.trim();

    if (!normalizedYear) {
      setError("School year is required.");
      return;
    }

    if (!schoolYearPattern.test(normalizedYear)) {
      setError("Enter a valid school year like 2026-2027.");
      return;
    }

    const [startYear, endYear] = normalizedYear.split("-").map(Number);
    if (endYear !== startYear + 1) {
      setError("School year must span consecutive years.");
      return;
    }

    if (schoolYears.includes(normalizedYear)) {
      setError("That school year already exists.");
      return;
    }

    setError("");
    await onAddSchoolYear?.({ year: normalizedYear });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border border-[#D1D5DB] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#231F20]">
            <CalendarRange className="h-5 w-5 text-[#FFC20E]" />
            Manage School Years
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <form onSubmit={handleAdd} className="rounded-xl border border-[#E5E7EB] bg-[#FAFAF7] p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="new-school-year" className="text-sm font-medium text-[#231F20]">
                  Add School Year
                </Label>
                <Input
                  id="new-school-year"
                  value={newSchoolYear}
                  onChange={(event) => setNewSchoolYear(event.target.value)}
                  placeholder="e.g. 2026-2027"
                  className="border-[#D1D5DB] bg-white text-[#231F20]"
                />
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
              </div>

              <Button
                type="submit"
                className="bg-[#FFC20E] text-[#231F20] hover:bg-[#FFC20E]/90"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Save School Year
              </Button>
            </div>
          </form>

          <div className="grid gap-4">
            {sectionsByYear.map(([year, yearSections]) => (
              <div key={year} className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-[#231F20] px-3 py-1.5 text-sm font-semibold text-[#FFC20E]">
                      {year}
                    </div>
                    <span className="text-sm text-[#6B6B6B]">
                      {yearSections.length} section{yearSections.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {yearSections.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-[#FAFAF7] px-4 py-5 text-sm text-[#6B6B6B]">
                    No sections assigned to this school year yet.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {yearSections
                      .sort((a, b) => `${a.courseCode}-${a.name}`.localeCompare(`${b.courseCode}-${b.name}`))
                      .map((section) => (
                        <div key={section.id} className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF7] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[#231F20]">{section.name}</p>
                              <p className="text-sm text-[#6B6B6B]">
                                {section.courseCode} · {section.courseName}
                              </p>
                            </div>
                            <div className="rounded-md bg-white px-2 py-1 text-xs font-medium text-[#231F20] ring-1 ring-[#E5E7EB]">
                              {section.semester || "No semester"}
                            </div>
                          </div>

                          <div className="mt-3 space-y-2 text-xs text-[#6B6B6B]">
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5" />
                              <span>{section.facultyName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FolderTree className="h-3.5 w-3.5" />
                              <span>{section.students?.length || 0} student{(section.students?.length || 0) === 1 ? "" : "s"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchoolYearManagementModal;
