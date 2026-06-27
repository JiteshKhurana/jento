import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import {
  Geist,
  Geist_Mono,
  Inter,
  Libre_Franklin,
  Francois_One,
} from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PendoInitializer } from "@/components/pendo-initializer";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  title: "Jento — Travel better.",
  description:
    "AI-powered travel planning with personalized itineraries, maps, and booking links",
  metadataBase: new URL("https://jento.in"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jento",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
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
        <head>
          {/* PWA — enables "Add to Home Screen" on Android Chrome */}
          <meta name="mobile-web-app-capable" content="yes" />
          <Script
            id="pendo-bootstrap"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(apiKey){(function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];v=['initialize','identify','updateOptions','pageLoad','track','trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');})('f8ca1224-1ec4-4157-97b6-c26a8d7c9442');`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col font-sans">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PendoInitializer />
            {children}
            <PwaInstallPrompt />
          </ThemeProvider>
          <PwaRegister />
        </body>
      </html>
    </ClerkProvider>
  );
}
