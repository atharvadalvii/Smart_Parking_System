"use client";

import React from 'react';
import Link from 'next/link';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const features = [
    {
      title: "Real-time Monitoring",
      icon: "🟢",
      description: "Check slot status before you arrive. Know exactly where to park with precision."
    },
    {
      title: "QR-Based Entry",
      icon: "📱",
      description: "Enjoy a seamless entry experience using your personal membership QR code. No tickets needed."
    },
    {
      title: "Easy Payment",
      icon: "💳",
      description: "Fares are calculated automatically upon exit. Pay online quickly and efficiently."
    },
    {
      title: "Path Guidance",
      icon: "🗺️",
      description: "The system dynamically guides you to the nearest available slot, saving your time."
    }
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Section 1: Hero */}
      <section className="bg-neutral-warm px-4 md:px-6 lg:px-10 py-[64px] md:py-[120px] w-full border-b border-divider">
        <div className="container mx-auto max-w-[1440px] flex flex-col md:flex-row items-center justify-between gap-[40px]">
          <div className="w-full md:w-[60%] flex flex-col items-start text-left">
            <h1 className="text-[45px] md:text-[58px] font-semibold mb-[24px] leading-[1.2] text-starbucks-green">
              Smart Parking,<br />Simplified
            </h1>
            <p className="text-[19px] text-text-black max-w-2xl mb-[32px] leading-[1.75]">
              Experience the next-generation smart parking management system. Say goodbye to the hassle of finding a spot. With real-time monitoring, automated guidance, and one-click booking, parking has never been easier.
            </p>
            <div className="flex flex-col sm:flex-row gap-[16px]">
              {isAuthenticated ? (
                <>
                  <Link href="/qrcode">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto">My QR Code</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outlineDark" size="lg" className="w-full sm:w-auto">Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto">Get Started</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outlineDark" size="lg" className="w-full sm:w-auto">Dashboard</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="w-full md:w-[40%] flex justify-center items-center">
             {/* Placeholder for hero image */}
             <div className="w-full max-w-[400px] aspect-square bg-ceramic rounded-[50%] flex items-center justify-center border-4 border-white shadow-sm">
                <span className="text-[120px]">🅿️</span>
             </div>
          </div>
        </div>
      </section>

      {/* Section 2: Features */}
      <section className="bg-white px-4 md:px-6 lg:px-10 py-[64px] md:py-[80px]">
        <div className="container mx-auto max-w-[1440px]">
          <h2 className="text-[24px] font-semibold text-center mb-[48px] text-text-black">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[24px] md:gap-[32px]">
            {features.map((feature, index) => (
              <Card key={index} elevated className="flex flex-col items-center text-center h-full">
                <div className="text-[40px] mb-[24px] bg-neutral-warm p-[16px] rounded-[50%]">{feature.icon}</div>
                <h3 className="text-[19px] font-semibold mb-[16px] text-text-black">{feature.title}</h3>
                <p className="text-[16px] text-text-black-soft leading-[1.5]">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Workflow */}
      <section className="bg-house-green px-4 md:px-6 lg:px-10 py-[64px] md:py-[80px] text-white">
        <div className="container mx-auto max-w-[1440px]">
          <h2 className="text-[24px] font-semibold text-center mb-[48px]">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[40px] md:gap-[48px] max-w-[1000px] mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-[56px] h-[56px] rounded-[50%] bg-green-accent text-white text-[24px] font-bold flex items-center justify-center mb-[24px] shadow-[0_0_6px_rgba(0,0,0,0.24)]">1</div>
              <h3 className="text-[19px] font-semibold mb-[16px]">Register & Get QR</h3>
              <p className="text-[16px] text-text-white-soft leading-[1.5]">Create an account to receive your permanent personal parking QR code. Book a slot in advance.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-[56px] h-[56px] rounded-[50%] bg-green-accent text-white text-[24px] font-bold flex items-center justify-center mb-[24px] shadow-[0_0_6px_rgba(0,0,0,0.24)]">2</div>
              <h3 className="text-[19px] font-semibold mb-[16px]">Scan to Enter</h3>
              <p className="text-[16px] text-text-white-soft leading-[1.5]">Present your personal QR code at the entrance. The gate opens automatically if you have an active booking.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-[56px] h-[56px] rounded-[50%] bg-green-accent text-white text-[24px] font-bold flex items-center justify-center mb-[24px] shadow-[0_0_6px_rgba(0,0,0,0.24)]">3</div>
              <h3 className="text-[19px] font-semibold mb-[16px]">Seamless Exit</h3>
              <p className="text-[16px] text-text-white-soft leading-[1.5]">Scan the same QR code upon exit. The system calculates duration and allows you to pay online effortlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: CTA */}
      <section className="bg-neutral-warm px-4 md:px-6 lg:px-10 py-[80px] text-center border-t border-divider">
        <div className="container mx-auto max-w-[1440px]">
          {isAuthenticated ? (
            <>
              <h2 className="text-[24px] font-semibold mb-[32px] text-text-black">Ready to Park?</h2>
              <Link href="/qrcode">
                <Button variant="primary" size="lg">View My QR Code</Button>
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-[24px] font-semibold mb-[32px] text-text-black">Ready to Get Started?</h2>
              <Link href="/register">
                <Button variant="primary" size="lg">Create an Account</Button>
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
