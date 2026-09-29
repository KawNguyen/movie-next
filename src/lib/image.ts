const baseUrl = process.env.NEXT_PUBLIC_API_IMAGE_URL;

export function getImageUrl(
  path: string | undefined | null,
): string {
  if (!path) return "";

  // Đã là URL đầy đủ
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Là path tương đối
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${baseUrl}/${cleanPath}`;
}