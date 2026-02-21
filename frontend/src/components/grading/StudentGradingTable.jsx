import { GradeInput } from "./GradeInput";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { useMemo } from "react";

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

  const getColumnHeader = (shortName) => {
    return shortName.toUpperCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const studentsWithStats = useMemo(() => {
    return students.map(student => ({
      ...student,
      avg: calculateAverage(student.grades),
      pct: calculatePercentage(student.grades),
      satisfactory: isSatisfactory(student.grades)
    }));
  }, [students, satisfactoryThreshold]);

  return (
    <div className="w-full max-h-[600px] overflow-auto rounded-xl border border-[#D1D5DB] bg-white shadow-lg scrollbar-visible">
      <table className="w-full min-w-max text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 z-30">
          <tr>
            <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-16 sticky left-0 top-0 bg-[#231F20] z-40 border-b-2 border-[#FFC20E] border-r border-r-[#3A3535]">#</th>
            <th className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[180px] sticky left-16 top-0 bg-[#231F20] z-40 border-b-2 border-[#FFC20E] border-r border-r-[#3A3535]">STUDENT</th>
            {performanceIndicators.map((pi, i) => (
              <th key={pi.id} className={`px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider min-w-[140px] bg-[#231F20] border-b-2 border-[#FFC20E] ${i < performanceIndicators.length - 1 ? 'border-r border-r-[#3A3535]' : ''}`}>
                {getColumnHeader(pi.shortName)}
              </th>
            ))}
            <th className="px-4 py-3.5 text-center text-xs font-bold text-[#FFC20E] uppercase tracking-wider w-24 bg-[#231F20] border-b-2 border-[#FFC20E] border-l border-l-[#3A3535]">AVG</th>
            <th className="px-4 py-3.5 text-center text-xs font-bold text-[#FFC20E] uppercase tracking-wider w-24 bg-[#231F20] border-b-2 border-[#FFC20E] border-l border-l-[#3A3535]">%</th>
            <th className="px-4 py-3.5 text-center text-xs font-bold text-[#FFC20E] uppercase tracking-wider w-32 bg-[#231F20] border-b-2 border-[#FFC20E] border-l border-l-[#3A3535]">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {studentsWithStats.map((student, index) => (
            <tr key={student.id} className="hover:bg-[#FFFCF3] transition-colors group">
              <td className="px-4 py-3.5 text-sm font-semibold text-[#231F20] sticky left-0 bg-white group-hover:bg-[#FFFCF3] z-10 border-b border-[#E5E5E5] border-r border-r-[#E5E5E5]">
                {index + 1}
              </td>
              <td className="px-4 py-3.5 text-sm font-semibold text-[#231F20] sticky left-16 bg-white group-hover:bg-[#FFFCF3] z-10 border-b border-[#E5E5E5] border-r border-r-[#D1D5DB] shadow-[2px_0_6px_rgba(0,0,0,0.08)]">
                {student.name}
              </td>
              {performanceIndicators.map((pi, i) => (
                <td key={pi.id} className={`px-4 py-3.5 text-center bg-white group-hover:bg-[#FFFCF3] border-b border-[#E5E5E5] ${i < performanceIndicators.length - 1 ? 'border-r border-r-[#E5E5E5]' : ''}`}>
                  <div className="flex justify-center items-center">
                    <GradeInput
                      value={student.grades[pi.id]}
                      onChange={(value) => onGradeChange(student.id, pi.id, value)}
                    />
                  </div>
                </td>
              ))}
              <td className="px-4 py-3.5 text-center text-base font-bold text-[#231F20] bg-white group-hover:bg-[#FFFCF3] border-b border-[#E5E5E5] border-l border-l-[#E5E5E5]">
                {student.avg !== null ? student.avg.toFixed(2) : "-"}
              </td>
              <td className="px-4 py-3.5 text-center text-base font-bold text-[#231F20] bg-white group-hover:bg-[#FFFCF3] border-b border-[#E5E5E5] border-l border-l-[#E5E5E5]">
                {student.pct !== null ? `${student.pct}%` : "-"}
              </td>
              <td className="px-4 py-3.5 text-center bg-white group-hover:bg-[#FFFCF3] border-b border-[#E5E5E5] border-l border-l-[#E5E5E5]">
                {student.satisfactory !== null && (
                  <div className="flex justify-center items-center">
                    {student.satisfactory ? (
                      <div className="flex items-center gap-1.5">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-semibold text-green-600">PASS</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <X className="w-5 h-5 text-red-600" />
                        <span className="text-xs font-semibold text-red-600">FAIL</span>
                      </div>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
