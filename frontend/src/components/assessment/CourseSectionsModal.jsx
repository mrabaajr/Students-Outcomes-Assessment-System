import { Users, CheckCircle2, Clock3, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  onClose,
  onSelectSection,
}) {
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
            View all sections, faculty, and student enrollment details
          </DialogDescription>
        </DialogHeader>

        {selectedCourse && (
          <div className="space-y-4">
            {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
              <div className="space-y-4">
                {selectedCourse.sections.map((section) => {
                  const facultyName = getFacultyForSection(section, facultyData);
                  const sectionStatus =
                    (selectedSOId && sectionStatusMap?.[`${section.id}-${selectedSOId}`]) || "not-yet";
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-[#6B6B6B]">
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
                                <span className="font-semibold text-[#231F20]">Curriculum:</span>{" "}
                                {section.curriculum || "—"}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onSelectSection(section)}
                            className="px-3 py-1.5 bg-[#FFC20E] text-[#231F20] rounded text-xs font-medium hover:bg-[#FFC20E]/90 transition-colors whitespace-nowrap"
                          >
                            Assess Student
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
                            <div
                              key={student.id}
                              className="px-5 py-3 grid grid-cols-12 text-sm items-center hover:bg-[#FFC20E]/5 transition-colors gap-2"
                            >
                              <span className="col-span-1 text-[#6B6B6B] font-medium">
                                {idx + 1}
                              </span>
                              <span className="col-span-4 font-medium text-[#231F20]">
                                {student.name}
                              </span>
                              <span className="col-span-3 text-[#6B6B6B] font-mono text-xs">
                                {student.studentId}
                              </span>
                              <span className="col-span-2 text-[#6B6B6B] text-xs">
                                {student.yearLevel || "—"}
                              </span>
                              <span className="col-span-2 text-right text-[#6B6B6B] text-xs truncate">
                                {section.curriculum || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!section.students || section.students.length === 0 && (
                        <div className="px-5 py-6 text-center text-sm text-[#6B6B6B]">
                          No students enrolled in this section yet.
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
    </Dialog>
  );
}
