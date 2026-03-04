import { useState, useCallback } from "react";
import { Save, Download, Upload, CheckCircle2, AlertCircle, Circle, RotateCcw } from "lucide-react";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";

const sections = [
  { id: "CPE41S1", label: "CPE 401 - CPE41S1 (Computer Networks)", courseId: "CPE401" },
  { id: "CPE31S2", label: "CPE 312 - CPE31S2 (Digital Systems)", courseId: "CPE312" },
  { id: "CPE20S1", label: "CPE 203 - CPE20S1 (Data Structures)", courseId: "CPE203" },
  { id: "CPE10S3", label: "CPE 105 - CPE10S3 (Intro to Computing)", courseId: "CPE105" },
];

const soMapping = {
  CPE401: [
    { id: "SO1", title: "SO 1: Apply Engineering Knowledge", pis: [
      { id: "PI1.1", criteria: [
        { id: "PC1.1.1", label: "Problem Identification" },
        { id: "PC1.1.2", label: "Solution Formulation" },
        { id: "PC1.1.3", label: "Technical Analysis" },
      ]},
    ]},
    { id: "SO3", title: "SO 3: Design System Components", pis: [
      { id: "PI3.1", criteria: [
        { id: "PC3.1.1", label: "System Design" },
        { id: "PC3.1.2", label: "Component Selection" },
      ]},
    ]},
  ],
  CPE312: [
    { id: "SO2", title: "SO 2: Conduct Experiments", pis: [
      { id: "PI2.1", criteria: [
        { id: "PC2.1.1", label: "Experiment Setup" },
        { id: "PC2.1.2", label: "Data Collection" },
        { id: "PC2.1.3", label: "Result Analysis" },
      ]},
    ]},
  ],
  CPE203: [
    { id: "SO1", title: "SO 1: Apply Engineering Knowledge", pis: [
      { id: "PI1.1", criteria: [
        { id: "PC1.1.1", label: "Problem Identification" },
        { id: "PC1.1.2", label: "Solution Formulation" },
      ]},
    ]},
  ],
  CPE105: [
    { id: "SO1", title: "SO 1: Apply Engineering Knowledge", pis: [
      { id: "PI1.1", criteria: [
        { id: "PC1.1.1", label: "Problem Identification" },
      ]},
    ]},
  ],
};

const studentsBySection = {
  CPE41S1: [
    { id: "2021-00101", name: "Juan Dela Cruz" },
    { id: "2021-00102", name: "Maria Santos" },
    { id: "2021-00103", name: "Pedro Reyes" },
    { id: "2021-00104", name: "Ana Garcia" },
    { id: "2021-00105", name: "Carlos Ramos" },
  ],
  CPE31S2: [
    { id: "2022-00201", name: "Liza Fernandez" },
    { id: "2022-00202", name: "Mark Villanueva" },
    { id: "2022-00203", name: "Sofia Cruz" },
  ],
  CPE20S1: [
    { id: "2023-00301", name: "James Mendoza" },
    { id: "2023-00302", name: "Emma Tan" },
    { id: "2023-00303", name: "Luis Aquino" },
    { id: "2023-00304", name: "Grace Lim" },
  ],
  CPE10S3: [
    { id: "2024-00401", name: "Mia Rivera" },
    { id: "2024-00402", name: "John Bautista" },
  ],
};

const FacultyAssessments = () => {
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSO, setSelectedSO] = useState("");
  const [grades, setGrades] = useState({});
  const [saved, setSaved] = useState(false);

  const sectionObj = sections.find((s) => s.id === selectedSection);
  const availableSOs = sectionObj ? soMapping[sectionObj.courseId] || [] : [];
  const soObj = availableSOs.find((so) => so.id === selectedSO);
  const students = studentsBySection[selectedSection] || [];
  const allCriteria = soObj ? soObj.pis.flatMap((pi) => pi.criteria) : [];

  const handleGradeChange = useCallback((studentId, criterionId, value) => {
    const num = value === "" ? "" : Math.min(5, Math.max(0, Number(value)));
    setGrades((prev) => ({
      ...prev,
      [`${studentId}-${criterionId}`]: num,
    }));
    setSaved(false);
  }, []);

  const getStudentAvg = (studentId) => {
    if (allCriteria.length === 0) return null;
    const scores = allCriteria.map((c) => grades[`${studentId}-${c.id}`]).filter((v) => v !== undefined && v !== "");
    if (scores.length === 0) return null;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  };

  const getStudentStatus = (studentId) => {
    const filled = allCriteria.filter((c) => grades[`${studentId}-${c.id}`] !== undefined && grades[`${studentId}-${c.id}`] !== "").length;
    if (filled === 0) return "not-started";
    if (filled === allCriteria.length) return "complete";
    return "incomplete";
  };

  const totalGraded = students.filter((s) => getStudentStatus(s.id) === "complete").length;

  const handleSave = () => setSaved(true);
  const handleClear = () => { setGrades({}); setSaved(false); };

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
            <span className="text-white">Assessment &</span>
            <br />
            <span className="text-[#FFC20E]">Grading</span>
          </h1>
          <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl">
            Select a section and student outcome to begin grading performance criteria.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Selection */}
        <div className="glass-card p-5 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold mb-1.5">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => { setSelectedSection(e.target.value); setSelectedSO(""); setGrades({}); setSaved(false); }}
                className="w-full bg-white text-[#231F20] text-sm rounded-lg px-4 py-2.5 border border-gray-200 focus:border-[#FFC20E] focus:outline-none"
              >
                <option value="">Select section...</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold mb-1.5">Student Outcome</label>
              <select
                value={selectedSO}
                onChange={(e) => { setSelectedSO(e.target.value); setGrades({}); setSaved(false); }}
                disabled={!selectedSection}
                className="w-full bg-white text-[#231F20] text-sm rounded-lg px-4 py-2.5 border border-gray-200 focus:border-[#FFC20E] focus:outline-none disabled:opacity-40"
              >
                <option value="">Select SO...</option>
                {availableSOs.map((so) => (
                  <option key={so.id} value={so.id}>{so.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold mb-1.5">School Year</label>
              <select className="w-full bg-white text-[#231F20] text-sm rounded-lg px-4 py-2.5 border border-gray-200 focus:border-[#FFC20E] focus:outline-none">
                <option>2024-2025</option>
                <option>2023-2024</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grading Table */}
        {soObj && students.length > 0 && (
          <>
            {/* SO Info */}
            <div className="glass-card p-5 sm:p-6 mb-4">
              <h3 className="font-semibold text-[#231F20]">{soObj.title}</h3>
              <p className="text-xs text-[#6B6B6B] mt-1">Performance Criteria: {allCriteria.map((c) => c.label).join(" · ")}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-[#6B6B6B]">
                <span>{totalGraded}/{students.length} students graded</span>
                <span>Scale: 0-5</span>
                {!saved && Object.keys(grades).length > 0 && (
                  <span className="text-warning flex items-center gap-1"><AlertCircle className="h-3 w-3" />Unsaved changes</span>
                )}
                {saved && (
                  <span className="text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Saved</span>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[#6B6B6B] border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Student ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      {allCriteria.map((c) => (
                        <th key={c.id} className="text-center py-3 px-3 font-semibold min-w-[100px]">{c.label}</th>
                      ))}
                      <th className="text-center py-3 px-4 font-semibold">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stu) => {
                      const status = getStudentStatus(stu.id);
                      const avg = getStudentAvg(stu.id);
                      return (
                        <tr key={stu.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-2.5 px-4">
                            {status === "complete" && <CheckCircle2 className="h-4 w-4 text-success" />}
                            {status === "incomplete" && <AlertCircle className="h-4 w-4 text-warning" />}
                            {status === "not-started" && <Circle className="h-4 w-4 text-[#6B6B6B]" />}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-xs text-primary">{stu.id}</td>
                          <td className="py-2.5 px-4 text-[#231F20]">{stu.name}</td>
                          {allCriteria.map((c) => (
                            <td key={c.id} className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={5}
                                step={1}
                                value={grades[`${stu.id}-${c.id}`] ?? ""}
                                onChange={(e) => handleGradeChange(stu.id, c.id, e.target.value)}
                                className="w-16 bg-white text-[#231F20] text-sm text-center rounded-lg px-2 py-1.5 border border-gray-200 focus:border-[#FFC20E] focus:outline-none"
                              />
                            </td>
                          ))}                          <td className="py-2.5 px-4 text-center">
                            <span className={`font-bold text-sm ${avg && avg >= 3.5 ? "text-success" : avg ? "text-warning" : "text-[#6B6B6B]"}`}>
                              {avg ?? "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={handleSave} className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors">
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>SAVE GRADES</span>
              </button>
              <button className="flex items-center gap-2 bg-white text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors border border-gray-200">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>EXPORT TEMPLATE</span>
              </button>
              <button className="flex items-center gap-2 bg-white text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors border border-gray-200">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>IMPORT SCORES</span>
              </button>
              <button onClick={handleClear} className="flex items-center gap-2 text-[#A5A8AB] hover:text-destructive px-4 py-2.5 rounded-lg text-sm transition ml-auto">
                <RotateCcw className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            </div>
          </>
        )}

        {!soObj && (
          <div className="text-center py-16 text-[#A5A8AB]">
            <p className="text-lg">Select a section and student outcome to start grading.</p>
          </div>
        )}
      </div>
      </main>

      <Footer />
    </div>
  );
};

export default FacultyAssessments;
