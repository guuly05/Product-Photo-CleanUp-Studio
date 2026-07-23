import { ImageAdjustments, BackgroundSettings, ShadowSettings } from '../types';

export async function exportEditedPhoto(
  imageUrl: string,
  adjustments: ImageAdjustments,
  background: BackgroundSettings,
  shadow: ShadowSettings,
  format: 'png' | 'jpeg' = 'png',
  transparentBackground: boolean = false
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 1. Draw Background Fill if specified
      if (!transparentBackground && background.mode === 'color' && background.color) {
        ctx.fillStyle = background.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (!transparentBackground && background.mode === 'gradient') {
        const grad = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          50,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height) / 1.5
        );
        grad.addColorStop(0, background.gradientStart || '#ffffff');
        grad.addColorStop(1, background.gradientEnd || '#cbd5e1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (format === 'jpeg') {
        // JPEG doesn't support transparency, default to white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Apply CSS Filter string for color adjustments
      const brightnessFilter = 100 + adjustments.brightness;
      const contrastFilter = 100 + adjustments.contrast;
      const saturationFilter = 100 + adjustments.saturation;

      let filterString = `brightness(${brightnessFilter}%) contrast(${contrastFilter}%) saturate(${saturationFilter}%)`;

      if (shadow.enabled) {
        filterString += ` drop-shadow(0px ${shadow.offsetY}px ${shadow.blur}px rgba(0, 0, 0, ${shadow.opacity / 100}))`;
      }

      ctx.filter = filterString;

      // 3. Draw Main Image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 4. Export Blob & Download Link
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mimeType, 0.95);

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `product-cleanup-studio-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      resolve();
    };

    img.onerror = (err) => reject(err);
  });
}
