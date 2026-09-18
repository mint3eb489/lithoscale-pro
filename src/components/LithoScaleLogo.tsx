import React from 'react';

interface LogoProps {
  className?: string;
}

export const LithoScaleLogo: React.FC<LogoProps> = ({ className = "w-full h-full" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      className={className}
      aria-label="LithoScale Pro Logo"
    >
      <defs>
        <linearGradient id="ls-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="ls-slab-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="ls-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <filter id="ls-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Base container */}
      <rect x="24" y="24" width="464" height="464" rx="100" fill="url(#ls-bg-grad)" stroke="#1e293b" strokeWidth="4" />

      {/* Subtle grid lines in background */}
      <g opacity="0.18" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4">
        <line x1="80" y1="256" x2="432" y2="256" />
        <line x1="256" y1="80" x2="256" y2="432" />
        <circle cx="256" cy="256" r="120" fill="none" />
        <circle cx="256" cy="256" r="180" fill="none" />
      </g>

      {/* 3D Isometric Stone Slab */}
      <g transform="translate(256, 240)">
        {/* Shadow */}
        <path d="M -130,20 L 0,-45 L 130,20 L 0,85 Z" fill="#000000" opacity="0.4" />
        
        {/* Left Side */}
        <path d="M -120,10 L 0,70 L 0,130 L -120,70 Z" fill="#0369a1" />
        
        {/* Right Side */}
        <path d="M 0,70 L 120,10 L 120,70 L 0,130 Z" fill="#0284c7" />
        
        {/* Top Face */}
        <path d="M -120,10 L 0,-50 L 120,10 L 0,70 Z" fill="url(#ls-slab-grad)" />
        
        {/* Measurement ticks on edges */}
        <path d="M -100,0 L -95,2 M -80,-10 L -75,-8 M -60,-20 L -55,-18 M -40,-30 L -35,-28 M -20,-40 L -15,-38" stroke="#ffffff" strokeWidth="2.5" opacity="0.8" />
        <path d="M 100,0 L 95,2 M 80,-10 L 75,-8 M 60,-20 L 55,-18 M 40,-30 L 35,-28 M 20,-40 L 15,-38" stroke="#ffffff" strokeWidth="2.5" opacity="0.8" />

        {/* Laser precision line */}
        <path d="M -150,30 L 150,-70" stroke="#38bdf8" strokeWidth="3.5" filter="url(#ls-glow)" opacity="0.9" />
        
        {/* Helper dashed lines */}
        <path d="M -120,40 L -120,-20 M 120,40 L 120,-20" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        
        {/* Ruler arrow line */}
        <path d="M -120,-10 L 120,-10" stroke="url(#ls-accent-grad)" strokeWidth="2" />
        <path d="M -60,110 L -60,170 L 60,170" stroke="#38bdf8" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" filter="url(#ls-glow)" />
      </g>

      {/* Precision corner crosshairs */}
      <path d="M 60,80 L 80,80 L 80,60" fill="none" stroke="#0ea5e9" strokeWidth="3" />
      <path d="M 452,80 L 432,80 L 432,60" fill="none" stroke="#0ea5e9" strokeWidth="3" />
      <path d="M 60,432 L 80,432 L 80,452" fill="none" stroke="#0ea5e9" strokeWidth="3" />
      <path d="M 452,432 L 432,432 L 432,452" fill="none" stroke="#0ea5e9" strokeWidth="3" />

      {/* Laser center dot */}
      <circle cx="256" cy="240" r="5.5" fill="#ffffff" filter="url(#ls-glow)" />
    </svg>
  );
};
