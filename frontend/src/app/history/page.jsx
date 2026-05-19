"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/hooks/useBooking';

const STATUS_STYLES = {
  confirmed: { bg: 'bg-green-accent/10', text: 'text-green-accent', label: 'Confirmed' },
  active: { bg: 'bg-starbucks-green/10', text: 'text-starbucks-green', label: 'Active' },
  completed: { bg: 'bg-text-black-soft/10', text: 'text-text-black-soft', label: 'Completed' },
  cancelled: { bg: 'bg-error/10', text: 'text-error', label: 'Cancelled' },
};

export default function HistoryPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { getUserBookings } = useBooking();
  const [filter, setFilter] = useState('all');
  const [allBookings, setAllBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      getUserBookings(currentUser.id).then(data => {
        setAllBookings(data);
        setBookingsLoading(false);
      });
    }
  }, [isAuthenticated, currentUser, getUserBookings]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-text-black-soft text-[16px]">Loading...</div>
      </div>
    );
  }
  const filteredBookings = filter === 'all'
    ? allBookings
    : allBookings.filter(b => b.status === filter);

  return (
    <div className="flex-grow container mx-auto px-4 md:px-6 lg:px-10 max-w-[1000px] py-[32px] md:py-[48px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-[32px] gap-[16px]">
        <div>
          <h1 className="text-[24px] md:text-[32px] font-semibold text-starbucks-green mb-[4px]">
            Booking History
          </h1>
          <p className="text-[16px] text-text-black-soft">
            View your past and current parking bookings
          </p>
        </div>
        <Link href="/booking">
          <Button variant="primary">New Booking</Button>
        </Link>
      </div>

      <Card elevated className="mb-[24px] overflow-hidden !p-0">
        {/* Filters */}
        {bookingsLoading && (
          <div className="p-[24px] text-center text-text-black-soft text-[14px]">Loading bookings...</div>
        )}
        <div className="flex gap-[8px] p-[16px] border-b border-divider overflow-x-auto">
          {['all', 'confirmed', 'active', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-[16px] py-[8px] rounded-[50px] text-[14px] font-semibold transition-colors whitespace-nowrap ${filter === f
                  ? 'bg-starbucks-green text-white'
                  : 'bg-gray-100 text-text-black hover:bg-gray-200'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table / List */}
        {filteredBookings.length === 0 ? (
          <div className="p-[48px] text-center">
            <div className="text-[48px] mb-[16px]">📭</div>
            <h3 className="text-[18px] font-semibold text-text-black mb-[8px]">No bookings found</h3>
            <p className="text-[14px] text-text-black-soft">
              You don't have any bookings matching this filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-divider">
                  <th className="p-[16px] text-[12px] font-semibold text-text-black-soft uppercase tracking-wider">Date & Time</th>
                  <th className="p-[16px] text-[12px] font-semibold text-text-black-soft uppercase tracking-wider">Slot</th>
                  <th className="p-[16px] text-[12px] font-semibold text-text-black-soft uppercase tracking-wider">Duration</th>
                  <th className="p-[16px] text-[12px] font-semibold text-text-black-soft uppercase tracking-wider">Cost</th>
                  <th className="p-[16px] text-[12px] font-semibold text-text-black-soft uppercase tracking-wider">Status</th>
                  <th className="p-[16px] text-[12px] font-semibold text-text-black-soft uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => {
                  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.completed;
                  return (
                    <tr key={booking.id} className="border-b border-divider hover:bg-gray-50/50 transition-colors">
                      <td className="p-[16px]">
                        <div className="font-semibold text-text-black">{booking.date}</div>
                        <div className="text-[14px] text-text-black-soft">{booking.startTime}</div>
                      </td>
                      <td className="p-[16px]">
                        <span className="inline-flex w-[32px] h-[32px] rounded-[6px] bg-green-accent text-white text-[14px] font-bold items-center justify-center">
                          {booking.slotName}
                        </span>
                      </td>
                      <td className="p-[16px] text-[14px] text-text-black">
                        {booking.duration >= 1 ? `${booking.duration} hr${booking.duration > 1 ? 's' : ''}` : '30 min'}
                      </td>
                      <td className="p-[16px] text-[14px] font-semibold text-text-black">
                        ${booking.cost.toFixed(2)}
                      </td>
                      <td className="p-[16px]">
                        <span className={`inline-flex px-[12px] py-[4px] rounded-[50px] text-[12px] font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="p-[16px] text-right">
                        <Link href={`/booking/${booking.id}`}>
                          <span className="text-[14px] font-semibold text-starbucks-green hover:underline cursor-pointer">
                            View Details
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
