import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Search,
  Users,
  Clock,
  MapPin,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  X,
  Filter,
  RotateCcw,
  Loader2,
} from "lucide-react";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";

const API_BASE_URL = "http://localhost:8000/api";

const toYearNumber = (yearLevel) => {
  const match = String(yearLevel || "").match(/\d+/);
  return match ? Number(match[0]) : null;
};

const normalizeSection = (section) => ({
  id: String(section.id),
  code: section.courseCode || "",
  name: section.courseName || "",
  section: section.name || "",
  schedule: section.schedule || "Schedule not set",
  room: section.room || "Room not set",
  schoolYear: section.schoolYear || section.academicYear || "",
  semester: section.semester || "",
  mappedSOs: Array.isArray(section.studentOutcomes)
    ? section.studentOutcomes.map((so) => so.number || so.id).filter(Boolean)
    : [],
  students: Array.isArray(section.students)
    ? section.students.map((student) => ({
        id: student.studentId || String(student.id),
        name: student.name || "Unnamed Student",
        program: student.course || "",
        year: toYearNumber(student.yearLevel),
      }))
    : [],
});

const FacultyClasses = () => {
  const [sectionsData, setSectionsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("All School Years");
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedSection, setSelectedSection] = useState("All Sections");
  const [expandedSection, setExpandedSection] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [importModal, setImportModal] = useState({
    isOpen: false,
    sectionId: null,
    sectionName: null,
    loading: false,
    result: null,
    error: null,
  });
  const fileInputRef = useRef(null);

  const loadSections = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_BASE_URL}/sections/load_all/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const sections = Array.isArray(response.data?.sections) ? response.data.sections : [];
      setSectionsData(sections.map(normalizeSection));
    } catch (error) {
      console.error("Failed to load faculty classes:", error);
      setLoadError(
        error.response?.data?.detail ||
          "Unable to load your assigned classes right now."
      );
      setSectionsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const filterOptions = useMemo(() => {
    const courses = ["All Courses", ...new Set(sectionsData.map((section) => section.code).filter(Boolean))];
    const schoolYears = ["All School Years", ...new Set(sectionsData.map((section) => section.schoolYear).filter(Boolean))];
    const sections = ["All Sections", ...new Set(sectionsData.map((section) => section.section).filter(Boolean))];
    return { courses, schoolYears, sections };
  }, [sectionsData]);

  const filtered = useMemo(() => {
    return sectionsData.filter((section) => {
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch === "" ||
        section.code.toLowerCase().includes(normalizedSearch) ||
        section.name.toLowerCase().includes(normalizedSearch) ||
        section.section.toLowerCase().includes(normalizedSearch) ||
        section.students.some(
          (student) =>
            student.name.toLowerCase().includes(normalizedSearch) ||
            student.id.toLowerCase().includes(normalizedSearch)
        );

      const matchesCourse = selectedCourse === "All Courses" || section.code === selectedCourse;
      const matchesYear = selectedYear === "All School Years" || section.schoolYear === selectedYear;
      const matchesSection = selectedSection === "All Sections" || section.section === selectedSection;

      return matchesSearch && matchesCourse && matchesYear && matchesSection;
    });
  }, [search, sectionsData, selectedCourse, selectedYear, selectedSection]);

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

    if (!file.name.endsWith(".csv")) {
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
      formData.append("file", file);

      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${API_BASE_URL}/sections/${importModal.sectionId}/import-csv/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setImportModal((prev) => ({
        ...prev,
        loading: false,
        result: {
          message: response.data.message,
          created: response.data.created || 0,
          updated: response.data.updated || 0,
          skipped: response.data.skipped || 0,
          errors: response.data.errors || [],
        },
      }));

      await loadSections();
    } catch (error) {
      setImportModal((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.error || `Error: ${error.message}`,
      }));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

          {isLoading && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 shadow-sm text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#FFC20E] mx-auto mb-4" />
              <p className="text-sm text-[#6B6B6B]">Loading your assigned classes...</p>
            </div>
          )}

          {!isLoading && loadError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-red-800">Unable to load classes</p>
                  <p className="text-sm text-red-700 mt-1">{loadError}</p>
                  <button
                    onClick={loadSections}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#231F20] px-4 py-2 text-sm font-medium text-white hover:bg-[#3A3A3A]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !loadError && (
            <div className={viewMode === "card" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
              {viewMode === "card" && (
                <>
                  {filtered.map((sec) => {
                    const isExpanded = expandedSection === sec.section;
                    return (
                      <div key={sec.section} className="flex flex-col glass-card overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-4 sm:p-5">
                          <div className="mb-3">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded flex-shrink-0">
                                {sec.code}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {sec.mappedSOs.slice(0, 2).map((so) => (
                                  <span
                                    key={so}
                                    className="text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                                  >
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
                              <span className="text-[#6B6B6B]">{sec.schoolYear || "Not set"}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleImportClick(sec.id, sec.section)}
                              className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-white bg-primary hover:bg-primary/90 transition rounded px-2 py-1.5"
                            >
                              <Upload className="h-3 w-3" />
                              Import
                            </button>
                            <button
                              type="button"
                              disabled
                              className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-[#A5A8AB] bg-gray-100 rounded px-2 py-1.5 cursor-not-allowed"
                            >
                              <Download className="h-3 w-3" />
                              Export
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedSection(isExpanded ? null : sec.section)}
                          className="border-t border-gray-200 py-2 px-4 text-xs font-medium text-primary hover:text-primary/80 transition flex items-center justify-center gap-1.5"
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          {isExpanded ? "Hide" : "View"} Students
                        </button>

                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-[#F9FAFB] px-4 py-3">
                            <div className="text-xs space-y-2 max-h-48 overflow-y-auto">
                              {sec.students.map((stu) => (
                                <div key={stu.id} className="border-b border-gray-100 pb-2 last:border-0">
                                  <div className="font-mono text-primary text-[10px] mb-0.5">{stu.id}</div>
                                  <div className="font-medium text-[#231F20] text-xs">{stu.name}</div>
                                  <div className="text-[#6B6B6B] text-[10px]">
                                    {stu.program || "Program not set"}
                                    {stu.year ? ` - Year ${stu.year}` : ""}
                                  </div>
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
                            <td className="py-3 px-4 text-[#6B6B6B]">{sec.schoolYear || "Not set"}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleImportClick(sec.id, sec.section)}
                                  className="text-[10px] font-medium text-primary hover:text-primary/80 transition bg-primary/10 px-2 py-1 rounded"
                                >
                                  Import
                                </button>
                                <button
                                  type="button"
                                  disabled
                                  className="text-[10px] font-medium text-[#A5A8AB] bg-gray-100 px-2 py-1 rounded cursor-not-allowed"
                                >
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
          )}
        </div>
      </main>

      <Footer />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

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
                          <p>Created: {importModal.result.created} students</p>
                          <p>Updated: {importModal.result.updated} students</p>
                          {importModal.result.skipped > 0 && (
                            <p>Skipped: {importModal.result.skipped} rows</p>
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
                          <li key={idx}>- {error}</li>
                        ))}
                        {importModal.result.errors.length > 5 && (
                          <li>- ... and {importModal.result.errors.length - 5} more</li>
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
