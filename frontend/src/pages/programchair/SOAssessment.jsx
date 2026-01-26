import { useParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { studentOutcomes, generateSampleStudents, courses, sections } from "@/data/studentOutcomes";
import { StudentGradingTable } from "@/components/grading/StudentGradingTable";
import { StatCard } from "@/components/stats/StatCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Save, 
  Download, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Calculator,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SOAssessment() {
  const { id } = useParams();
  const soId = parseInt(id || "1");
  
  const so = studentOutcomes.find(s => s.id === soId);
  
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [selectedSection, setSelectedSection] = useState(sections[0]);
  const [students, setStudents] = useState(() => generateSampleStudents(soId));

  const handleGradeChange = (studentId, indicatorId, value) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          grades: {
            ...student.grades,
            [indicatorId]: value,
          },
        };
      }
      return student;
    }));
  };

  const stats = useMemo(() => {
    const satisfactoryThreshold = 5;
    let totalStudents = students.length;
    let satisfactoryCount = 0;
    let totalGrades = 0;
    let gradeSum = 0;

    students.forEach(student => {
      const values = Object.values(student.grades).filter((g) => g !== null);
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        if (avg >= satisfactoryThreshold) {
          satisfactoryCount++;
        }
        gradeSum += avg;
        totalGrades++;
      }
    });

    const avgGrade = totalGrades > 0 ? gradeSum / totalGrades : 0;
    const attainmentRate = totalStudents > 0 ? (satisfactoryCount / totalStudents) * 100 : 0;

    return {
      totalStudents,
      satisfactoryCount,
      unsatisfactoryCount: totalStudents - satisfactoryCount,
      avgGrade: avgGrade.toFixed(2),
      attainmentRate: attainmentRate.toFixed(1),
    };
  }, [students]);

  const handleSave = () => {
    toast({
      title: "Assessment Saved",
      description: `Grades for ${so?.code} have been saved successfully.`,
    });
  };

  const handleExport = () => {
    toast({
      title: "Exporting Data",
      description: "Generating Excel file...",
    });
  };

  if (!so) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold text-foreground mb-4">Student Outcome Not Found</h1>
        <Link to="/">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {so.code}
              </span>
            </div>
            <h1 className="page-title">{so.title}</h1>
            <p className="page-subtitle max-w-2xl mt-2">
              {so.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Assessment
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="stat-card mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Course:</span>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Section:</span>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sections.map(section => (
                  <SelectItem key={section} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto text-sm text-muted-foreground">
            School Year: <span className="font-semibold text-foreground">2023-2024</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle={`${selectedSection}`}
          icon={Users}
        />
        <StatCard
          title="Satisfactory"
          value={stats.satisfactoryCount}
          subtitle="≥ 83.33% rating"
          icon={CheckCircle2}
          variant="accent"
        />
        <StatCard
          title="Needs Improvement"
          value={stats.unsatisfactoryCount}
          subtitle="< 83.33% rating"
          icon={XCircle}
        />
        <StatCard
          title="Attainment Rate"
          value={`${stats.attainmentRate}%`}
          subtitle={parseFloat(stats.attainmentRate) >= 80 ? "Target Met ✓" : "Below Target"}
          icon={Calculator}
          variant="primary"
        />
      </div>

      {/* Performance Indicators Legend */}
      <div className="stat-card mb-6">
        <h3 className="font-heading font-semibold text-foreground mb-4">Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {so.performanceIndicators.map((pi, index) => (
            <div key={pi.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-sm text-foreground">{pi.shortName}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pi.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grading Table */}
      <div className="mb-8">
        <h3 className="font-heading font-semibold text-foreground mb-4">
          Student Grades
          <span className="text-sm font-normal text-muted-foreground ml-2">(Scale: 1-6, Satisfactory ≥ 5)</span>
        </h3>
        <StudentGradingTable
          students={students}
          performanceIndicators={so.performanceIndicators}
          onGradeChange={handleGradeChange}
        />
      </div>

      {/* Summary Footer */}
      <div className="stat-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-semibold text-foreground">Assessment Summary</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {parseFloat(stats.attainmentRate) >= 80 
                ? `${stats.attainmentRate}% of the class got satisfactory rating or higher. Thus, the level of attainment is higher than the target level of 80%.`
                : `${stats.attainmentRate}% of the class got satisfactory rating. Thus, the level of attainment is lower than the target level of 80%.`
              }
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
            parseFloat(stats.attainmentRate) >= 80 
              ? 'bg-success/10 text-success' 
              : 'bg-destructive/10 text-destructive'
          }`}>
            {parseFloat(stats.attainmentRate) >= 80 ? 'TARGET MET' : 'BELOW TARGET'}
          </div>
        </div>
      </div>
    </div>
  );
}
