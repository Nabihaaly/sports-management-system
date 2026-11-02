import type { Metadata } from "next";
import { Archivo, DM_Sans } from "next/font/google";
import "./global.css";
import { Toaster } from "react-hot-toast";
import { SportsProvider } from "@/Context/SportsContext";
import Navbar from "@/Components/Navbar";
import AuthModals from "@/Components/AuthModals";

// Variable Archivo with the width axis → condensed display headings (font-stretch in CSS)
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["wdth"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Court Connect",
  description: "Book any court. Find a rival at your level. Walk the court in 3D before you show up.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SportsProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { borderRadius: 999, background: "#0f1a16", color: "#fff", fontSize: 14 },
            }}
          />
          <Navbar />
          {children}
          <AuthModals />
        </SportsProvider>
      </body>
    </html>
  );
}
