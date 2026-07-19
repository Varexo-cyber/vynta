import { NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await params;

  const safe = segments.filter((s) => !s.includes("..") && !s.includes("\\"));
  if (safe.length !== segments.length) {
    return NextResponse.json({ error: "Ongeldig pad." }, { status: 400 });
  }

  const key = segments.join("/");
  let result;
  try {
    const provider = getStorageProvider();
    result = await provider.read(key);
  } catch (err) {
    console.error("[storage-read] Provider error", err);
    return NextResponse.json(
      { error: "Media kon niet worden geladen.", code: "BLOB_READ_ERROR" },
      { status: 500 }
    );
  }

  if (!result) {
    return NextResponse.json(
      { error: "Bestand niet gevonden.", code: "BLOB_NOT_FOUND" },
      { status: 404 }
    );
  }

  const { data, mimeType } = result;
  const totalLength = data.length;
  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (match) {
      let start: number;
      let end: number;
      if (!match[1] && match[2]) {
        const suffixLength = Math.max(0, parseInt(match[2], 10));
        start = Math.max(0, totalLength - suffixLength);
        end = totalLength - 1;
      } else {
        start = match[1] ? parseInt(match[1], 10) : 0;
        end = match[2] ? parseInt(match[2], 10) : totalLength - 1;
      }
      if (totalLength === 0 || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= totalLength || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${totalLength}` },
        });
      }
      end = Math.min(end, totalLength - 1);
      const chunkSize = end - start + 1;
      const chunk = data.subarray(start, end + 1);

      const headers = new Headers({
        "Content-Type": mimeType,
        "Content-Length": String(chunkSize),
        "Content-Range": `bytes ${start}-${end}/${totalLength}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      });

      return new NextResponse(new Uint8Array(chunk), { status: 206, headers });
    }
    return new NextResponse(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${totalLength}` },
    });
  }

  const headers = new Headers({
    "Content-Type": mimeType,
    "Content-Length": String(totalLength),
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  });

  return new NextResponse(new Uint8Array(data), { status: 200, headers });
}
