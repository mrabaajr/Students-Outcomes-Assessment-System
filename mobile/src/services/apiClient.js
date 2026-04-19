import axios from "axios";

import { API_BASE_URL } from "../config/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: __DEV__ ? 6000 : 10000,
});

export function attachAccessToken(accessToken) {
  if (accessToken) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
}
