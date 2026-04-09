function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  return global.atob ? global.atob(padded) : atob(padded);
}

export function decodeJwt(token) {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("Invalid token");
  }

  return JSON.parse(decodeBase64Url(payload));
}
