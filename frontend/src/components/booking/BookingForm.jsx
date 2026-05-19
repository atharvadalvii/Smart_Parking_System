"use client";

import React, { useState, useMemo } from 'react';
import Button from '@/components/common/Button';

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const TimePicker = ({ value, onChange, isToday }) => {
  const [h, m] = value.split(':').map(Number);
  const now = new Date();
  const nowH = now.getHours();
  const nowM = now.getMinutes();

  const setHour = (hour) => {
    // If the new hour makes the current minute invalid, bump minute to now+1
    let newMin = m;
    if (isToday && hour === nowH && m <= nowM) {
      newMin = Math.min(nowM + 1, 59);
    }
    onChange(`${String(hour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`);
  };

  const setMinute = (minute) => {
    onChange(`${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  const hourDisabled  = (hour) => isToday && hour < nowH;
  const minuteDisabled = (minute) => isToday && h === nowH && minute <= nowM;

  const selectBase = "w-full px-[12px] py-[10px] border border-[#d6dbde] rounded-[4px] bg-white focus:outline-none focus:ring-1 focus:ring-green-accent focus:border-green-accent text-[15px] font-medium text-text-black appearance-none";

  return (
    <div className="border border-[#d6dbde] rounded-[4px] p-[14px] bg-white space-y-[14px]">
      <div className="flex gap-[12px]">
        {/* Hour */}
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-text-black-soft uppercase tracking-wider mb-[6px]">Hour</p>
          <select
            value={h}
            onChange={e => setHour(Number(e.target.value))}
            className={selectBase}
          >
            {HOURS.map(hour => (
              <option key={hour} value={hour} disabled={hourDisabled(hour)}>
                {String(hour).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        {/* Separator */}
        <div className="flex items-end pb-[10px] text-[24px] font-bold text-text-black-soft">:</div>

        {/* Minute */}
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-text-black-soft uppercase tracking-wider mb-[6px]">Minute</p>
          <select
            value={m}
            onChange={e => setMinute(Number(e.target.value))}
            className={selectBase}
          >
            {MINUTES.map(minute => (
              <option key={minute} value={minute} disabled={minuteDisabled(minute)}>
                {String(minute).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected display */}
      <div className="text-center text-[26px] font-bold text-green-accent tracking-widest">
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
      </div>
    </div>
  );
};

const DURATION_OPTIONS = [
  { value: 0.5, label: '30 minutes' },
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 3, label: '3 hours' },
  { value: 4, label: '4 hours' },
  { value: 8, label: 'Full Day (8 hours)' },
];

const BookingForm = ({ selectedSlot, hourlyRate = 2, onSubmit, onCancel, submitting = false }) => {
  // Default date = today, default time = next full hour
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

  const todayStr = now.toISOString().split('T')[0];
  const defaultTime = `${String(nextHour.getHours()).padStart(2, '0')}:00`;

  const [formData, setFormData] = useState({
    date: todayStr,
    startTime: defaultTime,
    duration: 1,
  });
  const [errors, setErrors] = useState({});

  const estimatedCost = useMemo(() => {
    return (formData.duration * hourlyRate).toFixed(2);
  }, [formData.duration, hourlyRate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' ? parseFloat(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const selectedDate = new Date(formData.date);
    const today = new Date(todayStr);

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    } else if (selectedDate < today) {
      newErrors.date = 'Date cannot be in the past';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Please select a start time';
    } else if (formData.date === todayStr) {
      const [h, m] = formData.startTime.split(':').map(Number);
      const selectedTime = new Date(now);
      selectedTime.setHours(h, m, 0, 0);
      if (selectedTime <= now) {
        newErrors.startTime = 'Start time must be in the future';
      }
    }

    if (!formData.duration) {
      newErrors.duration = 'Please select a duration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const inputStyles = "w-full px-[12px] py-[12px] border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-green-accent focus:border-green-accent transition-colors bg-white";
  const errorInputStyles = "border-error bg-error/5 focus:ring-error focus:border-error";
  const normalInputStyles = "border-[#d6dbde]";

  return (
    <form onSubmit={handleSubmit} className="space-y-[24px]">
      {/* Selected slot summary */}
      <div className="flex items-center gap-[16px] bg-green-accent/5 border border-green-accent/20 rounded-[8px] px-[20px] py-[16px]">
        <div className="w-[48px] h-[48px] rounded-[8px] bg-green-accent text-white text-[20px] font-bold flex items-center justify-center">
          {selectedSlot?.name}
        </div>
        <div>
          <div className="text-[16px] font-semibold text-text-black">Slot {selectedSlot?.name} Selected</div>
          <div className="text-[14px] text-text-black-soft">You can change this by going back to Step 1</div>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-[14px] font-semibold mb-[8px] text-text-black" htmlFor="date">
          Parking Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          min={todayStr}
          className={`${inputStyles} ${errors.date ? errorInputStyles : normalInputStyles}`}
        />
        {errors.date && <p className="mt-[4px] text-[13px] text-error">{errors.date}</p>}
      </div>

      {/* Start time */}
      <div>
        <label className="block text-[14px] font-semibold mb-[8px] text-text-black">
          Start Time
        </label>
        <TimePicker
          value={formData.startTime}
          isToday={formData.date === todayStr}
          onChange={(time) => {
            setFormData(prev => ({ ...prev, startTime: time }));
            setErrors(prev => ({ ...prev, startTime: '' }));
          }}
        />
        {errors.startTime && <p className="mt-[4px] text-[13px] text-error">{errors.startTime}</p>}
      </div>

      {/* Duration */}
      <div>
        <label className="block text-[14px] font-semibold mb-[8px] text-text-black" htmlFor="duration">
          Duration
        </label>
        <select
          id="duration"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          className={`${inputStyles} ${errors.duration ? errorInputStyles : normalInputStyles}`}
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.duration && <p className="mt-[4px] text-[13px] text-error">{errors.duration}</p>}
      </div>

      {/* Price Preview */}
      <div className="bg-neutral-warm rounded-[8px] p-[20px] border border-divider">
        <div className="text-[14px] font-semibold text-text-black-soft uppercase tracking-wider mb-[12px]">
          Price Preview
        </div>
        <div className="flex justify-between items-center text-[16px] text-text-black mb-[8px]">
          <span>Rate</span>
          <span>${hourlyRate.toFixed(2)} / hour</span>
        </div>
        <div className="flex justify-between items-center text-[16px] text-text-black mb-[8px]">
          <span>Duration</span>
          <span>{formData.duration >= 1 ? `${formData.duration} hr${formData.duration > 1 ? 's' : ''}` : '30 min'}</span>
        </div>
        <div className="border-t border-divider my-[12px]"></div>
        <div className="flex justify-between items-center text-[20px] font-bold text-starbucks-green">
          <span>Estimated Total</span>
          <span>${estimatedCost}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-[12px] pt-[8px]">
        <Button type="submit" variant="primary" className="flex-1 !py-[14px]" disabled={submitting}>
          {submitting ? 'Booking...' : 'Confirm Booking'}
        </Button>
        <Button type="button" variant="outlineDark" className="flex-1 !py-[14px]" onClick={onCancel}>
          Back
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;
