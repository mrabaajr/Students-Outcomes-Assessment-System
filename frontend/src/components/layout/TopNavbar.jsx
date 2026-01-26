import { Link, useLocation } from "react-router-dom";
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  BarChart3,
  LogOut,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/", label: "Student Outcomes", icon: Target },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/assessment", label: "Assessment", icon: FileText },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export function TopNavbar() {
  const location = useLocation();

  return (
    <header className="h-16 bg-navbar border-b border-sidebar-border sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-navbar-foreground text-lg leading-tight">
              SO Assessment
            </h1>
            <p className="text-xs font-medium text-primary leading-tight">
              T.I.P. ENGINEERING
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-navbar-foreground/70 hover:text-navbar-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Log out button */}
        <Button 
          variant="outline" 
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </div>
    </header>
  );
}
