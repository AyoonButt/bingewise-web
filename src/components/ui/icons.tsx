"use client";

interface IconProps {
  className?: string;
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M9.88 4.08L9.86 1.01L14.14 1.01L14.12 4.08L16.1 4.9L18.26 2.71L21.29 5.74L19.1 7.9L19.92 9.88L22.99 9.86L22.99 14.14L19.92 14.12L19.1 16.1L21.29 18.26L18.26 21.29L16.1 19.1L14.12 19.92L14.14 22.99L9.86 22.99L9.88 19.92L7.9 19.1L5.74 21.29L2.71 18.26L4.9 16.1L4.08 14.12L1.01 14.14L1.01 9.86L4.08 9.88L4.9 7.9L2.71 5.74L5.74 2.71L7.9 4.9L9.88 4.08ZM8.6 12A3.4 3.4 0 1 0 15.4 12A3.4 3.4 0 1 0 8.6 12Z"
        clipRule="evenOdd"
      />
    </svg>
  );
}
