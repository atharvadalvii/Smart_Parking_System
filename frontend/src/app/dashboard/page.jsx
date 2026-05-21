"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParkingData } from '@/hooks/useParkingData';
import ParkingMap from '@/components/parking/ParkingMap';
import VehicleCounter from '@/components/parking/VehicleCounter';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import Toast from '@/components/common/Toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function DashboardPage() {
  const { slots, vehicleCount, totalSlots, isConnected } = useParkingData();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [payment, setPayment] = useState(null); // { plate, fare_amount, slot }
  const [paying, setPaying]   = useState(false);
  const [paid, setPaid]       = useState(false);
  const [toast, setToast]     = useState(null);

  // Listen for SSE payment_required events
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/events/stream`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.payment_required) {
          setPayment({ plate: data.plate, fare_amount: data.fare_amount, slot: data.slot });
          setPaid(false);
        }
        if (data.payment_confirmed) {
          setPayment(null);
          setPaid(false);
          setToast('Payment Done! Exit gate is opening...');
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  // Fallback: poll pending exits every 5s in case SSE was missed
  useEffect(() => {
    const poll = async () => {
      if (paid) return;
      try {
        const res = await fetch(`${API_BASE}/api/gate/pending-exits`);
        const list = await res.json();
        if (list.length > 0 && !paid) {
          const first = list[0];
          setPayment(p => p ? p : { plate: first.plate, fare_amount: first.fare_amount, slot: first.slot });
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [paid]);

  const handleSimulatePayment = async () => {
    if (!payment) return;
    setPaying(true);
    try {
      const res = await fetch(`${API_BASE}/api/gate/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: payment.plate }),
      });
      if (res.ok) {
        setPayment(null);
        setPaid(false);
        setToast('Payment Done! Exit gate is opening...');
      }
    } catch {}
    setPaying(false);
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-text-black-soft text-[16px]">Loading...</div>
      </div>
    );
  }

  const handleSlotClick = (slotId) => {
    const slot = slots?.find(s => s.id === slotId);
    if (!slot || slot.status !== 'free') return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push(`/booking?slot=${slot.name}`);
  };

  return (
    <div className="flex-grow container mx-auto px-4 md:px-6 lg:px-10 max-w-[1440px] py-[32px] md:py-[48px]">

      {/* Toast */}
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}

      {/* Payment Modal */}
      {payment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center mx-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto mb-4 flex items-center justify-center text-3xl">🚗</div>
            <h2 className="text-[22px] font-bold text-text-black mb-1">Payment Required</h2>
            <p className="text-text-black-soft text-[13px] mb-6">
              Plate <strong className="text-text-black font-mono">{payment.plate}</strong>
              {payment.slot ? ` · Slot ${payment.slot}` : ''}
            </p>

            <div className="bg-[#1E3932] rounded-xl p-5 mb-6">
              <p className="text-green-300 text-[12px] uppercase tracking-wide mb-1">Amount Due</p>
              <p className="text-white text-[42px] font-bold">${Number(payment.fare_amount).toFixed(2)}</p>
              <p className="text-green-400 text-[12px] mt-1">AUD · $3.00/hr · $2.00 minimum</p>
            </div>

            <Button
              variant="primary"
              className="w-full !py-[14px] text-[16px]"
              disabled={paying}
              onClick={handleSimulatePayment}
            >
              {paying ? 'Processing...' : 'Simulate Payment'}
            </Button>
            <p className="text-[11px] text-text-black-soft mt-3">
              Gate opens automatically after payment
            </p>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-[32px] gap-[16px]">
        <div>
          <h1 className="text-[24px] md:text-[32px] font-semibold text-starbucks-green mb-[4px]">Dashboard</h1>
          <p className="text-[16px] text-text-black-soft">Real-time parking status overview</p>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-[8px] bg-white px-[16px] py-[8px] rounded-[50px] shadow-[0_0_0.5px_rgba(0,0,0,0.14),0_1px_1px_rgba(0,0,0,0.24)]">
          <div className="relative flex h-3 w-3">
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-accent opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-accent' : 'bg-error'}`}></span>
          </div>
          <span className="text-[14px] font-bold text-text-black uppercase tracking-wider">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-[24px] lg:gap-[32px]">

        <div className="w-full lg:w-[65%] flex flex-col gap-[24px]">
          <Card elevated className="w-full h-[500px] lg:h-[600px] p-0 overflow-hidden flex flex-col">
            <div className="px-[24px] py-[16px] border-b border-divider bg-white shrink-0 flex items-center justify-between">
              <h2 className="text-[19px] font-semibold text-text-black">Parking Map</h2>
              <span className="text-[13px] text-text-black-soft">Click a free slot to book</span>
            </div>
            <div className="flex-grow bg-[#f2f0eb] relative overflow-hidden">
              <ParkingMap slots={slots} onSlotClick={handleSlotClick} />
            </div>
          </Card>
        </div>

        <div className="w-full lg:w-[35%] flex flex-col gap-[24px]">
          <VehicleCounter vehicleCount={vehicleCount} totalSlots={totalSlots} />
        </div>

      </div>
    </div>
  );
}
