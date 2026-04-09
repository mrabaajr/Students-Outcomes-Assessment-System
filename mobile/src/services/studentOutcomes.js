import { apiClient } from "./apiClient";

function transformFromBackend(backendSO) {
  return {
    id: backendSO.id,
    number: backendSO.number,
    code: `SO ${backendSO.number}`,
    title: backendSO.title,
    description: backendSO.description,
    indicators: (
      backendSO.performanceIndicators ||
      backendSO.performance_indicators ||
      []
    ).map((pi) => ({
      id: pi.id,
      number: pi.number,
      description: pi.description || pi.name || "",
      criteria: (
        pi.performanceCriteria ||
        pi.performance_criteria ||
        pi.criteria ||
        []
      ).map((pc) => ({
        id: pc.id,
        name: pc.name || pc.description || "",
        order: pc.order ?? 0,
      })),
    })),
  };
}

function transformToBackend(outcome) {
  return {
    id: typeof outcome.id === "number" ? outcome.id : null,
    number: outcome.number,
    title: outcome.title,
    description: outcome.description,
    performanceIndicators: (outcome.indicators || []).map((pi, idx) => ({
      id: typeof pi.id === "number" ? pi.id : null,
      number: pi.number || idx + 1,
      description: pi.description || "",
      performanceCriteria: (pi.criteria || []).map((pc, pcIdx) => ({
        id: typeof pc.id === "number" ? pc.id : null,
        name: pc.name || "",
        order: pc.order ?? pcIdx + 1,
      })),
    })),
  };
}

export async function fetchStudentOutcomesMobile() {
  const response = await apiClient.get("/student-outcomes/");
  const data = Array.isArray(response.data) ? response.data : response.data.results || [];
  return data.map(transformFromBackend);
}

export async function saveStudentOutcomesMobile(outcomes) {
  const response = await apiClient.post("/student-outcomes/bulk_save/", {
    outcomes: outcomes.map(transformToBackend),
  });

  return (response.data.outcomes || []).map(transformFromBackend);
}
