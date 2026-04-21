import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";
import {
  Plus,
  FileText,
  Settings,
  GitBranch,
  ClipboardList,
  BarChart3,
  ArrowRight,
  Target,
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  CalendarRange,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const actions = [
  {
    icon: Settings,
    title: "Manage SOs",
    description: "Create and edit student outcomes and rubrics",
    color: "text-primary",
    link: "/programchair/student-outcomes",
  },
  {
    icon: GitBranch,
    title: "Course Mapping",
    description: "Map courses to student outcomes for assessment",
    color: "text-primary",
    link: "/programchair/courses",
  },
  {
    icon: ClipboardList,
    title: "Input Scores",
    description: "Enter student assessment scores and evaluations",
    color: "text-primary",
    link: "/programchair/assessment",
  },
  {
    icon: BarChart3,
    title: "View Reports",
    description: "Generate summaries and analytics reports",
    color: "text-primary",
    link: "/programchair/reports",
  },
];

const formatRelativeDate = (value) => {
  if (!value) return "No recent activity";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent activity";

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async (schoolYear = "") => {
    setIsLoading(true);
    setError("");

    try {
      const params = {};
      if (schoolYear) params.school_year = schoolYear;

      const response = await axios.get(`${API_BASE_URL}/reports/dashboard/`, { params });
      setDashboardData(response.data);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setDashboardData(null);
      setError("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedSchoolYear);
  }, [fetchDashboardData, selectedSchoolYear]);

  const schoolYearOptions = dashboardData?.filter_options?.school_years || [];

  const stats = useMemo(() => {
    const metrics = dashboardData?.metrics;
    return [
      {
        icon: Target,
        value: String(metrics?.total_student_outcomes ?? 0),
        label: "STUDENT OUTCOMES",
        sublabel: "Tracked in assessments",
        change: null,
      },
      {
        icon: BookOpen,
        value: String(metrics?.total_courses ?? 0),
        label: "COURSES MAPPED",
        sublabel: selectedSchoolYear ? `For ${selectedSchoolYear}` : "Across active reports",
        change: null,
      },
      {
        icon: Users,
        value: String(metrics?.total_students ?? 0),
        label: "STUDENTS ASSESSED",
        sublabel: selectedSchoolYear ? `For ${selectedSchoolYear}` : "Across active reports",
        change: null,
      },
      {
        icon: TrendingUp,
        value: `${Math.round(metrics?.avg_performance ?? 0)}%`,
        label: "AVG. PERFORMANCE",
        sublabel: "Converted from rubric scores",
        change: null,
      },
    ];
  }, [dashboardData, selectedSchoolYear]);

  const progressItems = useMemo(() => {
    return (dashboardData?.so_performance || []).slice(0, 6).map((item) => ({
      id: `SO-${item.number}`,
      title: item.name,
      progress: Math.round(item.avg ?? 0),
      target: 80,
      assessed: `${item.pass_rate ?? 0}% pass rate`,
    }));
  }, [dashboardData]);

  const activities = useMemo(() => {
    const courseActivities = (dashboardData?.course_summary || [])
      .filter((course) => course.last_assessed)
      .sort((left, right) => new Date(right.last_assessed) - new Date(left.last_assessed))
      .slice(0, 3)
      .map((course) => ({
        icon: CheckCircle,
        iconColor: "text-success",
        iconBg: "bg-success/10",
        title: `${course.code} updated`,
        description: `${course.sections_assessed}/${course.sections_total} sections assessed, ${course.so_attained}/${course.so_total} SOs attained`,
        time: formatRelativeDate(course.last_assessed),
      }));

    const alertActivities = (dashboardData?.so_performance || [])
      .filter((item) => !item.met)
      .slice(0, 2)
      .map((item) => ({
        icon: item.avg >= 70 ? Clock : AlertCircle,
        iconColor: item.avg >= 70 ? "text-primary" : "text-destructive",
        iconBg: item.avg >= 70 ? "bg-primary/10" : "bg-destructive/10",
        title: `SO ${item.number} needs attention`,
        description: `${item.name} is at ${item.avg}% with ${item.pass_rate}% pass rate`,
        time: selectedSchoolYear ? selectedSchoolYear : "Current view",
      }));

    return [...courseActivities, ...alertActivities].slice(0, 5);
  }, [dashboardData, selectedSchoolYear]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              ASSESSMENT SYSTEM
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-white">Student Outcomes</span>
              <br />
              <span className="text-[#FFC20E]">Assessment Portal</span>
            </h1>

            <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl mb-6 sm:mb-8">
              Track assessment coverage, outcome attainment, and recent reporting activity from one dashboard.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate("/programchair/assessment")}
                className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>NEW ASSESSMENT</span>
              </button>
              <button
                onClick={() => navigate("/programchair/reports")}
                className="flex items-center gap-2 bg-transparent text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#3A3A3A] transition-colors border border-[#A5A8AB]"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>VIEW REPORTS</span>
              </button>

              <div className="flex items-center gap-2 rounded-lg border border-[#A5A8AB] bg-[#2E2A2B] px-3 py-2 text-sm text-white">
                <CalendarRange className="w-4 h-4 text-[#FFC20E]" />
                <select
                  value={selectedSchoolYear}
                  onChange={(event) => setSelectedSchoolYear(event.target.value)}
                  className="bg-transparent text-white outline-none"
                >
                  <option value="" className="text-[#231F20]">All School Years</option>
                  {schoolYearOptions.map((year) => (
                    <option key={year} value={year} className="text-[#231F20]">
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {isLoading ? (
            <div className="glass-card p-12 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#FFC20E]" />
              <p className="mt-4 text-sm text-[#6B6B6B]">Loading dashboard data...</p>
            </div>
          ) : error ? (
            <div className="glass-card p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
              <p className="mt-4 font-medium text-[#231F20]">{error}</p>
              <button
                onClick={() => fetchDashboardData(selectedSchoolYear)}
                className="mt-4 rounded-lg bg-[#231F20] px-4 py-2 text-sm font-medium text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="glass-card p-4 sm:p-5 hover-lift">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                    </div>

                    <p className="text-xs text-[#6B6B6B] font-medium mb-1">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#231F20] mb-1">{stat.value}</p>
                    <p className="text-xs text-[#6B6B6B]">{stat.sublabel}</p>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#231F20] mb-4">Quick Actions</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {actions.map((action, index) => (
                    <div
                      key={index}
                      onClick={() => navigate(action.link)}
                      className="glass-card p-4 sm:p-5 hover-lift group cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <action.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${action.color}`} />
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#FFC20E] group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>

                      <h3 className="text-sm sm:text-base font-semibold text-[#231F20] mb-1 group-hover:text-[#FFC20E] transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-xs text-[#6B6B6B]">{action.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-[#231F20]">SO Assessment Progress</h2>
                    <span className="text-xs text-[#6B6B6B] bg-secondary px-3 py-1 rounded-full">
                      {selectedSchoolYear || "All School Years"}
                    </span>
                  </div>

                  {progressItems.length > 0 ? (
                    <div className="space-y-5">
                      {progressItems.map((item, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {item.id}
                              </span>
                              <span className="text-sm font-medium text-[#231F20]">{item.title}</span>
                            </div>
                            <span className={`text-sm font-bold ${
                              item.progress >= item.target ? "text-success" : "text-primary"
                            }`}>
                              {item.progress}%
                            </span>
                          </div>

                          <div className="progress-bar mb-1">
                            <div
                              className={`progress-fill ${
                                item.progress >= item.target ? "bg-success" : "bg-primary"
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#6B6B6B]">Target: {item.target}%</span>
                            <span className="text-xs text-[#6B6B6B]">{item.assessed}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B6B6B]">No SO progress data available for this selection yet.</p>
                  )}
                </div>

                <div className="glass-card p-6">
                  <h2 className="text-lg font-semibold text-[#231F20] mb-6">Recent Activity</h2>

                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-lg ${activity.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <activity.icon size={18} className={activity.iconColor} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-[#231F20]">{activity.title}</h4>
                            <p className="text-xs text-[#6B6B6B] mt-0.5">{activity.description}</p>
                          </div>

                          <span className="text-xs text-[#6B6B6B] whitespace-nowrap">
                            {activity.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B6B6B]">No recent dashboard activity yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
