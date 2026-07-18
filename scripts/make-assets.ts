import { existsSync, mkdirSync, readFileSync } from "fs";
import { resolve } from "path";
import sharp from "sharp";

const root = resolve(__dirname, "..");
const assetsDir = resolve(root, "assets");
mkdirSync(assetsDir, { recursive: true });

// Het logo mag op drie plekken staan. De eerste die gevonden wordt wint:
// 1. public/logo.png   (je huidige merklogo)
// 2. assets/logo.png   (vierkant, transparant, ideaal voor app iconen)
// 3. assets/logo.svg   (vector)
// Als alles ontbreekt wordt een placeholder-V gebruikt.
const publicLogoPng = resolve(root, "public", "logo.png");
const assetsLogoPng = resolve(assetsDir, "logo.png");
const assetsLogoSvg = resolve(assetsDir, "logo.svg");

async function loadLogo(): Promise<Buffer> {
  if (existsSync(publicLogoPng)) {
    console.log("Using public/logo.png");
    return readFileSync(publicLogoPng);
  }
  if (existsSync(assetsLogoPng)) {
    console.log("Using assets/logo.png");
    return readFileSync(assetsLogoPng);
  }
  if (existsSync(assetsLogoSvg)) {
    console.log("Using assets/logo.svg");
    return readFileSync(assetsLogoSvg);
  }
  console.log("No logo found; using placeholder V");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="128" fill="#111111"/>
    <text x="256" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="260" font-weight="600" fill="#ffffff" text-anchor="middle">V</text>
  </svg>`;
  return Buffer.from(svg);
}

async function main() {
  const logo = await loadLogo();

  // App icon: 1024x1024 PNG.
  // iOS rond af zelf af, Android gebruikt dit voor adaptieve iconen.
  await sharp(logo)
    .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(assetsDir, "icon.png"));

  // Splash screen: 2732x2732 met logo gecentreerd op ~40% van de breedte.
  const splashBg = { r: 246, g: 246, b: 244, alpha: 1 };
  const splash = await sharp({
    create: { width: 2732, height: 2732, channels: 4, background: splashBg },
  })
    .png()
    .toBuffer();

  const logoForSplash = await sharp(logo)
    .resize(1092, 1092, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp(splash)
    .composite([{ input: logoForSplash, gravity: "center" }])
    .png()
    .toFile(resolve(assetsDir, "splash.png"));

  console.log("Native assets written to ./assets");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
