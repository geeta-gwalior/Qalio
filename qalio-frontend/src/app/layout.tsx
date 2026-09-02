import type { Metadata } from "next";
import { Geist, Geist_Mono, Jost } from "next/font/google";
import "./globals.css";
// import { Toaster } from "@/components/ui/sonner";
import AuthHydrator from "@/components/common/AuthHydrator";
import ToasterClient from "@/components/common/ToasterClient";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Add the weights you need
  variable: "--font-jost", // For Tailwind
  display: "swap",
});

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Qalio | Assessment & Hiring Platform",
  description:
    "Qalio is a smart assessment and hiring platform designed for students, colleges, companies, and universities to streamline testing, recruitment, and talent discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jost.variable} antialiased`}>
        <AuthHydrator />
        {children}
        <ToasterClient />
      </body>
    </html>
  );
}
