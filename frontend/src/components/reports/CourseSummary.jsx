

const courses = [
  { code: "CPE 205A", name: "Data Structures", instructor: "Dr. Santos", sos: [1, 3, 5], students: 42, avg: 76, passRate: 78 },
  { code: "CPE 301", name: "Digital Logic Design", instructor: "Engr. Reyes", sos: [1, 2], students: 38, avg: 81, passRate: 85 },
  { code: "CPE 302", name: "Microprocessors", instructor: "Dr. Cruz", sos: [2, 3, 5], students: 35, avg: 73, passRate: 70 },
  { code: "CPE 401", name: "Computer Networks", instructor: "Engr. Garcia", sos: [3, 4, 6], students: 40, avg: 79, passRate: 82 },
  { code: "CPE 402", name: "Software Engineering", instructor: "Dr. Lim", sos: [4, 5, 6], students: 37, avg: 84, passRate: 89 },
  { code: "CPE 501", name: "Embedded Systems", instructor: "Engr. Torres", sos: [1, 2, 3], students: 33, avg: 71, passRate: 68 },
  { code: "EE 201", name: "Circuit Analysis", instructor: "Dr. Navarro", sos: [1, 5], students: 45, avg: 77, passRate: 80 },
  { code: "EE 302", name: "Signals & Systems", instructor: "Dr. Aquino", sos: [1, 2, 6], students: 39, avg: 80, passRate: 84 },
];

export default function CourseSummary() {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-[#231F20] mb-4">Course-Level Summary</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B]">Code</th>
              <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B]">Course Name</th>
              <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B]">Instructor</th>
              <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B]">Linked SOs</th>
              <th className="pb-3 text-center text-xs font-medium text-[#6B6B6B]">Students</th>
              <th className="pb-3 text-center text-xs font-medium text-[#6B6B6B]">Avg Score</th>
              <th className="pb-3 text-center text-xs font-medium text-[#6B6B6B]">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.code} className="border-b border-[#E5E7EB] last:border-0">
                <td className="py-3 font-medium text-sm text-[#231F20]">{c.code}</td>
                <td className="py-3 text-sm text-[#231F20]">{c.name}</td>
                <td className="py-3 text-sm text-[#231F20]">{c.instructor}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.sos.map((so) => (
                      <span key={so} className="bg-secondary text-[#231F20] px-2 py-0.5 rounded text-xs font-medium">
                        SO {so}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 text-center text-sm text-[#231F20]">{c.students}</td>
                <td className="py-3 text-center text-sm text-[#231F20]">{c.avg}%</td>
                <td className="py-3 text-center text-sm">
                  <span
                    className={
                      c.passRate >= 75
                        ? "font-medium text-emerald-600"
                        : "font-medium text-red-600"
                    }
                  >
                    {c.passRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
