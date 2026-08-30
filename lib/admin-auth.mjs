export function isAdminUser(user) {
  return Array.isArray(user?.roles) && user.roles.includes("admin");
}
