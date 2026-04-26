"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Button from './Button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Booking', href: '/booking' },
    { name: 'History', href: '/history' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_2px_2px_rgba(0,0,0,0.06),0_0_2px_rgba(0,0,0,0.07)] h-[72px] md:h-[83px] lg:h-[99px] flex items-center transition-all duration-300">
      <div className="container mx-auto px-4 md:px-6 lg:px-10 max-w-[1440px] flex items-center justify-between w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[24px] font-bold tracking-tight text-starbucks-green uppercase">SmartParking</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="text-[16px] font-semibold text-text-black hover:text-green-accent transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <Button variant="outlineDark">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button variant="black">Join now</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden flex flex-col justify-center items-center w-12 h-12 space-y-1.5 focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-[2px] bg-text-black transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-[2px] bg-text-black transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`block w-6 h-[2px] bg-text-black transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg border-b border-divider flex flex-col md:hidden">
          <nav className="flex flex-col p-4 space-y-4">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-lg font-medium text-text-black border-b border-divider pb-4 pt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outlineDark" className="w-full">Sign in</Button>
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                <Button variant="black" className="w-full">Join now</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
