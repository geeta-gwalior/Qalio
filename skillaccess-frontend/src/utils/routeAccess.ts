export const roleRouteAccess = {
  student: ["/student"],
  company: ["/company"],
  college: ["/college"],
  university: ["/university"],
  admin: ["/admin"],
};

export const isPathAllowedForRole = (
  path: string,
  role: keyof typeof roleRouteAccess
): boolean => {
  const allowedPaths = roleRouteAccess[role];
  return allowedPaths?.some((prefix) => path.startsWith(prefix)) ?? false;
};
