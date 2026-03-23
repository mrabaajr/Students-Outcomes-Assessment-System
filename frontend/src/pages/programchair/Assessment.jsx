import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { SectionsGrid } from "@/components/assessment/SectionsGrid";
import Navbar from "@/components/dashboard/Navbar";
import Footer from "@/components/dashboard/Footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  ChevronRight,
  Lightbulb,
  MessageSquare,
  Scale,
  UsersRound,
  FlaskConical,
  PenTool,
  Loader2,
  Calendar,
  Grid3x3,
  List,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const API_BASE_URL = "http://localhost:8000/api";

// Icons mapping for SOs (cycles if more than 6)
const soIconList = [Lightbulb, PenTool, MessageSquare, Scale, UsersRound, FlaskConical];
const getSOIcon = (index) => soIconList[(index >= 0 ? index : 0) % soIconList.length];

// Helper function to find faculty for a section
const getFacultyForSection = (section, facultyData) => {
  const match = facultyData.find(faculty =>
    faculty.courses.some(course =>
      course.code === section.courseCode && course.sections.includes(section.name)
    )
  );
  return match?.name || "No faculty assigned";
};

export default function SOAssessment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // ── API data ─────────────────────────────────────────
  const [studentOutcomes, setStudentOutcomes] = useState([]);
  const [sectionsData, setSectionsData] = useState([]);
  const [facultyData, setFacultyData] = useState([]);
  const [courseMappings, setCourseMappings] = useState({}); // courseId -> [soIds]
  const [isLoading, setIsLoading] = useState(true);

  // ── Selection state ──────────────────────────────────
  const [selectedSOId, setSelectedSOId] = useState(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState("");
  const [selectedSectionName, setSelectedSectionName] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");

  // ── Grade state ──────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [isSaved, setIsSaved] = useState(false);

  // ── View state ───────────────────────────────────────
  const [sectionsViewMode, setSectionsViewMode] = useState("grid"); // "grid" or "list"

  // ── Modal state ───────────────────────────────────────
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null); // Course to show sections modal

  // ── Navigator state ──────────────────────────────────
  const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState(true);
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(false);


  // ── Fetch SOs, sections, and course-SO mappings ──────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [soRes, secRes, mappingRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/student-outcomes/`),
          axios.get(`${API_BASE_URL}/sections/load_all/`),
          axios.get(`${API_BASE_URL}/course-so-mappings/`).catch(() => ({ data: [] })), // Fallback if endpoint not available
        ]);

        const soData = (Array.isArray(soRes.data) ? soRes.data : soRes.data.results || []).map(so => ({
          id: so.id,
          number: so.number,
          code: `SO ${so.number}`,
          title: so.title,
          description: so.description,
          performanceIndicators: (so.performance_indicators || so.performanceIndicators || []).map(pi => ({
            id: pi.id,
            number: pi.number,
            name: pi.description,
            shortName: pi.description ? pi.description.substring(0, 40) : '',
            performanceCriteria: (pi.criteria || pi.performanceCriteria || pi.performance_criteria || []).map(pc => ({
              id: pc.id,
              name: pc.name || '',
              order: pc.order ?? 0,
            })),
          })),
        }));
        setStudentOutcomes(soData);
        if (soData.length > 0) {
          setSelectedSOId(soData[0].id);
        }

        const sections = secRes.data.sections || [];
        const faculty = secRes.data.faculty || [];
        setSectionsData(sections);
        setFacultyData(faculty);

        // Build course-SO mappings: courseCode -> [soIds]
        const mappings = {};
        const courses = Array.isArray(mappingRes.data) ? mappingRes.data : mappingRes.data.results || [];
        courses.forEach(course => {
          // Handle different field name variations from backend
          const soList = 
            (course.mappedSOs) ||     // camelCase
            (course.mapped_sos) ||    // snake_case 
            (course.mapped_sos_details?.map(s => s.id)) || // Details objects
            [];
          
          // Convert to IDs (handle both objects and primitives)
          const soIds = (Array.isArray(soList) ? soList : []).map(so => 
            typeof so === 'object' ? so.id : parseInt(so)
          );
          
          if (course.code && soIds.length > 0) {
            mappings[course.code] = soIds;
          }
        });
        setCourseMappings(mappings);
      } catch (err) {
        console.error("Error loading data:", err);
        toast({ title: "Error", description: "Failed to load data from backend.", variant: "destructive" });
      }
      setIsLoading(false);
    };
    load();
  }, []);

  // ── Derived data from sections ───────────────────────
  const courseOptions = useMemo(() => {
    const map = new Map();
    sectionsData.forEach(sec => {
      if (!map.has(sec.courseCode)) {
        map.set(sec.courseCode, sec.courseName);
      }
    });
    return Array.from(map, ([code, name]) => ({ code, name }));
  }, [sectionsData]);

  // Auto-select first course when options change
  useEffect(() => {
    // Only auto-select if we've explicitly chosen to filter by course
    // Leave empty to show all sections initially
  }, [courseOptions]);

  // Sections filtered by selected course (or all if no course selected)
  const sectionOptions = useMemo(() => {
    const filtered = selectedCourseCode
      ? sectionsData.filter(sec => sec.courseCode === selectedCourseCode)
      : sectionsData;
    return [...new Set(filtered.map(sec => sec.name))];
  }, [sectionsData, selectedCourseCode]);

  // Auto-select first section when options change
  useEffect(() => {
    // Only auto-select if a course has been explicitly chosen
    if (selectedCourseCode && sectionOptions.length > 0 && !sectionOptions.includes(selectedSectionName)) {
      setSelectedSectionName(sectionOptions[0]);
    }
  }, [sectionOptions, selectedCourseCode]);

  // School years for selected course + section (or all if not selected)
  const schoolYearOptions = useMemo(() => {
    let filtered = sectionsData;
    if (selectedCourseCode) {
      filtered = filtered.filter(sec => sec.courseCode === selectedCourseCode);
    }
    if (selectedSectionName) {
      filtered = filtered.filter(sec => sec.name === selectedSectionName);
    }
    return [...new Set(filtered.map(sec => sec.schoolYear).filter(Boolean))];
  }, [sectionsData, selectedCourseCode, selectedSectionName]);

  // Auto-select school year (only if section is selected)
  useEffect(() => {
    if (selectedSectionName) {
      if (schoolYearOptions.length === 1) {
        setSelectedSchoolYear(schoolYearOptions[0]);
      } else if (schoolYearOptions.length > 0 && !schoolYearOptions.includes(selectedSchoolYear)) {
        setSelectedSchoolYear(schoolYearOptions[0]);
      } else if (schoolYearOptions.length === 0) {
        setSelectedSchoolYear("");
      }
    }
  }, [schoolYearOptions, selectedSectionName]);

  // The actual section object  
  const activeSection = useMemo(() => {
    return sectionsData.find(
      sec => sec.courseCode === selectedCourseCode 
          && sec.name === selectedSectionName
          && (selectedSchoolYear ? sec.schoolYear === selectedSchoolYear : true)
    );
  }, [sectionsData, selectedCourseCode, selectedSectionName, selectedSchoolYear]);

  // Current SO
  const so = useMemo(() => {
    return studentOutcomes.find(s => s.id === selectedSOId) || null;
  }, [studentOutcomes, selectedSOId]);

  // ── Initialize students from section when filters change ──
  useEffect(() => {
    if (!activeSection) {
      setStudents([]);
      return;
    }
    const sectionStudents = (activeSection.students || []).map(s => {
      const grades = {};
      if (so) {
        so.performanceIndicators.forEach(pi => {
          grades[pi.id] = null;
        });
      }
      return {
        id: s.id,
        name: s.name,
        studentId: s.studentId,
        grades,
      };
    });
    setStudents(sectionStudents);
    setIsSaved(false);

    // Try to load saved grades from backend
    if (so && activeSection) {
      loadGrades(activeSection.id, so.id, selectedSchoolYear);
    }
  }, [activeSection?.id, so?.id, selectedSchoolYear]);

  const loadGrades = async (sectionId, soId, schoolYear) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/assessments/load_grades/`, {
        params: { section_id: sectionId, so_id: soId, school_year: schoolYear },
      });
      const savedGrades = res.data.grades || {};
      if (Object.keys(savedGrades).length > 0) {
        setStudents(prev => prev.map(student => {
          const studentGrades = savedGrades[student.id];
          if (studentGrades) {
            return { ...student, grades: { ...student.grades, ...Object.fromEntries(
              Object.entries(studentGrades).map(([k, v]) => [parseInt(k), v])
            )}};
          }
          return student;
        }));
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Error loading grades:", err);
    }
  };

  // ── Grade change handler ─────────────────────────────
  const handleGradeChange = (studentId, indicatorId, value) => {
    setIsSaved(false);
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          grades: { ...student.grades, [indicatorId]: value },
        };
      }
      return student;
    }));
  };

  // ── Derive courses from sections data ──────────────────
  // Group sections by course code to create a courses list
  const coursesData = useMemo(() => {
    const courseMap = new Map();
    
    sectionsData.forEach(section => {
      const key = section.courseCode;
      if (!courseMap.has(key)) {
        // Create course object from first section with this course code
        courseMap.set(key, {
          id: `${section.courseCode}-${Date.now()}`, // Unique ID for each course
          courseCode: section.courseCode,
          courseName: section.courseName,
          name: section.courseName, // For compatibility
          faculty: [],
          sections: [],
          studentCount: 0,
          courses: section.courses,
        });
      }
      
      const course = courseMap.get(key);
      // Aggregate faculty
      if (section.faculty) {
        const sectionFaculty = Array.isArray(section.faculty) ? section.faculty : [section.faculty];
        sectionFaculty.forEach(f => {
          if (!course.faculty.find(fac => fac.id === f.id)) {
            course.faculty.push(f);
          }
        });
      }
      // Aggregate sections and student count
      course.sections.push(section);
      course.studentCount += (section.students?.length || 0);
    });
    
    return Array.from(courseMap.values());
  }, [sectionsData]);

  // ── Course selection handler from grid ──────────────────
  const handleSelectSectionFromGrid = (course) => {
    // When a course is selected, open the modal to show sections
    setSelectedCourseForModal(course);
  };

  // ── State for course assessment status ──
  const [courseAssessmentStatus, setCourseAssessmentStatus] = useState({}); // courseCode-soId -> status

  // ── Helper function to get assessment status for a course ──
  const getAssessmentStatus = useCallback((course) => {
    if (!so) return "not-yet"; // If no SO selected, return not-yet
    
    const statusKey = `${course.courseCode}-${so.id}`;
    return courseAssessmentStatus[statusKey] || "not-yet";
  }, [so, courseAssessmentStatus]);

  // ── Fetch assessment status for courses ──
  useEffect(() => {
    if (!so || coursesData.length === 0) {
      setCourseAssessmentStatus({});
      return;
    }

    const fetchAssessmentStatus = async () => {
      try {
        const statuses = {};
        
        // For each unique course, check assessment status for the selected SO
        const uniqueCourses = [...new Set(coursesData.map(c => c.courseCode))];
        
        for (const courseCode of uniqueCourses) {
          const course = coursesData.find(c => c.courseCode === courseCode);
          if (!course) continue;

          // Check each section of the course
          let totalGraded = 0;
          let totalStudents = 0;

          for (const section of course.sections) {
            try {
              const res = await axios.get(`${API_BASE_URL}/assessments/load_grades/`, {
                params: { 
                  section_id: section.id, 
                  so_id: so.id, 
                  school_year: section.schoolYear 
                },
              });
              
              const savedGrades = res.data.grades || {};
              const studentsWithGrades = Object.keys(savedGrades).filter(studentId => {
                const grades = savedGrades[studentId];
                return Object.values(grades).some(g => g !== null && g !== undefined);
              });

              totalGraded += studentsWithGrades.length;
              totalStudents += (section.students?.length || 0);
            } catch (err) {
              console.error(`Error fetching grades for section ${section.id}:`, err);
              totalStudents += (section.students?.length || 0);
            }
          }

          // Determine status
          if (totalStudents === 0) {
            statuses[`${courseCode}-${so.id}`] = "not-yet";
          } else if (totalGraded === 0) {
            statuses[`${courseCode}-${so.id}`] = "not-yet";
          } else if (totalGraded === totalStudents) {
            statuses[`${courseCode}-${so.id}`] = "assessed";
          } else {
            statuses[`${courseCode}-${so.id}`] = "incomplete";
          }
        }

        setCourseAssessmentStatus(statuses);
      } catch (err) {
        console.error("Error fetching assessment status:", err);
      }
    };

    fetchAssessmentStatus();
  }, [so, coursesData]);

  // ── Filtered courses for grid (by SO and school year) ──
  // Filters by selected SO and school year
  const coursesForGrid = useMemo(() => {
    let filtered = coursesData;
    
    // Filter by selected SO
    if (selectedSOId) {
      filtered = filtered.filter(course => {
        const mappedSOs = courseMappings[course.courseCode] || [];
        // Handle type comparison (string vs number)
        return mappedSOs.some(soId => 
          parseInt(soId) === parseInt(selectedSOId)
        );
      });
    }
    
    // Filter by school year
    if (selectedSchoolYear) {
      filtered = filtered.filter(course => 
        course.sections.some(sec => sec.schoolYear === selectedSchoolYear)
      );
    }
    return filtered;
  }, [coursesData, selectedSOIds, selectedCourseCode, selectedSectionName, selectedSchoolYear, courseMappings]);

  // ── Stats computation ────────────────────────────────
  const stats = useMemo(() => {
    const satisfactoryThreshold = 5;
    const totalStudents = students.length;
    let satisfactoryCount = 0;
    let unsatisfactoryCount = 0;
    let satisfactoryPctSum = 0;
    let unsatisfactoryAvgSum = 0;
    let totalPctSum = 0;
    let gradedStudentCount = 0;

    students.forEach(student => {
      const values = Object.values(student.grades).filter(g => g !== null && g !== undefined);
      if (values.length === 0) return;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const pct = (avg / 6) * 100;
      totalPctSum += pct;
      gradedStudentCount++;
      if (avg >= satisfactoryThreshold) {
        satisfactoryCount++;
        satisfactoryPctSum += pct;
      } else {
        unsatisfactoryCount++;
        unsatisfactoryAvgSum += avg;
      }
    });

    const attainmentRate = totalStudents > 0 ? (satisfactoryCount / totalStudents) * 100 : 0;
    const avgSatisfactoryPct = satisfactoryCount > 0 ? (satisfactoryPctSum / satisfactoryCount) : 0;
    const avgUnsatisfactoryRating = unsatisfactoryCount > 0 ? (unsatisfactoryAvgSum / unsatisfactoryCount) : 0;
    const totalAveragePercent = gradedStudentCount > 0 ? (totalPctSum / gradedStudentCount) : 0;

    return {
      totalStudents,
      satisfactoryCount,
      unsatisfactoryCount,
      avgSatisfactoryPct: avgSatisfactoryPct.toFixed(1),
      avgUnsatisfactoryRating: avgUnsatisfactoryRating.toFixed(2),
      attainmentRate: attainmentRate.toFixed(1),
      totalAveragePercent: totalAveragePercent.toFixed(1),
    };
  }, [students]);

  const indicatorSummary = useMemo(() => {
    const indicators = so?.performanceIndicators || [];
    const answeredCounts = indicators.map((pi) =>
      students.filter((student) => {
        const score = student.grades?.[pi.id];
        return score !== null && score !== undefined;
      }).length
    );

    const actualStudentCount = students.length;
    const averageAnswered =
      answeredCounts.length > 0
        ? (answeredCounts.reduce((sum, count) => sum + count, 0) / answeredCounts.length).toFixed(0)
        : "0";

    return {
      answeredCounts,
      actualStudentCount,
      averageAnswered,
    };
  }, [so, students]);

  // ── Save handler ─────────────────────────────────────
  const handleSave = async () => {
    if (!activeSection || !so) return;
    
    const gradesPayload = {};
    students.forEach(student => {
      const studentGrades = {};
      Object.entries(student.grades).forEach(([piId, score]) => {
        if (score !== null && score !== undefined) {
          studentGrades[piId] = score;
        }
      });
      if (Object.keys(studentGrades).length > 0) {
        gradesPayload[student.id] = studentGrades;
      }
    });

    try {
      await axios.post(`${API_BASE_URL}/assessments/save_grades/`, {
        section_id: activeSection.id,
        so_id: so.id,
        school_year: selectedSchoolYear,
        grades: gradesPayload,
      });
      setIsSaved(true);
      toast({ title: "Assessment Saved", description: `Grades for ${so.code} have been saved successfully.` });
    } catch (err) {
      console.error("Error saving:", err);
      toast({ title: "Error", description: "Failed to save assessment.", variant: "destructive" });
    }
  };

  const handleExport = () => {
    toast({ title: "Exporting Data", description: "Generating Excel file..." });
  };

  // ── Loading state ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#FFC20E]" />
            <p className="text-[#6B6B6B]">Loading assessment data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!so) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-[#231F20] mb-4">
            {studentOutcomes.length === 0 
              ? "No Student Outcomes Found" 
              : "Student Outcome Not Found"}
          </h1>
          <p className="text-[#6B6B6B] mb-6">
            {studentOutcomes.length === 0 
              ? "Please configure Student Outcomes first." 
              : "The selected outcome could not be found."}
          </p>
          <Link to="/programchair/student-outcomes">
            <button className="bg-[#FFC20E] hover:bg-[#FFC20E]/90 text-[#231F20] px-6 py-3 rounded-lg font-medium transition-colors">
              Go to Student Outcomes
            </button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              STUDENT OUTCOMES ASSESSMENT
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-white">Evaluate & Assess</span>
              <br />
              <span className="text-[#FFC20E]">Student Outcomes</span>
            </h1>

            <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl mb-6 sm:mb-8">
              Measure the performance of student learning outcomes across courses and sections. Select an outcome to view its details and assessment data.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>SAVE ASSESSMENT</span>
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-transparent text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#3A3A3A] transition-colors border border-[#A5A8AB]"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </section>

        {/* Compact Floating SO Navigator */}
        {so && (
          <div className={`fixed right-4 top-20 z-40 hidden lg:block transition-all duration-300 ${isNavigatorVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <div className={`bg-[#231F20]/95 backdrop-blur-sm border border-[#FFC20E] rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${isNavigatorCollapsed ? 'w-28' : 'w-52'}`}>
              <button
                onClick={() => setIsNavigatorCollapsed(!isNavigatorCollapsed)}
                className="w-full flex items-center justify-between gap-1 px-2 py-1.5 hover:bg-[#2A2626] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const Icon = getSOIcon(studentOutcomes.findIndex(s => s.id === selectedSOId));
                    return <Icon className="w-4 h-4 text-[#FFC20E] shrink-0" />;
                  })()}
                  <span className="text-xs font-bold text-white whitespace-nowrap">{so.code}</span>
                </div>
                {!isNavigatorCollapsed && (
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${isSaved ? 'bg-green-600 text-white' : 'bg-[#FFC20E] text-[#231F20]'}`}>
                      {isSaved ? 'SAVED' : 'EDITING'}
                    </span>
                    <ChevronRight className="w-3 h-3 text-[#FFC20E] rotate-90 shrink-0" />
                  </div>
                )}
              </button>
              
              <div className={`transition-all duration-300 overflow-hidden ${isNavigatorCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
                <div className="px-2 pb-2">
                  <div className="pb-1.5 mb-1.5 border-b border-[#FFC20E]/30">
                    <p className="text-xs font-semibold text-[#FFC20E] text-center leading-tight line-clamp-1">
                      {so.title}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1">
                    {studentOutcomes.map((outcome, idx) => {
                      const Icon = getSOIcon(idx);
                      const isActive = outcome.id === selectedSOId;
                      return (
                        <button
                          key={outcome.id}
                          onClick={() => setSelectedSOId(outcome.id)}
                          className={`flex flex-col items-center justify-center py-1.5 rounded transition-all ${isActive ? 'bg-[#FFC20E] text-[#231F20]' : 'bg-[#3A3A3A] text-[#A5A8AB] hover:bg-[#4A4A4A] hover:text-white'}`}
                          title={outcome.title}
                        >
                          <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-[#231F20]' : ''}`} />
                          <span className="text-xs font-bold leading-none">{outcome.number}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-[#FFC20E]/30">
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#FFC20E] text-[#231F20] px-2 py-1 rounded text-[10px] font-bold hover:bg-[#FFC20E]/90 transition-colors"
                    >
                      <Save className="w-3 h-3" />
                      <span>SAVE</span>
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center justify-center bg-[#3A3A3A] text-[#FFC20E] p-1 rounded hover:bg-[#4A4A4A] transition-colors"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="bg-[#F5F5F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
            
            {/* Student Outcome Selection */}
            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-medium text-[#6B6B6B] mb-4 uppercase tracking-wider">Select Student Outcome</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {studentOutcomes.map((outcome, idx) => {
                  const Icon = getSOIcon(idx);
                  const isActive = outcome.id === selectedSOId;
                  
                  return (
                    <button
                      key={outcome.id}
                      onClick={() => setSelectedSOId(outcome.id)}
                      className={cn(
                        "p-3 sm:p-4 rounded-xl border-2 transition-all text-left hover:scale-105",
                        isActive 
                          ? "bg-[#FFC20E] border-[#FFC20E] shadow-lg" 
                          : "bg-white border-[#A5A8AB] hover:border-[#FFC20E]/50"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 mb-2",
                        isActive ? "text-[#231F20]" : "text-[#FFC20E]"
                      )} />
                      <p className="text-xs sm:text-sm font-bold mb-1 text-[#231F20]">
                        {outcome.code}
                      </p>
                      <p className={cn(
                        "text-xs line-clamp-2",
                        isActive ? "text-[#231F20]/70" : "text-[#6B6B6B]"
                      )}>
                        {outcome.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Student Outcomes Details */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-[#231F20] mb-4 text-lg">Student Outcome Details</h3>
              {!so ? (
                <p className="text-sm text-[#6B6B6B]">
                  Select a Student Outcome above to view its details.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* SO Header */}
                  <div className="border-l-4 border-[#FFC20E] pl-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="px-3 py-1 bg-[#FFC20E] text-[#231F20] rounded-full text-xs font-bold">
                        {so.code}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-[#231F20] mb-2">{so.title}</h4>
                    <p className="text-sm text-[#6B6B6B] leading-relaxed">{so.description}</p>
                  </div>

                  {/* Performance Indicators */}
                  {so.performanceIndicators && so.performanceIndicators.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-[#231F20] mb-3">Performance Indicators</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {so.performanceIndicators.map((pi, index) => (
                          <div key={pi.id} className="p-4 rounded-lg bg-[#FFC20E]/5 border border-[#FFC20E]/20">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFC20E] text-[#231F20] text-xs font-bold flex items-center justify-center mt-0.5">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-sm text-[#231F20] mb-1">{pi.shortName}</p>
                                <p className="text-xs text-[#6B6B6B]">{pi.name}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="glass-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#231F20]">Filters</h3>
                {selectedSchoolYear && (
                  <button
                    onClick={() => {
                      setSelectedSchoolYear("");
                    }}
                    className="text-xs font-semibold text-[#FFC20E] hover:text-[#FFC20E]/80 transition-colors flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-6">
                {/* Course filter */}
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-[#6B6B6B]" />
                  <span className="text-sm font-medium text-[#6B6B6B]">Course:</span>
                  <div className="flex items-center gap-2">
                    <Select value={selectedCourseCode} onValueChange={setSelectedCourseCode}>
                      <SelectTrigger className="w-[240px] border-[#A5A8AB]">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courseOptions.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} — {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCourseCode && (
                      <button
                        onClick={() => setSelectedCourseCode("")}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Clear course filter"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section filter */}
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#6B6B6B]" />
                  <span className="text-sm font-medium text-[#6B6B6B]">Section:</span>
                  <div className="flex items-center gap-2">
                    <Select value={selectedSectionName} onValueChange={setSelectedSectionName}>
                      <SelectTrigger className="w-[160px] border-[#A5A8AB]">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionOptions.map(sec => (
                          <SelectItem key={sec} value={sec}>
                            {sec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSectionName && (
                      <button
                        onClick={() => setSelectedSectionName("")}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Clear section filter"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* School Year filter */}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#6B6B6B]" />
                  <span className="text-sm font-medium text-[#6B6B6B]">School Year:</span>
                  <div className="flex items-center gap-2">
                    {schoolYearOptions.length > 1 ? (
                      <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
                        <SelectTrigger className="w-[160px] border-[#A5A8AB]">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolYearOptions.map(sy => (
                            <SelectItem key={sy} value={sy}>
                              {sy}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="font-semibold text-[#231F20] text-sm">
                        {selectedSchoolYear || "N/A"}
                      </span>
                    )}
                    {selectedSchoolYear && schoolYearOptions.length > 1 && (
                      <button
                        onClick={() => setSelectedSchoolYear("")}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Clear school year filter"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Grid */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#231F20] text-lg flex items-center gap-3">
                  <span>Courses</span>
                  <span className="text-sm font-normal text-[#6B6B6B]\">({coursesForGrid.length} total)</span>
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSectionsViewMode("grid")}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      sectionsViewMode === "grid"
                        ? "bg-[#FFC20E] text-[#231F20]"
                        : "bg-[#8A817C]/10 text-[#231F20] hover:bg-[#8A817C]/20"
                    )}
                    title="Grid view"
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSectionsViewMode("list")}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      sectionsViewMode === "list"
                        ? "bg-[#FFC20E] text-[#231F20]"
                        : "bg-[#8A817C]/10 text-[#231F20] hover:bg-[#8A817C]/20"
                    )}
                    title="List view"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <SectionsGrid
                sections={coursesForGrid}
                selectedSectionId={activeSection?.courseCode}
                studentOutcomes={studentOutcomes}
                selectedSOId={selectedSOId}
                onSelectSection={handleSelectSectionFromGrid}
                viewMode={sectionsViewMode}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Students */}
              <div className="glass-card hover-lift p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-[#6B6B6B] mb-1">Total Students</p>
                <p className="text-3xl font-bold text-[#231F20]">{stats.totalStudents}</p>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  {selectedSectionName} • {selectedCourseCode}
                </p>
              </div>

              {/* Satisfactory */}
              <div className="glass-card hover-lift p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-[#6B6B6B] mb-1">Satisfactory</p>
                <p className="text-3xl font-bold text-[#231F20]">{stats.satisfactoryCount}</p>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Avg: {stats.avgSatisfactoryPct}% rating
                </p>
              </div>

              {/* Needs Improvement */}
              <div className="glass-card hover-lift p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <p className="text-sm text-[#6B6B6B] mb-1">Needs Improvement</p>
                <p className="text-3xl font-bold text-[#231F20]">{stats.unsatisfactoryCount}</p>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Avg rating: {stats.avgUnsatisfactoryRating}
                </p>
              </div>

              {/* Attainment Rate */}
              <div className="glass-card hover-lift p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-[#6B6B6B] mb-1">Attainment Rate</p>
                <p className="text-3xl font-bold text-[#231F20]">{stats.totalAveragePercent}%</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                  parseFloat(stats.totalAveragePercent) >= 80
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-100 text-red-600 border border-red-300'
                }`}>
                  {parseFloat(stats.totalAveragePercent) >= 80 ? "Target Attained" : "Below Target"}
                </span>
              </div>
            </div>

            {/* Assessment Summary */}
            <div className="glass-card p-4 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#8A817C] bg-white px-5 py-4">
                <div>
                  <h3 className="font-semibold text-[#231F20] text-base mb-1">Assessment Summary</h3>
                  <p className="text-sm text-[#6B6B6B]">
                    The class has an overall average of <span className="font-semibold text-[#231F20]">{stats.totalAveragePercent}%</span> with{" "}
                    <span className="font-semibold text-[#231F20]">{stats.satisfactoryCount}</span> satisfactory and{" "}
                    <span className="font-semibold text-[#231F20]">{stats.unsatisfactoryCount}</span> needing improvement out of{" "}
                    <span className="font-semibold text-[#231F20]">{stats.totalStudents}</span> students. Thus, the level of attainment is{" "}
                    {parseFloat(stats.totalAveragePercent) >= 80 ? "at or above" : "lower than"} the target level of 80%.
                  </p>
                </div>
                <span className={`shrink-0 px-5 py-2 rounded-lg text-xs font-bold tracking-wider ${parseFloat(stats.totalAveragePercent) >= 80 ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-50 text-red-600 border border-red-300'}`}>
                  {parseFloat(stats.totalAveragePercent) >= 80 ? "TARGET ATTAINED" : "BELOW TARGET"}
                </span>
              </div>

              {so?.performanceIndicators?.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max border-collapse bg-white text-sm text-[#231F20]">
                    <tbody>
                      <tr>
                        <td className="border border-[#231F20] px-4 py-2 font-semibold">
                          No. of Students Answered per indicator
                        </td>
                        {indicatorSummary.answeredCounts.map((count, index) => (
                          <td key={`answered-${so.performanceIndicators[index].id}`} className="border border-[#231F20] px-4 py-2 text-center">
                            {count}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-[#231F20] px-4 py-2 font-semibold">
                          Actual no. of students who answered
                        </td>
                        {so.performanceIndicators.map((pi) => (
                          <td key={`actual-${pi.id}`} className="border border-[#231F20] px-4 py-2 text-center">
                            {indicatorSummary.actualStudentCount}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-[#231F20] px-4 py-2 font-semibold">
                          Average no. of students who got scores
                        </td>
                        <td
                          colSpan={so.performanceIndicators.length}
                          className="border border-[#231F20] px-4 py-2 text-center"
                        >
                          {indicatorSummary.averageAnswered}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Sections Modal */}
        <Dialog open={!!selectedCourseForModal} onOpenChange={(open) => {
          if (!open) setSelectedCourseForModal(null);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedCourseForModal?.courseName} ({selectedCourseForModal?.courseCode})
              </DialogTitle>
              <DialogDescription>
                View all sections, faculty, and student enrollment details
              </DialogDescription>
            </DialogHeader>
            
            {selectedCourseForModal && (
              <div className="space-y-4">
                {selectedCourseForModal.sections && selectedCourseForModal.sections.length > 0 ? (
                  <div className="space-y-4">
                    {selectedCourseForModal.sections.map((section) => {
                      const facultyName = getFacultyForSection(section, facultyData);
                      
                      return (
                        <div
                          key={section.id}
                          className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden transition-all hover:shadow-md"
                        >
                          {/* Section Header */}
                          <div className="px-5 py-4 border-b border-[#E5E7EB] bg-white">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-lg bg-[#FFC20E] flex items-center justify-center flex-shrink-0">
                                <Users className="w-6 h-6 text-[#231F20]" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-base text-[#231F20] mb-1">
                                  {section.name}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-[#6B6B6B]">
                                  <div>
                                    <span className="font-semibold text-[#231F20]">Faculty:</span> {facultyName}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-[#231F20]">Students:</span> {section.students?.length || 0}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-[#231F20]">Year:</span> {section.schoolYear}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-[#231F20]">Schedule:</span> {section.schedule || "—"}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedSectionName(section.name);
                                  setSelectedSchoolYear(section.schoolYear);
                                  setSelectedCourseForModal(null);
                                }}
                                className="px-3 py-1.5 bg-[#FFC20E] text-[#231F20] rounded text-xs font-medium hover:bg-[#FFC20E]/90 transition-colors whitespace-nowrap"
                              >
                                View Grades
                              </button>
                            </div>
                          </div>

                          {/* Students Table */}
                          {section.students && section.students.length > 0 && (
                            <div className="divide-y divide-[#E5E7EB]">
                              <div className="px-5 py-3 bg-[#F9FAFB]">
                                <div className="grid grid-cols-12 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider gap-2">
                                  <span className="col-span-1">#</span>
                                  <span className="col-span-4">Name</span>
                                  <span className="col-span-3">Student ID</span>
                                  <span className="col-span-2">Year Level</span>
                                  <span className="col-span-2 text-right">Contact</span>
                                </div>
                              </div>
                              {section.students.map((student, idx) => (
                                <div
                                  key={student.id}
                                  className="px-5 py-3 grid grid-cols-12 text-sm items-center hover:bg-[#FFC20E]/5 transition-colors gap-2"
                                >
                                  <span className="col-span-1 text-[#6B6B6B] font-medium">{idx + 1}</span>
                                  <span className="col-span-4 font-medium text-[#231F20]">{student.name}</span>
                                  <span className="col-span-3 text-[#6B6B6B] font-mono text-xs">{student.studentId}</span>
                                  <span className="col-span-2 text-[#6B6B6B] text-xs">{student.yearLevel || "—"}</span>
                                  <span className="col-span-2 text-right text-[#6B6B6B] text-xs truncate">{student.email || "—"}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* No students message */}
                          {!section.students || section.students.length === 0 && (
                            <div className="px-5 py-6 text-center text-sm text-[#6B6B6B]">
                              No students enrolled in this section yet.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B6B6B] text-center py-8">No sections found for this course.</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
