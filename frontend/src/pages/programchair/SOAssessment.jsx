import { useParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { studentOutcomes, generateSampleStudents, courses, sections } from "../../data/studentOutcomes";
import { StudentGradingTable } from "../../components/grading/StudentGradingTable";
import { StatCard } from "../../components/stats/StatCard";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { 
  Save, 
  Download, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Calculator,
  FileSpreadsheet,
  ClipboardList,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";

export default function SOAssessment() {
  const { id } = useParams();
  const soId = parseInt(id || "1");
  const { toast } = useToast();
  
  const so = studentOutcomes.find(s => s.id === soId);
  
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id?.toString() || "");
  const [selectedSection, setSelectedSection] = useState(sections[0]?.id?.toString() || "");
  const [students, setStudents] = useState(() => generateSampleStudents(soId));

  const selectedCourseObj = courses.find(c => c.id.toString() === selectedCourse);
  const selectedSectionObj = sections.find(s => s.id.toString() === selectedSection);

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
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-[#231F20] mb-4">Student Outcome Not Found</h1>
          <Link to="/programchair/dashboard">
            <Button className="bg-[#FFC20E] text-[#231F20] hover:bg-[#FFC20E]/90">Return to Dashboard</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#231F20] border-b border-[#A5A8AB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-block px-3 py-1 bg-[#FFC20E] rounded-full text-xs text-[#231F20] font-semibold">
                {so.code}
              </div>
              <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB]">
                ASSESSMENT INPUT
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">{so.name}</span>
            </h1>

            <p className="text-[#A5A8AB] max-w-xl mb-8">
              {so.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-6 py-3 rounded-lg font-medium hover:bg-[#FFC20E]/90 transition-colors"
              >
                <Save size={18} />
                <span>SAVE ASSESSMENT</span>
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-transparent text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3A3A3A] transition-colors border border-[#A5A8AB]"
              >
                <Download size={18} />
                <span>EXPORT DATA</span>
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Filters */}
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-[#6B6B6B]" />
                <span className="text-sm font-medium text-[#6B6B6B]">Course:</span>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#6B6B6B]" />
                <span className="text-sm font-medium text-[#6B6B6B]">Section:</span>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto text-sm text-[#6B6B6B]">
                School Year: <span className="font-semibold text-[#231F20]">2023-2024</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-primary" />
                </div>
              </div>
              <p className="text-xs text-[#6B6B6B] font-medium mb-1">TOTAL STUDENTS</p>
              <p className="text-3xl font-bold text-[#231F20] mb-1">{stats.totalStudents}</p>
              <p className="text-xs text-[#6B6B6B]">{selectedSectionObj?.name || "All Sections"}</p>
            </div>

            <div className="glass-card p-5 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-success" />
                </div>
              </div>
              <p className="text-xs text-[#6B6B6B] font-medium mb-1">SATISFACTORY</p>
              <p className="text-3xl font-bold text-[#231F20] mb-1">{stats.satisfactoryCount}</p>
              <p className="text-xs text-[#6B6B6B]">≥ 83.33% rating</p>
            </div>

            <div className="glass-card p-5 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <XCircle size={20} className="text-destructive" />
                </div>
              </div>
              <p className="text-xs text-[#6B6B6B] font-medium mb-1">NEEDS IMPROVEMENT</p>
              <p className="text-3xl font-bold text-[#231F20] mb-1">{stats.unsatisfactoryCount}</p>
              <p className="text-xs text-[#6B6B6B]">&lt; 83.33% rating</p>
            </div>

            <div className="glass-card p-5 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calculator size={20} className="text-primary" />
                </div>
                {parseFloat(stats.attainmentRate) >= 80 && (
                  <span className="text-xs font-medium px-2 py-1 rounded text-success bg-success/10">
                    TARGET MET
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6B6B] font-medium mb-1">ATTAINMENT RATE</p>
              <p className="text-3xl font-bold text-[#231F20] mb-1">{stats.attainmentRate}%</p>
              <p className="text-xs text-[#6B6B6B]">
                {parseFloat(stats.attainmentRate) >= 80 ? "Above Target ✓" : "Below Target"}
              </p>
            </div>
          </div>

          {/* Performance Indicators Legend */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-[#231F20] mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Performance Indicators
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {so.performanceIndicators.map((pi, index) => (
                <div key={pi.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#F5F5F5]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFC20E] text-[#231F20] text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm text-[#231F20]">{pi.id}</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5 line-clamp-2">{pi.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grading Table */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-[#231F20] mb-4">
              Student Grades
              <span className="text-sm font-normal text-[#6B6B6B] ml-2">(Scale: 0-4, Satisfactory ≥ 3)</span>
            </h3>
            <StudentGradingTable
              students={students}
              performanceIndicators={so.performanceIndicators}
              onGradeChange={handleGradeChange}
            />
          </div>

          {/* Summary Footer */}
          <div className="glass-card p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-[#231F20] mb-2">Assessment Summary</h3>
                <p className="text-sm text-[#6B6B6B]">
                  {parseFloat(stats.attainmentRate) >= 80 
                    ? `${stats.attainmentRate}% of the class got satisfactory rating or higher. Thus, the level of attainment is higher than the target level of 80%.`
                    : `${stats.attainmentRate}% of the class got satisfactory rating. Thus, the level of attainment is lower than the target level of 80%.`
                  }
                </p>
              </div>
              <div className={`px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap ${
                parseFloat(stats.attainmentRate) >= 80 
                  ? 'bg-success/10 text-success' 
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {parseFloat(stats.attainmentRate) >= 80 ? 'TARGET MET ✓' : 'BELOW TARGET'}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
