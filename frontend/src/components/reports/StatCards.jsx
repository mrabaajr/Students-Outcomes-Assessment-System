import { Target, BookOpen, TrendingUp, CheckCircle2 } from "lucide-react";

const stats = [
  { label: "Total Student Outcomes", value: "6", icon: Target, change: null },
  { label: "Courses Mapped", value: "8", icon: BookOpen, change: "+12%" },
  { label: "Avg Performance", value: "78.4%", icon: TrendingUp, change: "+5%" },
  { label: "Completion Rate", value: "72%", icon: CheckCircle2, change: "+8%" },
];

export default function StatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="glass-card p-5 hover-lift">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <stat.icon size={20} className="text-primary" />
            </div>
            {stat.change && (
              <span className="text-xs font-medium px-2 py-1 rounded text-success bg-success/10">
                {stat.change}
              </span>
            )}
          </div>
          
          <p className="text-xs text-[#6B6B6B] font-medium mb-1">{stat.label.toUpperCase()}</p>
          <p className="text-3xl font-bold text-[#231F20] mb-1">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
