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
      {/* Hero */}
      <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
          <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
            FACULTY PORTAL
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-white">My Classes</span>
          </h1>
          <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl">
            View your assigned sections, student rosters, and mapped outcomes.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A5A8AB]" />
            <input
              type="text"
              placeholder="Search courses or sections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-[#231F20] text-sm rounded-lg pl-10 pr-4 py-2.5 border border-gray-200 focus:border-[#FFC20E] focus:outline-none placeholder:text-[#A5A8AB]"
            />
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white text-[#231F20] text-sm rounded-lg px-4 py-2.5 border border-gray-200 focus:border-[#FFC20E] focus:outline-none"
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
          </select>
        </div>

        {/* Section Cards */}
        <div className="space-y-4">
          {filtered.map((sec) => {
            const isExpanded = expandedSection === sec.section;
            return (
              <div key={sec.section} className="glass-card overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">{sec.code}</span>
                        <h3 className="font-semibold text-[#231F20]">{sec.name}</h3>
                      </div>
                      <p className="text-sm text-[#6B6B6B]">{sec.section}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sec.mappedSOs.map((so) => (
                        <span key={so} className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {so}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-4 text-xs text-[#6B6B6B]">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{sec.schedule}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{sec.room}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{sec.students.length} students</span>
                    <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{sec.semester} Sem, {sec.schoolYear}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : sec.section)}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {isExpanded ? "Hide" : "View"} Students
                    </button>
                    <button 
                      onClick={() => handleImportClick(sec.id, sec.section)}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B] hover:text-[#231F20] transition"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Import CSV
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B] hover:text-[#231F20] transition">
                      <Download className="h-3.5 w-3.5" />
                      Export Roster
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 px-5 sm:px-6 pb-5">
                    <table className="w-full text-sm mt-3">
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
