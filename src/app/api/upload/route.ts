import { NextResponse } from "next/server";
import { getStorageProvider, generateStorageKey } from "@/lib/storage";

const LIMITS = {
  image: 100 * 1024 * 1024, // 100 MB
  video: 500 * 1024 * 1024, // 500 MB
  audio: 100 * 1024 * 1024, // 100 MB
  document: 100 * 1024 * 1024, // 100 MB
};

const ALLOWED = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"],
  video: ["video/mp4", "video/webm", "video/quicktime", "video/mov"],
  audio: ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg", "audio/aac"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
    "text/plain",
  ],
};

const DANGEROUS_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "bin", "msi", "dmg", "apk", "app", "scr", "pif",
  "vbs", "js", "jar", "wsf", "hta", "com", "cpp",
]);

const DANGEROUS_MIMES = new Set([
  "application/x-msdownload",
  "application/x-exe",
  "application/x-msdos-program",
  "application/x-sh",
  "application/x-javascript",
  "text/html",
]);

function isDangerous(file: File, category: string | null): boolean {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(ext)) return true;
  if (DANGEROUS_MIMES.has(file.type)) return true;
  if (category === null && file.type.startsWith("application/octet-stream")) {
    // Reject generic binary streams without a recognized document type.
    return true;
  }
  return false;
}

function detectCategory(type: string): "image" | "video" | "audio" | "document" | null {
  if (ALLOWED.image.includes(type)) return "image";
  if (ALLOWED.video.includes(type)) return "video";
  if (ALLOWED.audio.includes(type)) return "audio";
  if (ALLOWED.document.includes(type)) return "document";
  return null;
}

function extension(file: File, category: "image" | "video" | "audio" | "document") {
  const original = file.name.split(".").pop()?.toLowerCase();
  if (original && /^[a-z0-9]{1,6}$/.test(original)) return original;
  if (category === "image") return "jpg";
  if (category === "video") return "mp4";
  if (category === "audio") return "webm";
  return "pdf";
}

export async function POST(request: Request) {
  console.log("[upload] POST received, content-type:", request.headers.get("content-type"));

  let session;
  try {
    const { getSession } = await import("@/lib/auth");
    session = await getSession();
  } catch (authErr) {
    console.error("[upload] Auth error:", authErr);
    return NextResponse.json(
      { error: "Authenticatie mislukt.", code: "UPLOAD_AUTH_ERROR" },
      { status: 500 }
    );
  }

  if (!session) {
    return NextResponse.json(
      { error: "Je sessie is verlopen. Log opnieuw in.", code: "UPLOAD_UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Geen bestand ontvangen.", code: "UPLOAD_FILE_MISSING" },
        { status: 400 }
      );
    }

    console.log("[upload] File received:", file.name, "size:", file.size, "type:", file.type);

    const category = detectCategory(file.type);
    if (!category || isDangerous(file, category)) {
      return NextResponse.json(
        { error: "Dit bestandstype is niet toegestaan.", code: "UPLOAD_INVALID_TYPE" },
        { status: 415 }
      );
    }

    if (file.size > LIMITS[category]) {
      const mb = Math.round(LIMITS[category] / 1024 / 1024);
      return NextResponse.json(
        { error: `Bestand te groot. Maximaal ${mb} MB voor ${category}.`, code: "UPLOAD_TOO_LARGE" },
        { status: 413 }
      );
    }

    const ext = extension(file, category);
    const companyId = session.company.id;
    const storageKey = generateStorageKey(companyId, category, ext);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("[upload] Starting storage upload, key:", storageKey, "company:", companyId);

    const provider = getStorageProvider();
    const result = await provider.upload(buffer, {
      key: storageKey,
      mimeType: file.type,
      companyId,
      category,
    });

    console.log("[upload] Storage upload succeeded, url:", result.url);

    let width: number | undefined;
    let height: number | undefined;
    if (category === "image") {
      try {
        const sharp = (await import("sharp")).default;
        const meta = await sharp(buffer).metadata();
        width = meta.width ?? undefined;
        height = meta.height ?? undefined;
      } catch (sharpErr) {
        console.warn("[upload] sharp unavailable, skipping dimensions:", sharpErr);
      }
    }

    return NextResponse.json({
      ok: true,
      url: result.url,
      key: result.key,
      type: category,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      width,
      height,
    });
  } catch (err) {
    console.error("[upload] Upload failed:", err);
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json(
      { error: `Upload mislukt: ${message}`, code: "UPLOAD_STORAGE_ERROR" },
      { status: 500 }
    );
  }
}
