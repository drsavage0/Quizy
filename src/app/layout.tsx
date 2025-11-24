import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Providers } from "@/components/Providers";
import AppHeader from "@/components/shared/AppHeader";
import FloatingIconsBackground from "@/components/shared/FloatingIconsBackground";
import AdBanner from "@/components/shared/AdBanner";
import Script from "next/script"; // Added this for Ads

export const metadata: Metadata = {
  title: "Quizy - Test Your Knowledge!",
  description: "An AI-powered quiz game. Choose a topic, take a quiz, and climb the leaderboard!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* This is the Google AdSense Connection Code */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6735324159548317"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased text-foreground min-h-screen flex flex-col relative overflow-x-hidden`}>
        <FloatingIconsBackground />
        <Providers>
          <AppHeader />
          <AdBanner />
          <main className="flex-grow container mx-auto px-4 py-8 animate-fadeIn z-10 relative">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}