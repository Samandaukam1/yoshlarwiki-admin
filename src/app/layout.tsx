import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { themeInitScript } from "@/components/theme";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "YoshlarWiki Admin",
    template: "%s | YoshlarWiki Admin",
  },
  description: "YoshlarWiki boshqaruv paneli.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/assets/brand/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/brand/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/brand/favicons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/assets/brand/favicons/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/assets/brand/favicons/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/assets/brand/favicons/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/brand/favicons/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/assets/brand/favicons/favicon-32x32.png",
    apple: "/assets/brand/favicons/favicon-180x180.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#000c1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
