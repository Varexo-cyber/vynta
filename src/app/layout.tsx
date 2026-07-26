import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NativeAppProvider } from "@/components/native-app-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vynta — Het zakelijke netwerk van Nederland",
  description:
    "Het gratis zakelijke socialmediaplatform waar Nederlandse bedrijven zich presenteren, kansen vinden en rechtstreeks met elkaar in contact komen.",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png?v=3",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vynta",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('vynta-theme');
    var d = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', d);
    document.documentElement.style.colorScheme = d ? 'dark' : 'light';
    var c = window.Capacitor;
    var l = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    var q = new URLSearchParams(location.search).get('app-preview');
    if (l && q === '1') sessionStorage.setItem('vynta-app-preview', '1');
    if (l && q === '0') sessionStorage.removeItem('vynta-app-preview');
    var p = l && (q === '1' || sessionStorage.getItem('vynta-app-preview') === '1');
    if (p || (c && typeof c.isNativePlatform === 'function' && c.isNativePlatform())) {
      document.documentElement.classList.add('native-app');
      document.documentElement.dataset.platform =
        p ? 'preview' : (c && typeof c.getPlatform === 'function' ? c.getPlatform() : 'native');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-light.png?v=5"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          type="image/png"
          href="/favicon-dark.png?v=5"
          media="(prefers-color-scheme: dark)"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <NativeAppProvider>{children}</NativeAppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
