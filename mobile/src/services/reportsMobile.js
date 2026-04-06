import { apiClient } from "./apiClient";

export async function fetchReportsDashboard(filters = {}) {
  const params = {};
  if (filters.schoolYear) params.school_year = filters.schoolYear;
  if (filters.course) params.course = filters.course;
  if (filters.section) params.section = filters.section;
  if (filters.outcome) params.so = filters.outcome;

  const response = await apiClient.get("/reports/dashboard/", { params });
  return response.data;
}
