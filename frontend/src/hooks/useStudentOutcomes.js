import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const initialData = [
  {
    id: '1',
    number: 1,
    title: 'T.I.P. SO 1',
    description: 'Identify, formulate, and solve complex engineering problems by applying principles of engineering, science, and mathematics.',
    performanceIndicators: [
      { id: '1-1', number: 1, description: 'Identify and describe complex engineering problems.' },
      { id: '1-2', number: 2, description: 'Formulate mathematical models for engineering problems.' },
      { id: '1-3', number: 3, description: 'Apply scientific principles to analyze and solve problems.' },
    ],
  },
  {
    id: '2',
    number: 2,
    title: 'T.I.P. SO 2',
    description: 'Apply engineering design to produce solutions that meet specified needs with consideration of public health, safety, and welfare.',
    performanceIndicators: [
      { id: '2-1', number: 1, description: 'Design solutions meeting specified engineering requirements.' },
      { id: '2-2', number: 2, description: 'Consider public health and safety in design decisions.' },
    ],
  },
];

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useStudentOutcomes() {
  const [outcomes, setOutcomes] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch outcomes from backend on mount
  const fetchOutcomes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/student-outcomes/`, {
        headers: getAuthHeader(),
      });
      
      // Transform backend data to frontend format
      const transformedData = response.data.map(so => ({
        id: String(so.id),
        number: so.number,
        title: so.title,
        description: so.description,
        performanceIndicators: (so.performanceIndicators || so.performance_indicators || []).map(pi => ({
          id: String(pi.id),
          number: pi.number,
          description: pi.description,
        })),
      }));
      
      // If no data from backend, use initial data
      if (transformedData.length === 0) {
        setOutcomes(initialData);
        setHasUnsavedChanges(true); // Mark as unsaved so user can save initial data
      } else {
        setOutcomes(transformedData);
      }
    } catch (err) {
      console.error('Error fetching student outcomes:', err);
      setError(err.message);
      // Fallback to initial data on error
      setOutcomes(initialData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutcomes();
  }, [fetchOutcomes]);

  // Save all outcomes to backend
  const saveToBackend = async () => {
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/student-outcomes/bulk_save/`,
        { outcomes },
        { headers: getAuthHeader() }
      );
      
      // Update local state with saved data (includes proper IDs)
      if (response.data.outcomes) {
        const transformedData = response.data.outcomes.map(so => ({
          id: String(so.id),
          number: so.number,
          title: so.title,
          description: so.description,
          performanceIndicators: (so.performanceIndicators || so.performance_indicators || []).map(pi => ({
            id: String(pi.id),
            number: pi.number,
            description: pi.description,
          })),
        }));
        setOutcomes(transformedData);
      }
      
      setHasUnsavedChanges(false);
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Error saving student outcomes:', err);
      setError(err.response?.data?.detail || err.message);
      return { success: false, message: err.response?.data?.detail || 'Failed to save changes' };
    }
  };

  const updateOutcome = (id, updates) => {
    setOutcomes(prev =>
      prev.map(so => (so.id === id ? { ...so, ...updates } : so))
    );
    setHasUnsavedChanges(true);
  };

  const addOutcome = () => {
    const newNumber = outcomes.length > 0 ? Math.max(...outcomes.map(o => o.number)) + 1 : 1;
    const newOutcome = {
      id: Date.now().toString(),
      number: newNumber,
      title: `T.I.P. SO ${newNumber}`,
      description: 'New student outcome description.',
      performanceIndicators: [],
    };
    setOutcomes(prev => [...prev, newOutcome]);
    setHasUnsavedChanges(true);
    return newOutcome;
  };

  const deleteOutcome = (id) => {
    setOutcomes(prev => prev.filter(so => so.id !== id));
    setHasUnsavedChanges(true);
  };

  const addPerformanceIndicator = (outcomeId) => {
    setOutcomes(prev =>
      prev.map(so => {
        if (so.id === outcomeId) {
          const newNumber = so.performanceIndicators.length > 0
            ? Math.max(...so.performanceIndicators.map(pi => pi.number)) + 1
            : 1;
          return {
            ...so,
            performanceIndicators: [
              ...so.performanceIndicators,
              { id: `${outcomeId}-${Date.now()}`, number: newNumber, description: 'New performance indicator.' },
            ],
          };
        }
        return so;
      })
    );
    setHasUnsavedChanges(true);
  };

  const updatePerformanceIndicator = (outcomeId, piId, description) => {
    setOutcomes(prev =>
      prev.map(so => {
        if (so.id === outcomeId) {
          return {
            ...so,
            performanceIndicators: so.performanceIndicators.map(pi =>
              pi.id === piId ? { ...pi, description } : pi
            ),
          };
        }
        return so;
      })
    );
    setHasUnsavedChanges(true);
  };

  const deletePerformanceIndicator = (outcomeId, piId) => {
    setOutcomes(prev =>
      prev.map(so => {
        if (so.id === outcomeId) {
          return {
            ...so,
            performanceIndicators: so.performanceIndicators.filter(pi => pi.id !== piId),
          };
        }
        return so;
      })
    );
    setHasUnsavedChanges(true);
  };

  return {
    outcomes,
    hasUnsavedChanges,
    isLoading,
    error,
    saveToBackend,
    fetchOutcomes,
    updateOutcome,
    addOutcome,
    deleteOutcome,
    addPerformanceIndicator,
    updatePerformanceIndicator,
    deletePerformanceIndicator,
  };
}
