import { NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await params;

  const safe = segments.filter((s) => !s.includes("..") && !s.includes("\\"));
  if (safe.length !== segments.length) {
    return NextResponse.json({ error: "Ongeldig pad." }, { status: 400 });
  }

  const key = segments.join("/");

  const provider = getStorageProvider();
  const result = await provider.read(key);

  if (!result) {
    return new NextResponse(null, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": result.mimeType,
    "Content-Length": String(result.data.length),
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  return new NextResponse(new Uint8Array(result.data), { status: 200, headers });
}
