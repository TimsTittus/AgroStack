export async function detectMediaType(url: string) {
  const headRes = await fetch(url, { method: "HEAD" });
  const contentType = headRes.headers.get("content-type") || "";
  const urlLower = url.toLowerCase();
  const isVideo = contentType.startsWith("video/") || /\.(mp4|mov|avi|webm)$/i.test(urlLower);
  return isVideo ? "VIDEO" : "IMAGE";
}
