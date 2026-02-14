// Student Outcomes data and related utilities

export const studentOutcomes = [
  {
    id: 1,
    code: "SO1",
    name: "Engineering Knowledge",
    description: "Apply knowledge of mathematics, natural science, computing and engineering",
    performanceIndicators: [
      {
        id: "PI1.1",
        description: "Apply mathematics to solve engineering problems",
        targetLevel: 3,
        weight: 0.3,
      },
      {
        id: "PI1.2",
        description: "Apply natural science principles to engineering solutions",
        targetLevel: 3,
        weight: 0.3,
      },
      {
        id: "PI1.3",
        description: "Apply computing fundamentals to solve problems",
        targetLevel: 3,
        weight: 0.4,
      },
    ],
  },
  {
    id: 2,
    code: "SO2",
    name: "Problem Analysis",
    description: "Identify, formulate, research literature and analyze complex engineering problems",
    performanceIndicators: [
      {
        id: "PI2.1",
        description: "Identify and formulate complex engineering problems",
        targetLevel: 3,
        weight: 0.4,
      },
      {
        id: "PI2.2",
        description: "Research and analyze literature relevant to the problem",
        targetLevel: 3,
        weight: 0.3,
      },
      {
        id: "PI2.3",
        description: "Analyze problems using appropriate methodologies",
        targetLevel: 3,
        weight: 0.3,
      },
    ],
  },
  {
    id: 3,
    code: "SO3",
    name: "Design/Development of Solutions",
    description: "Design solutions for complex engineering problems and design system components",
    performanceIndicators: [
      {
        id: "PI3.1",
        description: "Design solutions that meet specified needs",
        targetLevel: 3,
        weight: 0.4,
      },
      {
        id: "PI3.2",
        description: "Consider public health, safety, and welfare in design",
        targetLevel: 3,
        weight: 0.3,
      },
      {
        id: "PI3.3",
        description: "Design system components with appropriate constraints",
        targetLevel: 3,
        weight: 0.3,
      },
    ],
  },
  {
    id: 4,
    code: "SO4",
    name: "Investigation",
    description: "Conduct investigations of complex problems using research-based knowledge",
    performanceIndicators: [
      {
        id: "PI4.1",
        description: "Plan and conduct investigations systematically",
        targetLevel: 3,
        weight: 0.4,
      },
      {
        id: "PI4.2",
        description: "Apply research-based knowledge and methods",
        targetLevel: 3,
        weight: 0.3,
      },
      {
        id: "PI4.3",
        description: "Analyze and interpret investigation results",
        targetLevel: 3,
        weight: 0.3,
      },
    ],
  },
  {
    id: 5,
    code: "SO5",
    name: "Modern Tool Usage",
    description: "Create, select, and apply appropriate techniques, resources, and modern engineering tools",
    performanceIndicators: [
      {
        id: "PI5.1",
        description: "Select appropriate modern engineering tools",
        targetLevel: 3,
        weight: 0.3,
      },
      {
        id: "PI5.2",
        description: "Apply tools effectively to engineering activities",
        targetLevel: 3,
        weight: 0.4,
      },
      {
        id: "PI5.3",
        description: "Understand limitations of modern tools",
        targetLevel: 3,
        weight: 0.3,
      },
    ],
  },
  {
    id: 6,
    code: "SO6",
    name: "The Engineer and Society",
    description: "Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal and cultural issues",
    performanceIndicators: [
      {
        id: "PI6.1",
        description: "Assess societal and health impacts of engineering solutions",
        targetLevel: 3,
        weight: 0.35,
      },
      {
        id: "PI6.2",
        description: "Consider safety and legal issues in engineering practice",
        targetLevel: 3,
        weight: 0.35,
      },
      {
        id: "PI6.3",
        description: "Apply cultural awareness in engineering contexts",
        targetLevel: 3,
        weight: 0.3,
      },
    ],
  },
  {
    id: 7,
    code: "SO7",
    name: "Environment and Sustainability",
    description: "Understand the impact of professional engineering solutions in societal and environmental contexts",
    performanceIndicators: [
      {
        id: "PI7.1",
        description: "Assess environmental impact of engineering solutions",
        targetLevel: 3,
        weight: 0.4,
      },
      {
        id: "PI7.2",
        description: "Apply sustainability principles in engineering design",
        targetLevel: 3,
        weight: 0.35,
      },
      {
        id: "PI7.3",
        description: "Understand global and societal context of solutions",
        targetLevel: 3,
        weight: 0.25,
      },
    ],
  },
];

export const courses = [
  { id: 1, code: "CS101", name: "Introduction to Programming" },
  { id: 2, code: "CS201", name: "Data Structures" },
  { id: 3, code: "CS301", name: "Database Systems" },
  { id: 4, code: "CS401", name: "Software Engineering" },
  { id: 5, code: "IT202", name: "Web Development" },
];

export const sections = [
  { id: 1, name: "Section A", courseId: 1 },
  { id: 2, name: "Section B", courseId: 1 },
  { id: 3, name: "Section A", courseId: 2 },
  { id: 4, name: "Section A", courseId: 3 },
];

// Generate sample students for testing
export const generateSampleStudents = (soId) => {
  const so = studentOutcomes.find(s => s.id === soId);
  if (!so) return [];

  const firstNames = ["John", "Emma", "Michael", "Sophia", "William", "Olivia", "James", "Ava", "Benjamin", "Isabella"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
  
  const students = [];
  for (let i = 0; i < 30; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const studentId = `2024${String(1000 + i).padStart(4, '0')}`;
    
    const grades = {};
    so.performanceIndicators.forEach(pi => {
      // Generate random grades (0-4) or null for some students
      grades[pi.id] = Math.random() > 0.2 ? Math.floor(Math.random() * 5) : null;
    });
    
    students.push({
      id: i + 1,
      studentId,
      name: `${firstName} ${lastName}`,
      grades,
    });
  }
  
  return students;
};
