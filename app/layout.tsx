import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "RACKTAG — Warehouse Label Generator",
  description:
    "Build QR tags for bin locations, carts, and cart bins. Pick the variable segments, print or save the label art.",
  themeColor: "#121212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var KEY='racktag_theme';var pref=localStorage.getItem(KEY)||'dark';function resolve(p){if(p==='system'&&window.matchMedia){return window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';}return p==='light'?'light':'dark';}document.documentElement.setAttribute('data-theme',resolve(pref));document.documentElement.setAttribute('data-theme-pref',pref);})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"
          strategy="lazyOnload"
        />
        <Script src="/racktag.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
