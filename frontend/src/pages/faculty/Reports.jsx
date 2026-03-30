import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Download, FileText, Users, TrendingUp, Target, BookOpen, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";

const assessedCourseSummaries = [
  {
    courseCode: "CPE 401",
    courseName: "Computer Networks",
    sectionsAssessed: 1,
    sectionsTotal: 1,
    studentsAssessed: 5,
    attainmentRate: 77,
    avgScore: 78,
    target: 75,
    soAttained: 2,
    soTotal: 3,
    lastAssessed: "2026-03-21",
  },
  {
    courseCode: "CPE 312",
    courseName: "Digital Systems",
    sectionsAssessed: 1,
    sectionsTotal: 1,
    studentsAssessed: 3,
    attainmentRate: 71,
    avgScore: 72,
    target: 75,
    soAttained: 0,
    soTotal: 2,
    lastAssessed: "2026-03-20",
  },
  {
    courseCode: "CPE 203",
    courseName: "Data Structures",
    sectionsAssessed: 1,
    sectionsTotal: 1,
    studentsAssessed: 4,
    attainmentRate: 79,
    avgScore: 79,
    target: 75,
    soAttained: 2,
    soTotal: 3,
    lastAssessed: "2026-03-24",
  },
  {
    courseCode: "CPE 105",
    courseName: "Introduction to Computing",
    sectionsAssessed: 1,
    sectionsTotal: 1,
    studentsAssessed: 2,
    attainmentRate: 65,
    avgScore: 65,
    target: 75,
    soAttained: 0,
    soTotal: 1,
    lastAssessed: "2026-03-18",
  },
];

const schoolYearOptions = ["2024-2025", "2023-2024"];

const FacultyReports = () => {
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("2024-2025");

  const filteredCourses = useMemo(() => {
    return assessedCourseSummaries;
  }, [selectedSchoolYear]);

  const overallMetrics = useMemo(() => {
    const totalCourses = filteredCourses.length;
    const totalStudents = filteredCourses.reduce((sum, item) => sum + item.studentsAssessed, 0);
    const overallAverage = totalCourses > 0
      ? (filteredCourses.reduce((sum, item) => sum + item.avgScore, 0) / totalCourses).toFixed(1)
      : "0.0";
    const coursesMeetingTarget = filteredCourses.filter((item) => item.avgScore >= item.target).length;
    const targetHitRate = totalCourses > 0 ? Math.round((coursesMeetingTarget / totalCourses) * 100) : 0;

    return { totalCourses, totalStudents, overallAverage, targetHitRate };
  }, [filteredCourses]);

  const attainmentDistribution = useMemo(() => {
    const attained = filteredCourses.filter((item) => item.avgScore >= item.target).length;
    const nearTarget = filteredCourses.filter((item) => item.avgScore < item.target && item.avgScore >= item.target - 5).length;
    const belowTarget = filteredCourses.filter((item) => item.avgScore < item.target - 5).length;

    return [
      { name: "Target Attained", value: attained, color: "#16A34A" },
      { name: "Near Target", value: nearTarget, color: "#F59E0B" },
      { name: "Below Target", value: belowTarget, color: "#DC2626" },
    ];
  }, [filteredCourses]);

  const chartData = useMemo(() => {
    return filteredCourses.map((item) => ({
      course: item.courseCode,
      average: item.avgScore,
      target: item.target,
    }));
  }, [filteredCourses]);

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
            <span className="text-white">Course-Level</span>
            <br />
            <span className="text-[#FFC20E]">Summary Report</span>
          </h1>
          <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl">
            Placeholder visualization of assessed classes grouped by course. This view can be connected to backend reports later.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Filters & Export */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={selectedSchoolYear}
            onChange={(e) => setSelectedSchoolYear(e.target.value)}
            className="bg-white text-[#231F20] text-sm rounded-lg px-4 py-2.5 border border-gray-200 focus:border-[#FFC20E] focus:outline-none"
          >
            {schoolYearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <div className="ml-auto flex gap-2">
            <button className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">EXPORT SUMMARY PDF</span>
            </button>
            <button className="flex items-center gap-2 bg-white text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors border border-gray-200">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">EXPORT SUMMARY CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="glass-card p-5 sm:p-6 flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold">Courses Assessed</p>
              <p className="text-2xl font-bold text-[#231F20]">{overallMetrics.totalCourses}</p>
            </div>
          </div>
          <div className="glass-card p-5 sm:p-6 flex items-center gap-4">
            <div className="bg-success/10 p-2.5 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold">Overall Average</p>
              <p className="text-2xl font-bold text-[#231F20]">{overallMetrics.overallAverage}%</p>
            </div>
          </div>
          <div className="glass-card p-5 sm:p-6 flex items-center gap-4">
            <div className="bg-info/10 p-2.5 rounded-lg">
              <Users className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold">Students Assessed</p>
              <p className="text-2xl font-bold text-[#231F20]">{overallMetrics.totalStudents}</p>
            </div>
          </div>
          <div className="glass-card p-5 sm:p-6 flex items-center gap-4">
            <div className="bg-warning/10 p-2.5 rounded-lg">
              <Target className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold">Target Hit Rate</p>
              <p className="text-2xl font-bold text-[#231F20]">{overallMetrics.targetHitRate}%</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Course Average vs Target */}
          <div className="glass-card p-5 sm:p-6">
            <h3 className="font-semibold text-[#231F20] mb-4">Course Average vs Target</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                  <XAxis dataKey="course" tick={{ fill: "hsl(210 2% 66%)", fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(210 2% 66%)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(0 2% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8, color: "#fff" }}
                  />
                  <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.average >= entry.target ? "hsl(142, 71%, 45%)" : "hsl(45, 100%, 53%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[#6B6B6B] text-sm text-center py-12">No data available.</p>
            )}
          </div>

          {/* Attainment Distribution */}
          <div className="glass-card p-5 sm:p-6">
            <h3 className="font-semibold text-[#231F20] mb-4">Attainment Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Tooltip
                  contentStyle={{ background: "hsl(0 2% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8, color: "#fff" }}
                />
                <Pie data={attainmentDistribution} dataKey="value" nameKey="name" outerRadius={84} label>
                  {attainmentDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {attainmentDistribution.map((entry) => (
                <span
                  key={entry.name}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-[#231F20]"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}: {entry.value}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Course Summary Table */}
        {filteredCourses.length > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="font-semibold text-[#231F20]">Course-Level Assessment Summary</h3>
              <p className="text-xs text-[#6B6B6B] mt-1">Placeholder data from assessed classes for visualization.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[#6B6B6B] border-b border-gray-200">
                    <th className="text-left py-3 px-5 font-semibold">Course</th>
                    <th className="text-center py-3 px-4 font-semibold">Sections</th>
                    <th className="text-center py-3 px-4 font-semibold">Students</th>
                    <th className="text-center py-3 px-4 font-semibold">SO Attained</th>
                    <th className="text-center py-3 px-4 font-semibold">Avg Score</th>
                    <th className="text-center py-3 px-4 font-semibold">Target</th>
                    <th className="text-center py-3 px-5 font-semibold">Status</th>
                    <th className="text-center py-3 px-5 font-semibold">Last Assessed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => {
                    const isPassing = course.avgScore >= course.target;
                    return (
                      <tr key={course.courseCode} className="border-t border-gray-200 hover:bg-gray-50 transition">
                        <td className="py-3 px-5 text-[#231F20]">
                          <div className="font-medium">{course.courseCode}</div>
                          <div className="text-xs text-[#6B6B6B]">{course.courseName}</div>
                        </td>
                        <td className="text-center py-3 px-4">{course.sectionsAssessed}/{course.sectionsTotal}</td>
                        <td className="text-center py-3 px-4">{course.studentsAssessed}</td>
                        <td className="text-center py-3 px-4">{course.soAttained}/{course.soTotal}</td>
                        <td className="text-center py-3 px-4 font-semibold">{course.avgScore}%</td>
                        <td className="text-center py-3 px-4 text-[#6B6B6B]">{course.target}%</td>
                        <td className="text-center py-3 px-5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${isPassing ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                            {isPassing ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            {isPassing ? "Target Attained" : "Needs Attention"}
                          </span>
                        </td>
                        <td className="text-center py-3 px-5 text-[#6B6B6B]">{course.lastAssessed}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="glass-card p-5 sm:p-6 mt-6">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-[#6B6B6B] mt-0.5" />
            <div>
              <h4 className="font-semibold text-[#231F20]">Course Assessment Basis</h4>
              <p className="text-sm text-[#6B6B6B] mt-1">
                This report is based on the Course-Level Assessment Summary and indicates whether each course is Target Attained,
                Near Target, or Below Target based on average score versus the target benchmark.
              </p>
            </div>
          </div>
        </div>
      </div>
      </main>

      <Footer />
    </div>
  );
};

export default FacultyReports;
