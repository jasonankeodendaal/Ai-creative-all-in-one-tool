
import React from 'react';

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M9.93 2.57a2.53 2.53 0 0 0-3.36 3.36" />
    <path d="m14.3 11.2 2.45-2.45" />
    <path d="M11.2 14.3 2.57 21.43" />
    <path d="M21.43 2.57 14.3 11.2" />
    <path d="M12 22a10 10 0 0 0 10-10" />
    <path d="M2 12A10 10 0 0 0 12 22" />
  </svg>
);

export default SparklesIcon;
