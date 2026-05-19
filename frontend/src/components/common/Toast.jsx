"use client";

import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', duration = 4000, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on mount
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // wait for exit animation
    }, duration);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [duration, onClose]);

  const colours = {
    success: 'bg-green-accent text-white',
    error:   'bg-error text-white',
    info:    'bg-blue-500 text-white',
  };

  return (
    <div
      className={`fixed top-[24px] left-1/2 z-50 flex items-center gap-[10px] px-[20px] py-[14px] rounded-[10px] shadow-lg text-[15px] font-semibold
        transition-all duration-300
        ${colours[type]}
        ${visible ? 'opacity-100 -translate-x-1/2 translate-y-0' : 'opacity-0 -translate-x-1/2 -translate-y-4'}`}
    >
      {type === 'success' && (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {message}
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-[4px] opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}
