export function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escUrl(url: string): string {
  if (!url.startsWith("https://") && !url.startsWith("http://")) return "#";
  return esc(url);
}

export function sanitizeSubject(str: string): string {
  return str.replace(/[\r\n]/g, " ");
}
