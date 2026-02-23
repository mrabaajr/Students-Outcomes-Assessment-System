import { Link, useLocation } from "react-router-dom";
import { 
  Target, 
  Lightbulb, 
  MessageSquare, 
  Scale, 
  Users, 
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { studentOutcomes } from "@/data/studentOutcomes";
import { cn } from "@/lib/utils";
import { useState } from "react";

const soIcons = [
  Lightbulb,
  Target,
  MessageSquare,
  Scale,
  Users,
  FlaskConical,
];

export function AssessmentSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-[calc(100vh-4rem)] bg-sidebar flex flex-col transition-all duration-300 sticky top-16",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h2 className="font-heading font-semibold text-sidebar-foreground text-sm">Assessment</h2>
              <p className="text-xs text-primary">Select an SO</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3">
              Student Outcomes
            </p>
          </div>
        )}

        {studentOutcomes.map((so, index) => {
          const Icon = soIcons[index] || Target;
          const isActive = location.pathname === `/so/${so.id}`;
          
          return (
            <Link
              key={so.id}
              to={`/so/${so.id}`}
              className={cn(
                "nav-item",
                isActive && "nav-item-active"
              )}
              title={collapsed ? `SO ${so.id}: ${so.title}` : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <span className="block truncate font-medium">SO {so.id}</span>
                  <span className="block text-xs truncate opacity-70">{so.title}</span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-item w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
