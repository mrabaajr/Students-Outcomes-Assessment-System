import axios from "axios";

import { API_BASE_URL } from "../config/api";
import { decodeJwt } from "../utils/jwt";

export async function loginWithEmail(email, password) {
  const loginResponse = await axios.post(`${API_BASE_URL}/users/login/`, {
    email,
    password,
  });

  const { access, refresh } = loginResponse.data;
  const payload = decodeJwt(access);
  const userId = payload.user_id;

  const userResponse = await axios.get(`${API_BASE_URL}/users/${userId}/`, {
    headers: {
      Authorization: `Bearer ${access}`,
    },
  });

  return {
    accessToken: access,
    refreshToken: refresh,
    user: userResponse.data,
  };
}
