import { ArrowRight, BookOpen, ClipboardCheck, BarChart3, Users, Clock, CheckCircle2, AlertCircle, Bell, TrendingUp, Target } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";

const statCards = [
  { icon: BookOpen, label: "MY SECTIONS", value: "4", sub: "Active this semester", color: "text-primary", bg: "bg-primary/10" },
  { icon: Users, label: "TOTAL STUDENTS", value: "142", sub: "Across all sections", color: "text-info", bg: "bg-info/10", trend: "+12" },
  { icon: ClipboardCheck, label: "ASSESSMENTS", value: "8", sub: "Pending completion", color: "text-warning", bg: "bg-warning/10", trend: "-3" },
  { icon: TrendingUp, label: "AVG. PERFORMANCE", value: "78%", sub: "Above target threshold", color: "text-success", bg: "bg-success/10", trend: "+5" },
];

const quickActions = [
  { icon: ClipboardCheck, label: "Input Grades", desc: "Grade students on performance criteria", to: "/faculty/assessments", color: "bg-primary/10 text-primary" },
  { icon: BookOpen, label: "My Classes", desc: "View sections and student rosters", to: "/faculty/classes", color: "bg-info/10 text-info" },
  { icon: BarChart3, label: "View Reports", desc: "Section-level analytics and exports", to: "/faculty/reports", color: "bg-success/10 text-success" },
  { icon: Target, label: "SO Overview", desc: "View mapped student outcomes", to: "/faculty/classes", color: "bg-purple-500/10 text-purple-400" },
];

const mySections = [
  { code: "CPE 401", section: "CPE41S1", students: 38, schedule: "MWF 8:00-9:30", completion: 75 },
  { code: "CPE 312", section: "CPE31S2", students: 35, schedule: "TTh 10:00-11:30", completion: 40 },
  { code: "CPE 203", section: "CPE20S1", students: 42, schedule: "MWF 1:00-2:30", completion: 90 },
  { code: "CPE 105", section: "CPE10S3", students: 27, schedule: "TTh 3:00-4:30", completion: 10 },
];

const recentActivity = [
  { icon: CheckCircle2, color: "text-success", title: "Grades Submitted", desc: "CPE 401 - SO 1 Assessment completed", time: "2 hours ago" },
  { icon: AlertCircle, color: "text-warning", title: "Pending Assessment", desc: "CPE 312 - Digital Systems requires rubric scores", time: "5 hours ago" },
  { icon: Bell, color: "text-info", title: "Deadline Reminder", desc: "CPE 203 assessment due in 3 days", time: "1 day ago" },
  { icon: Clock, color: "text-destructive", title: "Overdue", desc: "CPE 105 - SO 3 grading past deadline", time: "2 days ago" },
];

const FacultyDashboard = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
          <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
            FACULTY PORTAL
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-white">Welcome,</span>
            <br />
            <span className="text-[#FFC20E]">Prof. Ferrer</span>
          </h1>
          <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl mb-6 sm:mb-8">
            Manage your sections, input assessment scores, and track student performance across your assigned courses.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link
              to="/faculty/assessments"
              className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors"
            >
              <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>INPUT GRADES</span>
            </Link>
            <Link
              to="/faculty/reports"
              className="flex items-center gap-2 bg-white/10 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-white/20 transition-colors border border-white/20"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>VIEW REPORTS</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((stat) => (
            <div key={stat.label} className="glass-card p-5 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.trend && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${Number(stat.trend) > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {Number(stat.trend) > 0 ? "+" : ""}{stat.trend}%
                  </span>
                )}              </div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#6B6B6B]">{stat.label}</p>
              <p className="text-2xl font-bold text-[#231F20] mt-1">{stat.value}</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#231F20] mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="glass-card p-5 sm:p-6 hover:shadow-lg transition-shadow group flex flex-col justify-between"
              >
                <div>
                  <div className={`${action.color} p-2 rounded-lg inline-block mb-3`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-[#231F20]">{action.label}</h3>
                  <p className="text-xs text-[#6B6B6B] mt-1">{action.desc}</p>
                </div>
                <div className="flex justify-end mt-4">
                  <ArrowRight className="h-4 w-4 text-[#6B6B6B] group-hover:text-[#FFC20E] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* My Sections */}
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#231F20]">My Sections</h2>
              <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">1st Semester 2024</span>
            </div>
            <div className="space-y-3">
              {mySections.map((sec) => (
                <div key={sec.section} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">{sec.code}</span>
                      <span className="text-sm font-medium text-[#231F20]">{sec.section}</span>
                      <span className="text-xs text-[#6B6B6B] ml-auto">{sec.students} students</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${sec.completion}%`,
                            backgroundColor: sec.completion >= 75 ? "#16A34A" : sec.completion >= 50 ? "#FFC20E" : "#EAB308",
                          }}
                        />                      </div>
                      <span className="text-xs text-[#6B6B6B] w-8 text-right">{sec.completion}%</span>
                    </div>
                    <p className="text-[11px] text-[#6B6B6B] mt-1">{sec.schedule}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-5 sm:p-6">
            <h2 className="font-semibold text-[#231F20] mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((act, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full bg-gray-100 ${act.color}`}>
                    <act.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#231F20]">{act.title}</p>
                    <p className="text-xs text-[#6B6B6B]">{act.desc}</p>
                  </div>
                  <span className="text-[11px] text-[#6B6B6B] whitespace-nowrap">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </main>

      <Footer />
    </div>
  );
};

export default FacultyDashboard;
