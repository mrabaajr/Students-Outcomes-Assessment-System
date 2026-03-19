import { Users, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SectionsGrid Component
 * Displays courses as cards or list with faculty and SO information
 * Used in Assessment page to give program chairs an overview before entering grades
 */
export function SectionsGrid({
  sections = [],
  selectedSectionId = null,
  studentOutcomes = [],
  onSelectSection = () => {},
  selectedSOId = null,
  viewMode = "grid", // "grid" or "list"
}) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-[#6B6B6B]/40 mx-auto mb-3" />
        <p className="text-sm text-[#6B6B6B]">
          No courses found for the selected filters.
        </p>
        <p className="text-xs text-[#6B6B6B] mt-1">
          Please adjust your school year selection or select a different Student Outcome.
        </p>
      </div>
    );
  }

  // Grid view (default)
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((course) => {
          const isSelected = selectedSectionId === course.courseCode;

          return (
            <div
              key={course.id}
              onClick={() => onSelectSection(course)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all cursor-pointer hover-lift",
                "bg-white hover:bg-[#FFC20E]/5",
                isSelected
                  ? "border-[#FFC20E] shadow-md"
                  : "border-[#8A817C]/20 hover:border-[#FFC20E]/50"
              )}
            >
              {/* Header: Course Code & Course Name */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#231F20] text-sm leading-tight">
                    {course.courseCode}
                  </h4>
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    {course.courseName}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#FFC20E] flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="w-3 h-3 text-[#231F20]" />
                  </div>
                )}
              </div>

              {/* Students Section */}
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span className="text-xs text-[#6B6B6B]">
                  {course.studentCount || 0} students
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-3">
      {sections.map((course) => {
        const isSelected = selectedSectionId === course.courseCode;

        return (
          <div
            key={course.id}
            onClick={() => onSelectSection(course)}
            className={cn(
              "p-4 rounded-lg border-2 transition-all cursor-pointer",
              "bg-white hover:bg-[#FFC20E]/5 flex items-center justify-between",
              isSelected
                ? "border-[#FFC20E] shadow-md"
                : "border-[#8A817C]/20 hover:border-[#FFC20E]/50"
            )}
          >
            <div className="flex-1">
              <h4 className="font-semibold text-[#231F20] text-sm">
                {course.courseCode} — {course.courseName}
              </h4>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <span className="text-xs text-[#6B6B6B] whitespace-nowrap">
                {course.studentCount || 0} students
              </span>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[#FFC20E] flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-3 h-3 text-[#231F20]" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SectionsGrid;
