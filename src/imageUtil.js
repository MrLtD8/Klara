// Delad bildhjälpare: läser en fil (inkl. iPhone-HEIC), skalar ner och
// returnerar en JPEG data-URL. Används för små bilder som lagras inline
// (t.ex. belöningsikoner) — konverteraren laddas bara när HEIC dyker upp.

export async function fileToDownscaledJpeg(file, maxDim = 200, quality = 0.8) {
  if (/\.heic$|\.heif$/i.test(file.name) || ['image/heic', 'image/heif'].includes(file.type)) {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    file = Array.isArray(converted) ? converted[0] : converted;
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Kunde inte läsa bilden.')); };
    img.src = url;
  });
}
