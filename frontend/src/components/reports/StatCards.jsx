import { Target, BookOpen, TrendingUp, Users } from "lucide-react";

export default function StatCards({ metrics }) {
  const m = metrics || {};

  const stats = [
    {
      label: "Student Outcomes Assessed",
      value: m.total_student_outcomes ?? 0,
      icon: Target,
    },
    {
      label: "Courses Assessed",
      value: m.total_courses ?? 0,
      icon: BookOpen,
    },
    {
      label: "Avg Performance",
      value: `${m.avg_performance ?? 0}%`,
      icon: TrendingUp,
      highlight: (m.avg_performance ?? 0) >= 80,
    },
    {
      label: "Students Assessed",
      value: m.total_students ?? 0,
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="glass-card p-5 hover-lift">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <stat.icon size={20} className="text-primary" />
            </div>
            {stat.highlight !== undefined && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  stat.highlight
                    ? "text-emerald-700 bg-emerald-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                {stat.highlight ? "On Target" : "Below Target"}
              </span>
            )}
          </div>

          <p className="text-xs text-[#6B6B6B] font-medium mb-1">
            {stat.label.toUpperCase()}
          </p>
          <p className="text-3xl font-bold text-[#231F20] mb-1">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
