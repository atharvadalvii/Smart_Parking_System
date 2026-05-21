"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    login(formData.email, formData.password).then((result) => {
      if (result.success) {
        router.push('/dashboard');
      } else {
        setServerError(result.error);
      }
    });
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-neutral-warm p-4">
      <Card className="w-full max-w-[500px]" elevated>
        <div className="text-center mb-[32px]">
          <h1 className="text-[28px] font-semibold mb-[8px] text-starbucks-green">Log In to Your Account</h1>
          <p className="text-[16px] text-text-black-soft">Welcome back, please log in with your email and password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {serverError && (
            <div className="bg-error/10 border border-error/30 text-error text-[14px] px-[16px] py-[12px] rounded-[8px] text-center font-medium">
              {serverError}
            </div>
          )}
          <div>
            <label className="block text-[14px] font-semibold mb-[8px] text-text-black" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className={`w-full px-[12px] py-[12px] border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent focus:border-green-accent transition-colors ${
                errors.email ? 'border-error bg-error/5 text-error focus:ring-error focus:border-error' : 'border-[#d6dbde]'
              }`}
            />
            {errors.email && <p className="mt-1.5 text-sm text-error">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-[14px] font-semibold mb-[8px] text-text-black" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-[12px] py-[12px] border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent focus:border-green-accent transition-colors ${
                errors.password ? 'border-error bg-error/5 text-error focus:ring-error focus:border-error' : 'border-[#d6dbde]'
              }`}
            />
            {errors.password && <p className="mt-1.5 text-sm text-error">{errors.password}</p>}
          </div>


          <Button type="submit" variant="primary" className="w-full mt-[16px] !py-[14px]">
            Log In
          </Button>
        </form>

        <div className="mt-[32px] text-center text-[14px] text-text-black-soft border-t border-divider pt-[24px]">
          Don't have an account?{' '}
          <Link href="/register" className="text-green-accent hover:underline font-semibold">
            Sign Up
          </Link>
        </div>

      </Card>
    </div>
  );
}
