// Mock data for Classes page

// Student type
export const mockStudents = [
  {
    id: "s1",
    name: "Maria Santos",
    studentId: "2021-00101",
    course: "BSIT",
    yearLevel: "3rd Year"
  },
  {
    id: "s2",
    name: "Juan Dela Cruz",
    studentId: "2021-00102",
    course: "BSIT",
    yearLevel: "3rd Year"
  },
  {
    id: "s3",
    name: "Ana Reyes",
    studentId: "2021-00103",
    course: "BSCS",
    yearLevel: "2nd Year"
  }
];

// Section type
export const sections = [
  {
    id: "1",
    name: "BSIT 3-1",
    courseCode: "IT301",
    courseName: "Data Structures and Algorithms",
    semester: "1st Semester",
    students: [
      {
        id: "s1",
        name: "Maria Santos",
        studentId: "2021-00101",
        course: "BSIT",
        yearLevel: "3rd Year"
      },
      {
        id: "s2",
        name: "Juan Dela Cruz",
        studentId: "2021-00102",
        course: "BSIT",
        yearLevel: "3rd Year"
      },
      {
        id: "s4",
        name: "Pedro Garcia",
        studentId: "2021-00104",
        course: "BSIT",
        yearLevel: "3rd Year"
      }
    ]
  },
  {
    id: "2",
    name: "BSCS 2-1",
    courseCode: "CS201",
    courseName: "Object-Oriented Programming",
    semester: "2nd Semester",
    students: [
      {
        id: "s3",
        name: "Ana Reyes",
        studentId: "2021-00103",
        course: "BSCS",
        yearLevel: "2nd Year"
      },
      {
        id: "s5",
        name: "Carlos Martinez",
        studentId: "2022-00201",
        course: "BSCS",
        yearLevel: "2nd Year"
      }
    ]
  },
  {
    id: "3",
    name: "BSIT 4-1",
    courseCode: "IT401",
    courseName: "Capstone Project",
    semester: "1st Semester",
    students: [
      {
        id: "s6",
        name: "Lisa Aquino",
        studentId: "2020-00050",
        course: "BSIT",
        yearLevel: "4th Year"
      },
      {
        id: "s7",
        name: "Mark Villanueva",
        studentId: "2020-00051",
        course: "BSIT",
        yearLevel: "4th Year"
      },
      {
        id: "s8",
        name: "Sofia Cruz",
        studentId: "2020-00052",
        course: "BSIT",
        yearLevel: "4th Year"
      }
    ]
  }
];

// Faculty type
export const faculty = [
  {
    id: "f1",
    name: "Dr. Roberto Fernandez",
    department: "Computer Engineering",
    email: "rfernandez@tip.edu.ph",
    courses: [
      {
        code: "IT301",
        name: "Data Structures and Algorithms",
        sections: ["BSIT 3-1", "BSIT 3-2"]
      },
      {
        code: "CS301",
        name: "Database Systems",
        sections: ["BSCS 3-1"]
      }
    ]
  },
  {
    id: "f2",
    name: "Prof. Elena Morales",
    department: "Computer Engineering",
    email: "emorales@tip.edu.ph",
    courses: [
      {
        code: "CS201",
        name: "Object-Oriented Programming",
        sections: ["BSCS 2-1", "BSCS 2-2"]
      }
    ]
  },
  {
    id: "f3",
    name: "Dr. Jose Ramirez",
    department: "Computer Engineering",
    email: "jramirez@tip.edu.ph",
    courses: [
      {
        code: "IT401",
        name: "Capstone Project",
        sections: ["BSIT 4-1"]
      },
      {
        code: "CS402",
        name: "Software Engineering",
        sections: ["BSCS 4-1", "BSCS 4-2"]
      }
    ]
  },
  {
    id: "f4",
    name: "Asst. Prof. Patricia Santos",
    department: "Computer Engineering",
    email: "psantos@tip.edu.ph",
    courses: [
      {
        code: "IT201",
        name: "Web Development",
        sections: ["BSIT 2-1", "BSIT 2-2", "BSIT 2-3"]
      }
    ]
  }
];
