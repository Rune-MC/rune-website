import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://runemc.dev"),
  title: {
    default: "Rune: polyglot scripting for Paper Minecraft servers",
    template: "%s · Rune",
  },
  description:
    "Write your Paper plugin in TypeScript. In your Paper plugin. Rune embeds language runtimes (V8, Wasm, and more) inside the Paper JVM via a Rust loader on Panama FFM. No sidecar process, no IPC.",
  openGraph: {
    title: "Rune",
    description:
      "Polyglot scripting for Paper Minecraft servers, embedded inside the JVM.",
    url: "https://runemc.dev",
    siteName: "Rune",
    locale: "en_US",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
