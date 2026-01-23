import { useState } from 'react';

const STORAGE_KEY = 'student-outcomes';

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

export function useStudentOutcomes() {
  const [outcomes, setOutcomes] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialData;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveToStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(outcomes));
    setHasUnsavedChanges(false);
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
    saveToStorage,
    updateOutcome,
    addOutcome,
    deleteOutcome,
    addPerformanceIndicator,
    updatePerformanceIndicator,
    deletePerformanceIndicator,
  };
}
