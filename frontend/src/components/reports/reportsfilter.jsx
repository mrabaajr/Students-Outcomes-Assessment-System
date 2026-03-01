import { RefreshCcw } from "lucide-react";

export default function ReportsFilter({ filters, setFilters }) {

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      schoolYear: "",
      course: "",
      section: "",
      outcome: ""
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">

        {/* School Year */}
        <div className="flex flex-col w-full lg:w-1/4">
          <label className="text-xs font-medium text-gray-500 mb-1">
            School Year
          </label>
          <select
            name="schoolYear"
            value={filters.schoolYear}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
          </select>
        </div>

        {/* Course */}
        <div className="flex flex-col w-full lg:w-1/4">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Course
          </label>
          <select
            name="course"
            value={filters.course}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="CPE205A">CPE205A</option>
            <option value="CPE301">CPE301</option>
          </select>
        </div>

        {/* Section */}
        <div className="flex flex-col w-full lg:w-1/4">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Section
          </label>
          <select
            name="section"
            value={filters.section}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="CPE31S2">CPE31S2</option>
          </select>
        </div>

        {/* Student Outcome */}
        <div className="flex flex-col w-full lg:w-1/4">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Student Outcome
          </label>
          <select
            name="outcome"
            value={filters.outcome}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="SO1">SO1</option>
            <option value="SO2">SO2</option>
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