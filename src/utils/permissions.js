export function isManager(user) {
  return user?.role === "manager";
}

export function getInspectorName(user) {
  return String(user?.inspectorName || "").trim();
}

export function canAccessObject(user, object) {
  if (!user || !object) {
    return false;
  }

  if (isManager(user)) {
    return true;
  }

  return getInspectorName(user).toLowerCase() === String(object.inspector || "").trim().toLowerCase();
}

export function filterObjectsByUser(objects, user) {
  if (isManager(user)) {
    return objects;
  }

  const inspectorName = getInspectorName(user).toLowerCase();

  return objects.filter((item) => String(item.inspector || "").trim().toLowerCase() === inspectorName);
}
