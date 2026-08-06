import { Fragment } from "react";

/**
 * Parses inline Markdown-style **bold** tags and renders them as <strong> elements.
 * Extremely lightweight and safe for inline content like paragraphs, list items, and headings.
 */
export function FormatText({ children }: { children: string }) {
  if (!children || typeof children !== "string") return <>{children}</>;
  
  // Split on **...** (non-greedy)
  const parts = children.split(/(\*\*.*?\*\*)/g);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
