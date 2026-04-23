import { useRef, useState } from "react";
import { Users, CheckCircle2, Clock3, AlertCircle, ChevronRight, Plus, Upload, Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StudentFormDialog from "@/components/classes/StudentFormDialog";

const getFacultyForSection = (section, facultyData) => {
  const match = facultyData.find((faculty) =>
    faculty.courses.some(
      (course) =>
        course.code === section.courseCode &&
        course.sections.includes(section.name)
    )
  );
  return match?.name || "No faculty assigned";
};

export function CourseSectionsModal({
  isOpen,
  selectedCourse,
  facultyData,
  selectedSOId,
  sectionStatusMap,
  sectionLastAssessedMap,
  onClose,
  onSelectSection,
  onSelectStudent,
  onAddStudent,
  onImportStudents,
}) {
  const fileInputRef = useRef(null);
  const [studentDialogSection, setStudentDialogSection] = useState(null);
  const [pendingImportSection, setPendingImportSection] = useState(null);
  const [importState, setImportState] = useState({
    sectionId: null,
    loading: false,
    message: "",
    error: "",
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "assessed":
        return {
          icon: CheckCircle2,
          label: "Assessed",
          className: "bg-green-100 text-green-700 border-green-300",
        };
      case "incomplete":
        return {
          icon: AlertCircle,
          label: "Incomplete",
          className: "bg-yellow-100 text-yellow-700 border-yellow-300",
        };
      case "not-yet":
      default:
        return {
          icon: Clock3,
          label: "Not Yet Assessed",
          className: "bg-gray-100 text-gray-700 border-gray-300",
        };
    }
  };

  const formatLastAssessed = (value) => {
    if (!value) return "Not assessed yet";

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return "Not assessed yet";

    return parsedDate.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleOpenStudentDialog = (section) => {
    setStudentDialogSection(section);
  };

  const handleSaveStudent = async (studentData) => {
    if (!studentDialogSection || !onAddStudent) {
      return;
    }

    await onAddStudent(studentDialogSection, studentData);
    setStudentDialogSection(null);
  };

  const handleStartImport = (section) => {
    setPendingImportSection(section);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleImportFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !pendingImportSection || !onImportStudents) {
      return;
    }

    setImportState({
      sectionId: pendingImportSection.id,
      loading: true,
      message: "",
      error: "",
    });

    try {
      const result = await onImportStudents(pendingImportSection, file);
      setImportState({
        sectionId: pendingImportSection.id,
        loading: false,
        message: result?.message || "Students imported successfully.",
        error: "",
      });
    } catch (error) {
      setImportState({
        sectionId: pendingImportSection.id,
        loading: false,
        message: "",
        error: error?.message || "Failed to import students.",
      });
    } finally {
      setPendingImportSection(null);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleExportSectionStudents = (section) => {
    const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Section", section.name],
      ["Course Code", section.courseCode],
      ["Course Name", selectedCourse?.courseName || section.courseName || ""],
      ["Semester", section.semester || ""],
      ["School Year", section.schoolYear || ""],
      ["Curriculum", section.curriculum || ""],
      ["Faculty", getFacultyForSection(section, facultyData)],
      [],
      ["Student ID", "Student Name", "Program", "Year Level"],
      ...(section.students || []).map((student) => [
        student.studentId || "",
        student.name || "",
        student.course || "",
        student.yearLevel || "",
      ]),
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${section.courseCode || "section"}_${section.name}_students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {selectedCourse?.courseName} ({selectedCourse?.courseCode})
          </DialogTitle>
          <DialogDescription>
            View all sections, faculty, and student enrollment details. Click a student row to open the rubric and assess one student at a time.
          </DialogDescription>
        </DialogHeader>

        {selectedCourse && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportFileSelected}
            />
            {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
              <div className="space-y-4">
                {selectedCourse.sections.map((section) => {
                  const facultyName = getFacultyForSection(section, facultyData);
                  const hasStudents = (section.students?.length || 0) > 0;
                  const sectionStatus =
                    (selectedSOId && sectionStatusMap?.[`${section.id}-${selectedSOId}`]) || "not-yet";
                  const lastAssessed =
                    (selectedSOId && sectionLastAssessedMap?.[`${section.id}-${selectedSOId}`]) || null;
                  const statusBadge = getStatusBadge(sectionStatus);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <div
                      key={section.id}
                      className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden transition-all hover:shadow-md"
                    >
                      <div className="px-5 py-4 border-b border-[#E5E7EB] bg-white">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[#FFC20E] flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-[#231F20]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <h4 className="font-bold text-base text-[#231F20]">
                                {section.name}
                              </h4>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}
                              >
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusBadge.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-[#6B6B6B]">
                              <div>
                                <span className="font-semibold text-[#231F20]">Faculty:</span>{" "}
                                {facultyName}
                              </div>
                              <div>
                                <span className="font-semibold text-[#231F20]">Students:</span>{" "}
                                {section.students?.length || 0}
                              </div>
                              <div>
                                <span className="font-semibold text-[#231F20]">Year:</span>{" "}
                                {section.schoolYear}
                              </div>
                              <div>
                                <span className="font-semibold text-[#231F20]">Semester:</span>{" "}
                                {section.semester || "-"}
                              </div>
                              <div>
                                <span className="font-semibold text-[#231F20]">Curriculum:</span>{" "}
                                {section.curriculum || "-"}
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-[#6B6B6B]">
                              <span className="font-semibold text-[#231F20]">Last assessed:</span>{" "}
                              {formatLastAssessed(lastAssessed)}
                            </div>
                            {(onAddStudent || onImportStudents) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {onAddStudent && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenStudentDialog(section)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#231F20] transition hover:border-[#FFC20E] hover:bg-[#FFF8DB]"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Student
                                  </button>
                                )}
                                {onImportStudents && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartImport(section)}
                                    disabled={importState.loading && importState.sectionId === section.id}
                                    className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#231F20] transition hover:border-[#FFC20E] hover:bg-[#FFF8DB] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {importState.loading && importState.sectionId === section.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Upload className="h-3.5 w-3.5" />
                                    )}
                                    Import CSV
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleExportSectionStudents(section)}
                                  disabled={!hasStudents}
                                  className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#231F20] transition hover:border-[#FFC20E] hover:bg-[#FFF8DB] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Export CSV
                                </button>
                              </div>
                            )}
                            {importState.sectionId === section.id && importState.message && (
                              <div className="mt-2 text-xs font-medium text-emerald-700">
                                {importState.message}
                              </div>
                            )}
                            {importState.sectionId === section.id && importState.error && (
                              <div className="mt-2 text-xs font-medium text-red-600">
                                {importState.error}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => onSelectSection(section)}
                            disabled={!hasStudents}
                            className="px-3 py-1.5 bg-[#FFC20E] text-[#231F20] rounded text-xs font-medium hover:bg-[#FFC20E]/90 transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#6B6B6B] disabled:hover:bg-[#E5E7EB]"
                          >
                            {hasStudents ? "View Summary" : "No Students Yet"}
                          </button>
                        </div>
                      </div>

                      {section.students && section.students.length > 0 && (
                        <div className="divide-y divide-[#E5E7EB]">
                          <div className="px-5 py-3 bg-[#F9FAFB]">
                            <div className="grid grid-cols-12 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider gap-2">
                              <span className="col-span-1">#</span>
                              <span className="col-span-4">Name</span>
                              <span className="col-span-3">Student ID</span>
                              <span className="col-span-2">Year Level</span>
                              <span className="col-span-2 text-right">Curriculum</span>
                            </div>
                          </div>
                          {section.students.map((student, idx) => (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => onSelectStudent?.(section, student)}
                              title={`Assess ${student.name}`}
                              className="group w-full cursor-pointer px-5 py-3 grid grid-cols-12 text-sm items-center text-left hover:bg-[#FFC20E]/10 focus:bg-[#FFC20E]/10 focus:outline-none transition-colors gap-2"
                            >
                              <span className="col-span-1 text-[#6B6B6B] font-medium">
                                {idx + 1}
                              </span>
                              <span className="col-span-4 flex items-center gap-2 font-medium text-[#231F20]">
                                <span>{student.name}</span>
                                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F59E0B] opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                                  Assess
                                </span>
                              </span>
                              <span className="col-span-3 text-[#6B6B6B] font-mono text-xs">
                                {student.studentId}
                              </span>
                              <span className="col-span-2 text-[#6B6B6B] text-xs">
                                {student.yearLevel || "-"}
                              </span>
                              <span className="col-span-2 flex items-center justify-end gap-2 text-right text-[#6B6B6B] text-xs truncate">
                                <span>{section.curriculum || "-"}</span>
                                <ChevronRight className="h-4 w-4 text-[#F59E0B] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-focus:translate-x-0.5 group-focus:opacity-100" />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {!section.students || section.students.length === 0 && (
                        <div className="px-5 py-6 text-center text-sm text-[#6B6B6B]">
                          No students enrolled in this section yet. Add students in the Classes page before assessing it.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#6B6B6B] text-center py-8">
                No sections found for this course.
              </p>
            )}
          </div>
        )}
      </DialogContent>

      <StudentFormDialog
        open={!!studentDialogSection}
        onClose={() => setStudentDialogSection(null)}
        onSave={handleSaveStudent}
        initialData={null}
      />
    </Dialog>
  );
}
