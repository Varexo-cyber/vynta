import { existsSync, mkdirSync, readFileSync } from "fs";
import { resolve } from "path";
import sharp from "sharp";

const root = resolve(__dirname, "..");
const assetsDir = resolve(root, "assets");
mkdirSync(assetsDir, { recursive: true });

const nativeBrandIcon = resolve(root, "icons", "icon-512.webp");
const publicLogoPng = resolve(root, "public", "logo.png");
const assetsLogoPng = resolve(assetsDir, "logo.png");
const assetsLogoSvg = resolve(assetsDir, "logo.svg");

async function loadLogo(): Promise<Buffer> {
  if (existsSync(nativeBrandIcon)) {
    console.log("Using the official Vynta app mark");
    const dot = Buffer.from(
      `<svg width="512" height="512"><circle cx="374" cy="370" r="40" fill="#ff4f1f"/></svg>`
    );
    return sharp(nativeBrandIcon)
      .resize(512, 512)
      .composite([{ input: dot }])
      .png()
      .toBuffer();
  }
  if (existsSync(publicLogoPng)) {
    console.log("Using the Vynta website mark");
    return sharp(publicLogoPng)
      // This is the same centered crop used by VyntaMark on the website.
      .extract({ left: 448, top: 192, width: 640, height: 640 })
      .png()
      .toBuffer();
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

  await sharp(logo)
    .resize(180, 180, { fit: "cover" })
    .png()
    .toFile(resolve(root, "public", "favicon.png"));
  await sharp(logo)
    .resize(180, 180, { fit: "cover" })
    .png()
    .toFile(resolve(root, "public", "apple-touch-icon.png"));

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

  await writeAndroidIcons(logo);
  await writeAndroidSplashes(logo);

  console.log("Native assets written to ./assets and Android resources");
}

const androidRes = resolve(root, "android", "app", "src", "main", "res");

async function writeAndroidIcons(logo: Buffer) {
  const densities = [
    { name: "ldpi", launcher: 36, adaptive: 81 },
    { name: "mdpi", launcher: 48, adaptive: 108 },
    { name: "hdpi", launcher: 72, adaptive: 162 },
    { name: "xhdpi", launcher: 96, adaptive: 216 },
    { name: "xxhdpi", launcher: 144, adaptive: 324 },
    { name: "xxxhdpi", launcher: 192, adaptive: 432 },
  ];

  for (const density of densities) {
    const directory = resolve(androidRes, `mipmap-${density.name}`);
    mkdirSync(directory, { recursive: true });

    const launcher = await sharp(logo)
      .resize(density.launcher, density.launcher, { fit: "cover" })
      .png()
      .toBuffer();
    await sharp(launcher).toFile(resolve(directory, "ic_launcher.png"));

    const circleMask = Buffer.from(
      `<svg width="${density.launcher}" height="${density.launcher}"><circle cx="50%" cy="50%" r="50%" fill="white"/></svg>`
    );
    await sharp(launcher)
      .composite([{ input: circleMask, blend: "dest-in" }])
      .png()
      .toFile(resolve(directory, "ic_launcher_round.png"));

    await sharp({
      create: {
        width: density.adaptive,
        height: density.adaptive,
        channels: 4,
        background: { r: 17, g: 17, b: 17, alpha: 1 },
      },
    })
      .png()
      .toFile(resolve(directory, "ic_launcher_background.png"));

    const foregroundSize = Math.round(density.adaptive * 0.78);
    const foreground = await sharp(logo)
      .resize(foregroundSize, foregroundSize, { fit: "cover" })
      .png()
      .toBuffer();
    await sharp({
      create: {
        width: density.adaptive,
        height: density.adaptive,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      },
    })
      .composite([{ input: foreground, gravity: "center" }])
      .png()
      .toFile(resolve(directory, "ic_launcher_foreground.png"));
  }
}

async function writeAndroidSplashes(logo: Buffer) {
  const screens = [
    { directory: "drawable", width: 320, height: 480, dark: false },
    { directory: "drawable-night", width: 320, height: 240, dark: true },
    { directory: "drawable-land-ldpi", width: 320, height: 240, dark: false },
    { directory: "drawable-land-mdpi", width: 480, height: 320, dark: false },
    { directory: "drawable-land-hdpi", width: 800, height: 480, dark: false },
    { directory: "drawable-land-xhdpi", width: 1280, height: 720, dark: false },
    { directory: "drawable-land-xxhdpi", width: 1600, height: 960, dark: false },
    { directory: "drawable-land-xxxhdpi", width: 1920, height: 1280, dark: false },
    { directory: "drawable-port-ldpi", width: 240, height: 320, dark: false },
    { directory: "drawable-port-mdpi", width: 320, height: 480, dark: false },
    { directory: "drawable-port-hdpi", width: 480, height: 800, dark: false },
    { directory: "drawable-port-xhdpi", width: 720, height: 1280, dark: false },
    { directory: "drawable-port-xxhdpi", width: 960, height: 1600, dark: false },
    { directory: "drawable-port-xxxhdpi", width: 1280, height: 1920, dark: false },
  ];

  const withNight = [
    ...screens,
    ...screens
      .filter((screen) => screen.directory.includes("-land-") || screen.directory.includes("-port-"))
      .map((screen) => ({
        ...screen,
        directory: screen.directory.replace("drawable-", "drawable-").replace(
          /^(drawable-(?:land|port))-/,
          "$1-night-"
        ),
        dark: true,
      })),
  ];

  for (const screen of withNight) {
    const directory = resolve(androidRes, screen.directory);
    mkdirSync(directory, { recursive: true });
    const markSize = Math.max(76, Math.round(Math.min(screen.width, screen.height) * 0.24));
    const mark = await sharp(logo)
      .resize(markSize, markSize, { fit: "cover" })
      .png()
      .toBuffer();
    await sharp({
      create: {
        width: screen.width,
        height: screen.height,
        channels: 4,
        background: screen.dark
          ? { r: 5, g: 5, b: 5, alpha: 1 }
          : { r: 246, g: 244, b: 241, alpha: 1 },
      },
    })
      .composite([{ input: mark, gravity: "center" }])
      .png()
      .toFile(resolve(directory, "splash.png"));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
