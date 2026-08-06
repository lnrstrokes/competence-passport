export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function videoEmbedUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  const watch = trimmed.match(/[?&]v=([^&#]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = trimmed.match(/youtu\.be\/([^?#]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  return trimmed;
}
