export const generateId = () => crypto.randomUUID();

export const initialStudentOutcomes = [
  {
    id: generateId(),
    number: 1,
    title: "TIP SO 1",
    description: "Identify, formulate, and solve complex engineering problems by applying principles of engineering, science, and mathematics.",
    indicators: [
      {
        id: generateId(),
        description: "Ability to identify complex engineering problems by applying knowledge and principles of engineering, science, and mathematics.",
        criteria: [{ id: generateId(), name: "Comprehension on complex engineering activities" }],
      },
    ],
  },
  {
    id: generateId(),
    number: 2,
    title: "TIP SO 2",
    description: "Apply engineering design to produce solutions that meet specified needs with consideration of public health, safety, and welfare, as well as global, cultural, social, environmental, and economic factors.",
    indicators: [],
  },
  {
    id: generateId(),
    number: 3,
    title: "TIP SO 3",
    description: "Communicate effectively on complex engineering activities with various communities including engineering experts and society at large using appropriate levels of discourse.",
    indicators: [
      {
        id: generateId(),
        description: "Ability to communicate effectively and inclusively on complex engineering activities with a range of audiences by comprehending information considering cultural, language, and learning differences.",
        criteria: [{ id: generateId(), name: "Comprehension on complex engineering activities" }],
      },
      {
        id: generateId(),
        description: "Ability to communicate effectively and inclusively on complex engineering activities with a range of audiences by writing in a variety of ways considering cultural, language, and learning differences.",
        criteria: [
          { id: generateId(), name: "Problem Statement or Purpose" },
          { id: generateId(), name: "Expression of Ideas" },
          { id: generateId(), name: "Illustrations to Support the Core Messages" },
          { id: generateId(), name: "Conclusion and Summary" },
          { id: generateId(), name: "List of References" },
        ],
      },
      {
        id: generateId(),
        description: "Ability to communicate effectively and inclusively on complex engineering activities with a range of audiences by presenting in a variety of ways considering cultural, language, and learning differences.",
        criteria: [
          { id: generateId(), name: "Confidence in Presenting the Topic" },
          { id: generateId(), name: "Coherence and Consistency" },
          { id: generateId(), name: "Energy and Enthusiasm" },
        ],
      },
    ],
  },
  {
    id: generateId(),
    number: 4,
    title: "TIP SO 4",
    description: "Recognize ethical and professional responsibilities in engineering situations and make informed judgments, which must consider the impact of engineering solutions in global, economic, environmental, and societal contexts.",
    indicators: [],
  },
  {
    id: generateId(),
    number: 5,
    title: "TIP SO 5",
    description: "Function effectively on a team whose members together provide leadership, create a collaborative and inclusive environment, establish goals, plan tasks, and meet objectives.",
    indicators: [],
  },
  {
    id: generateId(),
    number: 6,
    title: "TIP SO 6",
    description: "Develop and conduct appropriate experimentation, analyze and interpret data, and use engineering judgment to draw conclusions.",
    indicators: [],
  },
];
