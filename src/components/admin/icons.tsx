/** Line icons for the admin sidebar and dashboard tiles. */

const PATHS: Record<string, string> = {
  dashboard: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  inbox: "M4 13h4l1.5 3h5L16 13h4M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5",
  map: "M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7zM9 4v13M15 7v13",
  pin: "M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  activity: "M4 12h3l2.5-6 4 12L16 12h4",
  news: "M4 5h11a1 1 0 0 1 1 1v13H5a1 1 0 0 1-1-1zM16 9h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3M7 8h5M7 11h5M7 14h4",
  star: "m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.7l5.9-.8z",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.6 9.3a2.5 2.5 0 1 1 3.4 2.6c-.7.3-1 .9-1 1.6v.3M12 17.2h.01",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  gear: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19.4 14a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-3-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  signOut: "M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6",
  external: "M14 4h6v6M20 4l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4",
  draft: "M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM9 15l2.5-2.5L13 14l3-3",
  check: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 12.2l2.4 2.4 4.6-4.8",
  users: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.2a3.5 3.5 0 0 1 0 6.6",
  desktop: "M4 6h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM9 19h6M12 19v2",
  tablet: "M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM12 18h.01",
  mobile: "M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM12 18h.01",
  refresh: "M20 4v5h-5M4 20v-5h5M4.5 9A9 9 0 0 1 19.3 8.3L20 9M19.5 15A9 9 0 0 1 4.7 15.7L4 15",
  eye: "M2 12c0 0 4-8 10-8s10 8 10 8-4 8-10 8-10-8-10-8ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  eyeOff: "M10.4 10.4a3 3 0 1 0 4.2 4.2M2 12c0 0 4-8 10-8s10 8 10 8-4 8-10 8-10-8-10-8ZM3 3l18 18",
  chevron: "M9 6l6 6-6 6",
  bold: "M14 12a4 4 0 0 0 0-8H6v8 M15 20a4 4 0 0 0 0-8H6v8Z",
  link: "M10.5 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7l-1.4 1.4 M13.5 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.4-1.4",
  unlink: "M10.5 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7l-1.4 1.4 M13.5 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.4-1.4 M3 3l18 18",
  close: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  italic: "M19 4h-9 M14 20H5 M15 4L9 20",
  underline: "M6 3v7a6 6 0 0 0 12 0V3 M4 21h16",
  code: "M9 17l-5-5 5-5 M15 7l5 5-5 5",
  sparkles: "m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9zM18 15l.9 2.1 2.1.9-2.1.9L18 21l-.9-2.1-2.1-.9 2.1-.9z",
  trash: "M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2",
  pencil: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM14.5 5.5l4 4",
  arrowLeft: "M19 12H5M11 18l-6-6 6-6",
  grip: "M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01",
  table: "M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14",
  quote: "M9 7H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3v1a3 3 0 0 1-3 3M20 7h-4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3v1a3 3 0 0 1-3 3",
  listBullet: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  listOrdered: "M10 6h10M10 12h10M10 18h10M4 5h1v4M4 15.5h2M4 18.5h2M4 15.5a1 1 0 0 1 2 0c0 1-2 1.5-2 3h2",
  lineSpacing: "M10 6h10M10 12h10M10 18h10M5 4v16M5 4l-2 3M5 4l2 3M5 20l-2-3M5 20l2-3",
};

export function AdminIcon({
  name,
  className = "h-[18px] w-[18px]",
  strokeWidth = 1.7,
}: {
  name: keyof typeof PATHS | string;
  className?: string;
  strokeWidth?: number;
}) {
  const known = PATHS[name];
  // A typo used to render the dashboard glyph silently, so the wrong icon shipped looking
  // deliberate. Still fall back — a missing icon must not blank a toolbar — but say so.
  if (!known && import.meta.env.DEV) {
    console.warn(`AdminIcon: no glyph named "${name}" — falling back to "dashboard".`);
  }
  const d = known ?? PATHS.dashboard!;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {d.split(" M").map((segment, i) => (
        <path key={i} d={i === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}
