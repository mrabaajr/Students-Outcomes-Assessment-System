// Mock data for courses and related entities

export const studentOutcomes = [
  { id: 'SO1', code: 'SO1', name: 'Engineering Knowledge', description: 'Apply knowledge of mathematics, natural science, computing and engineering' },
  { id: 'SO2', code: 'SO2', name: 'Problem Analysis', description: 'Identify, formulate, research literature and analyze complex engineering problems' },
  { id: 'SO3', code: 'SO3', name: 'Design/Development of Solutions', description: 'Design solutions for complex engineering problems and design system components' },
  { id: 'SO4', code: 'SO4', name: 'Investigation', description: 'Conduct investigations of complex problems using research-based knowledge' },
  { id: 'SO5', code: 'SO5', name: 'Modern Tool Usage', description: 'Create, select, and apply appropriate techniques, resources, and modern engineering tools' },
  { id: 'SO6', code: 'SO6', name: 'The Engineer and Society', description: 'Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal and cultural issues' },
  { id: 'SO7', code: 'SO7', name: 'Environment and Sustainability', description: 'Understand the impact of professional engineering solutions in societal and environmental contexts' },
];

export const departments = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

export const academicYears = [
  '2023-2024',
  '2024-2025',
  '2025-2026',
  '2026-2027',
];

export const semesters = [
  'Fall',
  'Spring',
  'Summer',
];

export const initialCourses = [
  {
    id: 1,
    code: 'CS101',
    name: 'Introduction to Programming',
    department: 'Computer Science',
    credits: 3,
    semester: 'Fall',
    academicYear: '2024-2025',
    instructor: 'Dr. Smith',
    enrolledStudents: 45,
    mappedSOs: ['SO1', 'SO2', 'SO5'],
    description: 'Introduction to programming concepts using Python',
  },
  {
    id: 2,
    code: 'CS201',
    name: 'Data Structures',
    department: 'Computer Science',
    credits: 4,
    semester: 'Spring',
    academicYear: '2024-2025',
    instructor: 'Dr. Johnson',
    enrolledStudents: 38,
    mappedSOs: ['SO1', 'SO2', 'SO3', 'SO5'],
    description: 'Study of fundamental data structures and algorithms',
  },
  {
    id: 3,
    code: 'CS301',
    name: 'Database Systems',
    department: 'Computer Science',
    credits: 3,
    semester: 'Fall',
    academicYear: '2024-2025',
    instructor: 'Prof. Williams',
    enrolledStudents: 32,
    mappedSOs: ['SO1', 'SO3', 'SO5'],
    description: 'Design and implementation of database systems',
  },
  {
    id: 4,
    code: 'IT202',
    name: 'Web Development',
    department: 'Information Technology',
    credits: 3,
    semester: 'Spring',
    academicYear: '2024-2025',
    instructor: 'Dr. Brown',
    enrolledStudents: 42,
    mappedSOs: ['SO1', 'SO3', 'SO5', 'SO6'],
    description: 'Modern web development technologies and frameworks',
  },
  {
    id: 5,
    code: 'SE305',
    name: 'Software Engineering',
    department: 'Software Engineering',
    credits: 4,
    semester: 'Fall',
    academicYear: '2024-2025',
    instructor: 'Dr. Davis',
    enrolledStudents: 35,
    mappedSOs: ['SO2', 'SO3', 'SO4', 'SO6', 'SO7'],
    description: 'Principles and practices of software engineering',
  },
  {
    id: 6,
    code: 'CS401',
    name: 'Artificial Intelligence',
    department: 'Computer Science',
    credits: 3,
    semester: 'Spring',
    academicYear: '2024-2025',
    instructor: 'Prof. Martinez',
    enrolledStudents: 28,
    mappedSOs: ['SO1', 'SO2', 'SO4', 'SO5'],
    description: 'Introduction to AI concepts and machine learning',
  },
];
