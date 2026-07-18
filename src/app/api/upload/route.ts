import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getSession } from "@/lib/auth";
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 });
    }

    const category = detectCategory(file.type);
    if (!category || isDangerous(file, category)) {
      return NextResponse.json(
        { error: "Dit bestandstype is niet toegestaan." },
        { status: 400 }
      );
    }

    if (file.size > LIMITS[category]) {
      const mb = Math.round(LIMITS[category] / 1024 / 1024);
      return NextResponse.json(
        { error: `Bestand te groot. Maximaal ${mb} MB voor ${category}.` },
        { status: 413 }
      );
    }

    const ext = extension(file, category);
    const companyId = session.company.id;
    const storageKey = generateStorageKey(companyId, category, ext);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const provider = getStorageProvider();
    const result = await provider.upload(buffer, {
      key: storageKey,
      mimeType: file.type,
      companyId,
      category,
    });

    let width: number | undefined;
    let height: number | undefined;
    if (category === "image") {
      try {
        const meta = await sharp(buffer).metadata();
        width = meta.width ?? undefined;
        height = meta.height ?? undefined;
      } catch {
        // leave dimensions undefined
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
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: "Upload mislukt, probeer het opnieuw." },
      { status: 500 }
    );
  }
}
