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
  title: "ClinicPulse — Real-Time Primary Healthcare Intelligence",
  description:
    "Real-time visibility into South Africa's 3,500+ public primary healthcare clinics. Status tracking, referral routing, and operational intelligence for NGOs, district health managers, and patients.",
  openGraph: {
    title: "ClinicPulse — Know which clinics are working today",
    description:
      "Real-time visibility into South Africa's 3,500+ public primary healthcare clinics.",
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
      <body className="bg-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
