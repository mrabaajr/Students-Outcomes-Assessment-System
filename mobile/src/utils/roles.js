export function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();

  if (["admin", "program_chair", "program-chair", "chair", "programchair"].includes(value)) {
    return "admin";
  }

  if (["staff", "faculty", "instructor", "teacher"].includes(value)) {
    return "staff";
  }

  return value;
}

export function isProgramChairRole(role) {
  return normalizeRole(role) === "admin";
}

export function roleLabel(role) {
  return isProgramChairRole(role) ? "Program Chair" : "Faculty";
}
