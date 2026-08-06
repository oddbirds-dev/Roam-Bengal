import { createFileRoute } from "@tanstack/react-router";
import { Badge, Card, PageHeader, Table, Td } from "@/components/admin/admin-ui";
import { adminLinkAudit } from "@/lib/link-audit.functions";

/**
 * Internal-link health.
 *
 * Read-only by design. Nothing here rewrites content: keyword matches become suggestions
 * the editor accepts with the link picker, never silent edits to their prose.
 */
export const Route = createFileRoute("/_authenticated/admin/links")({
  loader: () => adminLinkAudit(),
  component: LinksScreen,
});

function LinksScreen() {
  const report = Route.useLoaderData();

  return (
    <>
      <PageHeader
        title="Links"
        subtitle={`${report.totals.pages} pages · ${report.totals.internal} internal links · ${report.totals.external} external`}
      />

      <div className="flex flex-col gap-6">
        <Card
          title={`Broken links (${report.broken.length})`}
          description="These point at a page that does not exist. Fix the link, or add a redirect for the old address."
        >
          <Table head={["On page", "Link text", "Points to"]} empty={!report.broken.length}>
            {report.broken.map((row, i) => (
              <tr key={`${row.from}-${row.to}-${i}`}>
                <Td>
                  <PagePath path={row.from} title={row.fromTitle} />
                </Td>
                <Td className="text-muted">{row.anchor || "—"}</Td>
                <Td>
                  <code className="rounded bg-rust/10 px-1.5 py-0.5 text-[0.78rem] text-rust">
                    {row.to}
                  </code>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card
          title={`Orphan pages (${report.orphans.length})`}
          description="Published, but nothing on the site links to them. Search engines and readers reach these only from the menu or a direct link."
        >
          <Table head={["Page", "Type", "Address"]} empty={!report.orphans.length}>
            {report.orphans.map((row) => (
              <tr key={row.path}>
                <Td>
                  <PageLink path={row.path} title={row.title} />
                </Td>
                <Td>
                  <Badge tone="muted">{row.kind === "tour" ? "Tour" : "Blog post"}</Badge>
                </Td>
                <Td className="font-mono text-[0.76rem] text-muted">{row.path}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card
          title={`Suggested links (${report.suggestions.length})`}
          description="These pages mention a tour by name without linking to it. Open the page, select the words, and use the link button."
        >
          <Table head={["On page", "Mentions", "Could link to"]} empty={!report.suggestions.length}>
            {report.suggestions.map((row, i) => (
              <tr key={`${row.from}-${row.to}-${i}`}>
                <Td>
                  <PageLink path={row.from} title={row.fromTitle} />
                </Td>
                <Td className="text-muted">
                  {row.mentions}×
                </Td>
                <Td>
                  <PageLink path={row.to} title={row.toTitle} />
                </Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card
          title="Every page, least-linked first"
          description="Inbound counts ignore the header and footer menus — a page reachable only from the footer still needs links from real content."
        >
          <Table head={["Page", "Type", "Links in", "Links out", "External"]}>
            {report.counts.map((row) => (
              <tr key={row.path}>
                <Td>
                  <PageLink path={row.path} title={row.title} />
                  {row.published ? null : (
                    <span className="ml-2">
                      <Badge tone="muted">Draft</Badge>
                    </span>
                  )}
                </Td>
                <Td className="text-muted">{row.kind === "tour" ? "Tour" : "Blog post"}</Td>
                <Td className={row.inbound === 0 ? "font-semibold text-rust" : ""}>
                  {row.inbound}
                </Td>
                <Td className="text-muted">{row.outboundInternal}</Td>
                <Td className="text-muted">{row.outboundExternal}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}

/** Opens the live page in a new tab — these are public URLs, not admin routes. */
function PageLink({ path, title }: { path: string; title: string }) {
  return (
    <a
      href={path}
      target="_blank"
      rel="noreferrer noopener"
      className="font-semibold text-green-dark hover:text-green hover:underline"
    >
      {title}
    </a>
  );
}

/** Same, but tolerates the synthetic "site" origin used for header/footer links. */
function PagePath({ path, title }: { path: string; title: string }) {
  if (path === "site") return <span className="font-semibold text-ink">{title}</span>;
  return (
    <>
      <PageLink path={path} title={title} />
      <span className="mt-0.5 block font-mono text-[0.72rem] text-muted">{path}</span>
    </>
  );
}
