import { apiClient } from "./apiClient";

export async function fetchCurrentUser() {
  const response = await apiClient.get("/users/me/");
  return response.data;
}

export async function createFacultyAccount(payload) {
  const response = await apiClient.post("/users/create_account/", {
    email: payload.email,
    first_name: payload.firstName,
    last_name: payload.lastName,
    role: "staff",
    department: payload.department || "",
  });

  return response.data;
}
