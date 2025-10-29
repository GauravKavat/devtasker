import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedClerkProvider } from "@/components/clerk-theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DevTasker",
  description: "Developed by developers for developers",
  icons: {
    icon: "/devtasker.svg",
    shortcut: "/devtasker.svg",
    apple: "/devtasker.svg",
  },
  openGraph: {
    title: "DevTasker",
    description: "Developed by developers for developers",
    images: ["/devtasker.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ThemedClerkProvider>
              {children}
              <Analytics />
            </ThemedClerkProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
