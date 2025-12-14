import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2, FileBarChart2, GraduationCap, BookOpen, ClipboardList, Link2, LayoutGrid } from 'lucide-react';
import StatusCard from "../../components/dashboard/StatusCard";
import ActionCard from "../../components/dashboard/ActionCard";
import TermSelector from "../../components/dashboard/TermSelector";
import ProgressChart from "../../components/dashboard/ProgressChart";
import SOPerformanceChart from "../../components/dashboard/SOPerformanceChart";

const Dashboard = () => {
  const [selectedTerm, setSelectedTerm] = useState('2024-2025-1');

  const statusData = [
    {
      title: 'SO Configuration',
      description: 'Student Outcomes setup and alignment',
      status: 'completed',
      progress: 100,
    },
    {
      title: 'Course Mapping',
      description: 'Courses linked to Student Outcomes',
      status: 'warning',
      progress: 72,
    },
    {
      title: 'Computation Status',
      description: 'Assessment calculations and analytics',
      status: 'pending',
      progress: 45,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-indigo-200 bg-gradient-to-r from-slate-50 to-blue-50 backdrop-blur-sm sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                  Academic Dashboard
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  Outcome-Based Education Management
                </p>
              </div>
            </motion.div>
            
            <TermSelector
              selectedTerm={selectedTerm}
              onTermChange={setSelectedTerm}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Welcome back!
          </h2>
          <p className="text-muted-foreground">
            Here's an overview of your academic outcome management system.
          </p>
        </motion.div>

        {/* Status Cards Grid */}
        <section className="mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full shadow"></div>
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest">
              System Status
            </h3>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statusData.map((item, index) => (
              <StatusCard
                key={item.title}
                {...item}
                delay={index * 0.1}
              />
            ))}
          </div>
        </section>

        {/* Chart and Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Progress Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 p-6 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Overall Progress</h3>
            <ProgressChart />
          </motion.div>

          {/* SO Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 p-6 rounded-lg bg-gradient-to-br from-white to-slate-50 border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-blue-600 rounded-full"></div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Student Outcome Performance</h3>
            </div>
            <SOPerformanceChart />
          </motion.div>
        </div>

        {/* Quick Actions Section */}
        <section className="mb-8">
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium text-slate-600 uppercase tracking-wider mb-4 font-semibold"
          >
            Quick Actions
          </motion.h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ translateY: -4 }}
              onClick={() => window.location.href = '/so-management'}
              className="p-4 rounded-lg bg-blue-500 hover:bg-blue-600 transition-all text-left text-white shadow-md hover:shadow-lg"
            >
              <Settings2 className="w-5 h-5 mb-2" />
              <div className="font-semibold">SO Management</div>
              <div className="text-xs opacity-90 mt-1">Configure Student Outcomes</div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ translateY: -4 }}
              onClick={() => window.location.href = '/rubrics'}
              className="p-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-all text-left text-white shadow-md hover:shadow-lg"
            >
              <ClipboardList className="w-5 h-5 mb-2" />
              <div className="font-semibold">Rubric Management</div>
              <div className="text-xs opacity-90 mt-1">Manage assessment rubrics</div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ translateY: -4 }}
              onClick={() => window.location.href = '/courses'}
              className="p-4 rounded-lg bg-amber-500 hover:bg-amber-600 transition-all text-left text-white shadow-md hover:shadow-lg"
            >
              <BookOpen className="w-5 h-5 mb-2" />
              <div className="font-semibold">Course Management</div>
              <div className="text-xs opacity-90 mt-1">Add and manage courses</div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              whileHover={{ translateY: -4 }}
              onClick={() => window.location.href = '/course-so-mapping'}
              className="p-4 rounded-lg bg-violet-500 hover:bg-violet-600 transition-all text-left text-white shadow-md hover:shadow-lg"
            >
              <Link2 className="w-5 h-5 mb-2" />
              <div className="font-semibold">Course–SO Mapping</div>
              <div className="text-xs opacity-90 mt-1">Link courses to outcomes</div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ translateY: -4 }}
              onClick={() => window.location.href = '/mapping-summary'}
              className="p-4 rounded-lg bg-rose-500 hover:bg-rose-600 transition-all text-left text-white shadow-md hover:shadow-lg"
            >
              <LayoutGrid className="w-5 h-5 mb-2" />
              <div className="font-semibold">Mapping Summary</div>
              <div className="text-xs opacity-90 mt-1">View mapping coverage</div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              whileHover={{ translateY: -4 }}
              onClick={() => window.location.href = '/reports'}
              className="p-4 rounded-lg bg-cyan-500 hover:bg-cyan-600 transition-all text-left text-white shadow-md hover:shadow-lg"
            >
              <FileBarChart2 className="w-5 h-5 mb-2" />
              <div className="font-semibold">Reports</div>
              <div className="text-xs opacity-90 mt-1">View analytics and reports</div>
            </motion.button>
          </div>
        </section>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
            <p>Last updated: December 14, 2024 at 10:30 AM</p>
            <p>Academic Term: First Semester 2024-2025</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
