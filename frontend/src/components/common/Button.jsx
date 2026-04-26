import React from 'react';

const Button = ({ variant = 'primary', size = 'md', disabled = false, onClick, children, className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-green-accent focus:ring-offset-2 active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-8 py-3 text-[19px]",
  };

  const variantStyles = {
    primary: "bg-green-accent text-white border border-green-accent rounded-[50px] hover:bg-[#00603A] disabled:bg-divider disabled:text-text-black-soft disabled:border-divider",
    secondary: "bg-transparent text-green-accent border border-green-accent rounded-[50px] hover:bg-[#F2F0EB]/50 disabled:border-divider disabled:text-text-black-soft",
    black: "bg-black text-white border border-black rounded-[50px] hover:bg-black/80 disabled:bg-divider disabled:text-text-black-soft disabled:border-divider",
    outlineDark: "bg-transparent text-text-black border border-text-black rounded-[50px] hover:bg-black/5 disabled:border-divider disabled:text-text-black-soft",
    inverted: "bg-white text-green-accent border border-white rounded-[50px] hover:bg-neutral-warm disabled:bg-divider disabled:text-text-black-soft disabled:border-divider",
    ghost: "bg-transparent text-green-accent hover:bg-neutral-warm rounded-[50px] px-3 py-1 disabled:text-text-black-soft disabled:hover:bg-transparent",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
