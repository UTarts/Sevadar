import type { Metadata, Viewport } from "next";
import { Poppins, Tiro_Devanagari_Hindi, Kalam } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout"; 
import Script from "next/script"; // Import Script for JSON-LD

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "600", "700"],
  variable: "--font-poppins"
});

const tiro = Tiro_Devanagari_Hindi({ 
  weight: "400", 
  subsets: ["devanagari"],
  variable: "--font-tiro"
});

const kalam = Kalam({
  weight: "700",
  subsets: ["devanagari"],
  variable: "--font-kalam"
});

// --- SEO STRATEGY ---
export const metadata: Metadata = {
  metadataBase: new URL('https://brijeshtiwari.in'),
  title: {
    default: "Brijesh Tiwari - Sevadar Pratapgarh | Mission 2029",
    template: "%s | Brijesh Tiwari Sevadar"
  },
  description: "Official website of Brijesh Kumar Tiwari (Sevadar). Join Mission 2029 for a developed Pratapgarh. Social service, daily updates, and community connection.",
  keywords: [
    "Brijesh Tiwari", "Brijesh Kumar Tiwari", "Sevadar", "Pratapgarh", 
    "Mission 2029", "Lok Sabha Pratapgarh", "Social Worker Pratapgarh", 
    "Politics UP", "Pratapgarh Development", "brijeshtiwari.in"
  ],
  authors: [{ name: "Brijesh Tiwari", url: "https://brijeshtiwari.in" }],
  creator: "UT Arts",
  publisher: "UT Arts",
  manifest: "/manifest.json",
  icons: {
    icon: '/logo.webp',
    shortcut: '/logo.webp',
    apple: '/logo.webp',
  },
  openGraph: {
    title: "Sevadar Pratapgarh - Brijesh Tiwari",
    description: "Join the movement for a better Pratapgarh. Lok Sabha Mission 2029.",
    url: 'https://brijeshtiwari.in',
    siteName: 'Sevadar - Mission 2029',
    locale: 'hi_IN',
    type: 'website',
    images: [
      {
        url: '/logo.webp', 
        width: 800,
        height: 800,
        alt: 'Brijesh Tiwari Sevadar Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brijesh Tiwari - Sevadar Pratapgarh',
    description: 'Jai Bharat, Jai Pratapgarh | Lok Sabha Mission 2029',
    images: ['/logo.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF9933", // Orange theme for browser bar
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Brijesh Kumar Tiwari",
  "alternateName": ["Sevadar", "Brijesh Tiwari Pratapgarh"],
  "url": "https://brijeshtiwari.in",
  "image": "https://brijeshtiwari.in/posters/BT.webp",
  "jobTitle": "Social Worker & Politician",
  "worksFor": {
    "@type": "Organization",
    "name": "Sevadar Mission 2029 - Lok Sabha Pratapgarh"
  },
  "homeLocation": {
    "@type": "Place",
    "name": "Pratapgarh, Uttar Pradesh, India"
  },
  "description": "Brijesh Tiwari is a dedicated social worker and 'Sevadar' committed to the development of Pratapgarh through Lok Sabha Mission 2029."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <body className={`${poppins.variable} ${tiro.variable} ${kalam.variable} bg-neutral-100 overflow-x-hidden`}>
        
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}