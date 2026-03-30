export default function CourseSummary({ courses = [] }) {
  if (courses.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-[#6B6B6B] py-12">
        <p className="text-sm">No course data available. Save assessments first.</p>
      </div>
    );
  }

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
                    {(c.sos || []).map((so) => (
                      <span
                        key={so}
                        className="bg-secondary text-[#231F20] px-2 py-0.5 rounded text-xs font-medium"
                      >
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
                      c.pass_rate >= 75
                        ? "font-medium text-emerald-600"
                        : "font-medium text-red-600"
                    }
                  >
                    {c.pass_rate}%
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
