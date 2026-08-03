import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { NewsletterForm } from "@/components/newsletter-form";
import { InitialAvatar } from "@/components/sections";
import { PhotoFrame, gradientFor } from "@/components/ui/photo-frame";
import { useSiteSettings } from "@/hooks/use-site-settings";
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
      <div className="bg-green-dark">
        <SiteHeader />
      </div>

      <main id="main">
        <section className="wrap py-16 text-center">
          <span className="text-[0.74rem] font-semibold tracking-[0.2em] text-orange uppercase">
            {blog_page.volume_label}
          </span>
          <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.2rem)] leading-tight text-green">
            {blog_page.heading}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[0.94rem] leading-7 text-muted">
            {blog_page.subtext}
          </p>
        </section>

        <div className="wrap flex flex-wrap justify-center gap-3 pb-10">
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
                navigate({ search: () => ({ category: c }), replace: true, resetScroll: false })
              }
            />
          ))}
        </div>

        {featured ? (
          <section className="wrap pb-16">
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="group grid overflow-hidden rounded-2xl border border-rule bg-paper transition-shadow hover:shadow-xl lg:grid-cols-2"
            >
              <PhotoFrame
                src={featured.coverImage}
                alt={featured.title}
                gradient={gradientFor(featured.slug)}
                priority
                placeholderLabel={`images/blog-featured-${featured.slug}.jpg`}
                className="aspect-[16/10] w-full lg:aspect-auto lg:min-h-[340px]"
              >
                {featured.category ? (
                  <span className="absolute top-4 left-4 rounded-full bg-paper/90 px-3 py-1 text-[0.7rem] font-semibold text-green-dark">
                    {featured.category}
                  </span>
                ) : null}
              </PhotoFrame>
              <div className="flex flex-col justify-center p-8">
                <span className="text-[0.72rem] font-semibold tracking-[0.2em] text-orange uppercase">
                  {blog_page.featured_eyebrow}
                </span>
                <h2 className="mt-3 font-display text-[clamp(1.4rem,2.6vw,2rem)] leading-snug text-green-dark group-hover:text-green">
                  {featured.title}
                </h2>
                {featured.excerpt ? (
                  <p className="mt-3 text-[0.92rem] leading-7 text-muted">
                    {featured.excerpt}
                  </p>
                ) : null}
                <div className="mt-5 flex items-center gap-2.5 text-[0.82rem] text-muted">
                  {featured.authorName ? (
                    <>
                      <InitialAvatar name={featured.authorName} className="h-8 w-8" />
                      <span>
                        <b className="text-ink">{featured.authorName}</b>
                        {featured.authorRole ? `, ${featured.authorRole}` : ""}
                        {featured.readTime ? ` · ${featured.readTime}` : ""}
                      </span>
                    </>
                  ) : null}
                </div>
                <span className="mt-6 font-semibold text-green underline-offset-4 group-hover:underline">
                  Read The Full Story →
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        <section className="wrap pb-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-display text-[1.6rem] text-green">
              {blog_page.latest_heading}
            </h2>
            <span className="text-[0.84rem] text-muted">
              {rest.length} article{rest.length === 1 ? "" : "s"}
            </span>
          </div>

          {rest.length ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <Link
                  key={post.id}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-rule bg-paper transition-shadow hover:shadow-lg"
                >
                  <PhotoFrame
                    src={post.coverImage}
                    alt={post.title}
                    gradient={gradientFor(post.slug)}
                    placeholderLabel={`images/blog-${post.slug}.jpg`}
                    className="aspect-[16/10] w-full"
                  >
                    {post.category ? (
                      <span className="absolute top-3 left-3 rounded-full bg-paper/90 px-3 py-1 text-[0.68rem] font-semibold text-green-dark">
                        {post.category}
                      </span>
                    ) : null}
                    {post.readTime ? (
                      <span className="absolute top-3 right-3 rounded-full bg-ink/60 px-3 py-1 text-[0.66rem] font-medium text-white">
                        {post.readTime}
                      </span>
                    ) : null}
                  </PhotoFrame>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-[1.05rem] leading-snug font-bold text-green-dark group-hover:text-green">
                      {post.title}
                    </h3>
                    {post.excerpt ? (
                      <p className="mt-2 line-clamp-3 text-[0.84rem] leading-6 text-muted">
                        {post.excerpt}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center gap-2 pt-4 text-[0.76rem] text-muted">
                      {post.authorName ? (
                        <>
                          <InitialAvatar name={post.authorName} className="h-6 w-6" />
                          {post.authorName}
                        </>
                      ) : null}
                      {post.dateLabel ? <span>· 📅 {post.dateLabel}</span> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-rule py-16 text-center text-muted">
              No stories in this category yet.
            </p>
          )}
        </section>

        <section className="bg-mint py-16">
          <div className="wrap max-w-2xl text-center">
            <h3 className="font-display text-[1.5rem] text-green">
              {blog_page.newsletter_heading}
            </h3>
            <p className="mt-3 text-[0.9rem] leading-7 text-muted">
              {blog_page.newsletter_body}
            </p>
            <NewsletterForm cta={blog_page.newsletter_cta} source="blog" />
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}

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
      className={`rounded-[30px] border-[1.5px] px-5 py-2 text-[0.82rem] font-semibold transition-colors ${
        isActive
          ? "border-green-dark bg-green-dark text-white"
          : "border-rule bg-paper text-ink hover:border-green"
      }`}
    >
      {label}
    </button>
  );
}
