import { describe, expect, it } from "vitest";
import sharp from "sharp";

describe("Görsel Optimizasyonu ve Boyut Düşürme Testi", () => {
  it("Yüksek çözünürlüklü ve detaylı (4032x3024 - 12MP Kamera) bir görseli 1600px sınırına küçültür ve disk tasarrufu sağlar", async () => {
    // 1. 12 Megapiksel (4032x3024) rastgele desenli/yoğun ham kamera simülasyonu
    const width = 4032;
    const height = 3024;
    const rawPixels = Buffer.alloc(width * height * 3);
    for (let i = 0; i < rawPixels.length; i += 3) {
      rawPixels[i] = (i * 7) % 256;
      rawPixels[i + 1] = (i * 13) % 256;
      rawPixels[i + 2] = (i * 19) % 256;
    }

    const rawHighResBuffer = await sharp(rawPixels, {
      raw: { width, height, channels: 3 },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const originalSizeKb = Math.round(rawHighResBuffer.length / 1024);

    // 2. Sistemdeki optimizasyon zinciri (operations.ts)
    const optimizedBuffer = await sharp(rawHighResBuffer)
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    const optimizedSizeKb = Math.round(optimizedBuffer.length / 1024);
    const savingsPercent = Math.round(((originalSizeKb - optimizedSizeKb) / originalSizeKb) * 100);
    const optimizedMeta = await sharp(optimizedBuffer).metadata();

    console.log(`\n======================================================`);
    console.log(`📸 12MP MOBİL KAMERA SİMÜLASYON TESTİ`);
    console.log(`======================================================`);
    console.log(`🔹 Orijinal Çözünürlük : ${width} x ${height} px (12.2 Megapiksel)`);
    console.log(`🔹 Orijinal Boyut       : ${(originalSizeKb / 1024).toFixed(2)} MB (${originalSizeKb} KB)`);
    console.log(`------------------------------------------------------`);
    console.log(`🔸 Optimize Çözünürlük : ${optimizedMeta.width} x ${optimizedMeta.height} px`);
    console.log(`🔸 Optimize Boyut      : ${(optimizedSizeKb / 1024).toFixed(2)} MB (${optimizedSizeKb} KB)`);
    console.log(`🚀 Elde Edilen Tasarruf: %${savingsPercent}`);
    console.log(`======================================================\n`);

    expect(optimizedMeta.width).toBeLessThanOrEqual(1600);
    expect(optimizedMeta.height).toBeLessThanOrEqual(1600);
    expect(optimizedSizeKb).toBeLessThan(originalSizeKb);
    expect(savingsPercent).toBeGreaterThanOrEqual(70);
  });
});

