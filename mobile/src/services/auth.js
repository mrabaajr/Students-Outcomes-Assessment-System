import axios from "axios";

import { API_BASE_URL } from "../config/api";
import { decodeJwt } from "../utils/jwt";

const REQUEST_TIMEOUT_MS = __DEV__ ? 6000 : 10000;

export async function loginWithEmail(email, password) {
  const loginResponse = await axios.post(`${API_BASE_URL}/users/login/`, {
    email,
    password,
  }, { timeout: REQUEST_TIMEOUT_MS });

  const { access, refresh } = loginResponse.data;
  const payload = decodeJwt(access);
  const userId = payload.user_id;

  const userResponse = await axios.get(`${API_BASE_URL}/users/${userId}/`, {
    headers: {
      Authorization: `Bearer ${access}`,
    },
    timeout: REQUEST_TIMEOUT_MS,
  });

  return {
    accessToken: access,
    refreshToken: refresh,
    user: userResponse.data,
  };
}
