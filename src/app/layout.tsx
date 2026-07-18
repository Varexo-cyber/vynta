import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vynta — Het Digitale Bedrijfsnetwerk van Nederland",
  description:
    "Vind, contacteer en doe zaken met lokale bedrijven in minuten. Vynta verbindt het Nederlandse bedrijfsleven.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png?v=3",
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
  themeColor: "#f6f6f4",
};

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('vynta-theme');
    if (t !== 'light') document.documentElement.classList.add('dark');
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
        <link rel="icon" type="image/png" href="/favicon.png?v=3" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
