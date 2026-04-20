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

export async function changePassword(payload) {
  const response = await apiClient.post("/users/change_password/", {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
    confirm_password: payload.confirmPassword,
  });

  return response.data;
}

export async function updateFacultyAccount(userId, payload) {
  const response = await apiClient.patch(`/users/${userId}/`, {
    email: payload.email,
    first_name: payload.firstName,
    last_name: payload.lastName,
    role: "staff",
    department: payload.department || "",
  });

  return response.data;
}
