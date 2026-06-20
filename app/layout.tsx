import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Libre_Franklin,
  Francois_One,
} from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jentoBrand = Libre_Franklin({
  variable: "--font-jento",
  subsets: ["latin"],
  weight: "700",
});

const francoisOne = Francois_One({
  variable: "--font-francois-one",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter-family",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jento — Travel better.",
  description:
    "AI-powered travel planning with personalized itineraries, maps, and booking links",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${jentoBrand.variable} ${francoisOne.variable} ${inter.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
