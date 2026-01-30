import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Layer & Order",
  description: "Stem Archive & AI Mastering Service",
};

import { GNB } from "@/components/shared/GNB";
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>
          <GNB />
          {children}
        </Providers>
      </body>
    </html>
  );
}
