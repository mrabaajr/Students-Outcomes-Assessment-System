export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const unwrapListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};
