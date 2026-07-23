import JSZip from 'jszip';
import { EditHistoryItem, ImageAdjustments, BackgroundSettings, ShadowSettings } from '../types';

export async function renderPhotoToBlob(
  imageUrl: string,
  adjustments: ImageAdjustments,
  background: BackgroundSettings,
  shadow: ShadowSettings,
  format: 'png' | 'jpeg' = 'png',
  transparentBackground: boolean = false
): Promise<Blob> {
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
      if (!transparentBackground && background?.mode === 'color' && background.color) {
        ctx.fillStyle = background.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (!transparentBackground && background?.mode === 'gradient') {
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
      const brightnessFilter = 100 + (adjustments?.brightness || 0);
      const contrastFilter = 100 + (adjustments?.contrast || 0);
      const saturationFilter = 100 + (adjustments?.saturation || 0);

      let filterString = `brightness(${brightnessFilter}%) contrast(${contrastFilter}%) saturate(${saturationFilter}%)`;

      if (shadow?.enabled) {
        filterString += ` drop-shadow(0px ${shadow.offsetY}px ${shadow.blur}px rgba(0, 0, 0, ${shadow.opacity / 100}))`;
      }

      ctx.filter = filterString;

      // 3. Draw Main Image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 4. Export Blob
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image blob'));
        }
      }, mimeType, 0.95);
    };

    img.onerror = (err) => reject(err);
  });
}

export async function exportEditedPhoto(
  imageUrl: string,
  adjustments: ImageAdjustments,
  background: BackgroundSettings,
  shadow: ShadowSettings,
  format: 'png' | 'jpeg' = 'png',
  transparentBackground: boolean = false
): Promise<void> {
  const blob = await renderPhotoToBlob(imageUrl, adjustments, background, shadow, format, transparentBackground);
  const dataUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `product-cleanup-studio-${Date.now()}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(dataUrl);
}

export async function exportAllHistoryAsZip(
  history: EditHistoryItem[],
  currentAdjustments: ImageAdjustments,
  currentBackground: BackgroundSettings,
  currentShadow: ShadowSettings
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    const itemAdj = item.adjustments || currentAdjustments;
    const itemBg = item.background || currentBackground;
    const itemShadow = item.shadow || currentShadow;

    try {
      const blob = await renderPhotoToBlob(
        item.imageUrl,
        itemAdj,
        itemBg,
        itemShadow,
        'png',
        false
      );

      const sanitizedLabel = (item.label || `step-${i + 1}`)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();

      const fileName = `${String(i + 1).padStart(2, '0')}_${sanitizedLabel}.png`;
      zip.file(fileName, blob);
    } catch (err) {
      console.error(`Failed rendering history step ${i + 1}:`, err);
    }
  }

  const zipContent = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipContent);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `product-studio-history-all-${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
