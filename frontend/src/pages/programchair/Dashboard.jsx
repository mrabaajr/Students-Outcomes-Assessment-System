import { useNavigate } from "react-router-dom";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";
import { Plus, FileText, Settings, GitBranch, ClipboardList, BarChart3, ArrowRight, Target, BookOpen, Users, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

const stats = [
  {
    icon: Target,
    value: "7",
    label: "STUDENT OUTCOMES",
    sublabel: "Active SO criteria",
    change: null,
  },
  {
    icon: BookOpen,
    value: "34",
    label: "COURSES MAPPED",
    sublabel: "Linked to outcomes",
    change: "+12%",
    changeType: "positive",
  },
  {
    icon: Users,
    value: "167",
    label: "STUDENTS ASSESSED",
    sublabel: "This semester",
    change: "+8%",
    changeType: "positive",
  },
  {
    icon: TrendingUp,
    value: "74%",
    label: "AVG. PERFORMANCE",
    sublabel: "Above target threshold",
    change: "+2%",
    changeType: "positive",
  },
];

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
    link: "#",
  },
  {
    icon: ClipboardList,
    title: "Input Scores",
    description: "Enter student assessment scores and evaluations",
    color: "text-primary",
    link: "#",
  },
  {
    icon: BarChart3,
    title: "View Reports",
    description: "Generate summaries and analytics reports",
    color: "text-primary",
    link: "#",
  },
];

const progressItems = [
  {
    id: "SO-1",
    title: "Apply Engineering Knowledge",
    progress: 78,
    target: 75,
    assessed: "6/10 courses assessed",
  },
  {
    id: "SO-2",
    title: "Design System Components",
    progress: 65,
    target: 75,
    assessed: "5/9 courses assessed",
  },
  {
    id: "SO-3",
    title: "Conduct Experiments",
    progress: 82,
    target: 75,
    assessed: "6/6 courses assessed",
  },
  {
    id: "SO-4",
    title: "Use Modern Tools",
    progress: 71,
    target: 75,
    assessed: "7/9 courses assessed",
  },
];

const activities = [
  {
    icon: CheckCircle,
    iconColor: "text-success",
    iconBg: "bg-success/10",
    title: "SO-1 Assessment Complete",
    description: "CPE 401 - Computer Networks assessment finalized",
    time: "2 hours ago",
  },
  {
    icon: Clock,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    title: "Awaiting Faculty Input",
    description: "CPE 312 - Digital Systems requires rubric scores",
    time: "5 hours ago",
  },
  {
    icon: FileText,
    iconColor: "text-info",
    iconBg: "bg-info/10",
    title: "New Rubric Created",
    description: "SO-3 Performance Criteria rubric added",
    time: "1 day ago",
  },
  {
    icon: AlertCircle,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    title: "Assessment Deadline",
    description: "First semester assessment due in 3 days",
    time: "2 days ago",
  },
];

const App = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
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
              Streamline your program assessment workflow. Define student outcomes, map
              courses, collect evaluations, and generate comprehensive reports.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>NEW ASSESSMENT</span>
              </button>
              <button className="flex items-center gap-2 bg-transparent text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#3A3A3A] transition-colors border border-[#A5A8AB]">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>View Reports</span>
              </button>
            </div>
          </div>
        </section>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="glass-card p-4 sm:p-5 hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  {stat.change && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      stat.changeType === "positive" 
                        ? "text-success bg-success/10" 
                        : "text-destructive bg-destructive/10"
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-[#6B6B6B] font-medium mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#231F20] mb-1">{stat.value}</p>
                <p className="text-xs text-[#6B6B6B]">{stat.sublabel}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
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
                      <action.icon className="w-4 h-4 sm:w-5 sm:h-5" color={action.color} />
                    </div>
                    <ArrowRight 
                      className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#FFC20E] group-hover:translate-x-1 transition-all flex-shrink-0" 
                    />
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
            {/* Assessment Progress */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#231F20]">SO Assessment Progress</h2>
                <span className="text-xs text-[#6B6B6B] bg-secondary px-3 py-1 rounded-full">
                  1ST SEMESTER 2024
                </span>
              </div>

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
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[#231F20] mb-6">Recent Activity</h2>

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
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default App;