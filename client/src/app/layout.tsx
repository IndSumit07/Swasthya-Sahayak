import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Swasthya Sahayak | Integrated Rural & Public Healthcare Access",
  description: "Bridging the rural healthcare divide with assisted teleconsultation, digital triage, longitudinal patient records, and real-time referral tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans bg-[#FAFAFA] text-slate-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
