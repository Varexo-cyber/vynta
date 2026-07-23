import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

const dist = resolve(process.cwd(), "dist");
mkdirSync(dist, { recursive: true });

// Deze URL laadt de app in de native webview.
// Lokaal testen: zet dit op je dev machine IP, bijv. http://192.168.1.10:3000
const serverUrl =
  process.env.CAPACITOR_SERVER_URL || "https://vynta.nl";

writeFileSync(
  resolve(dist, "index.html"),
  `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#f6f6f4" />
    <title>Vynta</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        display: grid;
        place-items: center;
        height: 100vh;
        background: #f6f6f4;
        color: #111111;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .loader {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(17,17,17,0.1);
        border-top-color: #111111;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="loader"></div>
    <script>
      window.location.href = "${serverUrl}";
    </script>
  </body>
</html>`
);

console.log(`Mobile shell points to ${serverUrl}`);

execSync("npx cap sync", { stdio: "inherit" });
