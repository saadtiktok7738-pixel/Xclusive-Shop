/**
 * Compress an image File into a base64 data URL.
 * Keeps aspect ratio and reduces size for Firestore safety.
 */
export async function compressImage(file, maxSize = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read file"));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Invalid image"));

      img.onload = () => {
        const ratio = Math.min(
          1,
          maxSize / Math.max(img.width, img.height)
        );

        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));

        ctx.drawImage(img, 0, 0, w, h);

        let q = quality;
        let dataUrl = canvas.toDataURL("image/jpeg", q);

        while (dataUrl.length > 700000 && q > 0.3) {
          q -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", q);
        }

        resolve(dataUrl);
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert string to slug
 */
export function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}