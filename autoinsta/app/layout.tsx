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
        <header className="w-full border-b bg-white">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex gap-4 text-sm">
            <a className="font-semibold" href="/">Dashboard</a>
            <a href="/upload">Upload</a>
            <a href="/posts">Posts</a>
            <a href="/profile">Profile</a>
            <a href="/schedule">Schedule</a>
          </nav>
        </header>
        <div className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
