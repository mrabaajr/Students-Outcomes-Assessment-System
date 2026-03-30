import { RefreshCcw, FileSpreadsheet, Users, Calendar, UsersRound, Lightbulb, PenTool, MessageSquare, Scale, FlaskConical, X, Tag } from "lucide-react";
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Icons mapping for SOs
const soIconList = [Lightbulb, PenTool, MessageSquare, Scale, UsersRound, FlaskConical];
const getSOIcon = (index) => soIconList[(index >= 0 ? index : 0) % soIconList.length];

export default function ReportsFilter({ filters, setFilters, filterOptions }) {
  const schoolYears = filterOptions?.school_years || [];
  const courses = filterOptions?.courses || [];
  const sections = filterOptions?.sections || [];
  const studentOutcomes = filterOptions?.student_outcomes || [];

  // Filter sections based on selected course
  const filteredSections = useMemo(() => {
    if (!filters.course) return sections;
    return sections.filter(
      (s) => String(s.course_id) === filters.course || String(s.id) === filters.section
    );
  }, [sections, filters.course]);

  const handleSOToggle = (soId) => {
    setFilters((prev) => ({
      ...prev,
      outcome: prev.outcome === String(soId) ? "" : String(soId),
    }));
  };

  const handleChange = (name, value) => {
    setFilters((prev) => {
      const next = { ...prev, [name]: value };
      // Reset section when course changes
      if (name === "course") {
        next.section = "";
      }
      return next;
    });
  };

  const handleReset = () => {
    setFilters({
      schoolYear: "",
      course: "",
      section: "",
      outcome: "",
    });
  };

  // Build active filter chips
  const activeFilterChips = [];
  
  if (filters.outcome) {
    const so = studentOutcomes.find(s => String(s.id) === String(filters.outcome));
    if (so) {
      activeFilterChips.push({
        key: `outcome-${so.id}`,
        label: `SO ${so.number}`,
        onRemove: () => handleChange("outcome", ""),
      });
    }
  }
  
  if (filters.course) {
    const course = courses.find(c => String(c.id) === String(filters.course));
    if (course) {
      activeFilterChips.push({
        key: `course-${course.id}`,
        label: `Course: ${course.code}`,
        onRemove: () => handleChange("course", ""),
      });
    }
  }
  
  if (filters.section) {
    const section = sections.find(s => String(s.id) === String(filters.section));
    if (section) {
      activeFilterChips.push({
        key: `section-${section.id}`,
        label: `Section: ${section.name}`,
        onRemove: () => handleChange("section", ""),
      });
    }
  }
  
  if (filters.schoolYear) {
    activeFilterChips.push({
      key: `year-${filters.schoolYear}`,
      label: `Year: ${filters.schoolYear}`,
      onRemove: () => handleChange("schoolYear", ""),
    });
  }

  return (
    <div className="glass-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-[#231F20]">Filters</h3>
        {activeFilterChips.length > 0 && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-[#FFC20E] hover:bg-[#FFC20E]/90 text-[#231F20] font-semibold rounded-md transition-colors flex items-center gap-2 text-xs"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Student Outcomes Filter */}
      <div className="mb-6 pb-6 border-b border-[#8A817C]/20">
        <div className="flex items-center gap-3 mb-3">
          <Lightbulb className="w-5 h-5 text-[#6B6B6B]" />
          <span className="text-sm font-medium text-[#6B6B6B]">Student Outcomes:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {studentOutcomes.map((outcome, idx) => {
            const Icon = getSOIcon(idx);
            const isActive = String(filters.outcome) === String(outcome.id);
            
            return (
              <button
                key={outcome.id}
                onClick={() => handleSOToggle(outcome.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                  isActive
                    ? "bg-[#FFC20E] text-[#231F20] shadow-md"
                    : "bg-[#F0F0F0] text-[#6B6B6B] border border-[#D0D0D0] hover:bg-[#E8E8E8]"
                )}
                title={outcome.title}
              >
                <Icon className="w-3.5 h-3.5" />
                SO {outcome.number}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {/* Course filter */}
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-[#6B6B6B]" />
          <span className="text-sm font-medium text-[#6B6B6B]">Course:</span>
          <div className="flex items-center gap-2">
            <Select value={filters.course} onValueChange={(value) => handleChange("course", value)}>
              <SelectTrigger className="w-[240px] border-[#A5A8AB]">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.course && (
              <button
                onClick={() => handleChange("course", "")}
                className="p-1.5 rounded hover:bg-red-50 transition-colors"
                title="Clear course filter"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        </div>

        {/* Section filter */}
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-[#6B6B6B]" />
          <span className="text-sm font-medium text-[#6B6B6B]">Section:</span>
          <div className="flex items-center gap-2">
            <Select value={filters.section} onValueChange={(value) => handleChange("section", value)}>
              <SelectTrigger className="w-[160px] border-[#A5A8AB]">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {filteredSections.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.section && (
              <button
                onClick={() => handleChange("section", "")}
                className="p-1.5 rounded hover:bg-red-50 transition-colors"
                title="Clear section filter"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        </div>

        {/* School Year filter */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#6B6B6B]" />
          <span className="text-sm font-medium text-[#6B6B6B]">School Year:</span>
          <div className="flex items-center gap-2">
            <Select value={filters.schoolYear} onValueChange={(value) => handleChange("schoolYear", value)}>
              <SelectTrigger className="w-[160px] border-[#A5A8AB]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map(sy => (
                  <SelectItem key={sy} value={sy}>
                    {sy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.schoolYear && (
              <button
                onClick={() => handleChange("schoolYear", "")}
                className="p-1.5 rounded hover:bg-red-50 transition-colors"
                title="Clear school year filter"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active filters section */}
      <div className="mt-5 pt-5 border-t border-[#8A817C]/20">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-[#6B6B6B]" />
          <span className="text-sm font-medium text-[#6B6B6B]">Active filters</span>
        </div>
        {activeFilterChips.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.onRemove}
                className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#231F20] hover:border-[#FFC20E] hover:bg-[#FFF8DB] transition-colors"
              >
                <span>{chip.label}</span>
                <X className="w-3.5 h-3.5 text-[#6B6B6B]" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B6B6B]">
            No active filters.
          </p>
        )}
      </div>
    </div>
  );
}
