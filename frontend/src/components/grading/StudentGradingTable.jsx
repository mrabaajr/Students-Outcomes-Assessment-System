import { GradeInput } from "./GradeInput";
import { cn } from "../../lib/utils";
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
    <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-[#F5F5F5] border-b border-[#E5E7EB]">
          <tr>
            <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">#</th>
            <th className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Student ID</th>
            <th className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Student Name</th>
            {performanceIndicators.map(pi => (
              <th key={pi.id} className="text-center min-w-[100px] px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
                <span className="block" title={pi.description}>{pi.id}</span>
              </th>
            ))}
            <th className="text-center w-24 px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Avg</th>
            <th className="text-center w-24 px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">%</th>
            <th className="text-center w-24 px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#E5E7EB]">
          {students.map((student, index) => {
            const avg = calculateAverage(student.grades);
            const pct = calculatePercentage(student.grades);
            const satisfactory = isSatisfactory(student.grades);
            
            return (
              <tr key={student.id} className="hover:bg-[#F9FAFB] transition-colors">
                <td className="px-4 py-3 font-medium text-[#6B6B6B]">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-[#231F20]">{student.studentId}</td>
                <td className="px-4 py-3 font-medium text-[#231F20]">{student.name}</td>
                {performanceIndicators.map(pi => (
                  <td key={pi.id} className="text-center px-4 py-3">
                    <GradeInput
                      value={student.grades[pi.id]}
                      onChange={(value) => onGradeChange(student.id, pi.id, value)}
                    />
                  </td>
                ))}
                <td className="text-center px-4 py-3 font-semibold text-[#231F20]">
                  {avg !== null ? avg.toFixed(2) : "-"}
                </td>
                <td className="text-center px-4 py-3 font-semibold text-[#231F20]">
                  {pct !== null ? `${pct}%` : "-"}
                </td>
                <td className="text-center px-4 py-3">
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
