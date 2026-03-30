import { Users, BookOpen, ChevronRight, Layers, CheckCircle2, Clock, AlertCircle } from "lucide-react";
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
  selectedSOIds = [],
  viewMode = "grid", // "grid" or "list"
  courseMappings = {},
  getSOIcon = () => null,
  isLoading = false,
}) {
  // Helper to get assessment status badge info
  const getStatusBadge = (status) => {
    switch (status) {
      case "assessed":
        return {
          icon: CheckCircle2,
          label: "Assessed",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          borderColor: "border-green-300",
        };
      case "incomplete":
        return {
          icon: AlertCircle,
          label: "Incomplete",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
          borderColor: "border-yellow-300",
        };
      case "not-yet":
      default:
        return {
          icon: Clock,
          label: "Not Yet Assessed",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          borderColor: "border-gray-300",
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

  if (isLoading) {
    const skeletonCards = Array.from({ length: 6 });

    return (
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
        {skeletonCards.map((_, index) => (
          <div
            key={`assessment-skeleton-${index}`}
            className="p-4 rounded-lg border-2 border-[#8A817C]/15 bg-white animate-pulse"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-[#E5E7EB]" />
                <div className="h-3 w-40 rounded bg-[#F1F5F9]" />
              </div>
              <div className="h-5 w-5 rounded-full bg-[#FDE68A]" />
            </div>
            <div className="h-6 w-32 rounded-full bg-[#F3F4F6] mb-4" />
            <div className="space-y-2 mb-4">
              <div className="h-3 w-28 rounded bg-[#F1F5F9]" />
              <div className="h-3 w-24 rounded bg-[#F1F5F9]" />
              <div className="h-3 w-36 rounded bg-[#F1F5F9]" />
            </div>
            <div className="pt-3 border-t border-[#E5E7EB]">
              <div className="h-3 w-20 rounded bg-[#E5E7EB] mb-2" />
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded bg-[#FEF3C7]" />
                <div className="h-6 w-16 rounded bg-[#FEF3C7]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

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
          const statusInfo = getStatusBadge(course.assessmentStatus);
          const StatusIcon = statusInfo.icon;

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

              {/* Assessment Status Badge */}
              <div className={`mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusInfo.label}</span>
              </div>

              {/* Students and Sections */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#6B6B6B]" />
                    <span className="text-xs text-[#6B6B6B]">
                      {course.studentCount || 0} students
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#6B6B6B]" />
                    <span className="text-xs text-[#6B6B6B]">
                      {course.sections?.length || 0} sections
                    </span>
                  </div>
                  <div className="text-xs text-[#6B6B6B]">
                    Last assessed: <span className="font-medium text-[#231F20]">{formatLastAssessed(course.lastAssessed)}</span>
                  </div>
                </div>
                
                {/* Mapped SOs */}
                {(() => {
                  const mappedSOIds = courseMappings[course.courseCode] || [];
                  const mappedSOs = studentOutcomes.filter(so => 
                    mappedSOIds.some(soId => parseInt(soId) === so.id)
                  );
                  if (mappedSOs.length > 0) {
                    return (
                      <div className="pt-2 border-t border-[#E5E7EB]">
                        <p className="text-xs font-semibold text-[#6B6B6B] mb-1.5">Mapped SOs:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {mappedSOs.map((so) => {
                            const Icon = getSOIcon(studentOutcomes.findIndex(s => s.id === so.id));
                            return (
                              <div key={so.id} className="flex items-center gap-1 px-2 py-1 bg-[#FFC20E]/10 rounded text-xs font-semibold text-[#231F20]">
                                {Icon && <Icon className="w-3 h-3" />}
                                {so.code}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
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
        const statusInfo = getStatusBadge(course.assessmentStatus);
        const StatusIcon = statusInfo.icon;

        return (
          <div
            key={course.id}
            onClick={() => onSelectSection(course)}
            className={cn(
              "p-4 rounded-lg border-2 transition-all cursor-pointer",
              "bg-white hover:bg-[#FFC20E]/5",
              isSelected
                ? "border-[#FFC20E] shadow-md"
                : "border-[#8A817C]/20 hover:border-[#FFC20E]/50"
            )}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-[#231F20] text-sm">
                  {course.courseCode} — {course.courseName}
                </h4>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[#FFC20E] flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-3 h-3 text-[#231F20]" />
                </div>
              )}
            </div>

            {/* Assessment Status Badge and Student/Section Info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
                <span className="whitespace-nowrap">{course.studentCount || 0} students</span>
                <span className="whitespace-nowrap">{course.sections?.length || 0} sections</span>
                <span className="whitespace-nowrap">Last assessed: {formatLastAssessed(course.lastAssessed)}</span>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusInfo.label}</span>
              </div>
            </div>
            
            {/* Mapped SOs */}
            {(() => {
              const mappedSOIds = courseMappings[course.courseCode] || [];
              const mappedSOs = studentOutcomes.filter(so => 
                mappedSOIds.some(soId => parseInt(soId) === so.id)
              );
              if (mappedSOs.length > 0) {
                return (
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                    <p className="text-xs font-semibold text-[#6B6B6B] mb-2">Mapped SOs:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mappedSOs.map((so) => {
                        const Icon = getSOIcon(studentOutcomes.findIndex(s => s.id === so.id));
                        return (
                          <div key={so.id} className="flex items-center gap-1 px-2 py-1 bg-[#FFC20E]/10 rounded text-xs font-semibold text-[#231F20]">
                            {Icon && <Icon className="w-3 h-3" />}
                            {so.code}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        );
      })}
    </div>
  );
}

export default SectionsGrid;
