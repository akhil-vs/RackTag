import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import RegisterSW from "./register-sw";
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/600.css";
import "@fontsource/oswald/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "RACKTAG — Warehouse Label Generator",
  description:
    "Build QR tags for bin locations, carts, and cart bins. Pick the variable segments, print or save the label art.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "RackTag",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5C400",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <RegisterSW />
        <Analytics />
        <Script
          src="/vendor/qrcode.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="/vendor/zxing.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="/vendor/tesseract.min.js"
          strategy="lazyOnload"
        />
        <Script src="/racktag.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
