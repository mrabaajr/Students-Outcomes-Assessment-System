import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Helper: Get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Transform backend SO → frontend format
const transformFromBackend = (backendSO) => ({
  id: backendSO.id,
  number: backendSO.number,
  code: `SO ${backendSO.number}`,
  title: backendSO.title,
  description: backendSO.description,
  performanceIndicators: (
    backendSO.performanceIndicators ||
    backendSO.performance_indicators ||
    []
  ).map((pi) => ({
    id: pi.id,
    number: pi.number,
    name: pi.description,
    shortName: pi.description
      ? pi.description.substring(0, 30)
      : '',
    performanceCriteria: (
      pi.performanceCriteria ||
      pi.performance_criteria ||
      []
    ).map((pc) => ({
      id: pc.id,
      level: pc.level || '',
      description: pc.description || '',
    })),
  })),
});

// Transform frontend SO → backend format for bulk save
const transformToBackend = (frontendSO) => ({
  id: typeof frontendSO.id === 'number' ? frontendSO.id : null,
  number:
    frontendSO.number ||
    parseInt(String(frontendSO.code).replace(/\D/g, '')) ||
    1,
  title: frontendSO.title,
  description: frontendSO.description,
  performanceIndicators: (frontendSO.performanceIndicators || []).map(
    (pi, idx) => ({
      id: typeof pi.id === 'number' ? pi.id : null,
      number: pi.number || idx + 1,
      description: pi.name || '',
      performanceCriteria: (pi.performanceCriteria || []).map(
        (pc, pcIdx) => ({
          id: typeof pc.id === 'number' ? pc.id : null,
          level: pc.level || '',
          description: pc.description || '',
        })
      ),
    })
  ),
});
// Hardcoded fallback data (used only when backend is unavailable)
export const studentOutcomes = [
  {
    id: 1,
    number: 1,
    code: "SO 1",
    title: "Engineering Problem Solving",
    description: "Identify, formulate, and solve complex engineering problems by applying knowledge and principles of engineering, science, and mathematics",
    performanceIndicators: [
      { id: "p1", number: 1, name: "Identify complex engineering problems by applying knowledge and principles of engineering, science, and mathematics", shortName: "Problem Identification" },
      { id: "p2", number: 2, name: "Formulate engineering solutions in solving complex engineering problems by applying knowledge and principles of engineering, science, and mathematics", shortName: "Solution Formulation" },
      { id: "p3", number: 3, name: "Approaches in solving complex engineering problems", shortName: "Problem Solving Approaches" },
      { id: "p4", number: 4, name: "Application of appropriate mathematical, science, and engineering principles in solving complex engineering problems", shortName: "Principles Application" },
    ],
  },
  {
    id: 2,
    number: 2,
    code: "SO 2",
    title: "Engineering Design",
    description: "Apply engineering design to produce solutions that meet specified needs with consideration of public health, safety, welfare, global, cultural, social, environmental, and economic factors",
    performanceIndicators: [
      { id: "p1", number: 1, name: "Identify a problem and formulate engineering solutions and/or satisfy a need", shortName: "Problem & Solution" },
      { id: "p2", number: 2, name: "Use trade-offs to determine final design choice", shortName: "Design Trade-offs" },
      { id: "p3", number: 3, name: "Solve complex engineering problems by applying knowledge and principles of engineering, science, and mathematics", shortName: "Complex Problem Solving" },
      { id: "p4", number: 4, name: "Apply appropriate standards and codes in the design process", shortName: "Standards & Codes" },
    ],
  },
  {
    id: 3,
    number: 3,
    code: "SO 3",
    title: "Effective Communication",
    description: "Communicate effectively on complex engineering activities with various communities including engineering experts and society at large using appropriate levels of discourse",
    performanceIndicators: [
      { id: "p1", number: 1, name: "Comprehension on complex engineering activities", shortName: "Comprehension" },
      { id: "p2", number: 2, name: "Problem Statement or purpose", shortName: "Problem Statement" },
      { id: "p3", number: 3, name: "Expression of ideas", shortName: "Expression of Ideas" },
      { id: "p4", number: 4, name: "Illustrations to support the core messages", shortName: "Illustrations" },
      { id: "p5", number: 5, name: "Conclusion and summary", shortName: "Conclusion" },
      { id: "p6", number: 6, name: "List of references", shortName: "References" },
      { id: "p7", number: 7, name: "Confidence in presenting the topic", shortName: "Confidence" },
      { id: "p8", number: 8, name: "Coherence and consistency", shortName: "Coherence" },
      { id: "p9", number: 9, name: "Energy and enthusiasm", shortName: "Enthusiasm" },
    ],
  },
  {
    id: 4,
    number: 4,
    code: "SO 4",
    title: "Professional & Ethical Responsibility",
    description: "Recognize ethical and professional responsibilities in engineering situations and make informed judgments, which must consider the impact of engineering solutions in global, economic, environmental, and societal contexts",
    performanceIndicators: [
      { id: "p1", number: 1, name: "Recognize ethical and professional responsibilities in engineering situations", shortName: "Ethical Recognition" },
      { id: "p2", number: 2, name: "Make informed judgments considering global impacts", shortName: "Informed Judgments" },
      { id: "p3", number: 3, name: "Consider environmental and societal contexts", shortName: "Context Consideration" },
    ],
  },
  {
    id: 5,
    number: 5,
    code: "SO 5",
    title: "Teamwork & Leadership",
    description: "Function effectively as an individual member in diverse and inclusive teams and/or leader who provide leadership, create a collaborative and inclusive environment, establish goals, plan tasks, and meet objectives in multi-disciplinary and long-distance settings by applying knowledge of engineering and management principles",
    performanceIndicators: [
      { id: "p1", number: 1, name: "Ability to function effectively as an individual member in diverse and inclusive teams and/or leader who provide leadership", shortName: "Team Function" },
      { id: "p2", number: 2, name: "Ability to create a collaborative and inclusive environment", shortName: "Collaboration" },
      { id: "p3", number: 3, name: "Ability to establish goals, plan tasks, and meet objectives in multi-disciplinary, multicultural, and long-distance setting by applying knowledge of engineering and management principles", shortName: "Goal Planning" },
    ],
  },
  {
    id: 6,
    number: 6,
    code: "SO 6",
    title: "Experimentation & Analysis",
    description: "Develop and conduct appropriate experimentation, analyze and interpret data, and use engineering judgment to draw conclusions",
    performanceIndicators: [
      { id: "p1", number: 1, name: "Develop appropriate experimentation", shortName: "Experimentation Design" },
      { id: "p2", number: 2, name: "Conduct appropriate experimentation", shortName: "Experimentation Conduct" },
      { id: "p3", number: 3, name: "Ability to analyze and interpret data", shortName: "Data Analysis" },
      { id: "p4", number: 4, name: "Use of engineering judgment to draw conclusions", shortName: "Engineering Judgment" },
    ],
  },
];

export const generateSampleStudents = (soId, count = 29) => {
  const so = studentOutcomes.find(s => s.id === soId);
  if (!so) return [];

  return Array.from({ length: count }, (_, index) => {
    const grades = {};
    so.performanceIndicators.forEach(pi => {
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

// Hook for managing student outcomes — connected to backend
export const useStudentOutcomes = () => {
  const [outcomes, setOutcomes] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch student outcomes from backend on mount
  const fetchOutcomes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/student-outcomes/`, {
        headers: getAuthHeader(),
      });
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      const transformed = data.map(transformFromBackend);
      setOutcomes(transformed.length > 0 ? transformed : studentOutcomes);
    } catch (err) {
      console.error('Error fetching student outcomes:', err);
      setError(err.response?.data?.detail || err.message);
      // Fallback to hardcoded data if backend is unavailable
      setOutcomes(studentOutcomes);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutcomes();
  }, [fetchOutcomes]);

  // Save all outcomes to backend via bulk_save endpoint
  const saveToBackend = useCallback(async () => {
    setError(null);
    try {
      const payload = {
        outcomes: outcomes.map(transformToBackend),
      };
      const response = await axios.post(
        `${API_BASE_URL}/student-outcomes/bulk_save/`,
        payload,
        { headers: getAuthHeader() }
      );
      // Update local state with saved data (now has proper backend IDs)
      const savedOutcomes = (response.data.outcomes || []).map(transformFromBackend);
      if (savedOutcomes.length > 0) {
        setOutcomes(savedOutcomes);
      }
      setHasUnsavedChanges(false);
      return { success: true };
    } catch (err) {
      console.error('Error saving student outcomes:', err);
      const message = err.response?.data?.detail || err.message;
      setError(message);
      return { success: false, message };
    }
  }, [outcomes]);

  const updateOutcome = useCallback((id, updates) => {
    setOutcomes(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    setHasUnsavedChanges(true);
  }, []);

  const addOutcome = useCallback(() => {
    const maxNumber = Math.max(...outcomes.map(o => o.number || 0), 0);
    const newNumber = maxNumber + 1;
    const newOutcome = {
      id: `new_${Date.now()}`,
      number: newNumber,
      code: `SO ${newNumber}`,
      title: `New Student Outcome ${newNumber}`,
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
  setOutcomes(prev =>
    prev.map(o => {
      if (o.id === outcomeId) {
        const maxNum = Math.max(
          ...o.performanceIndicators.map(pi => pi.number || 0),
          0
        );
        const newNumber = maxNum + 1;

        return {
          ...o,
          performanceIndicators: [
            ...o.performanceIndicators,
            {
              id: `new_${Date.now()}_${newNumber}`,
              number: newNumber,
              name: '',
              shortName: '',
              performanceCriteria: [],   // ✅ NEW
            },
          ],
        };
      }
      return o;
    })
  );
  setHasUnsavedChanges(true);
}, []);
  const addPerformanceCriterion = useCallback((outcomeId, piId) => {
  setOutcomes(prev =>
    prev.map(o => {
      if (o.id === outcomeId) {
        return {
          ...o,
          performanceIndicators: o.performanceIndicators.map(pi => {
            if (pi.id === piId) {
              return {
                ...pi,
                performanceCriteria: [
                  ...(pi.performanceCriteria || []),
                  {
                    id: `new_pc_${Date.now()}`,
                    level: '',
                    description: '',
                  },
                ],
              };
            }
            return pi;
          }),
        };
      }
      return o;
    })
  );
  setHasUnsavedChanges(true);
}, []);

  const updatePerformanceCriterion = useCallback(
  (outcomeId, piId, pcId, updates) => {
    setOutcomes(prev =>
      prev.map(o => {
        if (o.id === outcomeId) {
          return {
            ...o,
            performanceIndicators: o.performanceIndicators.map(pi => {
              if (pi.id === piId) {
                return {
                  ...pi,
                  performanceCriteria: pi.performanceCriteria.map(pc =>
                    pc.id === pcId ? { ...pc, ...updates } : pc
                  ),
                };
              }
              return pi;
            }),
          };
        }
        return o;
      })
    );
    setHasUnsavedChanges(true);
  },
  []
);

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

  const deletePerformanceCriterion = useCallback(
  (outcomeId, piId, pcId) => {
    setOutcomes(prev =>
      prev.map(o => {
        if (o.id === outcomeId) {
          return {
            ...o,
            performanceIndicators: o.performanceIndicators.map(pi => {
              if (pi.id === piId) {
                return {
                  ...pi,
                  performanceCriteria: pi.performanceCriteria.filter(
                    pc => pc.id !== pcId
                  ),
                };
              }
              return pi;
            }),
          };
        }
        return o;
      })
    );
    setHasUnsavedChanges(true);
  },
  []
);

  return {
    outcomes,
    hasUnsavedChanges,
    isLoading,
    error,
    fetchOutcomes,
    saveToBackend,
    updateOutcome,
    addOutcome,
    deleteOutcome,
    addPerformanceIndicator,
    updatePerformanceIndicator,
    deletePerformanceIndicator,
    addPerformanceCriterion,
    updatePerformanceCriterion,
    deletePerformanceCriterion,
  };
};
