
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const pieData = [
  { name: "Completed", value: 18, color: "#16A34A" },
  { name: "Pending", value: 8, color: "#FFC20E" },
  { name: "Not Started", value: 4, color: "#DC2626" },
];

const assessments = [
  { course: "CPE 205A", so: "SO 1", status: "Complete", updated: "2025-12-10", progress: 100 },
  { course: "CPE 205A", so: "SO 3", status: "Complete", updated: "2025-12-08", progress: 100 },
  { course: "CPE 301", so: "SO 1", status: "Complete", updated: "2025-11-28", progress: 100 },
  { course: "CPE 301", so: "SO 2", status: "Pending", updated: "2025-12-01", progress: 60 },
  { course: "CPE 302", so: "SO 2", status: "Pending", updated: "2025-11-30", progress: 45 },
  { course: "CPE 302", so: "SO 5", status: "Not Started", updated: "—", progress: 0 },
  { course: "CPE 401", so: "SO 4", status: "Complete", updated: "2025-12-05", progress: 100 },
  { course: "CPE 402", so: "SO 6", status: "Pending", updated: "2025-12-02", progress: 30 },
  { course: "CPE 501", so: "SO 3", status: "Not Started", updated: "—", progress: 0 },
  { course: "EE 201", so: "SO 1", status: "Complete", updated: "2025-11-25", progress: 100 },
];

const statusStyle = {
  Complete: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  Pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "Not Started": "bg-red-100 text-red-700 hover:bg-red-100",
};

export default function AssessmentCompletion() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Donut Chart */}
      <div className="glass-card p-6 lg:col-span-1">
        <h2 className="text-lg font-semibold text-[#231F20] mb-4">Completion Overview</h2>
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs text-[#6B6B6B]">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-center">
            <span className="text-3xl font-bold text-[#231F20]">60%</span>
            <p className="text-xs text-[#6B6B6B]">Overall Completion</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-6 lg:col-span-2">
        <h2 className="text-lg font-semibold text-[#231F20] mb-4">Assessment Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B]">Course</th>
                <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B]">SO</th>
                <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B]">Status</th>
                <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B]">Progress</th>
                <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B]">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a, i) => (
                <tr key={i} className="border-b border-[#E5E7EB] last:border-0">
                  <td className="py-3 font-medium text-sm text-[#231F20]">{a.course}</td>
                  <td className="py-3 text-sm text-[#231F20]">{a.so}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyle[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="py-3 w-32">
                    <div className="progress-bar">
                      <div
                        className="progress-fill bg-primary"
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 text-sm text-[#6B6B6B]">{a.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
