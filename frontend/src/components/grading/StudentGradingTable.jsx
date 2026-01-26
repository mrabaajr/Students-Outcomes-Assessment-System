import { GradeInput } from "./GradeInput";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export function StudentGradingTable({ 
  students, 
  performanceIndicators, 
  onGradeChange,
  satisfactoryThreshold = 5 
}) {
  const calculateAverage = (grades) => {
    const values = Object.values(grades).filter((g) => g !== null);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const calculatePercentage = (grades) => {
    const avg = calculateAverage(grades);
    if (avg === null) return null;
    return ((avg / 6) * 100).toFixed(1);
  };

  const isSatisfactory = (grades) => {
    const avg = calculateAverage(grades);
    if (avg === null) return null;
    return avg >= satisfactoryThreshold;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-12">#</th>
            <th className="min-w-[140px]">Student</th>
            {performanceIndicators.map(pi => (
              <th key={pi.id} className="text-center min-w-[100px]">
                <span className="block" title={pi.name}>{pi.shortName}</span>
              </th>
            ))}
            <th className="text-center w-24">Avg</th>
            <th className="text-center w-24">%</th>
            <th className="text-center w-24">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            const avg = calculateAverage(student.grades);
            const pct = calculatePercentage(student.grades);
            const satisfactory = isSatisfactory(student.grades);
            
            return (
              <tr key={student.id} className="animate-fade-in" style={{ animationDelay: `${index * 20}ms` }}>
                <td className="font-medium text-muted-foreground">{index + 1}</td>
                <td className="font-medium">{student.name}</td>
                {performanceIndicators.map(pi => (
                  <td key={pi.id} className="text-center">
                    <GradeInput
                      value={student.grades[pi.id]}
                      onChange={(value) => onGradeChange(student.id, pi.id, value)}
                    />
                  </td>
                ))}
                <td className="text-center font-semibold">
                  {avg !== null ? avg.toFixed(2) : "-"}
                </td>
                <td className="text-center font-semibold">
                  {pct !== null ? `${pct}%` : "-"}
                </td>
                <td className="text-center">
                  {satisfactory !== null && (
                    <span className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-full",
                      satisfactory ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}>
                      {satisfactory ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
