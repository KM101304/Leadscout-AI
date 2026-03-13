import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import { TopNav } from "@/components/TopNav";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

export const metadata: Metadata = {
  title: "LeadScout AI",
  description: "Find local businesses with digital weaknesses and turn them into outbound opportunities."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${spaceGrotesk.variable}`}>
        <TopNav />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
