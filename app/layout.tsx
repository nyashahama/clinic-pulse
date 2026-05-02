import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClinicPulse - Live Clinic Availability",
  description:
    "Live clinic availability, field reporting, patient rerouting, and audit history for district health teams.",
  openGraph: {
    title: "ClinicPulse - Know which clinics can serve patients right now",
    description:
      "Live clinic availability, field reporting, patient rerouting, and audit history for district health teams.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${satoshi.variable} ${geistMono.variable}`}
    >
      <body className="bg-background text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
