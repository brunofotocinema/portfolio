export function toEmbed(url?: string): string | null {
  if (!url) return null;
  const v = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}?autoplay=1`;
  const y = url.match(/[?&]v=([\w-]+)/);
  if (y) return `https://www.youtube.com/embed/${y[1]}?autoplay=1`;
  return null;
}

export function thumbOf(url?: string): string | null {
  if (!url) return null;
  const v = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (v) return `https://vumbnail.com/${v[1]}.jpg`;
  const y = url.match(/[?&]v=([\w-]+)/);
  if (y) return `https://img.youtube.com/vi/${y[1]}/maxresdefault.jpg`;
  return null;
}
