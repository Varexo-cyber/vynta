import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { stat } from "node:fs/promises";

const MIME: Record<string, string> = {
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
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  const safe = segments.filter((s) => !s.includes("..") && !s.includes("\\"));
  if (safe.length !== segments.length) {
    return NextResponse.json({ error: "Ongeldig pad." }, { status: 400 });
  }

  const filename = segments.join("/");
  const filePath = join(process.cwd(), "public", "uploads", ...safe);

  try {
    const st = await stat(filePath);
    if (!st.isFile()) {
      return NextResponse.json({ error: "Bestand niet gevonden." }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Bestand niet gevonden." }, { status: 404 });
  }

  const ext = (filename.split(".").pop() ?? "").toLowerCase();
  const contentType = MIME[`.${ext}`] || "application/octet-stream";

  const data = await readFile(filePath);
  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Length": String(data.length),
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  return new NextResponse(data, { status: 200, headers });
}
