/** Line icons from the reference designs, keyed by the `icon` string stored in
 *  `site_settings`. Unknown keys fall back to a neutral dot rather than crashing. */

const FEATURE_PATHS: Record<string, string> = {
  box: "M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3Z",
  user: "M12 4.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8ZM5 20c1.8-4.4 5.2-6 7-6s5.2 1.6 7 6",
  shield: "M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z",
  card: "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3 9h18M7 14h4",
  headset: "M4 15v-3a8 8 0 1 1 16 0v3M4 15a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Z",
  route: "M3 12l4-8h10l4 8-9 9-9-9ZM3 12h18",
  plane: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7Z",
  calendar: "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM4 10h16M8 3v4M16 3v4",
  users: "M15 19v-1.4a3.3 3.3 0 0 0-3.3-3.3H6.3A3.3 3.3 0 0 0 3 17.6V19M9 11.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8ZM21 19v-1.4a3.3 3.3 0 0 0-2.5-3.2M15.5 4.8a3.4 3.4 0 0 1 0 6.4",
};

export function FeatureIcon({ name }: { name: string }) {
  const d = FEATURE_PATHS[name];
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d ? <path d={d} /> : <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

const WHY_STYLES: Record<string, { bg: string; fg: string; d: string }> = {
  globe: {
    bg: "#DCEFE0",
    fg: "#1E5F3B",
    d: "M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9Z",
  },
  coin: {
    bg: "#DCEFE0",
    fg: "#1E5F3B",
    d: "M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5-1.3 2-3 2.5-3 1.1-3 2.5 1.3 2.5 3 2.5 3-1.1 3-2.5",
  },
  shield: {
    bg: "#DCEFE0",
    fg: "#1E5F3B",
    d: "M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11Z",
  },
  lock: {
    bg: "#DCEFE0",
    fg: "#1E5F3B",
    d: "M6 11V8a6 6 0 1 1 12 0v3M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z",
  },
  compass: {
    bg: "#DCEFE0",
    fg: "#1E5F3B",
    d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM15.5 8.5l-2 5-5 2 2-5 5-2Z",
  },
  ban: {
    bg: "#DCEFE0",
    fg: "#1E5F3B",
    d: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM5.6 5.6l12.8 12.8",
  },
  sparkles: {
    bg: "#DCEFE0",
    fg: "#1E5F3B",
    d: "M12 3l1.6 4.8L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.2L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z",
  },
  chat: {
    bg: "#DCEFE0",
    fg: "#1E5F3B",
    d: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H6a2 2 0 0 1-2-2V6Z",
  },
};

export function WhyIcon({ name, bg, fg }: { name: string; bg?: string; fg?: string }) {
  const style = WHY_STYLES[name] ?? WHY_STYLES.globe!;
  return (
    <span
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ background: bg ?? style.bg, color: fg ?? style.fg }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={style.d} />
      </svg>
    </span>
  );
}
