import React from "react";

/** Small stylized marks for the two wallet methods (not the official logos: those belong to their owners). */
export function VodafoneMark({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#E60000" />
      <path fill="#fff" d="M12.4 4.6c-3.7 0-6.6 2.8-6.6 6.5 0 3.6 2.8 6.4 6.3 6.5 1.2 0 2.2-.3 3.1-.8 1.9-1.1 3.1-3.1 3.1-5.4 0-.8-.1-1.4-.4-2.1.1 2.4-1.7 4.3-4 4.3-1.8 0-3.3-1.4-3.3-3.3 0-1.7 1.3-3.1 3-3.3.4 0 .8 0 1.1.1-.4-.4-1.4-.9-2.3-.9z" />
    </svg>
  );
}

export function InstapayMark({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ipg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7B2CBF" />
          <stop offset="1" stopColor="#3A0CA3" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ipg)" />
      <path fill="#fff" d="M13.4 3.8 6.6 13h4.6l-1 7.2 7.2-9.6h-4.7z" />
    </svg>
  );
}
