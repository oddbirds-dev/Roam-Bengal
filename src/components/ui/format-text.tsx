import Markdown from "markdown-to-jsx";

/**
 * Parses inline Markdown-style **bold** tags and basic HTML tags like <span class="...">.
 * Extremely lightweight and safe for inline content like paragraphs, list items, and headings.
 */
export function FormatText({ children }: { children: string }) {
  if (!children || typeof children !== "string") return <>{children}</>;
  
  return (
    <Markdown
      options={{
        forceInline: true,
        overrides: {
          strong: {
            component: "strong",
            props: {
              className: "font-semibold text-ink",
            },
          },
        },
      }}
    >
      {children}
    </Markdown>
  );
}
