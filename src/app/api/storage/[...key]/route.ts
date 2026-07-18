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
  console.log("[storage-read] Request for key:", key);

  let result;
  try {
    const provider = getStorageProvider();
    result = await provider.read(key);
  } catch (err) {
    console.error("[storage-read] Provider error for key:", key, err);
    return NextResponse.json(
      { error: "Media kon niet worden geladen.", code: "BLOB_READ_ERROR" },
      { status: 500 }
    );
  }

  if (!result) {
    console.log("[storage-read] Not found:", key);
    return NextResponse.json(
      { error: "Bestand niet gevonden.", code: "BLOB_NOT_FOUND" },
      { status: 404 }
    );
  }

  const { data, mimeType } = result;
  const totalLength = data.length;
  console.log("[storage-read] Serving:", key, "size:", totalLength, "mime:", mimeType);

  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (match) {
      let start = match[1] ? parseInt(match[1], 10) : 0;
      let end = match[2] ? parseInt(match[2], 10) : totalLength - 1;
      if (start > totalLength - 1) start = totalLength - 1;
      if (end > totalLength - 1) end = totalLength - 1;
      const chunkSize = end - start + 1;
      const chunk = data.subarray(start, end + 1);
      console.log("[storage-read] Range:", start, "-", end, "/", totalLength, "chunk:", chunkSize);

      const headers = new Headers({
        "Content-Type": mimeType,
        "Content-Length": String(chunkSize),
        "Content-Range": `bytes ${start}-${end}/${totalLength}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      });

      return new NextResponse(new Uint8Array(chunk), { status: 206, headers });
    }
  }

  const headers = new Headers({
    "Content-Type": mimeType,
    "Content-Length": String(totalLength),
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  return new NextResponse(new Uint8Array(data), { status: 200, headers });
}
