import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { CoachChat } from "@/components/cireern/coach-chat";
import "./globals.css";

/** Soft geometric sans — body, UI, long copy (Gen Z–friendly, high legibility). */
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

/** Quirky grotesque display — logos, page titles; contrasts with Plus Jakarta. */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap"
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "CareerGuide — Psychometric careers",
  description: "AI-assisted career assessment and guidance"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <div className="flex flex-1 flex-col">
            {children}
            <CoachChat />
          </div>
        </Providers>
      </body>
    </html>
  );
}
