export interface CropAspectPreset {
  id: string;
  name: string;
  ratio: number; // width / height, e.g. 1 for 1:1, 0.8 for 4:5
  aspectStr: string;
  category: 'Marketplace' | 'Social' | 'Hero' | 'Catalog';
  description: string;
}

export const CROP_ASPECT_PRESETS: CropAspectPreset[] = [
  {
    id: '1:1',
    name: '1:1 Square',
    ratio: 1,
    aspectStr: '1:1',
    category: 'Marketplace',
    description: 'Amazon, Shopify & eBay product grid standard',
  },
  {
    id: '4:5',
    name: '4:5 Portrait',
    ratio: 4 / 5,
    aspectStr: '4:5',
    category: 'Social',
    description: 'Instagram Feed & TikTok shop optimization',
  },
  {
    id: '16:9',
    name: '16:9 Banner',
    ratio: 16 / 9,
    aspectStr: '16:9',
    category: 'Hero',
    description: 'Storefront hero headers & desktop banners',
  },
  {
    id: '3:4',
    name: '3:4 Catalog',
    ratio: 3 / 4,
    aspectStr: '3:4',
    category: 'Catalog',
    description: 'Pinterest & apparel lookbook grid cards',
  },
  {
    id: '9:16',
    name: '9:16 Full Story',
    ratio: 9 / 16,
    aspectStr: '9:16',
    category: 'Social',
    description: 'Mobile stories, Reels & TikTok vertical view',
  },
  {
    id: '2:3',
    name: '2:3 Classic',
    ratio: 2 / 3,
    aspectStr: '2:3',
    category: 'Marketplace',
    description: 'Etsy & traditional portrait product listings',
  },
];

export interface CenterOfMass {
  cx: number;
  cy: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Scans image pixels to detect the product's bounding box and center of mass.
 * Works for images with transparent or solid backgrounds (white, gray, light studio).
 */
export function detectProductCenterOfMass(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): CenterOfMass {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Estimate background color from 4 corners
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  let bgR = 0, bgG = 0, bgB = 0;
  for (const [x, y] of corners) {
    const idx = (y * width + x) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR /= 4;
  bgG /= 4;
  bgB /= 4;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  // Sample grid to ensure high speed
  const step = Math.max(1, Math.floor(Math.min(width, height) / 300));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Pixel is foreground if alpha < 240 (transparent) OR color distance from background > threshold
      const dist = Math.sqrt(
        (r - bgR) * (r - bgR) +
        (g - bgG) * (g - bgG) +
        (b - bgB) * (b - bgB)
      );

      const isForeground = a < 230 || dist > 28;

      if (isForeground) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        const weight = a < 230 ? (255 - a) : dist;
        weightedX += x * weight;
        weightedY += y * weight;
        totalWeight += weight;
      }
    }
  }

  // Fallback if no distinct foreground found (e.g., solid color)
  if (totalWeight === 0 || minX >= maxX || minY >= maxY) {
    return {
      cx: Math.round(width / 2),
      cy: Math.round(height / 2),
      minX: 0,
      minY: 0,
      maxX: width,
      maxY: height,
      width,
      height,
    };
  }

  const cx = Math.round(weightedX / totalWeight);
  const cy = Math.round(weightedY / totalWeight);

  return {
    cx,
    cy,
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculates crop dimensions and generates a cropped data URL.
 */
export async function generateSmartCrop(
  imageUrl: string,
  targetRatio: number,
  autoCenterProduct: boolean = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;

      let cx = imgW / 2;
      let cy = imgH / 2;

      if (autoCenterProduct) {
        const centerInfo = detectProductCenterOfMass(ctx, imgW, imgH);
        cx = centerInfo.cx;
        cy = centerInfo.cy;
      }

      // Determine max crop box fitting targetRatio within imgW x imgH
      let cropW = imgW;
      let cropH = imgH;

      const currentRatio = imgW / imgH;

      if (currentRatio > targetRatio) {
        // Image is wider than target ratio -> constrain height
        cropH = imgH;
        cropW = imgH * targetRatio;
      } else {
        // Image is taller than target ratio -> constrain width
        cropW = imgW;
        cropH = imgW / targetRatio;
      }

      // Center crop box around (cx, cy)
      let cropX = cx - cropW / 2;
      let cropY = cy - cropH / 2;

      // Clamp inside image bounds
      if (cropX < 0) cropX = 0;
      if (cropY < 0) cropY = 0;
      if (cropX + cropW > imgW) cropX = imgW - cropW;
      if (cropY + cropH > imgH) cropY = imgH - cropH;

      // Render crop to output canvas
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = Math.round(cropW);
      outputCanvas.height = Math.round(cropH);
      const outCtx = outputCanvas.getContext('2d');

      if (!outCtx) {
        reject(new Error('Failed to create output canvas context'));
        return;
      }

      outCtx.drawImage(
        img,
        Math.round(cropX),
        Math.round(cropY),
        Math.round(cropW),
        Math.round(cropH),
        0,
        0,
        Math.round(cropW),
        Math.round(cropH)
      );

      resolve(outputCanvas.toDataURL('image/png'));
    };

    img.onerror = (err) => {
      reject(err || new Error('Failed to load image for smart cropping'));
    };
  });
}
