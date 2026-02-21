import { useState, useCallback } from 'react';

export const studentOutcomes = [
  {
    id: 1,
    code: "SO 1",
    title: "Engineering Problem Solving",
    description: "Identify, formulate, and solve complex engineering problems by applying knowledge and principles of engineering, science, and mathematics",
    performanceIndicators: [
      { id: "p1", name: "Identify complex engineering problems by applying knowledge and principles of engineering, science, and mathematics", shortName: "Problem Identification" },
      { id: "p2", name: "Formulate engineering solutions in solving complex engineering problems by applying knowledge and principles of engineering, science, and mathematics", shortName: "Solution Formulation" },
      { id: "p3.1", name: "Approaches in solving complex engineering problems", shortName: "Problem Solving Approaches" },
      { id: "p3.2", name: "Application of appropriate mathematical, science, and engineering principles in solving complex engineering problems", shortName: "Principles Application" },
    ],
  },
  {
    id: 2,
    code: "SO 2",
    title: "Engineering Design",
    description: "Apply engineering design to produce solutions that meet specified needs with consideration of public health, safety, welfare, global, cultural, social, environmental, and economic factors",
    performanceIndicators: [
      { id: "p1", name: "Identify a problem and formulate engineering solutions and/or satisfy a need", shortName: "Problem & Solution" },
      { id: "p2", name: "Use trade-offs to determine final design choice", shortName: "Design Trade-offs" },
      { id: "p3", name: "Solve complex engineering problems by applying knowledge and principles of engineering, science, and mathematics", shortName: "Complex Problem Solving" },
      { id: "p4", name: "Apply appropriate standards and codes in the design process", shortName: "Standards & Codes" },
    ],
  },
  {
    id: 3,
    code: "SO 3",
    title: "Effective Communication",
    description: "Communicate effectively on complex engineering activities with various communities including engineering experts and society at large using appropriate levels of discourse",
    performanceIndicators: [
      { id: "p1.1", name: "Comprehension on complex engineering activities", shortName: "Comprehension" },
      { id: "p1.2", name: "Problem Statement or purpose", shortName: "Problem Statement" },
      { id: "p1.3", name: "Expression of ideas", shortName: "Expression of Ideas" },
      { id: "p2.1", name: "Illustrations to support the core messages", shortName: "Illustrations" },
      { id: "p2.2", name: "Conclusion and summary", shortName: "Conclusion" },
      { id: "p2.3", name: "List of references", shortName: "References" },
      { id: "p3.1", name: "Confidence in presenting the topic", shortName: "Confidence" },
      { id: "p3.2", name: "Coherence and consistency", shortName: "Coherence" },
      { id: "p3.3", name: "Energy and enthusiasm", shortName: "Enthusiasm" },
    ],
  },
  {
    id: 4,
    code: "SO 4",
    title: "Professional & Ethical Responsibility",
    description: "Recognize ethical and professional responsibilities in engineering situations and make informed judgments, which must consider the impact of engineering solutions in global, economic, environmental, and societal contexts",
    performanceIndicators: [
      { id: "p1", name: "Recognize ethical and professional responsibilities in engineering situations", shortName: "Ethical Recognition" },
      { id: "p2", name: "Make informed judgments considering global impacts", shortName: "Informed Judgments" },
      { id: "p3", name: "Consider environmental and societal contexts", shortName: "Context Consideration" },
    ],
  },
  {
    id: 5,
    code: "SO 5",
    title: "Teamwork & Leadership",
    description: "Function effectively as an individual member in diverse and inclusive teams and/or leader who provide leadership, create a collaborative and inclusive environment, establish goals, plan tasks, and meet objectives in multi-disciplinary and long-distance settings by applying knowledge of engineering and management principles",
    performanceIndicators: [
      { id: "p1", name: "Ability to function effectively as an individual member in diverse and inclusive teams and/or leader who provide leadership", shortName: "Team Function" },
      { id: "p2", name: "Ability to create a collaborative and inclusive environment", shortName: "Collaboration" },
      { id: "p3", name: "Ability to establish goals, plan tasks, and meet objectives in multi-disciplinary, multicultural, and long-distance setting by applying knowledge of engineering and management principles", shortName: "Goal Planning" },
    ],
  },
  {
    id: 6,
    code: "SO 6",
    title: "Experimentation & Analysis",
    description: "Develop and conduct appropriate experimentation, analyze and interpret data, and use engineering judgment to draw conclusions",
    performanceIndicators: [
      { id: "p1", name: "Develop appropriate experimentation", shortName: "Experimentation Design" },
      { id: "p2", name: "Conduct appropriate experimentation", shortName: "Experimentation Conduct" },
      { id: "p3", name: "Ability to analyze and interpret data", shortName: "Data Analysis" },
      { id: "p4", name: "Use of engineering judgment to draw conclusions", shortName: "Engineering Judgment" },
    ],
  },
];

export const generateSampleStudents = (soId, count = 29) => {
  const so = studentOutcomes.find(s => s.id === soId);
  if (!so) return [];

  return Array.from({ length: count }, (_, index) => {
    const grades = {};
    so.performanceIndicators.forEach(pi => {
      // Generate random grades between 4-6 for demo, some null
      grades[pi.id] = Math.random() > 0.1 ? Math.floor(Math.random() * 3) + 4 : null;
    });
    return {
      id: index + 1,
      name: `Student ${index + 1}`,
      grades,
    };
  });
};

export const courses = [
  "CPE Design 1",
  "CPE Design 2",
  "Methods of Research",
  "Logic Circuits and Design",
];

export const sections = ["CPE32S1", "CPE32S2", "CPE32S3", "CPE42S1", "CPE42S2"];

// Hook for managing student outcomes
export const useStudentOutcomes = () => {
  const [outcomes, setOutcomes] = useState(studentOutcomes);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveToBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setHasUnsavedChanges(false);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateOutcome = useCallback((id, updates) => {
    setOutcomes(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    setHasUnsavedChanges(true);
  }, []);

  const addOutcome = useCallback(() => {
    const newId = Math.max(...outcomes.map(o => o.id), 0) + 1;
    const newOutcome = {
      id: newId,
      code: `SO ${newId}`,
      title: `New Student Outcome ${newId}`,
      description: "",
      performanceIndicators: [],
    };
    setOutcomes(prev => [...prev, newOutcome]);
    setHasUnsavedChanges(true);
    return newOutcome;
  }, [outcomes]);

  const deleteOutcome = useCallback((id) => {
    setOutcomes(prev => prev.filter(o => o.id !== id));
    setHasUnsavedChanges(true);
  }, []);

  const addPerformanceIndicator = useCallback((outcomeId) => {
    setOutcomes(prev => prev.map(o => {
      if (o.id === outcomeId) {
        const newId = `p${o.performanceIndicators.length + 1}`;
        return {
          ...o,
          performanceIndicators: [
            ...o.performanceIndicators,
            {
              id: newId,
              name: "",
              shortName: "",
            }
          ]
        };
      }
      return o;
    }));
    setHasUnsavedChanges(true);
  }, []);

  const updatePerformanceIndicator = useCallback((outcomeId, piId, updates) => {
    setOutcomes(prev => prev.map(o => {
      if (o.id === outcomeId) {
        return {
          ...o,
          performanceIndicators: o.performanceIndicators.map(pi =>
            pi.id === piId ? { ...pi, ...updates } : pi
          )
        };
      }
      return o;
    }));
    setHasUnsavedChanges(true);
  }, []);

  const deletePerformanceIndicator = useCallback((outcomeId, piId) => {
    setOutcomes(prev => prev.map(o => {
      if (o.id === outcomeId) {
        return {
          ...o,
          performanceIndicators: o.performanceIndicators.filter(pi => pi.id !== piId)
        };
      }
      return o;
    }));
    setHasUnsavedChanges(true);
  }, []);

  return {
    outcomes,
    hasUnsavedChanges,
    isLoading,
    error,
    saveToBackend,
    updateOutcome,
    addOutcome,
    deleteOutcome,
    addPerformanceIndicator,
    updatePerformanceIndicator,
    deletePerformanceIndicator,
  };
};
