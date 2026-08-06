export const MAX_FILE_BYTES = 8 * 1024 * 1024;

export function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}
