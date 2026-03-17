export const generateId = () => crypto.randomUUID();

const buildCriteria = (criteria = []) =>
  criteria.map((criterion) => ({
    id: generateId(),
    name: criterion,
  }));

const buildIndicator = (description, criteria = []) => ({
  id: generateId(),
  description,
  criteria: buildCriteria(criteria),
});

export const initialStudentOutcomes = [
  {
    id: generateId(),
    number: 1,
    title: "T.I.P. SO 1",
    description:
      "identify, formulate, and solve complex engineering problems by applying knowledge and principles of engineering, science, and mathematics",
    indicators: [
      buildIndicator(
        "identify complex engineering problems by applying knowledge and principles of engineering, science, and mathematics"
      ),
      buildIndicator(
        "formulate engineering solutions in solving complex engineering problems by applying knowledge and principles of engineering, science, and mathematics"
      ),
      buildIndicator(
        "solve complex engineering problems by applying knowledge and principles of engineering, science, and mathematics.",
        [
          "Approaches in solving complex engineering problems.",
          "Application of appropriate mathematical, science, and engineering principles in solving complex engineering problems",
        ]
      ),
    ],
  },
  {
    id: generateId(),
    number: 2,
    title: "T.I.P. SO 2",
    description:
      "apply engineering design to produce solutions that meet specified needs with consideration of public health, safety, welfare, global, cultural, social, environmental, and economic factors.",
    indicators: [
      buildIndicator(
        "Identify a problem and formulate engineering solutions and/or satisfy a need"
      ),
      buildIndicator("Use trade-offs to determine final design choice"),
      buildIndicator(
        "solve complex engineering problems by applying knowledge and principles of engineering, science, and mathematics."
      ),
      buildIndicator("Apply appropriate standards and codes in the design process"),
    ],
  },
  {
    id: generateId(),
    number: 3,
    title: "T.I.P. SO 3",
    description:
      "communicate effectively on complex engineering activities with various communities including engineering experts and society at large using appropriate levels of discourse.",
    indicators: [
      buildIndicator(
        "Ability to communicate effectively and inclusively on complex engineering activities with a range of audiences by being able to comprehend in a variety of ways considering cultural, language, and learning differences",
        ["Comprehension on complex engineering activities"]
      ),
      buildIndicator(
        "Ability to communicate effectively and inclusively on complex engineering activities with a range of audiences by being able to write in a variety of ways considering cultural, language, and learning differences",
        [
          "Problem Statement or purpose",
          "Expression of ideas",
          "Illustrations to support the core messages",
          "Conclusion and summary",
          "List of references",
        ]
      ),
      buildIndicator(
        "Ability to communicate effectively and inclusively on complex engineering activities with a range of audiences by being able to present in a variety of ways considering cultural, language, and learning differences",
        [
          "Confidence in presenting the topic",
          "Coherence and consistency",
          "Energy and enthusiasm",
        ]
      ),
    ],
  },
  {
    id: generateId(),
    number: 4,
    title: "T.I.P. SO 4",
    description:
      "recognize ethical and professional responsibilities in engineering situations and make informed judgments, which must consider the impact of engineering solutions in global, economic, environmental, and societal contexts.",
    indicators: [
      buildIndicator(
        "An ability to apply principles of ethics and commit to professional ethics, technology ethics, data ethics, global responsibilities, and norms of engineering practice; and adhere to relevant national and international laws",
        [
          "Apply principles of ethics and comply with professional Ethics, Technology Ethics and Data Ethics.",
          "Adopt global responsibilities and norms of engineering practice",
          "Adhere to relevant national and international laws",
        ]
      ),
      buildIndicator("An ability to comprehend the need for diversity and inclusion"),
      buildIndicator(
        "An ability to recognize ethical and professional responsibilities in engineering situations and make informed judgments which must consider the sustainability impact of engineering solutions in human, cultural, global, economic, environmental, and societal contexts",
        [
          "ability to recognize ethical and professional responsibilities in engineering situations",
          "ability to make informed judgments which must consider the sustainability impact of engineering solutions in human, cultural, global, economic, environmental, and societal contexts",
        ]
      ),
    ],
  },
  {
    id: generateId(),
    number: 5,
    title: "T.I.P. SO 5",
    description:
      "function effectively as an individual member in diverse and inclusive teams and/or leader who provide leadership, create a collaborative and inclusive environment, establish goals, plan tasks, and meet objectives in multi-disciplinary and long-distance settings by applying knowledge of engineering and management principles",
    indicators: [
      buildIndicator(
        "Ability to function effectively as an individual member in diverse and inclusive teams and/or leader who provide leadership"
      ),
      buildIndicator("Ability to create a collaborative and inclusive environment"),
      buildIndicator(
        "Ability to establish goals, plan tasks, and meet objectives in multi-disciplinary, multicultural, and long-distance setting by applying knowledge of engineering and management principles"
      ),
    ],
  },
  {
    id: generateId(),
    number: 6,
    title: "T.I.P. SO 6",
    description:
      "develop and conduct appropriate experimentation, analyze and interpret data, and use engineering judgment to draw conclusions",
    indicators: [
      buildIndicator("Develop appropriate experimentation"),
      buildIndicator("Conduct appropriate experimentation"),
      buildIndicator("Ability to analyze and interpret data"),
      buildIndicator("Use of engineering judgment to draw conclusions"),
    ],
  },
  {
    id: generateId(),
    number: 7,
    title: "T.I.P. SO 7",
    description:
      "acquire and apply new knowledge as needed, using appropriate learning strategies to engage in independent and life-long learning, creativity and adaptability to new and emerging technologies, and critical thinking in the broadest context of technological change.",
    indicators: [
      buildIndicator("Acquire and apply new knowledge from outside sources"),
      buildIndicator("Learn independently"),
      buildIndicator("Critical thinking in the broadest context of technological change"),
      buildIndicator("Creativity and adaptability to new and emerging technologies"),
    ],
  },
];
