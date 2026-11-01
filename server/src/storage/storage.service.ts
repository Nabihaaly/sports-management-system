import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Storage ka thin wrapper. Baaki app ko Supabase ka pata nahi hona chahiye —
// sirf "upload(bucket, path, buffer) → url" aur "remove(bucket, path)".
// Baad mein profile pictures / venue images bhi isi se jayengi.
@Injectable()
export class StorageService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }, // server pe session ki zaroorat nahi
    );
  }

  async upload(bucket: string, path: string, buffer: Buffer, contentType: string) {
    const { error } = await this.client.storage
      .from(bucket)
      .upload(path, buffer, { contentType, upsert: true });

    if (error) {
      throw new InternalServerErrorException(`Upload failed: ${error.message}`);
    }

    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async remove(bucket: string, path: string) {
    // Delete fail ho to request fail nahi karni — purani file reh jaye to bhi theek hai
    await this.client.storage.from(bucket).remove([path]);
  }

  // Public URL se bucket-relative path nikalta hai (delete ke liye)
  pathFromUrl(bucket: string, url: string): string | null {
    const marker = `/object/public/${bucket}/`;
    const i = url.indexOf(marker);
    return i === -1 ? null : url.slice(i + marker.length);
  }
}