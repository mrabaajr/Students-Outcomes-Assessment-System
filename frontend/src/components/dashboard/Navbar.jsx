import { GraduationCap, BookOpen, FileText, BarChart3, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { icon: GraduationCap, label: "Student Outcomes", link: "/programchair/student-outcomes" },
  { icon: BookOpen, label: "Courses", link: "/programchair/courses" },
  { icon: FileText, label: "Assessment", link: "/programchair/assessment" },
  { icon: BarChart3, label: "Reports", link: "#" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (link) => {
    if (link === "#") return false;
    return location.pathname === link;
  };

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    
    // Redirect to login page
    navigate("/login");
  };

  return (
    <nav className="bg-[#231F20]/90 backdrop-blur-sm border-b-2 border-[#FFC20E] fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => navigate("/programchair/dashboard")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div>
              <span className="font-bold text-white">SO Assessment</span>
              <span className="text-xs text-[#FFC20E] block">T.I.P. ENGINEERING</span>
            </div>
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.link)}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  isActive(item.link)
                    ? "text-[#FFC20E] font-semibold"
                    : "text-[#A5A8AB] hover:text-white"
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <User size={16} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
