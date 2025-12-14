import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const SOPerformanceChart = () => {
  const data = [
    { outcome: 'SO1', percentage: 85 },
    { outcome: 'SO2', percentage: 72 },
    { outcome: 'SO3', percentage: 91 },
    { outcome: 'SO4', percentage: 68 },
    { outcome: 'SO5', percentage: 79 },
    { outcome: 'SO6', percentage: 54 },
    { outcome: 'SO7', percentage: 88 },
  ];

  const getBarColor = (percentage) => {
    if (percentage >= 80) return 'hsl(var(--chart-2))';
    if (percentage >= 60) return 'hsl(var(--chart-4))';
    return 'hsl(var(--chart-5))';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-lg p-6 shadow-card border border-border"
    >
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">
        Student Outcomes Performance
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis 
              dataKey="outcome" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value) => [`${value}%`, 'Rating']}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            />
            <ReferenceLine 
              y={75} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="5 5" 
              label={{ 
                value: 'Target 75%', 
                position: 'right', 
                fill: 'hsl(var(--primary))',
                fontSize: 11
              }} 
            />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }}></div>
          <span>≥80% Excellent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-4))' }}></div>
          <span>60-79% Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-5))' }}></div>
          <span>&lt;60% Needs Improvement</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SOPerformanceChart;
