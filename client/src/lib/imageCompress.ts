/**
 * Client-side fast image compressor using HTML5 Canvas
 * Resizes 10-15MB mobile phone camera photos to ~100-150KB before sending over network
 */
export async function compressImageFile(file: File, maxWidth = 1280, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = e => {
      const src = String(e.target?.result || "");
      if (!src) return resolve("");

      const img = new Image();
      img.onerror = () => resolve(src);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(src);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        } catch {
          resolve(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
