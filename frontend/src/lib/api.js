export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const unwrapListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const getStoredToken = (key) => {
  const value = localStorage.getItem(key);
  if (!value || value === "undefined" || value === "null") {
    return null;
  }
  return value;
};

const parseJwtPayload = (token) => {
  try {
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      return null;
    }

    const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(base64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + 5000;
};

export const refreshAccessToken = async () => {
  const refreshToken = getStoredToken("refreshToken");
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const nextAccessToken = data?.access;
    if (!nextAccessToken) {
      return null;
    }

    localStorage.setItem("accessToken", nextAccessToken);
    return nextAccessToken;
  } catch {
    return null;
  }
};

export const getAuthHeader = async () => {
  let accessToken = getStoredToken("accessToken");

  if (!accessToken || isTokenExpired(accessToken)) {
    accessToken = await refreshAccessToken();
  }

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};
