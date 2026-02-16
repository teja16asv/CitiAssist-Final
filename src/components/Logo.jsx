import React from 'react';

const Logo = ({ className = "w-10 h-10" }) => (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="logoGradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#44403c" />
                <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>
        </defs>

        <rect x="32" y="32" width="448" height="448" rx="112" fill="url(#logoGradient)" />

        <g transform="translate(106, 120)">
            <path d="M150 20 L20 110 H280 L150 20 Z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="10" strokeLinejoin="round" />
            <rect x="20" y="270" width="260" height="40" rx="4" fill="#e7e5e4" />
            <rect x="40" y="120" width="35" height="140" rx="2" fill="#e7e5e4" />
            <rect x="132.5" y="120" width="35" height="140" rx="2" fill="#e7e5e4" />
            <rect x="225" y="120" width="35" height="140" rx="2" fill="#e7e5e4" />
        </g>
    </svg>
);

export default Logo;
