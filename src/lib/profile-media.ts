export const PROFILE_AVATARS_BUCKET = "profile-avatars";
export const PORTFOLIO_PHOTOS_BUCKET = "portfolio-photos";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const PORTFOLIO_MAX_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateProfileImage(file: File | null, maxBytes: number): string | null {
  if (!file) return "Оберіть файл зображення";
  if (!file.type.startsWith("image/")) return "Можна завантажувати лише зображення";
  if (!IMAGE_EXTENSIONS[file.type]) {
    return "Підтримуються формати JPG, PNG, WEBP, GIF та AVIF";
  }
  if (file.size > maxBytes) {
    return `Розмір файлу не повинен перевищувати ${Math.round(maxBytes / 1024 / 1024)} МБ`;
  }
  return null;
}

export function createProfileMediaPath(
  folder: "avatars" | "portfolio",
  userId: string,
  file: File,
): string {
  const extension = IMAGE_EXTENSIONS[file.type];
  return `${folder}/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

export function getOwnedPublicObjectPath(
  publicUrl: string,
  bucket: string,
  folder: "avatars" | "portfolio",
  userId: string,
): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const pathname = new URL(publicUrl).pathname;
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    const objectPath = decodeURIComponent(pathname.slice(markerIndex + marker.length));
    const parts = objectPath.split("/");
    if (
      parts.length < 3 ||
      parts[0] !== folder ||
      parts[1] !== userId ||
      parts.some((part) => !part || part === "." || part === "..")
    ) {
      return null;
    }
    return objectPath;
  } catch {
    return null;
  }
}
