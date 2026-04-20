import { apiClient } from "./apiClient";

function normalizeCourse(course) {
  return {
    id: course.id,
    course: course.course ?? null,
    code: course.code || course.course_code || "No Code",
    name: course.name || course.course_name || "Untitled Course",
    curriculum:
      course.curriculum_year || course.curriculum || course.curriculumYear || "Not set",
    semester: course.semester || "Not set",
    academicYear: course.academic_year || course.academicYear || "Not set",
    mappedSOs: (course.mappedSOs || course.mapped_sos || []).map((value) => String(value)),
    credits: course.credits || 0,
    yearLevel: course.year_level || course.yearLevel || "Not set",
  };
}

function normalizeSection(section) {
  return {
    id: section.id,
    courseId: section.course_id || section.courseId || null,
    courseCode: section.course_code || section.courseCode || "No Course Code",
    courseName: section.course_name || section.courseName || "Untitled Course",
    name: section.name || section.sectionName || "Unnamed Section",
    facultyId: section.faculty_id || section.facultyId || null,
    semester: section.semester || "Not set",
    academicYear: section.academic_year || section.academicYear || section.schoolYear || "Not set",
    isActive: typeof section.is_active === "boolean" ? section.is_active : section.isActive !== false,
    studentCount:
      section.student_count ??
      section.studentCount ??
      (Array.isArray(section.students) ? section.students.length : 0),
    students: Array.isArray(section.students) ? section.students : [],
  };
}

function normalizeFacultyMember(faculty) {
  return {
    id: faculty.id,
    name:
      faculty.name ||
      [faculty.first_name, faculty.last_name].filter(Boolean).join(" ").trim() ||
      faculty.email ||
      "Faculty member",
    email: faculty.email || "",
    courses: Array.isArray(faculty.courses) ? faculty.courses : [],
  };
}

export async function fetchProgramChairDashboardData() {
  const [studentOutcomesRes, coursesRes, sectionsRes] = await Promise.all([
    apiClient.get("/student-outcomes/"),
    apiClient.get("/course-so-mappings/"),
    apiClient.get("/sections/load_all/"),
  ]);

  const studentOutcomes = Array.isArray(studentOutcomesRes.data)
    ? studentOutcomesRes.data
    : studentOutcomesRes.data.results || [];
  const courses = (Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.results || []).map(
    normalizeCourse
  );
  const sectionsPayload = sectionsRes.data || {};
  const sections = (Array.isArray(sectionsPayload.sections) ? sectionsPayload.sections : []).map(
    normalizeSection
  );

  const totalStudents = sections.reduce((sum, section) => sum + (section.studentCount || 0), 0);
  const activeSections = sections.filter((section) => section.isActive).length;

  return {
    stats: [
      {
        label: "Student Outcomes",
        value: String(studentOutcomes.length),
        sublabel: "Active outcomes ready for assessment",
        accent: "#0f766e",
      },
      {
        label: "Courses Mapped",
        value: String(courses.length),
        sublabel: "Courses currently tied to outcomes",
        accent: "#f59e0b",
      },
      {
        label: "Students",
        value: String(totalStudents),
        sublabel: "Students across all loaded sections",
        accent: "#2563eb",
      },
      {
        label: "Active Sections",
        value: String(activeSections),
        sublabel: "Sections currently open this term",
        accent: "#dc2626",
      },
    ],
    topCourses: courses.slice(0, 5),
    recentSections: sections.slice(0, 5),
  };
}

export async function fetchFacultyDashboardData() {
  const sectionsRes = await apiClient.get("/sections/");
  const sections = (Array.isArray(sectionsRes.data) ? sectionsRes.data : []).map(normalizeSection);

  const totalStudents = sections.reduce((sum, section) => sum + (section.studentCount || 0), 0);
  const activeSections = sections.filter((section) => section.isActive).length;
  const completionBase = sections.length ? Math.round((activeSections / sections.length) * 100) : 0;

  return {
    stats: [
      {
        label: "My Sections",
        value: String(sections.length),
        sublabel: "Sections assigned to your account",
        accent: "#0f766e",
      },
      {
        label: "Students",
        value: String(totalStudents),
        sublabel: "Learners across your current sections",
        accent: "#2563eb",
      },
      {
        label: "Active Classes",
        value: String(activeSections),
        sublabel: "Classes you can work on right now",
        accent: "#f59e0b",
      },
      {
        label: "Coverage",
        value: `${completionBase}%`,
        sublabel: "Quick health snapshot from class status",
        accent: "#7c3aed",
      },
    ],
    sections: sections.slice(0, 5),
  };
}

export async function fetchProgramChairCourses() {
  const response = await apiClient.get("/course-so-mappings/");
  const data = Array.isArray(response.data) ? response.data : response.data.results || [];
  return data.map(normalizeCourse);
}

export async function fetchProgramChairClasses() {
  const response = await apiClient.get("/sections/load_all/");
  const payload = response.data || {};

  return {
    sections: (Array.isArray(payload.sections) ? payload.sections : []).map(normalizeSection),
    faculty: (Array.isArray(payload.faculty) ? payload.faculty : []).map(normalizeFacultyMember),
  };
}

export async function fetchFacultyClasses() {
  const response = await apiClient.get("/sections/");
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map(normalizeSection);
}

export async function fetchSectionDetails(sectionId) {
  const response = await apiClient.get(`/sections/${sectionId}/`);
  const data = response.data || {};

  return {
    ...normalizeSection(data),
    students: Array.isArray(data.students)
      ? data.students.map((student) => ({
          id: student.id,
          studentId: student.student_id || student.studentId || student.id,
          name:
            [student.first_name, student.last_name].filter(Boolean).join(" ").trim() ||
            student.name ||
            "Unnamed student",
          program: student.program || "",
          yearLevel: student.year_level || student.yearLevel || "",
        }))
      : [],
  };
}
