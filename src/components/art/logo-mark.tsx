import { useId } from "react";

/**
 * The Roam Bengal mark: a boat on water under a sun, in a green gradient roundel.
 * Lifted from the inline SVG repeated in every reference page.
 *
 * The reference files hand-wrote a unique gradient id per page (lg-grad, lg-grad2,
 * lg-grad2-rev, …) because duplicate ids collide. useId() removes that hazard.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 44 44" fill="none" className={className} aria-hidden="true">
      <circle cx="22" cy="22" r="21" fill={`url(#${gradientId})`} />
      <circle cx="27" cy="14" r="5.2" fill="#F0791E" />
      <path
        d="M8 24c3-8 8-12 14-13"
        stroke="#fff"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M9 28c3 1.8 6 1.8 8.5 0s5.5-1.8 8-0 5.5 1.8 8 0"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M13 32l1.5-6h13l1.5 6c-3 1.6-13 1.6-16 0Z" fill="#123D26" />
      <line
        x1="21.5"
        y1="26"
        x2="21.5"
        y2="19"
        stroke="#123D26"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M21.5 19c3 0.5 4.5 2 5 4.5"
        stroke="#123D26"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="44"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#22B57A" />
          <stop offset="1" stopColor="#0B6B47" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.6 14.3c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.2.1.4 0 .6-.1.2-.1.3-.3.5l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.7-.1.3.1 1.7.8 2 .9.3.2.5.2.6.4.1.2.1.9-.1 1.6Z" />
    </svg>
  );
}
