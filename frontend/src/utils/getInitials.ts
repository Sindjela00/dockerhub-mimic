export function getInitials(username: string): string {
  if (!username) return "?";
  return username.slice(0, 2).toUpperCase();
}
