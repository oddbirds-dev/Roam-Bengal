import { useEffect, useState } from "react";

/**
 * Track a CSS media query in React state.
 *
 * Use this only when a breakpoint has to change *what is mounted* rather than
 * how it looks — Tailwind's responsive classes are the right tool for styling.
 * Starts false so the server and the first client render agree; the real value
 * lands in the effect straight after mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
