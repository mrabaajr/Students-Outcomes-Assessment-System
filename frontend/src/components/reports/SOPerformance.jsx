import { CheckCircle2, XCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

export default function SOPerformance({ soData = [] }) {
  const chartData = soData.map((d) => ({
    name: `SO ${d.number}`,
    score: d.avg,
    met: d.met,
  }));

  if (soData.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-[#6B6B6B] py-12">
        <p className="text-sm">No SO performance data available. Save assessments first.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Chart */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-[#231F20] mb-4">SO Average Performance</h2>
        <div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B6B6B" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#6B6B6B" }} unit="%" />
              <Tooltip
                formatter={(value) => [`${value}%`, "Avg Score"]}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <ReferenceLine y={80} stroke="#FFC20E" strokeDasharray="5 5" label={{ value: "Target 80%", position: "right", fontSize: 10, fill: "#6B6B6B" }} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.met ? "#16A34A" : "#DC2626"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-[#231F20] mb-4">SO Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B] w-16">SO #</th>
                <th className="pb-3 text-left text-xs font-medium text-[#6B6B6B]">Name</th>
                <th className="pb-3 text-center text-xs font-medium text-[#6B6B6B]">Avg</th>
                <th className="pb-3 text-center text-xs font-medium text-[#6B6B6B]">Pass Rate</th>
                <th className="pb-3 text-center text-xs font-medium text-[#6B6B6B]">Status</th>
              </tr>
            </thead>
            <tbody>
              {soData.map((so) => (
                <tr key={so.id} className="border-b border-[#E5E7EB] last:border-0">
                  <td className="py-3 font-medium text-sm text-[#231F20]">SO {so.number}</td>
                  <td className="py-3 text-sm text-[#231F20] max-w-[200px] truncate">{so.name}</td>
                  <td className="py-3 text-center text-sm text-[#231F20]">{so.avg}%</td>
                  <td className="py-3 text-center text-sm text-[#231F20]">{so.pass_rate}%</td>
                  <td className="py-3 text-center">
                    {so.met ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Met
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                        <XCircle className="h-3 w-3" /> Not Met
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
