import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: 'swap',
});

export const metadata = {
  title: "Smart Parking System",
  description: "Smart Parking Management System with real-time slot monitoring, booking, and navigation.",
};

import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { ParkingProvider } from "@/contexts/ParkingContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans antialiased min-h-screen bg-neutral-warm text-text-black flex flex-col`}>
        <AuthProvider>
          <ParkingProvider>
            <BookingProvider>
              <Navbar />
              <main className="flex-grow flex flex-col">
                {children}
              </main>
              <Footer />
            </BookingProvider>
          </ParkingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
