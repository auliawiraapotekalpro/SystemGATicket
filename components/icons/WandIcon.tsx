import React from 'react';

export const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15 4V2"></path>
    <path d="M15 10V8"></path>
    <path d="M12.5 7.5L14 6"></path>
    <path d="M6 20L2 22l2-4"></path>
    <path d="M20 6L14 12"></path>
    <path d="M17.5 4.5L16 6"></path>
    <path d="m21.5 2.5-1.5 1.5"></path>
    <path d="M9 15l-1.5 1.5"></path>
    <path d="M15 15l6 6"></path>
    <path d="M3 11l8 8"></path>
  </svg>
);