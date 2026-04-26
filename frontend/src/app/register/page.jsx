"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    licensePlate: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    
    if (!formData.licensePlate) {
      newErrors.licensePlate = 'License plate is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Registration attempt with:', formData);
      // Backend integration will go here
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-neutral-warm p-4 py-[64px]">
      <Card className="w-full max-w-[600px]" elevated>
        <div className="text-center mb-[32px]">
          <h1 className="text-[28px] font-semibold mb-[8px] text-starbucks-green">Create an Account</h1>
          <p className="text-[16px] text-text-black-soft">Register to start experiencing smart parking.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-[24px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] md:gap-[24px]">
            <div>
              <label className="block text-[14px] font-semibold mb-[8px] text-text-black" htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-[12px] py-[12px] border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent focus:border-green-accent transition-colors ${
                  errors.name ? 'border-error bg-error/5 text-error focus:ring-error focus:border-error' : 'border-[#d6dbde]'
                }`}
              />
              {errors.name && <p className="mt-[4px] text-[13px] text-error">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-[14px] font-semibold mb-[8px] text-text-black" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-[12px] py-[12px] border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent focus:border-green-accent transition-colors ${
                  errors.phone ? 'border-error bg-error/5 text-error focus:ring-error focus:border-error' : 'border-[#d6dbde]'
                }`}
              />
              {errors.phone && <p className="mt-[4px] text-[13px] text-error">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-semibold mb-[8px] text-text-black" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-[12px] py-[12px] border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent focus:border-green-accent transition-colors ${
                errors.email ? 'border-error bg-error/5 text-error focus:ring-error focus:border-error' : 'border-[#d6dbde]'
              }`}
            />
            {errors.email && <p className="mt-[4px] text-[13px] text-error">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-[14px] font-semibold mb-[8px] text-text-black" htmlFor="licensePlate">License Plate</label>
            <input
              id="licensePlate"
              name="licensePlate"
              type="text"
              value={formData.licensePlate}
              onChange={handleChange}
              placeholder="e.g. 1ABC123"
              className={`w-full px-[12px] py-[12px] border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent focus:border-green-accent transition-colors ${
                errors.licensePlate ? 'border-error bg-error/5 text-error focus:ring-error focus:border-error' : 'border-[#d6dbde]'
              }`}
            />
            {errors.licensePlate && <p className="mt-[4px] text-[13px] text-error">{errors.licensePlate}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] md:gap-[24px]">
            <div>
              <label className="block text-[14px] font-semibold mb-[8px] text-text-black" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-[12px] py-[12px] border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent focus:border-green-accent transition-colors ${
                  errors.password ? 'border-error bg-error/5 text-error focus:ring-error focus:border-error' : 'border-[#d6dbde]'
                }`}
              />
              {errors.password && <p className="mt-[4px] text-[13px] text-error">{errors.password}</p>}
            </div>
            
            <div>
              <label className="block text-[14px] font-semibold mb-[8px] text-text-black" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-[12px] py-[12px] border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent focus:border-green-accent transition-colors ${
                  errors.confirmPassword ? 'border-error bg-error/5 text-error focus:ring-error focus:border-error' : 'border-[#d6dbde]'
                }`}
              />
              {errors.confirmPassword && <p className="mt-[4px] text-[13px] text-error">{errors.confirmPassword}</p>}
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-[16px] !py-[14px]">
            Sign Up
          </Button>
        </form>

        <div className="mt-[32px] text-center text-[14px] text-text-black-soft border-t border-divider pt-[24px]">
          Already have an account?{' '}
          <Link href="/login" className="text-green-accent hover:underline font-semibold">
            Log In
          </Link>
        </div>
      </Card>
    </div>
  );
}
