/** Product images come back as either a full URL or a `/static-images/...` path off the API host. */
export function getImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  const base = (import.meta.env.VITE_API as string) || 'http://localhost:3000';
  return `${base}${url}`;
}
