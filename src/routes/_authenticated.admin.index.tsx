import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminIcon } from "@/components/admin/icons";
import { adminStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  loader: () => adminStats(),
  component: Dashboard,
});

function Dashboard() {
  const stats = Route.useLoaderData();
  const drafts = stats.tours - stats.publishedTours;

  // Typed rather than `as const`: literal inference would give each tile its own shape
  // and `highlight` would not exist on the ones that omit it.
  const tiles: {
    label: string;
    value: number;
    icon: string;
    to: string;
    highlight?: boolean;
  }[] = [
    {
      label: "Inquiries received",
      value: stats.inquiries,
      icon: "inbox",
      to: "/admin/inquiries",
      // Highlighted while anything is unanswered — the one number that needs action.
      highlight: stats.newInquiries > 0 || stats.inquiries === 0,
    },
    { label: "Tours", value: stats.tours, icon: "map", to: "/admin/tours" },
    { label: "Activities", value: stats.activities, icon: "activity", to: "/admin/activities" },
    { label: "Blog posts", value: stats.posts, icon: "news", to: "/admin/posts" },
    { label: "Reviews", value: stats.testimonials, icon: "star", to: "/admin/testimonials" },
    { label: "FAQs", value: stats.faqs, icon: "help", to: "/admin/faqs" },
  ];

  return (
    <>
      <h1 className="font-display text-[2rem] leading-tight font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-[0.92rem] text-muted">
        Welcome back! Here&rsquo;s your content overview.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className={`rounded-xl border p-6 transition-colors ${
              tile.highlight
                ? "border-green-bright/40 bg-mint hover:border-green"
                : "border-rule bg-paper hover:border-green"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[0.92rem] text-muted">{tile.label}</span>
              <AdminIcon name={tile.icon} className="h-[18px] w-[18px] text-muted" />
            </div>
            <div
              className={`mt-3 font-display text-[2.2rem] leading-none font-bold ${
                tile.highlight ? "text-green" : "text-ink"
              }`}
            >
              {tile.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <StatusCard
          icon="draft"
          iconClass="text-orange"
          title="Draft tours"
          value={drafts}
          valueClass="text-orange"
          caption="Not yet visible on the site"
        />
        <StatusCard
          icon="check"
          iconClass="text-green-bright"
          title="Published tours"
          value={stats.publishedTours}
          valueClass="text-green-bright"
          caption="Live and bookable"
        />
      </div>

      {stats.newInquiries > 0 ? (
        <Link
          to="/admin/inquiries"
          className="mt-5 flex items-center gap-3 rounded-xl border border-orange/40 bg-orange/5 p-5 transition-colors hover:border-orange"
        >
          <AdminIcon name="inbox" className="h-5 w-5 text-orange" />
          <span className="text-[0.92rem] font-semibold text-ink">
            {stats.newInquiries} inquir{stats.newInquiries === 1 ? "y" : "ies"} waiting for a
            reply
          </span>
          <span className="ml-auto text-[0.86rem] font-semibold text-orange">Open queue →</span>
        </Link>
      ) : null}
    </>
  );
}

function StatusCard({
  icon,
  iconClass,
  title,
  value,
  valueClass,
  caption,
}: {
  icon: string;
  iconClass: string;
  title: string;
  value: number;
  valueClass: string;
  caption: string;
}) {
  return (
    <div className="rounded-xl border border-rule bg-paper p-6">
      <div className="flex items-center gap-2.5">
        <AdminIcon name={icon} className={`h-[18px] w-[18px] ${iconClass}`} />
        <h2 className="font-display text-[1.05rem] font-bold text-ink">{title}</h2>
      </div>
      <div className={`mt-3 font-display text-[2.2rem] leading-none font-bold ${valueClass}`}>
        {value}
      </div>
      <p className="mt-3 text-[0.86rem] text-muted">{caption}</p>
    </div>
  );
}
