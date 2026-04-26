import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-house-green mt-auto">
      <div className="container mx-auto px-4 md:px-6 lg:px-10 max-w-[1440px] py-[32px] md:py-[48px] flex flex-col justify-center items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[24px] font-bold text-white uppercase tracking-tight">SmartParking</span>
        </div>

        <div className="text-[14px] text-text-white-soft">
          &copy; {new Date().getFullYear()} CITS5506 Group 19. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
