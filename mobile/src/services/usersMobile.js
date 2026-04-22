import { apiClient } from "./apiClient";

export async function fetchCurrentUser() {
  const response = await apiClient.get("/users/me/");
  return response.data;
}

export async function createFacultyAccount(payload) {
  const endpoint = payload.password ? "/users/register/" : "/users/create_account/";
  const body = {
    email: payload.email,
    first_name: payload.firstName,
    last_name: payload.lastName,
    role: "staff",
    department: payload.department || "",
    ...(payload.password ? { password: payload.password } : {}),
  };

  const response = await apiClient.post(endpoint, body);

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

export async function changeEmail(payload) {
  const response = await apiClient.post("/users/change_email/", {
    new_email: payload.newEmail,
    current_password: payload.currentPassword,
  });

  return response.data;
}

export async function fetchEmailSettings() {
  const response = await apiClient.get("/users/email_settings/");
  return response.data;
}

export async function updateEmailSettings(payload) {
  const response = await apiClient.post("/users/email_settings/", payload);
  return response.data;
}

export async function sendTestEmail(payload) {
  const response = await apiClient.post("/users/test_email_settings/", {
    recipient_email: payload.recipientEmail,
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
