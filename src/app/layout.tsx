
import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Providers } from "@/components/Providers";
import AppHeader from "@/components/shared/AppHeader";
import FloatingIconsBackground from "@/components/shared/FloatingIconsBackground"; // Import the new component
import AdBanner from "@/components/shared/AdBanner"; // Import the AdBanner component

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
    // The dir and lang attributes will be set by the LanguageProvider via useEffect
    <html lang="en" dir="ltr"> 
      {/* The bg-background class is kept as a fallback if the image doesn't load */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased text-foreground min-h-screen flex flex-col relative overflow-x-hidden`}>
        <FloatingIconsBackground /> {/* Floating icons will be on top of the body background image */}
        <Providers>
          <AppHeader /> {/* AppHeader has z-50 */}
          <AdBanner /> {/* Add the AdBanner component here */}
          <main className="flex-grow container mx-auto px-4 py-8 animate-fadeIn z-10 relative"> {/* Ensure main content has a higher z-index or is relative */}
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
