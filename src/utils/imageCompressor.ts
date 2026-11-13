/**
 * High-Performance Client-Side Media Processor for Mosque TV Slides.
 *
 * Features:
 * - Photos: JPEG, PNG, WebP, GIF, SVG, BMP, AVIF, HEIC
 *   Adaptive Full HD/HD compression so slides look crisp on TV while staying fast & syncable across devices.
 *   Generates lightweight separate thumbnail (~10-20KB) so cloud documents never double-count payload size.
 * - Videos: MP4, WebM, MOV, MKV, OGG, AVI, M4V
 *   Uses native Blob storage with Object URL streaming + base64 helpers for chunked cloud sync.
 */

export interface ProcessedMediaResult {
  type: 'image' | 'video';
  url: string; // Object URL or Data URL for live rendering
  blob: Blob;  // Raw blob stored into IndexedDB
  thumbnailUrl: string; // Lightweight preview thumbnail (~15KB) for admin drawer & cloud metadata
  fileName: string;
}

/**
 * Checks if a file is a video by MIME type or file extension
 */
export function isVideoFile(file: File): boolean {
  if (file.type && file.type.startsWith('video/')) return true;
  const ext = (file.name || '').split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'mov', 'm4v', 'ogg', 'ogv', 'mkv', 'avi', '3gp', 'wmv'].includes(ext || '');
}

/**
 * Converts a Blob (e.g. video or image) into a Data URL string
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(new Error('Gagal membaca berkas media'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a Data URL string back into a native Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const header = parts[0] || '';
  const base64Data = parts[1] || '';
  const mimeMatch = header.match(/data:([^;]+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const byteChars = atob(base64Data);
  const byteArrays: Uint8Array<ArrayBuffer>[] = [];
  const sliceSize = 8192;

  for (let offset = 0; offset < byteChars.length; offset += sliceSize) {
    const slice = byteChars.slice(offset, offset + sliceSize);
    const byteNumbers = new Uint8Array(new ArrayBuffer(slice.length));
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(byteNumbers);
  }

  return new Blob(byteArrays, { type: mimeType });
}

/**
 * Generates a lightweight thumbnail (max 360x202 JPEG ~10-20KB) from an image Data URL
 */
export function createLightweightThumbnail(dataUrl: string, maxWidth = 360, maxHeight = 202): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || dataUrl.startsWith('blob:')) {
      resolve('');
      return;
    }
    if (dataUrl.length < 45000) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width <= 0 || height <= 0) {
          resolve('');
          return;
        }
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve('');
          return;
        }
        ctx.fillStyle = '#071C14';
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65) || '');
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = dataUrl;
  });
}

/**
 * Captures an instantaneous preview frame thumbnail from a video Blob
 */
export function captureVideoThumbnail(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      let isResolved = false;
      const finish = (result: string) => {
        if (!isResolved) {
          isResolved = true;
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {}
          resolve(result);
        }
      };

      // Seek to 0.5s or 10% into the video to get a meaningful frame (not black)
      video.onloadedmetadata = () => {
        const seekTime = video.duration && video.duration > 1 ? Math.min(1.0, video.duration * 0.1) : 0;
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        try {
          const rawW = video.videoWidth || 360;
          const rawH = video.videoHeight || 202;
          const ratio = Math.min(360 / rawW, 202 / rawH, 1);
          const width = Math.max(1, Math.round(rawW * ratio));
          const height = Math.max(1, Math.round(rawH * ratio));
          if (width > 0 && height > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, width, height);
              const thumb = canvas.toDataURL('image/jpeg', 0.65);
              finish(thumb);
              return;
            }
          }
        } catch {
          // Canvas export failed
        }
        finish('');
      };

      video.onerror = () => finish('');

      // Safety fallback timeout
      setTimeout(() => finish(''), 2500);
    } catch {
      resolve('');
    }
  });
}

/**
 * Downscales and compresses a single photo file to crisp HD/Full-HD JPEG Data URL
 * while targeting <= 620KB so it syncs reliably across all accounts/devices in Firestore.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG or animated GIF, read as data URL directly
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error(`Gagal membaca berkas ${file.name}`));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Gagal membaca foto ${file.name}`));
    reader.onload = (e) => {
      const rawData = e.target?.result as string;
      if (!rawData) {
        reject(new Error(`Berkas foto kosong: ${file.name}`));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const renderAt = (targetMaxW: number, targetMaxH: number, q: number): string => {
            let { width, height } = img;
            if (width <= 0 || height <= 0) return rawData;

            if (width > targetMaxW || height > targetMaxH) {
              const ratio = Math.min(targetMaxW / width, targetMaxH / height);
              width = Math.max(1, Math.round(width * ratio));
              height = Math.max(1, Math.round(height * ratio));
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { alpha: false });
            if (!ctx) return rawData;

            ctx.fillStyle = '#071C14';
            ctx.fillRect(0, 0, width, height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            return canvas.toDataURL('image/jpeg', q) || rawData;
          };

          let compressed = renderAt(maxWidth, maxHeight, quality);
          // Adaptive step-down if image is unusually dense (> 640KB base64) so it fits single-doc cloud sync cleanly
          if (compressed.length > 640000) {
            compressed = renderAt(maxWidth, maxHeight, 0.68);
          }
          if (compressed.length > 680000) {
            compressed = renderAt(1440, 810, 0.65);
          }

          resolve(compressed || rawData);
        } catch {
          resolve(rawData);
        }
      };

      img.onerror = () => resolve(rawData);
      img.src = rawData;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * High-level processor for uploaded file (Image or Video)
 */
export async function processUploadedMedia(file: File): Promise<ProcessedMediaResult> {
  const isVideo = isVideoFile(file);

  if (isVideo) {
    const objectUrl = URL.createObjectURL(file);
    const thumb = await captureVideoThumbnail(file);
    return {
      type: 'video',
      url: objectUrl,
      blob: file,
      thumbnailUrl: thumb,
      fileName: file.name
    };
  }

  // Image processing with separate tiny thumbnail so cloud payloads stay compact
  const compressedDataUrl = await compressImageFile(file);
  const lightweightThumb = await createLightweightThumbnail(compressedDataUrl);
  return {
    type: 'image',
    url: compressedDataUrl,
    blob: file,
    thumbnailUrl: lightweightThumb || compressedDataUrl,
    fileName: file.name
  };
}

/**
 * Backward compatibility wrapper
 */
export async function compressUploadedMedia(file: File): Promise<string> {
  const processed = await processUploadedMedia(file);
  return processed.url;
}
