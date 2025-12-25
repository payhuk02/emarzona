/**
 * Composant AlertCircle Icon - SVG inline pour éviter les problèmes de bundling
 * Utilise un SVG inline au lieu de lucide-react pour garantir la disponibilité en production
 */

import React from 'react';

interface AlertCircleIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export const AlertCircleIcon: React.FC<AlertCircleIconProps> = ({ 
  className = '', 
  size = 24,
  strokeWidth = 2 
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
};

