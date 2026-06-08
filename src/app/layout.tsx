import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navigation } from "@/components/layout/Navigation";
import { ThemeAwareToaster } from "@/components/layout/ThemeAwareToaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "mybooks",
  description: "Personal library for books, comics, and photobooks",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "mybooks",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#07080a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('theme-mode');var r=document.documentElement;r.classList.remove('theme-light','theme-dark');if(m==='light')r.classList.add('theme-light');else if(m==='dark')r.classList.add('theme-dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <Navigation />
        {children}
        <ThemeAwareToaster />
      </body>
    </html>
  );
}
