import axiosClient from "./axiosClient";

/** Full URL of a backend path such as user.avatar_url. */
export const assetUrl = (path) => (path ? `${axiosClient.defaults.baseURL}${path}` : null);

/** A readable message from an API error (string detail or validation list). */
export function errorText(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg.replace(/^Value error, /, "");
  return fallback;
}

/**
 * Opens a verification document in a new tab. Documents need the session token,
 * so the file is fetched here and shown from a local blob URL.
 */
export async function openDocument(id) {
  const tab = window.open("", "_blank");   // opened now so the browser doesn't block it
  try {
    const { data } = await axiosClient.get(`/api/documents/${id}`, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    if (tab) tab.location.href = url; else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    tab?.close();
    throw new Error("document");
  }
}

/**
 * Center-crops an image file to a square and re-encodes it (JPEG, 512 px).
 * Re-encoding also drops the photo's metadata (camera, GPS position).
 */
export function cropToSquare(file, size = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = Math.min(size, side);
      canvas.getContext("2d").drawImage(
        img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side,
        0, 0, canvas.width, canvas.height,
      );
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", 0.88);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image")); };
    img.src = url;
  });
}

export const MB = 1024 * 1024;
export const formatSize = (bytes) => (bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
