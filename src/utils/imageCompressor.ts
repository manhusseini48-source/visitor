/**
 * Image compressor and Cloudinary uploader utility
 * Enforces strict byte size ceilings:
 * - Profile, Medicine, Store, Support: < 300 KB
 * - Chat & Messenger images: < 200 KB
 */

export interface CompressionResult {
  file: Blob;
  dataUrl: string;
  sizeBytes: number;
  sizeKB: number;
  width: number;
  height: number;
  format: 'image/webp' | 'image/jpeg';
}

/**
 * Progressively compresses an image until it is strictly under the target max KB.
 */
export async function compressImage(
  file: File | Blob,
  maxKB: number = 300,
  maxDimension: number = 1600
): Promise<CompressionResult> {
  const targetBytes = maxKB * 1024;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('فرمت تصویر نامعتبر است'));
      img.onload = async () => {
        let width = img.width;
        let height = img.height;

        // Downscale initial dimensions if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('عدم پشتیبانی از پردازش تصویر در مرورگر'));
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Quality stepped descent
        let quality = 0.88;
        let format: 'image/webp' | 'image/jpeg' = 'image/webp';
        let blob: Blob | null = null;
        let dataUrl = '';

        // Test webp support
        const testData = canvas.toDataURL('image/webp');
        if (!testData.startsWith('data:image/webp')) {
          format = 'image/jpeg';
        }

        // Iterative compression loop
        for (let attempt = 0; attempt < 8; attempt++) {
          blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, format, quality)
          );

          if (!blob) break;

          if (blob.size <= targetBytes) {
            dataUrl = await blobToDataUrl(blob);
            return resolve({
              file: blob,
              dataUrl,
              sizeBytes: blob.size,
              sizeKB: Math.round(blob.size / 1024),
              width: canvas.width,
              height: canvas.height,
              format,
            });
          }

          // Reduce quality
          quality -= 0.12;

          // If quality gets too low, also reduce canvas dimensions
          if (quality < 0.45 && (canvas.width > 600 || canvas.height > 600)) {
            const nextW = Math.round(canvas.width * 0.75);
            const nextH = Math.round(canvas.height * 0.75);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = nextW;
            tempCanvas.height = nextH;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
              tempCtx.drawImage(canvas, 0, 0, nextW, nextH);
              canvas.width = nextW;
              canvas.height = nextH;
              ctx.clearRect(0, 0, nextW, nextH);
              ctx.drawImage(tempCanvas, 0, 0);
            }
            quality = 0.75;
          }
        }

        // Final attempt fallback
        if (blob && blob.size <= targetBytes) {
          dataUrl = await blobToDataUrl(blob);
          resolve({
            file: blob,
            dataUrl,
            sizeBytes: blob.size,
            sizeKB: Math.round(blob.size / 1024),
            width: canvas.width,
            height: canvas.height,
            format,
          });
        } else {
          reject(
            new Error('حجم تصویر انتخابی بیش از حد مجاز است. لطفاً فایل کوچک‌تری انتخاب کنید.')
          );
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

/**
 * Uploads compressed image to Cloudinary or falls back to optimized data URL.
 * Supports configurable Cloudinary cloud name and unsigned upload preset.
 */
export async function uploadToCloudinary(
  compressedBlob: Blob,
  folder: 'profiles' | 'medicines' | 'chat' | 'support' = 'medicines',
  customCloudName?: string,
  customUploadPreset?: string
): Promise<string> {
  const cloudName =
    customCloudName ||
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME) ||
    'dqmjajwb';
  const uploadPreset =
    customUploadPreset ||
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET) ||
    'visitor_pharma_preset';

  // If Cloudinary is configured, send real multipart POST
  if (
    cloudName &&
    uploadPreset &&
    cloudName !== 'your-cloudinary-cloud-name'
  ) {
    try {
      const formData = new FormData();
      formData.append('file', compressedBlob);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', `visitor-app/${folder}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url) {
          return data.secure_url;
        }
      }
    } catch (err) {
      console.warn('Cloudinary direct upload failed, saving compressed image locally', err);
    }
  }

  // Fallback to storing the clean compressed WebP data URL directly (under byte limit)
  return await blobToDataUrl(compressedBlob);
}
