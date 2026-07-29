export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "projeto";
}

export function uniqueSlug(base: string, existingIds: string[]): string {
  if (!existingIds.includes(base)) return base;
  let i = 2;
  while (existingIds.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
