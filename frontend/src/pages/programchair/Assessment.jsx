import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { SectionsGrid } from "@/components/assessment/SectionsGrid";
import { CourseSectionsModal } from "@/components/assessment/CourseSectionsModal";
import { AssessStudentsModal } from "@/components/assessment/AssessStudentsModal";
import Navbar from "@/components/dashboard/Navbar";
import Footer from "@/components/dashboard/Footer";
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
  RefreshCw,
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
  const [selectedSOIds, setSelectedSOIds] = useState([]);
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
  const [selectedSectionForAssessment, setSelectedSectionForAssessment] = useState(null); // Section for student assessment modal

  const clearAllFilters = useCallback(() => {
    setSelectedSOIds([]);
    setSelectedCourseCode("");
    setSelectedSectionName("");
    setSelectedSchoolYear("");
  }, []);

  // ── Navigator state ──────────────────────────────────
  const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState(true);
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(false);


  // ── Fetch SOs, sections, and course-SO mappings ──────
  const loadData = useCallback(async () => {
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
      // Don't auto-select first SO - let user choose from filters

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
      toast({ title: "Data Refreshed", description: "Course and mapping data has been reloaded.", variant: "default" });
    } catch (err) {
      console.error("Error loading data:", err);
      toast({ title: "Error", description: "Failed to load data from backend.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Sections filtered by selected course and SO (or all if no course/SO selected)
  const sectionOptions = useMemo(() => {
    let filtered = sectionsData;
    
    // Filter by SO if selected
    if (selectedSOIds.length > 0) {
      filtered = filtered.filter(sec => {
        const mappedSOs = courseMappings[sec.courseCode] || [];
        return selectedSOIds.some(selectedId =>
          mappedSOs.some(soId => parseInt(soId) === parseInt(selectedId))
        );
      });
    }
    
    // Filter by course code if selected
    if (selectedCourseCode) {
      filtered = filtered.filter(sec => sec.courseCode === selectedCourseCode);
    }
    
    return [...new Set(filtered.map(sec => sec.name))];
  }, [sectionsData, selectedCourseCode, selectedSOIds, courseMappings]);

  // Auto-select first section when options change
  useEffect(() => {
    // Only auto-select if a course has been explicitly chosen
    if (selectedCourseCode && sectionOptions.length > 0 && !sectionOptions.includes(selectedSectionName)) {
      setSelectedSectionName(sectionOptions[0]);
    }
  }, [sectionOptions, selectedCourseCode]);

  // School years for selected course + section + SO (or all if not selected)
  const schoolYearOptions = useMemo(() => {
    let filtered = sectionsData;
    
    // Filter by SO if selected
    if (selectedSOIds.length > 0) {
      filtered = filtered.filter(sec => {
        const mappedSOs = courseMappings[sec.courseCode] || [];
        return selectedSOIds.some(selectedId =>
          mappedSOs.some(soId => parseInt(soId) === parseInt(selectedId))
        );
      });
    }
    
    // Filter by course if selected
    if (selectedCourseCode) {
      filtered = filtered.filter(sec => sec.courseCode === selectedCourseCode);
    }
    
    // Filter by section if selected
    if (selectedSectionName) {
      filtered = filtered.filter(sec => sec.name === selectedSectionName);
    }
    
    return [...new Set(filtered.map(sec => sec.schoolYear).filter(Boolean))];
  }, [sectionsData, selectedCourseCode, selectedSectionName, selectedSOIds, courseMappings]);

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

  // Current SO (primary is first selected)
  const so = useMemo(() => {
    if (selectedSOIds.length === 0) return null;
    return studentOutcomes.find(s => s.id === selectedSOIds[0]) || null;
  }, [studentOutcomes, selectedSOIds]);

  // ── Initialize students from section ──
  useEffect(() => {
    const section = selectedSectionForAssessment || activeSection;
    if (!section) {
      setStudents([]);
      return;
    }
    const sectionStudents = (section.students || []).map(s => {
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
    const sectionId = section?.id;
    const schoolYear = selectedSectionForAssessment?.schoolYear || selectedSchoolYear;
    if (so && sectionId) {
      loadGrades(sectionId, so.id, schoolYear);
    }
  }, [selectedSectionForAssessment?.id ?? activeSection?.id, so?.id, selectedSchoolYear]);

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
  const [sectionAssessmentStatus, setSectionAssessmentStatus] = useState({}); // sectionId-soId -> status
  const [refreshCounter, setRefreshCounter] = useState(0); // Trigger to refresh assessment status

  const getRelevantSOIdForCourse = useCallback((courseCode) => {
    const mappedSOs = courseMappings[courseCode] || [];
    if (selectedSOIds.length > 0) {
      const selectedId = selectedSOIds[0];
      const isMapped = mappedSOs.some((soId) => parseInt(soId) === parseInt(selectedId));
      if (isMapped) return selectedId;
    }

    return mappedSOs.length > 0 ? parseInt(mappedSOs[0]) : null;
  }, [courseMappings, selectedSOIds]);

  const getSectionStatusFromGradeMap = useCallback((savedGrades, studentCount) => {
    if (!studentCount || studentCount <= 0) return "not-yet";

    const studentsWithGrades = Object.keys(savedGrades).filter((studentId) => {
      const grades = savedGrades[studentId] || {};
      return Object.values(grades).some((g) => g !== null && g !== undefined && g !== "");
    }).length;

    if (studentsWithGrades === 0) return "not-yet";
    if (studentsWithGrades === studentCount) return "assessed";
    return "incomplete";
  }, []);

  const fetchSingleCourseAssessmentStatus = useCallback(async (courseCode, soId) => {
    if (!soId) return;

    const course = coursesData.find((item) => item.courseCode === courseCode);
    if (!course) return;

    const nextSectionStatuses = {};

    for (const section of course.sections) {
      try {
        const res = await axios.get(`${API_BASE_URL}/assessments/load_grades/`, {
          params: {
            section_id: section.id,
            so_id: soId,
            school_year: section.schoolYear,
          },
        });

        const savedGrades = res.data.grades || {};
        nextSectionStatuses[`${section.id}-${soId}`] = getSectionStatusFromGradeMap(
          savedGrades,
          section.students?.length || 0
        );
      } catch (err) {
        console.error(`Error fetching grades for section ${section.id}:`, err);
        nextSectionStatuses[`${section.id}-${soId}`] = "not-yet";
      }
    }

    const sectionStatuses = course.sections.map(
      (section) => nextSectionStatuses[`${section.id}-${soId}`] || "not-yet"
    );

    let nextCourseStatus = "not-yet";
    if (sectionStatuses.length > 0) {
      if (sectionStatuses.every((status) => status === "assessed")) {
        nextCourseStatus = "assessed";
      } else if (sectionStatuses.some((status) => status === "assessed" || status === "incomplete")) {
        nextCourseStatus = "incomplete";
      }
    }

    setSectionAssessmentStatus((prev) => ({
      ...prev,
      ...nextSectionStatuses,
    }));

    setCourseAssessmentStatus((prev) => ({
      ...prev,
      [`${courseCode}-${soId}`]: nextCourseStatus,
    }));
  }, [coursesData, getSectionStatusFromGradeMap]);

  // Function to trigger refresh of assessment status (called from modal after save)
  const triggerStatusRefresh = useCallback((payload) => {
    if (payload?.courseCode && payload?.soId && payload?.sectionId) {
      const sectionKey = `${payload.sectionId}-${payload.soId}`;
      const nextSectionStatuses = {
        ...sectionAssessmentStatus,
        [sectionKey]: payload.sectionStatus || "not-yet",
      };

      setSectionAssessmentStatus(nextSectionStatuses);

      const course = coursesData.find((item) => item.courseCode === payload.courseCode);
      if (course) {
        const relevantStatuses = course.sections.map((section) => {
          if (String(section.id) === String(payload.sectionId)) {
            return payload.sectionStatus || "not-yet";
          }
          return nextSectionStatuses[`${section.id}-${payload.soId}`] || "not-yet";
        });

        let nextCourseStatus = "not-yet";
        if (relevantStatuses.length > 0) {
          if (relevantStatuses.every((status) => status === "assessed")) {
            nextCourseStatus = "assessed";
          } else if (relevantStatuses.some((status) => status === "assessed" || status === "incomplete")) {
            nextCourseStatus = "incomplete";
          }
        }

        setCourseAssessmentStatus((prev) => ({
          ...prev,
          [`${payload.courseCode}-${payload.soId}`]: nextCourseStatus,
        }));
      }

      fetchSingleCourseAssessmentStatus(payload.courseCode, payload.soId);
      return;
    }

    setRefreshCounter((prev) => prev + 1);
  }, [courseAssessmentStatus, coursesData, fetchSingleCourseAssessmentStatus, sectionAssessmentStatus]);

  // ── Fetch assessment status for courses ──
  useEffect(() => {
    if (coursesData.length === 0) {
      setCourseAssessmentStatus({});
      setSectionAssessmentStatus({});
      return;
    }

    const fetchAssessmentStatus = async () => {
      try {
        const nextCourseStatuses = {};
        const nextSectionStatuses = {};

        const uniqueCourses = [...new Set(coursesData.map(c => c.courseCode))];

        for (const courseCode of uniqueCourses) {
          const course = coursesData.find(c => c.courseCode === courseCode);
          if (!course) continue;
          const relevantSoId = getRelevantSOIdForCourse(courseCode);

          if (!relevantSoId) {
            nextCourseStatuses[`${courseCode}-none`] = "not-yet";
            continue;
          }

          for (const section of course.sections) {
            try {
              const res = await axios.get(`${API_BASE_URL}/assessments/load_grades/`, {
                params: { 
                  section_id: section.id, 
                  so_id: relevantSoId, 
                  school_year: section.schoolYear 
                },
              });

              const savedGrades = res.data.grades || {};
              nextSectionStatuses[`${section.id}-${relevantSoId}`] = getSectionStatusFromGradeMap(
                savedGrades,
                section.students?.length || 0
              );
            } catch (err) {
              console.error(`Error fetching grades for section ${section.id}:`, err);
              nextSectionStatuses[`${section.id}-${relevantSoId}`] = "not-yet";
            }
          }

          const statusesForCourse = course.sections.map(
            (section) => nextSectionStatuses[`${section.id}-${relevantSoId}`] || "not-yet"
          );

          if (statusesForCourse.length === 0) {
            nextCourseStatuses[`${courseCode}-${relevantSoId}`] = "not-yet";
          } else if (statusesForCourse.every((status) => status === "assessed")) {
            nextCourseStatuses[`${courseCode}-${relevantSoId}`] = "assessed";
          } else if (statusesForCourse.some((status) => status === "assessed" || status === "incomplete")) {
            nextCourseStatuses[`${courseCode}-${relevantSoId}`] = "incomplete";
          } else {
            nextCourseStatuses[`${courseCode}-${relevantSoId}`] = "not-yet";
          }
        }

        setSectionAssessmentStatus(nextSectionStatuses);
        setCourseAssessmentStatus(nextCourseStatuses);
      } catch (err) {
        console.error("Error fetching assessment status:", err);
      }
    };

    fetchAssessmentStatus();
  }, [coursesData, getRelevantSOIdForCourse, getSectionStatusFromGradeMap, refreshCounter]);

  // ── Filtered courses for grid (by SO, course, section, and school year) ──
  // Filters by selected SOs, course, section, and school year
  const coursesForGrid = useMemo(() => {
    let filtered = coursesData;
    
    // Filter by selected SOs (show courses that map to ANY of the selected SOs)
    if (selectedSOIds.length > 0) {
      filtered = filtered.filter(course => {
        const mappedSOs = courseMappings[course.courseCode] || [];
        // Handle type comparison (string vs number)
        return selectedSOIds.some(selectedId =>
          mappedSOs.some(soId => parseInt(soId) === parseInt(selectedId))
        );
      });
    }
    
    // Filter by course code
    if (selectedCourseCode) {
      filtered = filtered.filter(course => course.courseCode === selectedCourseCode);
    }
    
    // Filter by section name
    if (selectedSectionName) {
      filtered = filtered.filter(course =>
        course.sections.some(sec => sec.name === selectedSectionName)
      );
    }
    
    // Filter by school year
    if (selectedSchoolYear) {
      filtered = filtered.filter(course => 
        course.sections.some(sec => sec.schoolYear === selectedSchoolYear)
      );
    }
    
    // Enrich courses with assessment status
    return filtered.map(course => ({
      ...course,
      assessmentStatus:
        courseAssessmentStatus[
          `${course.courseCode}-${getRelevantSOIdForCourse(course.courseCode)}`
        ] || "not-yet",
    }));
  }, [courseAssessmentStatus, coursesData, getRelevantSOIdForCourse, selectedSOIds, selectedCourseCode, selectedSectionName, selectedSchoolYear, courseMappings]);

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

  const handleExport = async () => {
    console.log("Export button clicked");
    console.log("selectedSectionForAssessment:", selectedSectionForAssessment);
    console.log("activeSection:", activeSection);
    console.log("selectedSOIds:", selectedSOIds);
    console.log("selectedSchoolYear:", selectedSchoolYear);
    
    // Auto-select first SO if none selected
    let useSOIds = selectedSOIds;
    if (!selectedSOIds.length && studentOutcomes.length > 0) {
      useSOIds = [studentOutcomes[0].id];
      setSelectedSOIds([studentOutcomes[0].id]);
      console.log("Auto-selected first SO:", studentOutcomes[0].id);
    }
    
    // Auto-select first course if none selected
    let useCourseCode = selectedCourseCode;
    if (!selectedCourseCode && courseOptions.length > 0) {
      useCourseCode = courseOptions[0].code;
      setSelectedCourseCode(courseOptions[0].code);
      console.log("Auto-selected first course:", courseOptions[0].code);
    }
    
    // Auto-select first section if none selected
    let useSectionName = selectedSectionName;
    if (!selectedSectionName && sectionOptions.length > 0) {
      useSectionName = sectionOptions[0];
      setSelectedSectionName(sectionOptions[0]);
      console.log("Auto-selected first section:", sectionOptions[0]);
    }
    
    // Get the section with selected/auto-selected values
    const selectedSection = sectionsData.find(
      sec => sec.courseCode === useCourseCode 
          && sec.name === useSectionName
    );
    
    const section = selectedSectionForAssessment || selectedSection;
    
    if (!section) {
      console.log("No section found even after auto-select");
      toast({ 
        title: "Export Failed", 
        description: "Please select a course and section from the Filters section at the top of the page.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!useSOIds.length) {
      console.log("No SO selected");
      toast({ 
        title: "Export Failed", 
        description: "Please select a Student Outcome from the Filters section.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!selectedSchoolYear && !section.schoolYear) {
      console.log("No school year selected");
      toast({ 
        title: "Export Failed", 
        description: "Please select a school year from the Filters section.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const sectionId = section.id;
      const soId = useSOIds[0];
      const schoolYear = selectedSchoolYear || section.schoolYear;
      
      console.log("Exporting with params:", { sectionId, soId, schoolYear });

      const response = await axios.get(
        `${API_BASE_URL}/assessments/export_csv/`,
        {
          params: {
            section_id: sectionId,
            so_id: soId,
            school_year: schoolYear,
          },
          responseType: 'blob',
        }
      );

      console.log("Export response received:", response);
      
      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Assessment_${section.name}_${schoolYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("Download triggered");
      toast({ 
        title: "Export Successful", 
        description: "Assessment data exported as CSV file." 
      });
    } catch (err) {
      console.error("Error exporting:", err);
      console.error("Error response:", err.response?.data);
      toast({ 
        title: "Export Failed", 
        description: err.response?.data?.detail || err.message || "Failed to export assessment data.", 
        variant: "destructive" 
      });
    }
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

  // Show error only if no student outcomes exist at all
  if (studentOutcomes.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-[#231F20] mb-4">
            No Student Outcomes Found
          </h1>
          <p className="text-[#6B6B6B] mb-6">
            Please configure Student Outcomes first.
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
                    const Icon = getSOIcon(studentOutcomes.findIndex(s => s.id === selectedSOIds[0]));
                    return <Icon className="w-4 h-4 text-[#FFC20E] shrink-0" />;
                  })()}
                  <span className="text-xs font-bold text-white whitespace-nowrap">{so?.code}</span>
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
                      const isActive = selectedSOIds.includes(outcome.id);
                      return (
                        <button
                          key={outcome.id}
                          onClick={() => {
                            if (isActive) {
                              setSelectedSOIds(selectedSOIds.filter(id => id !== outcome.id));
                            } else {
                              setSelectedSOIds([...selectedSOIds, outcome.id]);
                            }
                          }}
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
            


            {/* Filters */}
            <div className="glass-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#231F20]">Filters</h3>
                {(selectedSOIds.length > 0 || selectedCourseCode || selectedSectionName || selectedSchoolYear) && (
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-1.5 bg-[#FFC20E] hover:bg-[#FFC20E]/90 text-[#231F20] font-semibold rounded-md transition-colors flex items-center gap-2 text-xs"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>
              
              {/* Student Outcomes Filter */}
              <div className="mb-6 pb-6 border-b border-[#8A817C]/20">
                <div className="flex items-center gap-3 mb-3">
                  <Lightbulb className="w-5 h-5 text-[#6B6B6B]" />
                  <span className="text-sm font-medium text-[#6B6B6B]">Student Outcomes:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {studentOutcomes.map((outcome, idx) => {
                    const Icon = getSOIcon(idx);
                    const isActive = selectedSOIds.includes(outcome.id);
                    
                    return (
                      <button
                        key={outcome.id}
                        onClick={() => {
                          if (isActive) {
                            setSelectedSOIds(selectedSOIds.filter(id => id !== outcome.id));
                          } else {
                            setSelectedSOIds([...selectedSOIds, outcome.id]);
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                          isActive
                            ? "bg-[#FFC20E] text-[#231F20] shadow-md"
                            : "bg-[#F0F0F0] text-[#6B6B6B] border border-[#D0D0D0] hover:bg-[#E8E8E8]"
                        )}
                        title={outcome.title}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {outcome.code}
                      </button>
                    );
                  })}
                </div>
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
                selectedSOIds={selectedSOIds}
                onSelectSection={handleSelectSectionFromGrid}
                viewMode={sectionsViewMode}
                courseMappings={courseMappings}
                getSOIcon={getSOIcon}
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
        <CourseSectionsModal
          isOpen={!!selectedCourseForModal}
          selectedCourse={selectedCourseForModal}
          facultyData={facultyData}
          selectedSOId={selectedCourseForModal ? getRelevantSOIdForCourse(selectedCourseForModal.courseCode) : null}
          sectionStatusMap={sectionAssessmentStatus}
          onClose={() => setSelectedCourseForModal(null)}
          onSelectSection={(section) => {
            setSelectedCourseCode(section.courseCode);
            setSelectedSectionName(section.name);
            setSelectedSchoolYear(section.schoolYear);
            setSelectedSectionForAssessment(section);
          }}
        />

        {/* Student Assessment Modal */}
        <AssessStudentsModal
          isOpen={!!selectedSectionForAssessment}
          selectedSection={selectedSectionForAssessment}
          studentOutcomes={studentOutcomes}
          courseMappings={courseMappings}
          facultyData={facultyData}
          selectedSOIds={selectedSOIds}
          onChangeSelectedSO={setSelectedSOIds}
          onClose={() => {
            setSelectedSectionForAssessment(null);
            setSelectedCourseForModal(null);
          }}
          onCourseFiltersChange={(courseCode, sectionName, schoolYear) => {
            setSelectedCourseCode(courseCode);
            setSelectedSectionName(sectionName);
            setSelectedSchoolYear(schoolYear);
          }}
          onSaveSuccess={triggerStatusRefresh}
        />
      </main>

      <Footer />
    </div>
  );
}
