export function userAvatarUrl(userId: number, size = 150): string {
  return `https://api.dicebear.com/7.x/bottts/png?seed=user${userId}&size=${size}`;
}