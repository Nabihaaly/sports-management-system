import { BadRequestException } from '@nestjs/common';

export const IMAGE_BUCKET = 'images';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// mimetype → file extension
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Magic bytes: file ke pehle bytes se asli type — naam ya browser ke mimetype pe bharosa nahi
function sniff(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'image/png';
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'image/webp';
  return null;
}

// Valid image → { contentType, ext }; warna 400
export function assertImage(file: Express.Multer.File) {
  const real = sniff(file.buffer);
  if (!real || !ALLOWED[real]) {
    throw new BadRequestException('Only JPG, PNG or WebP images are allowed');
  }
  return { contentType: real, ext: ALLOWED[real] };
}

// folder/<timestamp>-<random>.<ext> — unique, aur browser cache bhi bust
export function imagePath(folder: string, ext: string) {
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}