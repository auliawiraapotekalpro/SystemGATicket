import React from 'react';

export const TicketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 5H5a2 2 0 0 0-2 2v2.5a2.5 2.5 0 0 1 0 5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5a2.5 2.5 0 0 1 0-5V7a2 2 0 0 0-2-2Z" />
    <path d="M9 10h6v4H9z" />
  </svg>
);
