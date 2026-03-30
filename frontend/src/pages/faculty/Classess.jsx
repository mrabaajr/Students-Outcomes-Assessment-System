import { useState, useRef, useMemo } from "react";
import { Search, Users, Clock, MapPin, BookOpen, ChevronDown, ChevronUp, Download, Upload, AlertCircle, CheckCircle, X, Filter, RotateCcw } from "lucide-react";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";

const sectionsData = [
  {
    code: "CPE 401",
    name: "Computer Networks",
    section: "CPE41S1",
    schedule: "MWF 8:00 - 9:30 AM",
    room: "Room 301",
    schoolYear: "2024-2025",
    semester: "1st",
    mappedSOs: ["SO 1", "SO 3", "SO 5"],
    id: "1",
    students: [
      { id: "2021-00101", name: "Juan Dela Cruz", program: "CPE", year: 4 },
      { id: "2021-00102", name: "Maria Santos", program: "CPE", year: 4 },
      { id: "2021-00103", name: "Pedro Reyes", program: "CPE", year: 4 },
      { id: "2021-00104", name: "Ana Garcia", program: "CPE", year: 4 },
      { id: "2021-00105", name: "Carlos Ramos", program: "CPE", year: 4 },
    ],
  },
  {
    code: "CPE 312",
    name: "Digital Systems",
    section: "CPE31S2",
    schedule: "TTh 10:00 - 11:30 AM",
    room: "Room 205",
    schoolYear: "2024-2025",
    semester: "1st",
    mappedSOs: ["SO 2", "SO 4"],
    id: "2",
    students: [
      { id: "2022-00201", name: "Liza Fernandez", program: "CPE", year: 3 },
      { id: "2022-00202", name: "Mark Villanueva", program: "CPE", year: 3 },
      { id: "2022-00203", name: "Sofia Cruz", program: "CPE", year: 3 },
    ],
  },
  {
    code: "CPE 203",
    name: "Data Structures",
    section: "CPE20S1",
    schedule: "MWF 1:00 - 2:30 PM",
    room: "Room 102",
    schoolYear: "2024-2025",
    semester: "1st",
    mappedSOs: ["SO 1", "SO 2", "SO 6"],
    id: "3",
    students: [
      { id: "2023-00301", name: "James Mendoza", program: "CPE", year: 2 },
      { id: "2023-00302", name: "Emma Tan", program: "CPE", year: 2 },
      { id: "2023-00303", name: "Luis Aquino", program: "CPE", year: 2 },
      { id: "2023-00304", name: "Grace Lim", program: "CPE", year: 2 },
    ],
  },
  {
    code: "CPE 105",
    name: "Introduction to Computing",
    section: "CPE10S3",
    schedule: "TTh 3:00 - 4:30 PM",
    room: "Room 101",
    schoolYear: "2024-2025",
    semester: "1st",
    mappedSOs: ["SO 1"],
    id: "4",
    students: [
      { id: "2024-00401", name: "Mia Rivera", program: "CPE", year: 1 },
      { id: "2024-00402", name: "John Bautista", program: "CPE", year: 1 },
    ],
  },
];

const FacultyClasses = () => {
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("All School Years");
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedSection, setSelectedSection] = useState("All Sections");
  const [expandedSection, setExpandedSection] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // "card" or "list"
  const [importModal, setImportModal] = useState({
    isOpen: false,
    sectionId: null,
    sectionName: null,
    loading: false,
    result: null,
    error: null,
  });
  const fileInputRef = useRef(null);

  const filterOptions = useMemo(() => {
    const courses = ["All Courses", ...new Set(sectionsData.map((section) => section.code).filter(Boolean))];
    const schoolYears = ["All School Years", ...new Set(sectionsData.map((section) => section.schoolYear).filter(Boolean))];
    const sections = ["All Sections", ...new Set(sectionsData.map((section) => section.section).filter(Boolean))];
    return { courses, schoolYears, sections };
  }, []);

  const filtered = useMemo(() => {
    return sectionsData.filter(
      (s) => {
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          normalizedSearch === "" ||
          s.code.toLowerCase().includes(normalizedSearch) ||
          s.name.toLowerCase().includes(normalizedSearch) ||
          s.section.toLowerCase().includes(normalizedSearch) ||
          s.students.some(
            (student) =>
              student.name.toLowerCase().includes(normalizedSearch) ||
              student.id.toLowerCase().includes(normalizedSearch)
          );

        const matchesCourse = selectedCourse === "All Courses" || s.code === selectedCourse;
        const matchesYear = selectedYear === "All School Years" || s.schoolYear === selectedYear;
        const matchesSection = selectedSection === "All Sections" || s.section === selectedSection;

        return matchesSearch && matchesCourse && matchesYear && matchesSection;
      }
    );
  }, [search, selectedCourse, selectedYear, selectedSection]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCourse("All Courses");
    setSelectedYear("All School Years");
    setSelectedSection("All Sections");
  };

  const handleImportClick = (sectionId, sectionName) => {
    setImportModal({
      isOpen: true,
      sectionId,
      sectionName,
      loading: false,
      result: null,
      error: null,
    });
  };

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setImportModal((prev) => ({
        ...prev,
        error: "Please select a CSV file",
      }));
      return;
    }

    setImportModal((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `http://localhost:8000/api/sections/${importModal.sectionId}/import-csv/`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setImportModal((prev) => ({
          ...prev,
          loading: false,
          error: data.error || "Failed to import CSV",
        }));
        return;
      }

      setImportModal((prev) => ({
        ...prev,
        loading: false,
        result: {
          message: data.message,
          created: data.created || 0,
          updated: data.updated || 0,
          skipped: data.skipped || 0,
          errors: data.errors || [],
        },
      }));
    } catch (err) {
      setImportModal((prev) => ({
        ...prev,
        loading: false,
        error: `Error: ${err.message}`,
      }));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeImportModal = () => {
    setImportModal({
      isOpen: false,
      sectionId: null,
      sectionName: null,
      loading: false,
      result: null,
      error: null,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
      {/* Hero */}
      <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
          <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
            FACULTY PORTAL
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-white">My Classes</span>
          </h1>
          <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl mb-6">
            View your assigned sections, student rosters, and mapped outcomes.
          </p>

          <div className="flex items-center bg-[#3A3A3A] rounded-lg p-1 w-fit">
            <button
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                viewMode === "card"
                  ? "bg-[#FFC20E] text-[#231F20]"
                  : "text-[#A5A8AB] hover:text-white"
              }`}
            >
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Card View</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-[#FFC20E] text-[#231F20]"
                  : "text-[#A5A8AB] hover:text-white"
              }`}
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">List View</span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Filters */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5 shadow-sm mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                <Search className="h-3.5 w-3.5" />
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A5A8AB]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Section, course, or student"
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white py-2.5 pl-10 pr-3 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                />
              </div>
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                  <Filter className="h-3.5 w-3.5" />
                  Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                >
                  {filterOptions.courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                  School Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                >
                  {filterOptions.schoolYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                >
                  {filterOptions.sections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm font-medium text-[#231F20] transition hover:bg-[#F9FAFB]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="mt-4 text-sm text-[#6B6B6B]">
            Showing <span className="font-semibold text-[#231F20]">{filtered.length}</span> of{" "}
            <span className="font-semibold text-[#231F20]">{sectionsData.length}</span> sections
          </div>
        </div>

        {/* Section Cards Grid */}
        <div className={viewMode === "card" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
          {viewMode === "card" && (
            <>
              {filtered.map((sec) => {
                const isExpanded = expandedSection === sec.section;
                return (
                  <div key={sec.section} className="flex flex-col glass-card overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-4 sm:p-5">
                      {/* Header with Code and SOs */}
                      <div className="mb-3">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded flex-shrink-0">{sec.code}</span>
                          <div className="flex flex-wrap gap-1">
                            {sec.mappedSOs.slice(0, 2).map((so) => (
                              <span key={so} className="text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {so}
                              </span>
                            ))}
                            {sec.mappedSOs.length > 2 && (
                              <span className="text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                +{sec.mappedSOs.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm text-[#231F20] line-clamp-2">{sec.name}</h3>
                        <p className="text-xs text-[#6B6B6B] mt-1">{sec.section}</p>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        <div className="flex items-start gap-1.5">
                          <Clock className="h-3 w-3 text-[#A5A8AB] flex-shrink-0 mt-0.5" />
                          <span className="text-[#6B6B6B] line-clamp-2">{sec.schedule}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3 w-3 text-[#A5A8AB] flex-shrink-0 mt-0.5" />
                          <span className="text-[#6B6B6B]">{sec.room}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-[#A5A8AB]" />
                          <span className="text-[#6B6B6B]">{sec.students.length} students</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3 w-3 text-[#A5A8AB]" />
                          <span className="text-[#6B6B6B]">{sec.schoolYear}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleImportClick(sec.id, sec.section)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-white bg-primary hover:bg-primary/90 transition rounded px-2 py-1.5"
                        >
                          <Upload className="h-3 w-3" />
                          Import
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-[#6B6B6B] bg-gray-100 hover:bg-gray-200 transition rounded px-2 py-1.5">
                          <Download className="h-3 w-3" />
                          Export
                        </button>
                      </div>
                    </div>

                    {/* View Students Button */}
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : sec.section)}
                      className="border-t border-gray-200 py-2 px-4 text-xs font-medium text-primary hover:text-primary/80 transition flex items-center justify-center gap-1.5"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {isExpanded ? "Hide" : "View"} Students
                    </button>

                    {/* Expanded Student List */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-[#F9FAFB] px-4 py-3">
                        <div className="text-xs space-y-2 max-h-48 overflow-y-auto">
                          {sec.students.map((stu) => (
                            <div key={stu.id} className="border-b border-gray-100 pb-2 last:border-0">
                              <div className="font-mono text-primary text-[10px] mb-0.5">{stu.id}</div>
                              <div className="font-medium text-[#231F20] text-xs">{stu.name}</div>
                              <div className="text-[#6B6B6B] text-[10px]">{stu.program} - Year {stu.year}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {viewMode === "list" && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                      <th className="text-left py-3 px-4 font-semibold text-[#6B6B6B] text-xs uppercase tracking-wider">Course Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B6B6B] text-xs uppercase tracking-wider">Course Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B6B6B] text-xs uppercase tracking-wider">Section</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B6B6B] text-xs uppercase tracking-wider">Schedule</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B6B6B] text-xs uppercase tracking-wider">Room</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B6B6B] text-xs uppercase tracking-wider">Students</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B6B6B] text-xs uppercase tracking-wider">School Year</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#6B6B6B] text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((sec) => (
                      <tr key={sec.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition">
                        <td className="py-3 px-4">
                          <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">{sec.code}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#231F20]">{sec.name}</td>
                        <td className="py-3 px-4 text-[#6B6B6B]">{sec.section}</td>
                        <td className="py-3 px-4 text-[#6B6B6B] text-xs">{sec.schedule}</td>
                        <td className="py-3 px-4 text-[#6B6B6B] text-xs">{sec.room}</td>
                        <td className="py-3 px-4 text-[#6B6B6B]">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {sec.students.length}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6B6B6B]">{sec.schoolYear}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleImportClick(sec.id, sec.section)}
                              className="text-[10px] font-medium text-primary hover:text-primary/80 transition bg-primary/10 px-2 py-1 rounded"
                            >
                              Import
                            </button>
                            <button className="text-[10px] font-medium text-[#6B6B6B] hover:text-[#231F20] transition bg-gray-100 px-2 py-1 rounded">
                              Export
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-[#E5E7EB]">
              <Users className="w-12 h-12 text-[#A5A8AB] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#231F20] mb-2">
                {sectionsData.length === 0 ? "No Sections Yet" : "No Matching Sections"}
              </h3>
              <p className="text-sm text-[#6B6B6B] mb-4">
                {sectionsData.length === 0
                  ? "You don't have any classes assigned yet."
                  : "Try adjusting or clearing your filters to see more results."}
              </p>
              {sectionsData.length > 0 && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#231F20] text-white rounded-lg text-sm font-medium hover:bg-[#3A3A3A]"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </main>

      <Footer />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Import Modal */}
      {importModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#231F20]">
                  Import Students to {importModal.sectionName}
                </h2>
                <button
                  onClick={closeImportModal}
                  className="text-[#6B6B6B] hover:text-[#231F20]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {importModal.loading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-[#6B6B6B]">Processing CSV file...</p>
                </div>
              )}

              {importModal.error && !importModal.result && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-semibold">Import Failed</p>
                      <p className="text-red-700 text-sm mt-1">{importModal.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {importModal.result && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-green-800 font-semibold">{importModal.result.message}</p>
                        <div className="text-green-700 text-sm mt-2 space-y-1">
                          <p>✓ Created: {importModal.result.created} students</p>
                          <p>✓ Updated: {importModal.result.updated} students</p>
                          {importModal.result.skipped > 0 && (
                            <p>⊝ Skipped: {importModal.result.skipped} rows</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {importModal.result.errors && importModal.result.errors.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 font-semibold text-sm mb-2">Issues encountered:</p>
                      <ul className="text-yellow-700 text-xs space-y-1">
                        {importModal.result.errors.slice(0, 5).map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                        {importModal.result.errors.length > 5 && (
                          <li>• ... and {importModal.result.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!importModal.loading && !importModal.result && !importModal.error && (
                <div className="py-8">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-[#6B6B6B] mx-auto mb-3" />
                    <p className="text-[#231F20] font-semibold mb-1">Select a CSV file</p>
                    <p className="text-xs text-[#6B6B6B] mb-4">
                      Required columns: student_id, first_name, last_name, program, year_level
                    </p>
                    <button
                      onClick={handleChooseFileClick}
                      className="px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary/90 transition"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                {importModal.result && (
                  <button
                    onClick={closeImportModal}
                    className="flex-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary/90 transition"
                  >
                    Close
                  </button>
                )}
                {!importModal.loading && !importModal.result && (
                  <button
                    onClick={closeImportModal}
                    className="flex-1 px-4 py-2 bg-gray-200 text-[#231F20] text-sm font-medium rounded hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyClasses;
