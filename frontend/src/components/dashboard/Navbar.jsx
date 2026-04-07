import { GraduationCap, BookOpen, FileText, BarChart3, User, Users, Settings, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const programChairNavItems = [
  { icon: GraduationCap, label: "Student Outcomes", link: "/programchair/student-outcomes" },
  { icon: BookOpen, label: "Courses", link: "/programchair/courses" },
  { icon: Users, label: "Classes", link: "/programchair/classes" },
  { icon: FileText, label: "Assessment", link: "/programchair/assessment" },
  { icon: BarChart3, label: "Reports", link: "/programchair/reports" },
];

const facultyNavItems = [
  { icon: Users, label: "Classes", link: "/faculty/classes" },
  { icon: FileText, label: "Assessment", link: "/faculty/assessments" },
  { icon: BarChart3, label: "Reports", link: "/faculty/reports" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if user is on faculty or program chair pages
  const isFaculty = location.pathname.startsWith('/faculty');
  const navItems = isFaculty ? facultyNavItems : programChairNavItems;
  const dashboardLink = isFaculty ? '/faculty/dashboard' : '/programchair/dashboard';

  const isActive = (link) => {
    if (link === "#") return false;
    return location.pathname === link;
  };

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    
    // Redirect to login page
    navigate("/");
  };

  return (
    <nav className="bg-[#231F20]/90 backdrop-blur-sm border-b-2 border-[#FFC20E] fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 min-h-[4rem]">
          {/* Logo */}
          <button 
            onClick={() => navigate(dashboardLink)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <div>
              <span className="font-bold text-white text-base md:text-lg">SO Assessment</span>
              <span className="text-xs text-[#FFC20E] block">T.I.P. ENGINEERING</span>
            </div>
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 flex-shrink">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.link)}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 text-sm transition-colors whitespace-nowrap ${
                  isActive(item.link)
                    ? "text-[#FFC20E] font-semibold"
                    : "text-[#A5A8AB] hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right Section: Settings & Logout */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Settings Button */}
            <button 
              onClick={() => navigate(isFaculty ? '/faculty/settings' : '/programchair/settings')}
              className="flex items-center justify-center p-2 rounded-lg transition-colors text-[#FFC20E] hover:bg-[#FFC20E]/20"
              title="Account Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-3 lg:px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
