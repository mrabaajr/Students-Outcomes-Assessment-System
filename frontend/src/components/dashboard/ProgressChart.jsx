import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'SO Configured', value: 85, color: 'hsl(158, 64%, 42%)' },
  { name: 'Courses Mapped', value: 72, color: 'hsl(217, 91%, 40%)' },
  { name: 'Computation Done', value: 45, color: 'hsl(174, 60%, 45%)' },
];

const ProgressChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card rounded-lg p-6 shadow-card border border-border"
    >
      <h3 className="font-display text-lg font-semibold text-foreground mb-6">
        Overall Progress
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {data.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="text-center"
          >
            <p className="text-2xl font-display font-bold text-foreground">
              {item.value}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {item.name.split(' ')[0]}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProgressChart;
