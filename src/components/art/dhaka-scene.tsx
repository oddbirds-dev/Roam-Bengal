/**
 * The line-art Dhaka skyline that closes the homepage: domed mosque, minaret,
 * skyscraper, cable bridge, and two rickshaws over soft colour blobs.
 * Traced verbatim from reference design/roam-bengal-v3.html.
 */
export function DhakaScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 380"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Illustration of Dhaka landmarks and rickshaws"
    >
      <ellipse cx="120" cy="140" rx="110" ry="80" fill="#22B57A" opacity="0.18" />
      <ellipse cx="330" cy="100" rx="100" ry="90" fill="#F2B705" opacity="0.20" />
      <ellipse cx="360" cy="260" rx="120" ry="90" fill="#C4390E" opacity="0.16" />
      <ellipse cx="150" cy="280" rx="90" ry="70" fill="#D9450F" opacity="0.14" />

      {/* domed building */}
      <g
        stroke="#1B1B1B"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="150" y="150" width="110" height="90" />
        <circle cx="205" cy="140" r="34" />
        <rect x="195" y="95" width="20" height="30" />
        <circle cx="205" cy="90" r="6" />
        <rect x="160" y="170" width="14" height="70" />
        <rect x="236" y="170" width="14" height="70" />
        <rect x="192" y="190" width="26" height="50" />
      </g>

      {/* tower */}
      <g
        stroke="#1B1B1B"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="270" y="60" width="28" height="180" />
        <polygon points="270,60 284,20 298,60" />
        <line x1="270" y1="90" x2="298" y2="90" />
        <line x1="270" y1="120" x2="298" y2="120" />
        <line x1="270" y1="150" x2="298" y2="150" />
      </g>

      {/* skyscraper */}
      <g
        stroke="#1B1B1B"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="320,240 320,90 345,60 345,240" />
        <line x1="320" y1="120" x2="345" y2="120" />
        <line x1="320" y1="160" x2="345" y2="160" />
        <line x1="320" y1="200" x2="345" y2="200" />
      </g>

      {/* bridge */}
      <g stroke="#1B1B1B" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <line x1="330" y1="330" x2="330" y2="270" />
        <line x1="300" y1="300" x2="330" y2="280" />
        <line x1="360" y1="300" x2="330" y2="280" />
        <line x1="280" y1="320" x2="400" y2="320" />
      </g>

      <Rickshaw transform="translate(48,255)" hood="#1E5F3B" seat="#F0791E" />
      <Rickshaw transform="translate(360,130) scale(0.85)" hood="#D9450F" seat="#F2B705" />

      <text
        x="290"
        y="365"
        transform="rotate(-4 290 365)"
        fill="#E63238"
        className="font-script text-[52px] font-bold"
      >
        DHAKA
      </text>
    </svg>
  );
}

function Rickshaw({
  transform,
  hood,
  seat,
}: {
  transform: string;
  hood: string;
  seat: string;
}) {
  return (
    <g transform={transform}>
      <path d="M0 55 Q6 20 40 18 Q64 18 64 40 L64 55" fill={hood} opacity="0.9" />
      <path d="M4 46 Q30 30 60 46" fill={seat} opacity="0.85" />
      <circle cx="14" cy="70" r="14" fill="none" stroke="#1B1B1B" strokeWidth="2.2" />
      <circle cx="60" cy="70" r="14" fill="none" stroke="#1B1B1B" strokeWidth="2.2" />
      <line x1="64" y1="55" x2="90" y2="30" stroke="#1B1B1B" strokeWidth="2.2" />
      <line x1="64" y1="55" x2="90" y2="70" stroke="#1B1B1B" strokeWidth="2.2" />
    </g>
  );
}
