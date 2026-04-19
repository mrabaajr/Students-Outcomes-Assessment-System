import { apiClient } from "./apiClient";

function normalizeOutcome(so) {
  return {
    id: so.id,
    number: so.number,
    code: `SO ${so.number}`,
    title: so.title,
    description: so.description,
    performanceIndicators: (so.performance_indicators || so.performanceIndicators || []).map((pi) => ({
      id: pi.id,
      number: pi.number,
      name: pi.description || pi.name || "",
      performanceCriteria: (pi.criteria || pi.performanceCriteria || pi.performance_criteria || []).map((pc) => ({
        id: pc.id,
        name: pc.name || "",
        order: pc.order ?? 0,
      })),
    })),
  };
}

function getFacultyForSection(section, facultyData) {
  const match = (facultyData || []).find((faculty) =>
    (faculty.courses || []).some(
      (course) => course.code === section.courseCode && (course.sections || []).includes(section.name)
    )
  );
  return match?.name || "No faculty assigned";
}

function normalizeSection(section, facultyData) {
  return {
    id: section.id,
    name: section.name,
    courseCode: section.courseCode || section.course_code,
    courseName: section.courseName || section.course_name,
    semester: section.semester || "",
    schoolYear: section.schoolYear || section.academic_year || "",
    facultyName: section.facultyName || getFacultyForSection(section, facultyData),
    students: (section.students || []).map((student) => ({
      id: student.id,
      studentId: student.studentId || student.student_id,
      name:
        student.name ||
        [student.first_name, student.last_name].filter(Boolean).join(" ").trim(),
      yearLevel: student.yearLevel || student.year_level || "",
      program: student.program || "",
    })),
  };
}

export async function fetchAssessmentScreenData() {
  const [soRes, sectionsRes, mappingRes] = await Promise.all([
    apiClient.get("/student-outcomes/"),
    apiClient.get("/sections/load_all/"),
    apiClient.get("/course-so-mappings/"),
  ]);

  const studentOutcomes = (Array.isArray(soRes.data) ? soRes.data : soRes.data.results || []).map(
    normalizeOutcome
  );
  const faculty = sectionsRes.data?.faculty || [];
  const sections = (sectionsRes.data?.sections || [])
    .filter((section) => section.isActive !== false && section.is_active !== false)
    .map((section) => normalizeSection(section, faculty));

  const courseMappings = {};
  const courses = Array.isArray(mappingRes.data) ? mappingRes.data : mappingRes.data.results || [];

  courses.forEach((course) => {
    const soList =
      course.mappedSOs ||
      course.mapped_sos ||
      course.mapped_sos_details?.map((item) => item.id) ||
      [];
    const soIds = (Array.isArray(soList) ? soList : [])
      .map((item) => (typeof item === "object" ? item.id : parseInt(item, 10)))
      .filter((item) => Number.isInteger(item));

    if (course.code && soIds.length > 0) {
      const existingIds = courseMappings[course.code] || [];
      courseMappings[course.code] = [...new Set([...existingIds, ...soIds])];
    }
  });

  return {
    studentOutcomes,
    sections,
    faculty,
    courseMappings,
  };
}

export async function fetchFacultyAssessmentScreenData() {
  const [soRes, sectionsRes, mappingRes] = await Promise.all([
    apiClient.get("/student-outcomes/"),
    apiClient.get("/sections/"),
    apiClient.get("/course-so-mappings/"),
  ]);

  const studentOutcomes = (Array.isArray(soRes.data) ? soRes.data : soRes.data.results || []).map(
    normalizeOutcome
  );

  const sections = (Array.isArray(sectionsRes.data) ? sectionsRes.data : [])
    .filter((section) => section.is_active !== false)
    .map((section) => ({
      id: section.id,
      name: section.name || "Unnamed Section",
      courseCode: section.course_code || "No Course Code",
      courseName: section.course_name || "Untitled Course",
      semester: section.semester || "",
      schoolYear: section.academic_year || "",
      facultyName:
        section.faculty?.name ||
        [section.faculty?.first_name, section.faculty?.last_name].filter(Boolean).join(" ").trim() ||
        section.faculty?.email ||
        "Assigned Faculty",
      studentCount:
        section.student_count ??
        section.studentCount ??
        (Array.isArray(section.students) ? section.students.length : 0),
      isActive: section.is_active !== false,
    }));

  const courseMappings = {};
  const courses = Array.isArray(mappingRes.data) ? mappingRes.data : mappingRes.data.results || [];

  courses.forEach((course) => {
    const soList =
      course.mappedSOs ||
      course.mapped_sos ||
      course.mapped_sos_details?.map((item) => item.id) ||
      [];
    const soIds = (Array.isArray(soList) ? soList : [])
      .map((item) => (typeof item === "object" ? item.id : parseInt(item, 10)))
      .filter((item) => Number.isInteger(item));

    if (course.code && soIds.length > 0) {
      const existingIds = courseMappings[course.code] || [];
      courseMappings[course.code] = [...new Set([...existingIds, ...soIds])];
    }
  });

  return {
    studentOutcomes,
    sections,
    courseMappings,
  };
}

export async function fetchAssessmentSummaries(requests) {
  if (!requests.length) return [];
  const response = await apiClient.post("/assessments/summary/", { requests });
  return response.data?.summaries || [];
}

export async function loadAssessmentGrades(sectionId, soId, schoolYear) {
  const response = await apiClient.get("/assessments/load_grades/", {
    params: {
      section_id: sectionId,
      so_id: soId,
      school_year: schoolYear,
    },
  });

  return response.data?.grades || {};
}

export async function saveAssessmentGrades({ sectionId, soId, schoolYear, grades }) {
  const response = await apiClient.post("/assessments/save_grades/", {
    section_id: sectionId,
    so_id: soId,
    school_year: schoolYear,
    grades,
  });

  return response.data;
}
