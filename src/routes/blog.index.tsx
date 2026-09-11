import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { NewsletterForm } from "@/components/newsletter-form";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { toPlainText } from "@/lib/markdown";
import { listPublishedPosts } from "@/lib/site-content.functions";

export const Route = createFileRoute("/blog/")({
  validateSearch: z.object({ category: z.string().optional() }),
  loader: () => listPublishedPosts(),
  head: () => ({
    meta: [
      { title: "The Journal — Stories From Bangladesh | Roam Bengal" },
      {
        name: "description",
        content:
          "Field notes, guides, and honest travel advice from the boatmen and guides who call Bangladesh's routes home.",
      },
    ],
  }),
  component: BlogIndex,
});

const FEATURED_BG = "linear-gradient(155deg,#0B2818,#1E5F3B 55%,#22B57A)";
/** `.sc-photo` colours, cycled down the grid in reference order. */
const STORY_FRAMES = [
  "linear-gradient(160deg,#22B57A,#0B6B47)",
  "linear-gradient(160deg,#F2B705,#8C6A3D)",
  "linear-gradient(160deg,#C4390E,#7A2408)",
  "linear-gradient(160deg,#1E5F3B,#0B2818)",
  "linear-gradient(160deg,#F0791E,#C43B0E)",
  "linear-gradient(160deg,#8C6A3D,#5A3E1B)",
  "linear-gradient(160deg,#D9450F,#7A2408)",
];

function BlogIndex() {
  const posts = Route.useLoaderData();
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/blog/" });
  const { blog_page } = useSiteSettings();
  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];
  const active = category ?? "all";
  const filtered = active === "all" ? posts : posts.filter((p) => p.category === active);

  const featured = filtered.find((p) => p.isFeatured);
  const rest = featured ? filtered.filter((p) => p.id !== featured.id) : filtered;

  return (
    <>
      <SiteHeader variant="solid" />

      <main id="main">
        {/* Masthead */}
        <section className="full-bleed relative flex min-h-[640px] flex-col overflow-hidden text-center text-white">
          <PhotoFrame src={blog_page.banner_image} alt={toPlainText(blog_page.heading)} gradientCss={FEATURED_BG} priority placeholderLabel="images/blog-banner.jpg" className="absolute inset-0 z-0 h-full w-full" />
          <div className="absolute inset-0 z-[1] bg-black/60" aria-hidden="true" />
          <SiteHeader logo="light" />
          <div className="relative z-[1]">
            <span
              className={`mb-[22px] inline-flex items-center gap-2.5 text-[0.72rem] font-bold tracking-[0.18em] uppercase ${
                "text-white/80"
              }`}
            >
              <span
                className={`h-px w-[34px] ${"bg-white/40"}`}
                aria-hidden="true"
              />
              {blog_page.volume_label}
              <span
                className={`h-px w-[34px] ${"bg-white/40"}`}
                aria-hidden="true"
              />
            </span>
            <h1
              className={`mx-auto mb-[18px] max-w-[820px] font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.08] font-bold ${
                "text-white [text-shadow:0_4px_20px_rgba(0,0,0,0.4)]"
              }`}
            >
              <Emphasised text={blog_page.heading} />
            </h1>
            <p
              className={`mx-auto max-w-[520px] text-center text-[1rem] ${
                "text-white/85"
              }`}
            >
              <FormatText>{blog_page.subtext}</FormatText>
            </p>
          </div>
        </section>

        {/* Category rail */}
        <div className="wide flex flex-nowrap gap-2.5 overflow-x-auto px-5 pt-[26px] pb-1.5 min-[640px]:flex-wrap min-[640px]:justify-center min-[640px]:overflow-visible min-[640px]:px-10 min-[640px]:pb-0">
          <CategoryPill
            label="All Stories"
            isActive={active === "all"}
            onClick={() =>
              navigate({ search: () => ({}), replace: true, resetScroll: false })
            }
          />
          {categories.map((c) => (
            <CategoryPill
              key={c}
              label={c}
              isActive={active === c}
              onClick={() =>
                navigate({
                  search: () => ({ category: c }),
                  replace: true,
                  resetScroll: false,
                })
              }
            />
          ))}
        </div>

        {/* Featured story */}
        {featured ? (
          <section className="wide px-5 pt-14 pb-5 nav:px-10">
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="group grid overflow-hidden rounded-[22px] bg-paper shadow-[0_24px_60px_rgba(20,30,20,0.12)] nav:grid-cols-[1.15fr_1fr]"
            >
              <PhotoFrame
                src={featured.coverImage}
                alt={featured.title}
                gradientCss={FEATURED_BG}
                priority
                placeholderLabel={`images/blog-featured-${featured.slug}.jpg`}
                className="min-h-[280px] w-full nav:min-h-[420px]"
              >
                {featured.category ? (
                  <span className="absolute top-[22px] left-[22px] z-[2] rounded-[20px] bg-white/92 px-4 py-2 text-[0.72rem] font-bold tracking-[0.04em] text-ink uppercase">
                    {featured.category}
                  </span>
                ) : null}
              </PhotoFrame>

              <div className="flex flex-col justify-center px-7 py-[34px] nav:px-[46px] nav:py-12">
                <span className="mb-3.5 text-[0.78rem] font-bold tracking-[0.1em] text-orange uppercase">
                  {blog_page.featured_eyebrow}
                </span>
                <h2 className="mb-4 font-display text-[clamp(1.6rem,2.6vw,2.15rem)] leading-[1.2] font-bold">
                  {featured.title}
                </h2>
                {featured.excerpt ? (
                  <p className="mb-[26px] max-w-[440px] text-[0.96rem] leading-[1.75] text-muted">
                    {featured.excerpt}
                  </p>
                ) : null}
                {featured.authorName ? (
                  <div className="mb-6 flex items-center gap-3.5">
                    <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-green-dark font-display text-[0.92rem] font-bold text-white">
                      {featured.authorName.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="text-[0.8rem] leading-[1.4] text-muted">
                      <b className="font-semibold text-ink">{featured.authorName}</b>
                      {featured.authorRole ? `, ${featured.authorRole}` : ""}
                      {featured.readTime ? ` · ${featured.readTime}` : ""}
                    </span>
                  </div>
                ) : null}
                <span className="inline-flex w-fit items-center gap-2 border-b-2 border-orange pb-[3px] text-[0.9rem] font-semibold text-ink">
                  Read The Full Story →
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        {/* Story grid */}
        <div className="wide px-5 pt-9 pb-[90px] nav:px-10">
          <div className="mb-[30px] flex flex-wrap items-baseline justify-between gap-5">
            <h2 className="font-display text-[1.5rem] font-bold">
              {blog_page.latest_heading}
            </h2>
            <span className="text-[0.85rem] text-muted">
              {rest.length} article{rest.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* min-[…] rather than `sm:`/`nav:` — the custom `nav` breakpoint is emitted
              before `sm` in the cascade, so mixing the two lets 640px win at 1440px. */}
          {rest.length ? (
            <div className="grid gap-x-5 gap-y-6 min-[640px]:grid-cols-2 min-[980px]:grid-cols-3 min-[980px]:gap-x-7 min-[980px]:gap-y-[30px]">
              {rest.map((post, i) => (
                <Link
                  key={post.id}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="group flex flex-col"
                >
                  <PhotoFrame
                    src={post.coverImage}
                    alt={post.title}
                    gradientCss={STORY_FRAMES[i % STORY_FRAMES.length]}
                    placeholderLabel={`images/blog-${post.slug}.jpg`}
                    className="mb-[18px] aspect-[4/3] w-full rounded-2xl transition-transform duration-300 group-hover:-translate-y-1"
                  >
                    {post.category ? (
                      <span className="absolute top-3.5 left-3.5 z-[2] rounded-[20px] bg-white/92 px-3 py-1.5 text-[0.66rem] font-bold tracking-[0.03em] text-ink uppercase">
                        {post.category}
                      </span>
                    ) : null}
                    {post.readTime ? (
                      <span className="absolute right-3.5 bottom-3.5 z-[2] rounded-[20px] bg-[rgba(20,25,20,0.55)] px-[11px] py-[5px] text-[0.66rem] font-semibold text-white backdrop-blur-[2px]">
                        {post.readTime}
                      </span>
                    ) : null}
                  </PhotoFrame>

                  <h3 className="mb-2.5 font-display text-[1.12rem] leading-[1.3] font-bold group-hover:text-orange">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="mb-4 line-clamp-3 text-[0.86rem] leading-[1.65] text-muted">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center gap-2.5 border-t border-rule pt-3.5 text-[0.78rem] text-muted">
                    {post.authorName ? (
                      <>
                        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-mint text-[0.68rem] font-bold text-green-dark">
                          {post.authorName.trim().charAt(0).toUpperCase()}
                        </span>
                        {post.authorName}
                      </>
                    ) : null}
                    {post.dateLabel ? <span>· 📅 {post.dateLabel}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-rule py-16 text-center text-muted">
              No stories in this category yet.
            </p>
          )}
        </div>

        {/* Newsletter */}
        <section className="px-5 pb-[90px] nav:px-10">
          <div
            className="wide flex flex-wrap items-center justify-between gap-[30px] rounded-[20px] px-7 py-9 nav:px-14 nav:py-[50px]"
            style={{ background: "linear-gradient(120deg,#EAF4EC,#FDF0E4)" }}
          >
            <div>
              <h3 className="mb-2 font-display text-[1.45rem] font-bold">
                {blog_page.newsletter_heading}
              </h3>
              <p className="max-w-[400px] text-[0.88rem] text-muted">
                <FormatText>{blog_page.newsletter_body}</FormatText>
              </p>
            </div>
            <NewsletterForm cta={blog_page.newsletter_cta} source="blog" />
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}

/** Renders `*phrase*` in the heading as the reference's italic orange <em>. */
function Emphasised({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*([^*]+)\*/g).map((chunk, i) =>
        i % 2 === 1 ? (
          <em key={i} className="text-orange italic">
            {chunk}
          </em>
        ) : (
          chunk
        ),
      )}
    </>
  );
}

/** `.cat-pill` — ink when active, per the blog reference. */
function CategoryPill({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`cursor-pointer rounded-[30px] border-[1.5px] px-5 py-[9px] text-[0.82rem] font-semibold whitespace-nowrap transition-all duration-200 ${
        isActive
          ? "border-ink bg-ink text-white"
          : "border-rule text-muted hover:border-orange hover:text-orange"
      }`}
    >
      {label}
    </button>
  );
}
