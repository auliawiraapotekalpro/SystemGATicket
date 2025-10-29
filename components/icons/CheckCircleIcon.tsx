import React from 'react';

export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-5 h-5 text-green-500"
    {...props}
  >
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.06-1.06l-3.103 3.104-1.565-1.565a.75.75 0 00-1.06 1.06l2.095 2.095a.75.75 0 001.06 0l3.638-3.638z" clipRule="evenodd" />
  </svg>
);
