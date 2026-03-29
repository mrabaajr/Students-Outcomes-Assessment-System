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
      pi.criteria ||
      []
    ).map((pc) => ({
      id: pc.id,
      name: pc.name || pc.description || '',
      order: pc.order ?? 0,
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
          name: pc.name || '',
          order: pc.order ?? pcIdx + 1,
        })
      ),
    })
  ),
});

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
      const response = await axios.get(`${API_BASE_URL}/student-outcomes/`);
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      const transformed = data.map(transformFromBackend);
      setOutcomes(transformed);
    } catch (err) {
      console.error('Error fetching student outcomes:', err);
      // If 401 due to stale token, retry without auth header
      if (err.response?.status === 401) {
        try {
          const retry = await axios.get(`${API_BASE_URL}/student-outcomes/`, {
            headers: {},
          });
          const data = Array.isArray(retry.data) ? retry.data : retry.data.results || [];
          setOutcomes(data.map(transformFromBackend));
          return;
        } catch (retryErr) {
          console.error('Retry also failed:', retryErr);
        }
      }
      setError(err.response?.data?.detail || err.message);
      setOutcomes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutcomes();
  }, [fetchOutcomes]);

  // Save all outcomes to backend via bulk_save endpoint
  const saveToBackend = useCallback(async (outcomesOverride = outcomes) => {
    setError(null);
    try {
      const payload = {
        outcomes: outcomesOverride.map(transformToBackend),
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
                    name: '',
                    order: (pi.performanceCriteria || []).length + 1,
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
