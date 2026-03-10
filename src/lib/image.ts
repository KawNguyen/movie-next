export function getImageUrl(path: string | undefined | null): string {
  if (!path) return "";

  let url = path;
  if (!path.startsWith("http://") && !path.startsWith("https://")) {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    url = `https://phimimg.com/${cleanPath}`;
  }

  return `https://phimapi.com/image.php?url=${url}`;
}
