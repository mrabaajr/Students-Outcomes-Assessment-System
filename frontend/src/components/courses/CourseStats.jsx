import { BookOpen, CheckCircle, Link, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const StatCard = ({ icon: Icon, label, value, subtext, iconBgClass }) => (
  <Card className="bg-card">
    <CardContent className="p-4">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${iconBgClass}`}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const CourseStats = ({ courses }) => {
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'active').length;
  const mappedCourses = courses.filter(c => c.mappedSOs.length > 0).length;
  const avgSOCoverage = Math.round(
    (courses.reduce((acc, c) => acc + c.mappedSOs.length, 0) / (totalCourses * 6)) * 100
  );

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={BookOpen}
        label="Total Courses"
        value={totalCourses}
        subtext="All registered courses"
        iconBgClass="bg-header"
      />
      <StatCard
        icon={CheckCircle}
        label="Active Courses"
        value={activeCourses}
        subtext={`${totalCourses - activeCourses} inactive`}
        iconBgClass="bg-success"
      />
      <StatCard
        icon={Link}
        label="Mapped to SOs"
        value={mappedCourses}
        subtext={`${Math.round((mappedCourses / totalCourses) * 100)}% mapped`}
        iconBgClass="bg-primary"
      />
      <StatCard
        icon={BarChart3}
        label="Avg SO Coverage"
        value={`${avgSOCoverage}%`}
        subtext="Across all courses"
        iconBgClass="bg-warning"
      />
    </div>
  );
};

export default CourseStats;
