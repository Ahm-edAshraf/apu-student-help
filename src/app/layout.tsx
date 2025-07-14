import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast";
import PWAInstaller from "@/components/pwa-installer";
import KeyboardShortcuts from "@/components/keyboard-shortcuts";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APU Study Hub",
  description: "One Website to Rule Your GPA - Built for APU students",
  keywords: ["APU", "students", "study", "academic", "productivity", "AI", "assistant"],
  authors: [{ name: "APU Study Hub Team" }],
  creator: "APU Study Hub",
  publisher: "APU Study Hub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "APU Study Hub",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "APU Study Hub",
    "application-name": "APU Study Hub",
    "msapplication-TileColor": "#3b82f6",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#3b82f6",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <ToastProvider>
          <AuthProvider>
            {children}
            <Footer />
            <PWAInstaller />
            <KeyboardShortcuts />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
