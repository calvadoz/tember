import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";

import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const messages = getMessages();

export const metadata: Metadata = {
  title: {
    default: messages.common.appName,
    template: messages.metadata.titleTemplate,
  },
  description: messages.metadata.description,
  applicationName: messages.common.appName,
  openGraph: {
    type: "website",
    siteName: messages.common.appName,
    title: messages.metadata.shareTitle,
    description: messages.metadata.shareDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: messages.metadata.shareTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: messages.metadata.shareTitle,
    description: messages.metadata.shareDescription,
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#061b0e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={defaultLocale}>
      <body className={`${inter.variable} ${montserrat.variable}`}>
        {children}
      </body>
    </html>
  );
}
