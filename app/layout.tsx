import type { Metadata, Viewport } from "next";
import { Poppins, Tiro_Devanagari_Hindi, Kalam } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout"; // Import the new wrapper

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

export const metadata: Metadata = {
  title: "Mission 2029",
  description: "Jai Bharat, Jai Pratapgarh",
  manifest: "/manifest.json", 
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <body className={`${poppins.variable} ${tiro.variable} ${kalam.variable} bg-neutral-100 overflow-x-hidden`}>
        {/* Use the new ClientLayout to wrap everything */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}