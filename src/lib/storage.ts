import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface StorageProvider {
  upload(
    data: Buffer,
    opts: {
      key: string;
      mimeType: string;
      companyId: string;
      category: string;
    }
  ): Promise<UploadResult>;
  read(key: string): Promise<{ data: Buffer; mimeType: string } | null>;
  delete(key: string): Promise<void>;
}

function isNetlify(): boolean {
  return process.env.NETLIFY === "true" || !!process.env.NETLIFY_SITE_ID;
}

/**
 * Local filesystem storage provider (development only).
 * Files are stored in public/uploads/ and served via /api/uploads/[...path].
 */
class LocalStorageProvider implements StorageProvider {
  async upload(
    data: Buffer,
    opts: { key: string; mimeType: string; companyId: string; category: string }
  ): Promise<UploadResult> {
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = opts.key.split("/").pop() ?? `${randomUUID()}`;
    const path = join(dir, filename);
    await writeFile(path, data);
    return {
      key: filename,
      url: `/uploads/${filename}`,
      size: data.length,
      mimeType: opts.mimeType,
    };
  }

  async read(key: string): Promise<{ data: Buffer; mimeType: string } | null> {
    const filename = key.split("/").pop() ?? key;
    const path = join(process.cwd(), "public", "uploads", filename);
    try {
      await stat(path);
    } catch {
      return null;
    }
    const data = await readFile(path);
    const ext = (filename.split(".").pop() ?? "").toLowerCase();
    const mimeType = MIME_MAP[`.${ext}`] ?? "application/octet-stream";
    return { data, mimeType };
  }

  async delete(key: string): Promise<void> {
    const filename = key.split("/").pop() ?? key;
    const path = join(process.cwd(), "public", "uploads", filename);
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(path);
    } catch {
      // best-effort
    }
  }
}

/**
 * Netlify Blobs storage provider (production).
 * Uses @netlify/blobs for persistent object storage.
 */
class NetlifyBlobProvider implements StorageProvider {
  private store: any = null;

  private async getStore() {
    if (this.store) return this.store;
    console.log("[storage] Initializing Netlify Blobs store 'vynta-uploads'");
    const { getStore } = await import("@netlify/blobs");
    this.store = await getStore("vynta-uploads");
    console.log("[storage] Blobs store initialized");
    return this.store;
  }

  async upload(
    data: Buffer,
    opts: { key: string; mimeType: string; companyId: string; category: string }
  ): Promise<UploadResult> {
    const store = await this.getStore();
    const fullKey = `companies/${opts.companyId}/${opts.category}/${opts.key}`;
    console.log("[storage] Writing blob, key:", fullKey, "size:", data.length);
    await store.set(fullKey, data, {
      metadata: {
        mimeType: opts.mimeType,
        companyId: opts.companyId,
        category: opts.category,
        uploadedAt: new Date().toISOString(),
      },
    });
    console.log("[storage] Blob written successfully");
    const url = `/api/storage/${fullKey}`;
    return {
      key: fullKey,
      url,
      size: data.length,
      mimeType: opts.mimeType,
    };
  }

  async read(key: string): Promise<{ data: Buffer; mimeType: string } | null> {
    const store = await this.getStore();
    const data = await store.get(key, { type: "bytes" });
    if (!data) {
      console.log("[storage] Blob not found:", key);
      return null;
    }
    const metadata = await store.getMetadata(key);
    const mimeType = metadata?.mimeType ?? "application/octet-stream";
    console.log("[storage] Blob read:", key, "size:", data.length, "mime:", mimeType);
    return { data: Buffer.from(data), mimeType };
  }

  async delete(key: string): Promise<void> {
    const store = await this.getStore();
    try {
      await store.delete(key);
    } catch {
      // best-effort
    }
  }
}

const MIME_MAP: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
  ".weba": "audio/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
};

let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!_provider) {
    _provider = isNetlify() ? new NetlifyBlobProvider() : new LocalStorageProvider();
  }
  return _provider;
}

/**
 * Generate a safe storage key with company-scoped path.
 */
export function generateStorageKey(
  companyId: string,
  category: string,
  ext: string
): string {
  const uuid = randomUUID();
  return `${uuid}.${ext}`;
}

/**
 * Resolve a stored URL for client consumption.
 * - Old-style /uploads/xxx URLs are kept as-is (served by /api/uploads/[...path])
 * - New-style /api/storage/xxx URLs are served by /api/storage/[...key]
 * - Full URLs (https://) are returned as-is
 */
export function resolveMediaUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/storage/")) return url;
  if (url.startsWith("/uploads/")) return url.replace("/uploads/", "/api/uploads/");
  return url;
}

/**
 * Check if a URL points to an old-style local upload that may not exist in production.
 */
export function isLegacyUploadUrl(url: string): boolean {
  return url.startsWith("/uploads/") && !url.startsWith("/api/");
}
