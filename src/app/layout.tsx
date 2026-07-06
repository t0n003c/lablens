import type { Metadata, Viewport } from "next";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabLens",
  description: "Private lab report summaries for self-hosted health tracking.",
  applicationName: "LabLens",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "LabLens",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/lablens-icon.svg", type: "image/svg+xml" },
      { url: "/icons/lablens-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/lablens-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/lablens-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
