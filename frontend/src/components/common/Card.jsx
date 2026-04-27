import React from 'react';

const Card = ({ children, className = '', elevated = false, ...props }) => {
  const baseStyles = "bg-white rounded-[12px] p-5 md:p-6 transition-all duration-300 ease-in-out";
  const elevationStyles = elevated 
    ? "shadow-[0_0_0.5px_rgba(0,0,0,0.14),0_1px_1px_rgba(0,0,0,0.24)]" 
    : "border border-divider";

  return (
    <div className={`${baseStyles} ${elevationStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
