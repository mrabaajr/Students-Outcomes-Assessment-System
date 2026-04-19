import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ROLE_KEY = "userRole";
const STORAGE_TIMEOUT_MS = __DEV__ ? 1500 : 4000;

function withStorageTimeout(promise, fallbackValue = null) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallbackValue), STORAGE_TIMEOUT_MS);
    }),
  ]).catch(() => fallbackValue);
}

export async function getStoredSession() {
  const [accessToken, refreshToken, userRole] = await Promise.all([
    withStorageTimeout(SecureStore.getItemAsync(ACCESS_TOKEN_KEY), null),
    withStorageTimeout(SecureStore.getItemAsync(REFRESH_TOKEN_KEY), null),
    withStorageTimeout(SecureStore.getItemAsync(USER_ROLE_KEY), null),
  ]);

  return {
    accessToken,
    refreshToken,
    userRole,
  };
}

export async function saveSession({ accessToken, refreshToken, userRole }) {
  await Promise.allSettled([
    withStorageTimeout(SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken), undefined),
    withStorageTimeout(SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken), undefined),
    withStorageTimeout(SecureStore.setItemAsync(USER_ROLE_KEY, userRole), undefined),
  ]);
}

export async function clearSession() {
  await Promise.allSettled([
    withStorageTimeout(SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY), undefined),
    withStorageTimeout(SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY), undefined),
    withStorageTimeout(SecureStore.deleteItemAsync(USER_ROLE_KEY), undefined),
  ]);
}
