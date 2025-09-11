import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InstaAuto",
  description: "Instagram automation dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="w-full sticky top-0 z-20">
          <div className="backdrop-blur supports-[backdrop-filter]:bg-white/50 border-b">
            <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-sm">
              <a className="font-semibold" href="/">InstaAuto</a>
              <div className="flex gap-4">
                <a href="/upload" className="hover:underline">Upload</a>
                <a href="/posts" className="hover:underline">Posts</a>
                <a href="/profile" className="hover:underline">Profile</a>
                <a href="/schedule" className="hover:underline">Schedule</a>
              </div>
            </nav>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
