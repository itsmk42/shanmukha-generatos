import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shanmukha Generators - Used Generator Marketplace",
  description: "Find quality used generators from trusted sellers. Browse our catalog of diesel generators, gensets, and power equipment with detailed specifications and competitive prices.",
  keywords: "used generators, diesel generators, gensets, power equipment, generators for sale, second hand generators",
  authors: [{ name: "Shanmukha Generators" }],
  openGraph: {
    title: "Shanmukha Generators - Used Generator Marketplace",
    description: "Find quality used generators from trusted sellers",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
