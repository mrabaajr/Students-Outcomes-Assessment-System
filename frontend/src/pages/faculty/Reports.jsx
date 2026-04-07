import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Download, FileText, Users, TrendingUp, Target } from "lucide-react";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";

const mySections = [
  { id: "CPE41S1", label: "CPE 401 - CPE41S1 (Computer Networks)" },
  { id: "CPE31S2", label: "CPE 312 - CPE31S2 (Digital Systems)" },
  { id: "CPE20S1", label: "CPE 203 - CPE20S1 (Data Structures)" },
  { id: "CPE10S3", label: "CPE 105 - CPE10S3 (Intro to Computing)" },
];

const soPerformanceData = {
  CPE41S1: [
    { so: "SO 1", score: 78, target: 75 },
    { so: "SO 3", score: 82, target: 75 },
    { so: "SO 5", score: 71, target: 75 },
  ],
  CPE31S2: [
    { so: "SO 2", score: 68, target: 75 },
    { so: "SO 4", score: 74, target: 75 },
  ],
  CPE20S1: [
    { so: "SO 1", score: 85, target: 75 },
    { so: "SO 2", score: 79, target: 75 },
    { so: "SO 6", score: 72, target: 75 },
  ],
  CPE10S3: [
    { so: "SO 1", score: 65, target: 75 },
  ],
};

const studentScores = {
  CPE41S1: [
    { name: "Juan Dela Cruz", so1: 82, so3: 88, so5: 75, avg: 81.7 },
    { name: "Maria Santos", so1: 90, so3: 85, so5: 78, avg: 84.3 },
    { name: "Pedro Reyes", so1: 70, so3: 72, so5: 65, avg: 69.0 },
    { name: "Ana Garcia", so1: 78, so3: 80, so5: 72, avg: 76.7 },
    { name: "Carlos Ramos", so1: 68, so3: 84, so5: 70, avg: 74.0 },
  ],
};

const distributionData = [
  { range: "0-1", count: 2, color: "hsl(0, 84%, 60%)" },
  { range: "1-2", count: 5, color: "hsl(38, 92%, 50%)" },
  { range: "2-3", count: 12, color: "hsl(45, 100%, 53%)" },
  { range: "3-4", count: 15, color: "hsl(142, 71%, 45%)" },
  { range: "4-5", count: 8, color: "hsl(142, 71%, 35%)" },
];

const FacultyReports = () => {
  const [selectedSection, setSelectedSection] = useState("CPE41S1");
  const soData = soPerformanceData[selectedSection] || [];
  const students = studentScores[selectedSection] || [];

  const sectionAvg = soData.length > 0 ? (soData.reduce((a, b) => a + b.score, 0) / soData.length).toFixed(1) : "—";
  const passRate = soData.length > 0 ? Math.round((soData.filter((s) => s.score >= s.target).length / soData.length) * 100) : 0;

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
            <span className="text-white">Section</span>
            <br />
            <span className="text-[#FFC20E]">Reports</span>
          </h1>
          <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl">
            View performance analytics and generate reports for your sections.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-white text-[#231F20] text-sm rounded-lg px-4 py-2.5 border border-gray-200 focus:border-[#FFC20E] focus:outline-none"
          >
            {mySections.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <select className="bg-white text-[#231F20] text-sm rounded-lg px-4 py-2.5 border border-gray-200 focus:border-[#FFC20E] focus:outline-none">
            <option>2024-2025</option>
            <option>2023-2024</option>
          </select>
          <div className="ml-auto flex gap-2">
            <button className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">EXPORT PDF</span>
            </button>
            <button className="flex items-center gap-2 bg-white text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors border border-gray-200">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">EXPORT EXCEL</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="glass-card p-5 sm:p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold">Section Average</p>
              <p className="text-2xl font-bold text-[#231F20]">{sectionAvg}%</p>
            </div>
          </div>
          <div className="glass-card p-5 sm:p-6 flex items-center gap-4">
            <div className="bg-success/10 p-2.5 rounded-lg">
              <Target className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold">Pass Rate</p>
              <p className="text-2xl font-bold text-[#231F20]">{passRate}%</p>
            </div>
          </div>
          <div className="glass-card p-5 sm:p-6 flex items-center gap-4">
            <div className="bg-info/10 p-2.5 rounded-lg">
              <Users className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold">Students Assessed</p>
              <p className="text-2xl font-bold text-[#231F20]">{students.length || "—"}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* SO Performance Bar Chart */}
          <div className="glass-card p-5 sm:p-6">
            <h3 className="font-semibold text-[#231F20] mb-4">SO Performance</h3>
            {soData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={soData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                  <XAxis dataKey="so" tick={{ fill: "hsl(210 2% 66%)", fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(210 2% 66%)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(0 2% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8, color: "#fff" }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {soData.map((entry, i) => (
                      <Cell key={i} fill={entry.score >= entry.target ? "hsl(142, 71%, 45%)" : "hsl(45, 100%, 53%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[#6B6B6B] text-sm text-center py-12">No data available.</p>
            )}
          </div>

          {/* Score Distribution */}
          <div className="glass-card p-5 sm:p-6">
            <h3 className="font-semibold text-[#231F20] mb-4">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={distributionData} barSize={35}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis dataKey="range" tick={{ fill: "hsl(210 2% 66%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(210 2% 66%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(0 2% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8, color: "#fff" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distributionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Scores Table */}
        {students.length > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="font-semibold text-[#231F20]">Student Performance Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[#6B6B6B] border-b border-gray-200">
                    <th className="text-left py-3 px-5 font-semibold">Student</th>
                    {soData.map((so) => (
                      <th key={so.so} className="text-center py-3 px-4 font-semibold">{so.so}</th>
                    ))}
                    <th className="text-center py-3 px-5 font-semibold">Average</th>
                    <th className="text-center py-3 px-5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((stu) => {
                    const soKeys = Object.keys(stu).filter((k) => k.startsWith("so"));
                    return (
                      <tr key={stu.name} className="border-t border-gray-200 hover:bg-gray-50 transition">
                        <td className="py-3 px-5 text-[#231F20] font-medium">{stu.name}</td>
                        {soKeys.map((k) => (
                          <td key={k} className="text-center py-3 px-4">
                            <span className={`font-semibold ${stu[k] >= 75 ? "text-success" : "text-warning"}`}>{stu[k]}%</span>
                          </td>
                        ))}
                        <td className="text-center py-3 px-5 font-bold text-[#231F20]">{stu.avg}%</td>
                        <td className="text-center py-3 px-5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stu.avg >= 75 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                            {stu.avg >= 75 ? "Passing" : "At Risk"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </main>

      <Footer />
    </div>
  );
};

export default FacultyReports;
