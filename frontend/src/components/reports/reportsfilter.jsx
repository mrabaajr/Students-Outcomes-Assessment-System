import { RefreshCcw } from "lucide-react";
import { useMemo } from "react";

export default function ReportsFilter({ filters, setFilters, filterOptions }) {
  const schoolYears = filterOptions?.school_years || [];
  const courses = filterOptions?.courses || [];
  const sections = filterOptions?.sections || [];
  const studentOutcomes = filterOptions?.student_outcomes || [];

  // Filter sections based on selected course
  const filteredSections = useMemo(() => {
    if (!filters.course) return sections;
    return sections.filter(
      (s) => String(s.course__code) === filters.course || String(s.id) === filters.section
    );
  }, [sections, filters.course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        {/* School Year */}
        <div className="flex flex-col w-full lg:w-1/5">
          <label className="text-xs font-medium text-gray-500 mb-1">School Year</label>
          <select
            name="schoolYear"
            value={filters.schoolYear}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {schoolYears.map((sy) => (
              <option key={sy} value={sy}>
                {sy}
              </option>
            ))}
          </select>
        </div>

        {/* Course */}
        <div className="flex flex-col w-full lg:w-1/5">
          <label className="text-xs font-medium text-gray-500 mb-1">Course</label>
          <select
            name="course"
            value={filters.course}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div className="flex flex-col w-full lg:w-1/5">
          <label className="text-xs font-medium text-gray-500 mb-1">Section</label>
          <select
            name="section"
            value={filters.section}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {filteredSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Student Outcome */}
        <div className="flex flex-col w-full lg:w-1/5">
          <label className="text-xs font-medium text-gray-500 mb-1">Student Outcome</label>
          <select
            name="outcome"
            value={filters.outcome}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {studentOutcomes.map((so) => (
              <option key={so.id} value={so.id}>
                SO {so.number}: {so.title}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg"
        >
          <RefreshCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}