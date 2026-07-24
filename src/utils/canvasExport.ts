import JSZip from 'jszip';
import { EditHistoryItem, ImageAdjustments, BackgroundSettings, ShadowSettings, WatermarkSettings } from '../types';

export async function renderPhotoToBlob(
  imageUrl: string,
  adjustments: ImageAdjustments,
  background: BackgroundSettings,
  shadow: ShadowSettings,
  watermark?: WatermarkSettings,
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

      // 4. Draw Watermark if enabled
      if (watermark?.enabled && watermark.text?.trim()) {
        ctx.save();
        ctx.filter = 'none'; // reset filter so watermark is drawn crisp
        
        const scaleFactor = (watermark.scale || 100) / 100;
        const fontSize = Math.max(16, Math.round(canvas.width * 0.035 * scaleFactor));
        
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.globalAlpha = Math.max(0.05, Math.min(1, (watermark.opacity || 60) / 100));
        ctx.fillStyle = watermark.color || '#FFFFFF';

        // Add soft text shadow for high contrast legibility
        ctx.shadowColor = watermark.color?.toLowerCase() === '#ffffff' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const textMetrics = ctx.measureText(watermark.text);
        const textWidth = textMetrics.width;
        const margin = Math.round(canvas.width * 0.04);

        let x = margin;
        let y = margin + fontSize;

        const pos = watermark.position || 'bottom-right';

        if (pos === 'top-left') {
          x = margin;
          y = margin + fontSize;
        } else if (pos === 'top-right') {
          x = canvas.width - margin - textWidth;
          y = margin + fontSize;
        } else if (pos === 'bottom-left') {
          x = margin;
          y = canvas.height - margin;
        } else if (pos === 'bottom-right') {
          x = canvas.width - margin - textWidth;
          y = canvas.height - margin;
        } else if (pos === 'center') {
          x = (canvas.width - textWidth) / 2;
          y = canvas.height / 2 + fontSize / 3;
        }

        ctx.fillText(watermark.text, x, y);
        ctx.restore();
      }

      // 5. Export Blob
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
  watermark?: WatermarkSettings,
  format: 'png' | 'jpeg' = 'png',
  transparentBackground: boolean = false
): Promise<void> {
  const blob = await renderPhotoToBlob(imageUrl, adjustments, background, shadow, watermark, format, transparentBackground);
  const dataUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `product-cleanup-studio-${Date.now()}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(dataUrl);
}

export function generateFilenameFromTemplate(
  template: string,
  index: number,
  label: string,
  extension: string = 'png'
): string {
  if (!template || !template.trim()) {
    const sanitizedLabel = (label || `step-${index + 1}`)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    return `${String(index + 1).padStart(2, '0')}_${sanitizedLabel}.${extension}`;
  }

  const sanitizedLabel = (label || `step-${index + 1}`)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = String(Date.now());

  let rendered = template.trim();
  rendered = rendered.replace(/\{index\}/gi, String(index + 1));
  rendered = rendered.replace(/\{step\}/gi, String(index + 1));
  rendered = rendered.replace(/\{label\}/gi, sanitizedLabel);
  rendered = rendered.replace(/\{timestamp\}/gi, timeStr);
  rendered = rendered.replace(/\{date\}/gi, dateStr);

  // If template does not contain index or step or label variable, append index to avoid file name collisions
  const hasIndexOrLabel = /\{index\}|\{step\}|\{label\}/i.test(template);
  if (!hasIndexOrLabel) {
    rendered = `${rendered}_${index + 1}`;
  }

  const clean = rendered.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/_+/g, '_');
  return `${clean}.${extension}`;
}

export async function exportAllHistoryAsZip(
  history: EditHistoryItem[],
  currentAdjustments: ImageAdjustments,
  currentBackground: BackgroundSettings,
  currentShadow: ShadowSettings,
  currentWatermark?: WatermarkSettings,
  filenameTemplate?: string
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    const itemAdj = item.adjustments || currentAdjustments;
    const itemBg = item.background || currentBackground;
    const itemShadow = item.shadow || currentShadow;
    const itemWatermark = item.watermark || currentWatermark;

    try {
      const blob = await renderPhotoToBlob(
        item.imageUrl,
        itemAdj,
        itemBg,
        itemShadow,
        itemWatermark,
        'png',
        false
      );

      const fileName = generateFilenameFromTemplate(
        filenameTemplate || '',
        i,
        item.label || `step-${i + 1}`,
        'png'
      );
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
