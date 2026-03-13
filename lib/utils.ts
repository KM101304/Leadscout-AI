export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export function formatScore(score: number) {
  return `${Math.round(score)}/100`;
}

export function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
