import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true, ...props }: LogoProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <svg
        width="64"
        height="64"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("text-hidayah-gold", className)}
        {...props}
      >
        {/* Central Dome/Arch */}
        <path
          d="M 50 20 C 40 30 35 40 35 55 L 35 60 C 40 60 45 58 50 55 C 55 58 60 60 65 60 L 65 55 C 65 40 60 30 50 20 Z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Book Base */}
        <path
          d="M 25 65 C 35 65 45 60 50 55 C 55 60 65 65 75 65 L 75 70 C 65 70 55 65 50 60 C 45 65 35 70 25 70 Z"
          fill="currentColor"
        />
        {/* Central Axis/Pen */}
        <path
          d="M 50 35 L 50 55"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Diamond top of Pen */}
        <path
          d="M 50 28 L 52 32 L 50 36 L 48 32 Z"
          fill="currentColor"
        />
      </svg>
      
      {showText && (
        <span className={cn("text-hidayah-gold font-sans tracking-[0.2em] text-2xl font-light uppercase", className)}>
          Hidayah
        </span>
      )}
    </div>
  );
}
