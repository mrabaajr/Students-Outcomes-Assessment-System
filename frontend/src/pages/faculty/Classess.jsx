import { useState, useRef } from "react";
import { Search, Users, Clock, MapPin, BookOpen, ChevronDown, ChevronUp, Download, Upload, AlertCircle, CheckCircle, X } from "lucide-react";
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
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [expandedSection, setExpandedSection] = useState(null);
  const [importModal, setImportModal] = useState({
    isOpen: false,
    sectionId: null,
    sectionName: null,
    loading: false,
    result: null,
    error: null,
  });
  const fileInputRef = useRef(null);

  const filtered = sectionsData.filter(
    (s) =>
      s.schoolYear === selectedYear &&
      (s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.section.toLowerCase().includes(search.toLowerCase()))
  );

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
        <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 sm:pb-16">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              FACULTY PORTAL
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
              <span className="text-white">My Classes</span>
            </h1>
            <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl mb-6">
              View your assigned sections and student rosters. Inactive classes remain visible but
              stay view-only.
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

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="rounded-2xl border border-[#DADDE3] bg-white p-4 sm:p-5 shadow-[0_8px_24px_rgba(35,31,32,0.08)] mb-5">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_repeat(4,minmax(0,0.8fr))_auto] lg:items-end">
              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">
                  <Search className="h-3.5 w-3.5" />
                  Search
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A5A8AB]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Section, course, or student"
                    className="w-full rounded-lg border border-[#D1D5DB] bg-white py-2.5 pl-10 pr-3 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">
                  <Filter className="h-3.5 w-3.5" />
                  Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(event) => setSelectedCourse(event.target.value)}
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
                <label className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">
                  School Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
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
                <label className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(event) => setSelectedSection(event.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                >
                  {filterOptions.sectionNames.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                >
                  <option value="active">Active</option>
                  <option value="all">All</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                onClick={resetFilters}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm font-medium text-[#231F20] transition hover:bg-[#F9FAFB] lg:mt-[1.55rem]"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <div className="mt-4 text-sm text-[#6B6B6B]">
              <span>
                Showing <span className="font-semibold text-[#231F20]">{filteredSections.length}</span> of{" "}
                <span className="font-semibold text-[#231F20]">{sections.length}</span> assigned
                classes
              </span>
              <span>
                Active: <span className="font-semibold text-[#231F20]">{activeCount}</span>
              </span>
              <span>
                Inactive: <span className="font-semibold text-[#231F20]">{inactiveCount}</span>
              </span>
            </div>
          </div>

          {sectionsLoading && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6B6B6B] shadow-sm">
              Loading your assigned classes...
            </div>
          )}

          {!sectionsLoading && sectionsError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
              {sectionsError}
            </div>
          )}

          {!sectionsLoading && !sectionsError && (
            <div className={viewMode === "card" ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
              {viewMode === "card" &&
                filteredSections.map((section) => {
                  const isExpanded = expandedSectionId === section.id;
                  const roster = sectionDetails[section.id]?.students || [];
                  const rosterError = rosterErrorById[section.id];
                  const isRosterLoading = rosterLoadingId === section.id;

                  return (
                    <div
                      key={section.id}
                      className={`max-w-[296px] flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow ${
                        section.isActive
                          ? "border-[#2E3338] bg-white hover:shadow-lg"
                          : "border-[#CFCFCF] bg-[#FAFAFA]"
                      }`}
                    >
                      <div className="p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                            {section.sectionName}
                          </p>
                          <span className="rounded-full bg-[#FFF3CC] px-2 py-1 text-[10px] font-semibold text-[#F5A300]">
                            {section.courseCode}
                          </span>
                        </div>

                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="line-clamp-2 text-lg font-semibold text-[#231F20]">
                            {section.courseName}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                              section.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {section.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                          <div className="rounded-lg bg-[#F5F7FA] px-3 py-2">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-[#8B9097] mb-1">
                              Semester
                            </p>
                            <p className="font-medium text-[#231F20]">{section.semester}</p>
                          </div>
                          <div className="rounded-lg bg-[#F5F7FA] px-3 py-2">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-[#8B9097] mb-1">
                              School Year
                            </p>
                            <p className="font-medium text-[#231F20]">{section.academicYear}</p>
                          </div>
                          <div className="rounded-lg bg-[#F5F7FA] px-3 py-2">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-[#8B9097] mb-1">
                              Students
                            </p>
                            <p className="font-medium text-[#231F20]">{section.studentCount}</p>
                          </div>
                          <div className="rounded-lg bg-[#F5F7FA] px-3 py-2">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-[#8B9097] mb-1">
                              Access
                            </p>
                            <p className="font-medium text-[#231F20]">
                              {section.isActive ? "Editable" : "View Only"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleImportClick(section)}
                            disabled={!section.isActive}
                            className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition ${
                              section.isActive
                                ? "bg-primary text-white hover:bg-primary/90"
                                : "cursor-not-allowed bg-gray-100 text-[#A5A8AB]"
                            }`}
                          >
                            <Upload className="h-3 w-3" />
                            {section.isActive ? "Import Students" : "View Only"}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRoster(section.id)}
                        className="border-t border-gray-200 py-2 px-4 text-xs font-medium text-primary hover:text-primary/80 transition flex items-center justify-center gap-1.5"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                        {isExpanded ? "Hide" : "View"} Students
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-[#FBFBFC] px-3 py-2">
                          {isRosterLoading && (
                            <div className="text-xs text-[#6B6B6B]">Loading students...</div>
                          )}

                          {!isRosterLoading && rosterError && (
                            <div className="text-xs text-red-600">{rosterError}</div>
                          )}

                          {!isRosterLoading && !rosterError && roster.length === 0 && (
                            <div className="text-xs text-[#6B6B6B]">No students enrolled yet.</div>
                          )}

                          {!isRosterLoading && !rosterError && roster.length > 0 && (
                            <div className="max-h-56 overflow-y-auto text-xs">
                              {roster.map((student) => (
                                <div
                                  key={student.studentId}
                                  className="border-b border-gray-100 px-1 py-2 last:border-0"
                                >
                                  <div className="mb-0.5 font-mono text-[10px] text-primary/80">
                                    {student.studentId}
                                  </div>
                                  <div className="font-medium text-[#231F20]">{student.name}</div>
                                  <div className="text-[10px] text-[#6B6B6B]">
                                    {[student.program || "Program not set", student.yearLevel ? `Year ${student.yearLevel}` : ""]
                                      .filter(Boolean)
                                      .join(" | ")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              {viewMode === "list" && (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                          <th className="text-left py-2 font-semibold">Student ID</th>
                          <th className="text-left py-2 font-semibold">Name</th>
                          <th className="text-left py-2 font-semibold">Program</th>
                          <th className="text-left py-2 font-semibold">Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.students.map((stu) => (
                          <tr key={stu.id} className="border-t border-gray-100">
                            <td className="py-2 text-primary font-mono text-xs">{stu.id}</td>
                            <td className="py-2 text-[#231F20]">{stu.name}</td>
                            <td className="py-2 text-[#6B6B6B]">{stu.program}</td>
                            <td className="py-2 text-[#6B6B6B]">{stu.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#A5A8AB]">No sections found matching your criteria.</div>
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
