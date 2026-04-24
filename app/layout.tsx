import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
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
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-neutral-900">
        {children}
      </body>
    </html>
  );
}
