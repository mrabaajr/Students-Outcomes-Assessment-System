import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback } from "react";
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
  Calendar,
  Grid3x3,
  List,
  X,
  Tag,
  Clock3,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";

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

const parseSOQuery = (value) =>
  (value || "")
    .split(",")
    .map((item) => parseInt(item, 10))
    .filter((item) => Number.isInteger(item));

export default function SOAssessment() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ── API data ─────────────────────────────────────────
  const [studentOutcomes, setStudentOutcomes] = useState([]);
  const [sectionsData, setSectionsData] = useState([]);
  const [facultyData, setFacultyData] = useState([]);
  const [courseMappings, setCourseMappings] = useState({}); // courseId -> [soIds]
  const [isLoading, setIsLoading] = useState(true);

  // ── Selection state ──────────────────────────────────
  const [selectedSOIds, setSelectedSOIds] = useState(() => parseSOQuery(searchParams.get("so")));
  const [selectedCourseCode, setSelectedCourseCode] = useState(() => searchParams.get("course") || "");
  const [selectedSectionName, setSelectedSectionName] = useState(() => searchParams.get("section") || "");
  const [selectedSemester, setSelectedSemester] = useState(() => searchParams.get("semester") || "");
  const [selectedFaculty, setSelectedFaculty] = useState(() => searchParams.get("faculty") || "");

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
    setSelectedSemester("");
    setSelectedFaculty("");
  }, []);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (selectedSOIds.length > 0) {
      nextParams.set("so", selectedSOIds.join(","));
    }
    if (selectedCourseCode) {
      nextParams.set("course", selectedCourseCode);
    }
    if (selectedSectionName) {
      nextParams.set("section", selectedSectionName);
    }
    if (selectedSemester) {
      nextParams.set("semester", selectedSemester);
    }
    if (selectedFaculty) {
      nextParams.set("faculty", selectedFaculty);
    }

    const nextString = nextParams.toString();
    const currentString = searchParams.toString();
    if (nextString !== currentString) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    searchParams,
    selectedSOIds,
    selectedCourseCode,
    selectedSectionName,
    selectedSemester,
    selectedFaculty,
    setSearchParams,
  ]);

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

      const sections = (secRes.data.sections || [])
        .filter((section) => section.isActive !== false)
        .map((section) => ({
          ...section,
          facultyName: section.facultyName || getFacultyForSection(section, secRes.data.faculty || []),
        }));
      const faculty = secRes.data.faculty || [];
      setSectionsData(sections);
      setFacultyData(faculty);

      // Build course-SO mappings: courseCode -> union of all mapped SO ids
      // This prevents one academic-year mapping row from overwriting another
      // when multiple course mappings share the same course code.
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
          const existingIds = mappings[course.code] || [];
          mappings[course.code] = [...new Set([...existingIds, ...soIds])];
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

    if (selectedSemester) {
      filtered = filtered.filter(sec => sec.semester === selectedSemester);
    }

    if (selectedFaculty) {
      filtered = filtered.filter(sec => (sec.facultyName || "No faculty assigned") === selectedFaculty);
    }
    
    return [...new Set(filtered.map(sec => sec.name))];
  }, [sectionsData, selectedCourseCode, selectedSOIds, selectedSemester, selectedFaculty, courseMappings]);

  // Auto-select first section when options change
  useEffect(() => {
    // Only auto-select if a course has been explicitly chosen
    if (selectedCourseCode && sectionOptions.length > 0 && !sectionOptions.includes(selectedSectionName)) {
      setSelectedSectionName(sectionOptions[0]);
    }
  }, [sectionOptions, selectedCourseCode]);

  const semesterOptions = useMemo(() => {
    let filtered = sectionsData;

    if (selectedSOIds.length > 0) {
      filtered = filtered.filter(sec => {
        const mappedSOs = courseMappings[sec.courseCode] || [];
        return selectedSOIds.some(selectedId =>
          mappedSOs.some(soId => parseInt(soId) === parseInt(selectedId))
        );
      });
    }

    if (selectedCourseCode) {
      filtered = filtered.filter(sec => sec.courseCode === selectedCourseCode);
    }

    if (selectedFaculty) {
      filtered = filtered.filter(sec => (sec.facultyName || "No faculty assigned") === selectedFaculty);
    }

    if (selectedSectionName) {
      filtered = filtered.filter(sec => sec.name === selectedSectionName);
    }

    return [...new Set(filtered.map(sec => sec.semester).filter(Boolean))];
  }, [sectionsData, selectedSOIds, selectedCourseCode, selectedFaculty, selectedSectionName, courseMappings]);

  const facultyOptions = useMemo(() => {
    let filtered = sectionsData;

    if (selectedSOIds.length > 0) {
      filtered = filtered.filter(sec => {
        const mappedSOs = courseMappings[sec.courseCode] || [];
        return selectedSOIds.some(selectedId =>
          mappedSOs.some(soId => parseInt(soId) === parseInt(selectedId))
        );
      });
    }

    if (selectedCourseCode) {
      filtered = filtered.filter(sec => sec.courseCode === selectedCourseCode);
    }

    if (selectedSemester) {
      filtered = filtered.filter(sec => sec.semester === selectedSemester);
    }

    if (selectedSectionName) {
      filtered = filtered.filter(sec => sec.name === selectedSectionName);
    }

    return [...new Set(filtered.map(sec => sec.facultyName || "No faculty assigned").filter(Boolean))];
  }, [sectionsData, selectedSOIds, selectedCourseCode, selectedSemester, selectedSectionName, courseMappings]);

  // The actual section object  
  const activeSection = useMemo(() => {
    return sectionsData.find(
      sec => sec.courseCode === selectedCourseCode 
          && sec.name === selectedSectionName
          && (selectedSemester ? sec.semester === selectedSemester : true)
          && (selectedFaculty ? (sec.facultyName || "No faculty assigned") === selectedFaculty : true)
    );
  }, [sectionsData, selectedCourseCode, selectedSectionName, selectedSemester, selectedFaculty]);

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
    const schoolYear = selectedSectionForAssessment?.schoolYear || section?.schoolYear || "";
    if (so && sectionId) {
      loadGrades(sectionId, so.id, schoolYear);
    }
  }, [selectedSectionForAssessment?.id ?? activeSection?.id, so?.id]);

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
  const [courseAssessmentStatus, setCourseAssessmentStatus] = useState({}); // courseCode-soId and courseCode-all -> status
  const [sectionAssessmentStatus, setSectionAssessmentStatus] = useState({}); // sectionId-soId -> status
  const [courseLastAssessed, setCourseLastAssessed] = useState({}); // courseCode-soId and courseCode-all -> iso string
  const [sectionLastAssessed, setSectionLastAssessed] = useState({}); // sectionId-soId -> iso string
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0); // Trigger to refresh assessment status

  const getMappedSOIdsForCourse = useCallback((courseCode) => {
    const mappedSOs = courseMappings[courseCode] || [];
    return [...new Set(
      mappedSOs
        .map((soId) => parseInt(soId, 10))
        .filter((soId) => Number.isFinite(soId))
    )];
  }, [courseMappings]);

  const getRelevantSOIdForCourse = useCallback((courseCode) => {
    const mappedSOs = getMappedSOIdsForCourse(courseCode);
    if (selectedSOIds.length > 0) {
      const selectedId = parseInt(selectedSOIds[0], 10);
      const isMapped = mappedSOs.some((soId) => soId === selectedId);
      if (isMapped) return selectedId;
    }

    return mappedSOs.length > 0 ? mappedSOs[0] : null;
  }, [getMappedSOIdsForCourse, selectedSOIds]);

  const buildAssessmentSummaryRequests = useCallback((courses) => {
    const requests = [];

    courses.forEach((course) => {
      const mappedSOIds = getMappedSOIdsForCourse(course.courseCode);
      if (mappedSOIds.length === 0) return;

      mappedSOIds.forEach((soId) => {
        course.sections.forEach((section) => {
          requests.push({
            section_id: parseInt(section.id),
            so_id: soId,
            school_year: section.schoolYear || "",
          });
        });
      });
    });

    return requests;
  }, [getMappedSOIdsForCourse]);

  const applyAssessmentSummaries = useCallback((summaries, courses) => {
    const nextSectionStatuses = {};
    const nextCourseStatuses = {};
    const nextSectionLastAssessed = {};
    const nextCourseLastAssessed = {};

    summaries.forEach((summary) => {
      nextSectionStatuses[`${summary.section_id}-${summary.so_id}`] = summary.status;
      nextSectionLastAssessed[`${summary.section_id}-${summary.so_id}`] = summary.last_assessed || null;
    });

    courses.forEach((course) => {
      const mappedSOIds = getMappedSOIdsForCourse(course.courseCode);
      if (mappedSOIds.length === 0) {
        nextCourseStatuses[`${course.courseCode}-all`] = "not-yet";
        nextCourseLastAssessed[`${course.courseCode}-all`] = null;
        return;
      }

      const perSOStatuses = mappedSOIds.map((soId) => {
        const statusesForSO = course.sections.map(
          (section) => nextSectionStatuses[`${section.id}-${soId}`] || "not-yet"
        );

        let soStatus = "not-yet";
        if (statusesForSO.length > 0) {
          if (statusesForSO.every((status) => status === "assessed")) {
            soStatus = "assessed";
          } else if (statusesForSO.some((status) => status === "assessed" || status === "incomplete")) {
            soStatus = "incomplete";
          }
        }

        nextCourseStatuses[`${course.courseCode}-${soId}`] = soStatus;

        const latestSectionAssessmentForSO = course.sections
          .map((section) => nextSectionLastAssessed[`${section.id}-${soId}`])
          .filter(Boolean)
          .sort((left, right) => new Date(right) - new Date(left))[0] || null;

        nextCourseLastAssessed[`${course.courseCode}-${soId}`] = latestSectionAssessmentForSO;
        return soStatus;
      });

      let aggregateStatus = "not-yet";
      if (perSOStatuses.every((status) => status === "assessed")) {
        aggregateStatus = "assessed";
      } else if (perSOStatuses.every((status) => status === "not-yet")) {
        aggregateStatus = "not-yet";
      } else {
        aggregateStatus = "incomplete";
      }

      nextCourseStatuses[`${course.courseCode}-all`] = aggregateStatus;

      const latestAssessmentAcrossSOs = mappedSOIds
        .map((soId) => nextCourseLastAssessed[`${course.courseCode}-${soId}`])
        .filter(Boolean)
        .sort((left, right) => new Date(right) - new Date(left))[0] || null;

      nextCourseLastAssessed[`${course.courseCode}-all`] = latestAssessmentAcrossSOs;
    });

    setSectionAssessmentStatus(nextSectionStatuses);
    setCourseAssessmentStatus(nextCourseStatuses);
    setSectionLastAssessed(nextSectionLastAssessed);
    setCourseLastAssessed(nextCourseLastAssessed);
  }, [getMappedSOIdsForCourse]);

  const fetchAssessmentSummaries = useCallback(async (courses) => {
    const requests = buildAssessmentSummaryRequests(courses);
    if (requests.length === 0) {
      setSectionAssessmentStatus({});
      setCourseAssessmentStatus({});
      setSectionLastAssessed({});
      setCourseLastAssessed({});
      return;
    }

    setIsStatusLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/assessments/summary/`, {
        requests,
      });
      applyAssessmentSummaries(response.data.summaries || [], courses);
    } finally {
      setIsStatusLoading(false);
    }
  }, [applyAssessmentSummaries, buildAssessmentSummaryRequests]);

  // Function to trigger refresh of assessment status (called from modal after save)
  const triggerStatusRefresh = useCallback((payload) => {
    if (payload?.courseCode && payload?.soId && payload?.sectionId) {
      fetchAssessmentSummaries(coursesData);
      return;
    }

    setRefreshCounter((prev) => prev + 1);
  }, [coursesData, fetchAssessmentSummaries]);

  // ── Fetch assessment status for courses ──
  useEffect(() => {
    if (coursesData.length === 0) {
      setCourseAssessmentStatus({});
      setSectionAssessmentStatus({});
      setCourseLastAssessed({});
      setSectionLastAssessed({});
      return;
    }

    const fetchAssessmentStatus = async () => {
      try {
        await fetchAssessmentSummaries(coursesData);
      } catch (err) {
        console.error("Error fetching assessment status:", err);
      }
    };

    fetchAssessmentStatus();
  }, [coursesData, fetchAssessmentSummaries, refreshCounter]);

  // ── Filtered courses for grid ──
  // Filters by selected SOs, course, section, semester, and faculty
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

    // Filter by semester
    if (selectedSemester) {
      filtered = filtered.filter(course =>
        course.sections.some(sec => sec.semester === selectedSemester)
      );
    }

    // Filter by faculty
    if (selectedFaculty) {
      filtered = filtered.filter(course =>
        course.sections.some(sec => (sec.facultyName || "No faculty assigned") === selectedFaculty)
      );
    }
    
    // Enrich courses with assessment status
    return filtered.map(course => {
      const visibleSections = course.sections.filter((section) => {
        if (selectedSectionName && section.name !== selectedSectionName) return false;
        if (selectedSemester && section.semester !== selectedSemester) return false;
        if (selectedFaculty && (section.facultyName || "No faculty assigned") !== selectedFaculty) return false;
        return true;
      });

      return {
        ...course,
        sections: visibleSections,
        studentCount: visibleSections.reduce(
          (total, section) => total + (section.students?.length || 0),
          0
        ),
        lastAssessed:
          courseLastAssessed[`${course.courseCode}-all`] || null,
        assessmentStatus:
          courseAssessmentStatus[`${course.courseCode}-all`] || "not-yet",
      };
    });
  }, [courseAssessmentStatus, courseLastAssessed, coursesData, getRelevantSOIdForCourse, selectedSOIds, selectedCourseCode, selectedSectionName, selectedSemester, selectedFaculty, courseMappings]);

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

  const selectedCourseForExport = useMemo(
    () => coursesData.find((course) => course.courseCode === selectedCourseCode) || null,
    [coursesData, selectedCourseCode]
  );

  const exportContext = useMemo(() => {
    if (!selectedCourseForExport) {
      return {
        sections: [],
        relevantSOIds: [],
        sectionCount: 0,
        soCount: 0,
        rowCount: 0,
        summaryText: "Select a course to preview and export its assessment data.",
      };
    }

    const relevantSOIds = selectedSOIds.length > 0
      ? selectedSOIds
      : (courseMappings[selectedCourseCode] || []).map((id) => parseInt(id));

    const sections = selectedCourseForExport.sections.filter((section) => {
      if (selectedSectionName && section.name !== selectedSectionName) return false;
      if (selectedSemester && section.semester !== selectedSemester) return false;
      if (selectedFaculty && (section.facultyName || "No faculty assigned") !== selectedFaculty) return false;
      return true;
    });

    const rowCount = sections.reduce(
      (total, section) => total + ((section.students?.length || 0) * relevantSOIds.length),
      0
    );

    return {
      sections,
      relevantSOIds,
      sectionCount: sections.length,
      soCount: relevantSOIds.length,
      rowCount,
      summaryText: `Exporting ${sections.length} section${sections.length === 1 ? "" : "s"}, ${relevantSOIds.length} SO${relevantSOIds.length === 1 ? "" : "s"}, ${rowCount} row${rowCount === 1 ? "" : "s"}`,
    };
  }, [
    courseMappings,
    selectedCourseCode,
    selectedCourseForExport,
    selectedFaculty,
    selectedSOIds,
    selectedSectionName,
    selectedSemester,
  ]);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    selectedSOIds.forEach((soId) => {
      const outcome = studentOutcomes.find((item) => item.id === soId);
      if (!outcome) return;
      chips.push({
        key: `so-${soId}`,
        label: outcome.code,
        onRemove: () => setSelectedSOIds((prev) => prev.filter((item) => item !== soId)),
      });
    });

    if (selectedCourseCode) {
      chips.push({
        key: "course",
        label: `Course: ${selectedCourseCode}`,
        onRemove: () => setSelectedCourseCode(""),
      });
    }

    if (selectedSectionName) {
      chips.push({
        key: "section",
        label: `Section: ${selectedSectionName}`,
        onRemove: () => setSelectedSectionName(""),
      });
    }

    if (selectedSemester) {
      chips.push({
        key: "semester",
        label: `Semester: ${selectedSemester}`,
        onRemove: () => setSelectedSemester(""),
      });
    }

    if (selectedFaculty) {
      chips.push({
        key: "faculty",
        label: `Faculty: ${selectedFaculty}`,
        onRemove: () => setSelectedFaculty(""),
      });
    }

    return chips;
  }, [
    selectedSOIds,
    studentOutcomes,
    selectedCourseCode,
    selectedSectionName,
    selectedSemester,
    selectedFaculty,
  ]);

  const handleExport = async () => {
    if (!selectedCourseCode) {
      toast({
        title: "Export Failed",
        description: "Select a course first, then export that course's assessment data.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedCourse = selectedCourseForExport;
      if (!selectedCourse) {
        toast({
          title: "Export Failed",
          description: "The selected course could not be found.",
          variant: "destructive",
        });
        return;
      }

      const relevantSOIds = exportContext.relevantSOIds;

      if (relevantSOIds.length === 0) {
        toast({
          title: "Export Failed",
          description: "This course has no mapped Student Outcomes to export.",
          variant: "destructive",
        });
        return;
      }

      const filteredSections = exportContext.sections;

      if (filteredSections.length === 0) {
        toast({
          title: "Export Failed",
          description: "No sections match the current course filters.",
          variant: "destructive",
        });
        return;
      }

      const soMap = new Map(studentOutcomes.map((outcome) => [outcome.id, outcome]));
      const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const csvLines = [];

      for (const section of filteredSections) {
        for (const soId of relevantSOIds) {
          const soRecord = soMap.get(parseInt(soId));
          if (!soRecord) continue;

          const response = await axios.get(`${API_BASE_URL}/assessments/load_grades/`, {
            params: {
              section_id: section.id,
              so_id: soId,
              school_year: section.schoolYear,
            },
          });

          const gradesByStudent = response.data.grades || {};
          const assessmentColumns = [];

          (soRecord.performanceIndicators || []).forEach((pi) => {
            if (pi.performanceCriteria && pi.performanceCriteria.length > 0) {
              pi.performanceCriteria.forEach((pc) => {
                assessmentColumns.push({
                  key: `criterion:${pc.id}`,
                  label: `${pi.name} - ${pc.name}`,
                });
              });
            } else {
              assessmentColumns.push({
                key: `indicator:${pi.id}`,
                label: pi.name,
              });
            }
          });

          csvLines.push(
            ["Course Code", section.courseCode],
            ["Course Name", section.courseName],
            ["Section", section.name],
            ["Semester", section.semester || ""],
            ["School Year", section.schoolYear || ""],
            ["Faculty", section.facultyName || "No faculty assigned"],
            ["Curriculum", section.curriculum || ""],
            ["SO Code", soRecord.code],
            ["SO Title", soRecord.title],
            []
          );

          const headers = [
            "Student ID",
            "Student Name",
            "Year Level",
            ...assessmentColumns.map((column) => column.label),
            "Average",
            "Status",
          ];

          csvLines.push(headers);

          for (const student of section.students || []) {
            const studentGrades = gradesByStudent[String(student.id)] || {};
            const scores = assessmentColumns
              .map((column) => studentGrades[column.key])
              .filter((score) => score !== null && score !== undefined && score !== "");

            const average = scores.length
              ? (scores.reduce((sum, score) => sum + Number(score), 0) / scores.length).toFixed(2)
              : "";

            csvLines.push([
              student.studentId,
              student.name,
              student.yearLevel || "",
              ...assessmentColumns.map((column) => studentGrades[column.key] ?? ""),
              average,
              scores.length > 0 ? "Assessed" : "Not Yet Assessed",
            ]);
          }

          csvLines.push([]);
        }
      }

      const csv = csvLines
        .map((line) => line.map(csvEscape).join(","))
        .join("\r\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedCourseCode}_assessment_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${exportContext.summaryText} for ${selectedCourseCode}.`,
      });
    } catch (err) {
      console.error("Error exporting:", err);
      toast({
        title: "Export Failed",
        description: err.response?.data?.detail || err.message || "Failed to export course assessment data.",
        variant: "destructive",
      });
    }
  };

  // ── Loading state ────────────────────────────────────
  if (!isLoading && studentOutcomes.length === 0) {
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

            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <button
                  onClick={handleExport}
                  disabled={!selectedCourseCode}
                  className="flex items-center gap-2 bg-transparent text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors border border-[#A5A8AB] enabled:hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Export Course CSV</span>
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-[#F3F4F6]">
                  {exportContext.summaryText}
                </p>
                {!selectedCourseCode && (
                  <p className="text-xs text-[#A5A8AB]">
                    Select a course to enable export, preview row counts, and generate a course CSV.
                  </p>
                )}
              </div>
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
                      onClick={handleExport}
                      disabled={!selectedCourseCode}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#3A3A3A] text-[#FFC20E] px-2 py-1 rounded text-[10px] font-bold hover:bg-[#4A4A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-3 h-3" />
                      <span>EXPORT</span>
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
                {(selectedSOIds.length > 0 || selectedCourseCode || selectedSectionName || selectedSemester || selectedFaculty) && (
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

                {/* Semester filter */}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#6B6B6B]" />
                  <span className="text-sm font-medium text-[#6B6B6B]">Semester:</span>
                  <div className="flex items-center gap-2">
                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                      <SelectTrigger className="w-[180px] border-[#A5A8AB]">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesterOptions.map(semester => (
                          <SelectItem key={semester} value={semester}>
                            {semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSemester && (
                      <button
                        onClick={() => setSelectedSemester("")}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Clear semester filter"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Faculty filter */}
                <div className="flex items-center gap-3">
                  <UsersRound className="w-5 h-5 text-[#6B6B6B]" />
                  <span className="text-sm font-medium text-[#6B6B6B]">Faculty:</span>
                  <div className="flex items-center gap-2">
                    <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                      <SelectTrigger className="w-[220px] border-[#A5A8AB]">
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {facultyOptions.map(faculty => (
                          <SelectItem key={faculty} value={faculty}>
                            {faculty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedFaculty && (
                      <button
                        onClick={() => setSelectedFaculty("")}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Clear faculty filter"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

              </div>

              <div className="mt-5 pt-5 border-t border-[#8A817C]/20">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-[#6B6B6B]" />
                  <span className="text-sm font-medium text-[#6B6B6B]">Active filters</span>
                </div>
                {activeFilterChips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeFilterChips.map((chip) => (
                      <button
                        key={chip.key}
                        onClick={chip.onRemove}
                        className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#231F20] hover:border-[#FFC20E] hover:bg-[#FFF8DB] transition-colors"
                      >
                        <span>{chip.label}</span>
                        <X className="w-3.5 h-3.5 text-[#6B6B6B]" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6B6B6B]">
                    No active filters. Your current selection is shareable through the page URL once you apply filters.
                  </p>
                )}
              </div>
            </div>

            {/* Courses Grid */}
            <div className="glass-card p-6">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#231F20] text-lg flex items-center gap-3">
                    <span>Courses</span>
                    <span className="text-sm font-normal text-[#6B6B6B]">({coursesForGrid.length} total)</span>
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

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6B6B]">
                  <span className="font-medium text-[#231F20]">Status legend:</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-100 px-2.5 py-1 text-green-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Assessed
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300 bg-yellow-100 px-2.5 py-1 text-yellow-700">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Incomplete
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-gray-700">
                    <Clock3 className="w-3.5 h-3.5" />
                    Not Yet Assessed
                  </span>
                </div>
              </div>
              <SectionsGrid
                sections={coursesForGrid}
                isLoading={isLoading || isStatusLoading}
                selectedSectionId={activeSection?.courseCode}
                studentOutcomes={studentOutcomes}
                selectedSOIds={selectedSOIds}
                onSelectSection={handleSelectSectionFromGrid}
                viewMode={sectionsViewMode}
                courseMappings={courseMappings}
                getSOIcon={getSOIcon}
              />
            </div>
            {so?.performanceIndicators?.length > 0 && (
              <div className="glass-card p-4 sm:p-6 space-y-5">
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
              </div>
            )}
          </div>
        </div>

        {/* Course Sections Modal */}
        <CourseSectionsModal
          isOpen={!!selectedCourseForModal}
          selectedCourse={selectedCourseForModal}
          facultyData={facultyData}
          selectedSOId={selectedCourseForModal ? getRelevantSOIdForCourse(selectedCourseForModal.courseCode) : null}
          sectionStatusMap={sectionAssessmentStatus}
          sectionLastAssessedMap={sectionLastAssessed}
          onClose={() => setSelectedCourseForModal(null)}
          onSelectSection={(section) => {
            if (!section.students || section.students.length === 0) {
              toast({
                title: "Section has no students",
                description: "Add students to this section in the Classes page before assessing it.",
                variant: "destructive",
              });
              return;
            }
            setSelectedCourseCode(section.courseCode);
            setSelectedSectionName(section.name);
            setSelectedSemester(section.semester || "");
            setSelectedFaculty(section.facultyName || "No faculty assigned");
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
          onCourseFiltersChange={(courseCode, sectionName) => {
            setSelectedCourseCode(courseCode);
            setSelectedSectionName(sectionName);
          }}
          onSaveSuccess={triggerStatusRefresh}
        />
      </main>

      <Footer />
    </div>
  );
}

