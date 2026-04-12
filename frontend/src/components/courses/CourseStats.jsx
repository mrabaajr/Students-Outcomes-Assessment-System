import { BookOpen, Link, BarChart3 } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, subtext, iconColor }) => (
  <div className="glass-card p-5 hover-lift">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 ${iconColor}/10 rounded-lg flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
    </div>
    <p className="text-xs text-[#6B6B6B] font-medium mb-1">{label}</p>
    <p className="text-3xl font-bold text-[#231F20] mb-1">{value}</p>
    {subtext && <p className="text-xs text-[#6B6B6B]">{subtext}</p>}
  </div>
);

const CourseStats = ({ courses, studentOutcomes = [] }) => {
  const totalCourses = courses.length || 1; // Avoid division by zero
  const mappedCourses = courses.filter(c => c.mappedSOs.length > 0).length;
  
  // Use actual count of student outcomes, fallback to 7 if none available
  const totalStudentOutcomes = studentOutcomes.length > 0 ? studentOutcomes.length : 7;
  const totalPossibleMappings = totalCourses * totalStudentOutcomes;
  const actualMappings = courses.reduce((acc, c) => acc + c.mappedSOs.length, 0);
  const avgSOCoverage = totalPossibleMappings > 0 
    ? Math.round((actualMappings / totalPossibleMappings) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <StatCard
        icon={BookOpen}
        label="TOTAL COURSES"
        value={totalCourses}
        subtext="All registered courses"
        iconColor="text-primary"
      />
      <StatCard
        icon={Link}
        label="MAPPED TO SOs"
        value={mappedCourses}
        subtext={`${Math.round((mappedCourses / totalCourses) * 100)}% coverage`}
        iconColor="text-primary"
      />
      <StatCard
        icon={BarChart3}
        label="AVG SO COVERAGE"
        value={`${avgSOCoverage}%`}
        subtext="Across all courses"
        iconColor="text-primary"
      />
    </div>
  );
};

export default CourseStats;
