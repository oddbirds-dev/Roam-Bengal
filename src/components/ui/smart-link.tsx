import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { isExternal } from "@/components/ui/button";
import { isUnsafeHref } from "@/lib/sanitize";

/**
 * The `a` renderer for both markdown pipelines.
 *
 * Body copy is authored as markdown, so hrefs are runtime strings that cannot be checked
 * against the route tree — hence the `as never` cast, the same one `ButtonLink` uses for
 * settings-sourced nav paths. Internal paths go through the router so in-content links
 * navigate client-side instead of reloading the document.
 */
export function SmartLink({
  href = "",
  className,
  children,
}: {
  href?: string;
  className?: string;
  children?: ReactNode;
}) {
  // Never render an anchor we would refuse to follow — a dead `<a>` still looks clickable.
  if (!href || isUnsafeHref(href)) {
    return <span className={className}>{children}</span>;
  }

  if (isExternal(href)) {
    return (
      <a
        href={href}
        className={className}
        // `isExternal` also covers mailto:/tel:/#anchor, which must stay in-tab.
        {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={href as never} className={className}>
      {children}
    </Link>
  );
}
