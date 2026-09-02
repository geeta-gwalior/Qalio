export function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}
