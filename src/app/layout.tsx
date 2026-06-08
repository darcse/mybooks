import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Navigation } from "@/components/layout/Navigation";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "mybooks",
  description: "Personal library for books, comics, and photobooks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <Navigation />
        {children}
        <Toaster position="top-center" theme="dark" closeButton />
      </body>
    </html>
  );
}
