import { useEffect, useMemo, useState } from "react";
import { GraduationCap, BookOpen, FileText, BarChart3, Users, Settings, LogOut, CircleHelp } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import GettingStartedModal from "@/components/dashboard/GettingStartedModal";
import { API_BASE_URL, getAuthHeader } from "@/lib/api";

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
  const [isGettingStartedOpen, setIsGettingStartedOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // Determine if user is on faculty or program chair pages
  const isFaculty = location.pathname.startsWith('/faculty');
  const navItems = isFaculty ? facultyNavItems : programChairNavItems;
  const dashboardLink = isFaculty ? '/faculty/dashboard' : '/programchair/dashboard';
  const userRole = String(localStorage.getItem("userRole") || "").toLowerCase();
  const userId = localStorage.getItem("userId");
  const roleLabel = userRole === "admin" ? "Program Chair" : userRole === "staff" ? "Faculty" : "User";
  const displayNameStorageKey = useMemo(() => (userId ? `displayName:${userId}` : ""), [userId]);

  const gettingStartedStorageKey = useMemo(() => {
    const identity = userId || userRole || "anonymous";
    return `gettingStartedSeen:${identity}`;
  }, [userId, userRole]);

  useEffect(() => {
    if (!userRole) return;

    const hasSeenGuide = localStorage.getItem(gettingStartedStorageKey) === "true";
    if (!hasSeenGuide) {
      setIsGettingStartedOpen(true);
    }
  }, [gettingStartedStorageKey, userRole]);

  useEffect(() => {
    if (!userId) {
      setDisplayName("");
      return;
    }

    const cachedDisplayName =
      displayNameStorageKey ? localStorage.getItem(displayNameStorageKey) : "";
    if (cachedDisplayName) {
      setDisplayName(cachedDisplayName);
    }

    let isMounted = true;

    const loadDisplayName = async () => {
      try {
        const headers = await getAuthHeader();
        const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
          headers,
        });

        if (!response.ok) {
          throw new Error("Failed to load user profile.");
        }

        const data = await response.json();
        const firstName = String(data?.first_name || data?.firstName || "").trim();
        const lastName = String(data?.last_name || data?.lastName || "").trim();
        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

        if (isMounted) {
          if (fullName) {
            setDisplayName(fullName);
            if (displayNameStorageKey) {
              localStorage.setItem(displayNameStorageKey, fullName);
            }
          }
        }
      } catch {
        // Keep cached/current name on fetch issues to avoid flicker while routing.
      }
    };

    loadDisplayName();

    return () => {
      isMounted = false;
    };
  }, [displayNameStorageKey, userId]);

  const isActive = (link) => {
    if (link === "#") return false;
    return location.pathname === link;
  };

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    if (displayNameStorageKey) {
      localStorage.removeItem(displayNameStorageKey);
    }
    setDisplayName("");
    
    // Redirect to login page
    navigate("/");
  };

  const handleGettingStartedOpenChange = (nextOpen) => {
    setIsGettingStartedOpen(nextOpen);
  };

  const handleGettingStartedDismiss = ({ dontShowAgain }) => {
    if (dontShowAgain) {
      localStorage.setItem(gettingStartedStorageKey, "true");
    }
  };

  return (
    <>
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

            {/* Right Section: Help, Settings & Logout */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden lg:flex flex-col items-end mr-1">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#A5A8AB] leading-none">
                  {roleLabel}
                </span>
                {displayName && <span className="text-sm font-semibold text-white leading-tight">{displayName}</span>}
              </div>

              <button
                onClick={() => setIsGettingStartedOpen(true)}
                className="flex items-center justify-center p-2 rounded-lg transition-colors text-[#FFC20E] hover:bg-[#FFC20E]/20"
                title="Getting Started"
              >
                <CircleHelp className="w-5 h-5" />
              </button>

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

      <GettingStartedModal
        open={isGettingStartedOpen}
        onOpenChange={handleGettingStartedOpenChange}
        onDismiss={handleGettingStartedDismiss}
        userRole={userRole}
        pathname={location.pathname}
      />
    </>
  );
};

export default Navbar;
