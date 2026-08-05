import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { InitialAvatar } from "@/components/sections";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame, gradientFor } from "@/components/ui/photo-frame";
import { getPostBySlug, listPublishedPosts, listPublishedTours } from "@/lib/site-content.functions";
import { getSeoMeta } from "@/lib/seo.functions";
import { buildSeoMeta } from "@/lib/seo-head";

import { BlogShare } from "@/components/blog/blog-share";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * No reference design exists for the post detail page — blog.html links to a
 * `blog-post-sundarbans.html` that was never built (PRD §16). This layout is derived
 * from the policy-page pattern: banner, single prose column, author block, related
 * posts.
 */
export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const [post, all, tours] = await Promise.all([
      getPostBySlug({ data: { slug: params.slug } }),
      listPublishedPosts(),
      listPublishedTours(),
    ]);
    if (!post) throw notFound();
    
    const seoMeta = await getSeoMeta({ data: { entity_type: "blog", entity_id: post.id } });
    
    return { 
      post, 
      related: all.filter((p) => p.slug !== post.slug).slice(0, 3), 
      seoMeta,
      tours: tours.slice(0, 5) 
    };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return {};
    
    return buildSeoMeta(loaderData.seoMeta, {
      title: `${post.title} — Roam Bengal`,
      description: post.excerpt ?? "",
      image: post.coverImage ?? undefined,
      urlPath: `/blog/${post.slug}`
    });
  },
  component: BlogPost,
});

function BlogPost() {
  const { post, related } = Route.useLoaderData();

  return (
    <>
      <div className="bg-green-dark">
        <SiteHeader />
        <div className="wrap py-14 text-center">
          {post.category ? (
            <span className="text-[0.72rem] font-semibold tracking-[0.2em] text-gold uppercase">
              {post.category}
            </span>
          ) : null}
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-[clamp(1.8rem,4.4vw,2.9rem)] leading-tight text-white">
            {post.title}
          </h1>
          <div className="mt-5 flex items-center justify-center gap-2.5 text-[0.82rem] text-white/70">
            {post.authorName ? (
              <>
                <InitialAvatar name={post.authorName} className="h-8 w-8" />
                <span>
                  <b className="text-white">{post.authorName}</b>
                  {post.authorRole ? `, ${post.authorRole}` : ""}
                </span>
              </>
            ) : null}
            {post.dateLabel ? <span>· 📅 {post.dateLabel}</span> : null}
            {post.readTime ? <span>· {post.readTime}</span> : null}
          </div>
          <nav className="mt-5 text-[0.76rem] text-white/60" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-gold">
              Home
            </Link>
            {" / "}
            <Link to="/blog" className="hover:text-gold">
              Journal
            </Link>
          </nav>
        </div>
      </div>

      <main id="main">
        <div className="wrap max-w-3xl py-12">
          <PhotoFrame
            src={post.coverImage}
            alt={post.title}
            gradient={gradientFor(post.slug)}
            priority
            placeholderLabel={`images/blog-${post.slug}.jpg`}
            className="aspect-[16/9] w-full rounded-2xl"
          />

          {post.excerpt ? (
            <p className="mt-8 font-display text-[1.15rem] leading-8 text-green-dark italic">
              {post.excerpt}
            </p>
          ) : null}

          {post.body.length ? (
            <article className="mt-8 flex flex-col gap-5">
              {post.body.map((paragraph, i) => (
                <p key={i} className="text-[0.98rem] leading-8 text-ink/85">
                  {paragraph}
                </p>
              ))}
            </article>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed border-rule p-8 text-center text-[0.9rem] text-muted">
              The full story is being written — check back shortly.
            </p>
          )}

          <div className="mt-12 rounded-2xl bg-mint p-7 text-center">
            <h3 className="font-display text-[1.3rem] text-green">
              Want to see this for yourself?
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[0.88rem] leading-6 text-muted">
              Every trip we run is private and shaped around you. Tell us what caught your
              eye and we will build an itinerary around it.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/tours" variant="green-dark">
                Browse Tours
              </ButtonLink>
              <ButtonLink to="/contact" variant="outline-dark">
                Plan Your Trip
              </ButtonLink>
            </div>
          </div>
        </div>

        {related.length ? (
          <section className="bg-cream py-16">
            <div className="wrap">
              <h2 className="mb-8 font-display text-[1.5rem] text-green">
                More From The Journal
              </h2>
              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to="/blog/$slug"
                    params={{ slug: r.slug }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-rule bg-paper transition-shadow hover:shadow-lg"
                  >
                    <PhotoFrame
                      src={r.coverImage}
                      alt={r.title}
                      gradient={gradientFor(r.slug)}
                      className="aspect-[16/10] w-full"
                    />
                    <div className="p-5">
                      <h3 className="font-display text-[1rem] leading-snug font-bold text-green-dark group-hover:text-green">
                        {r.title}
                      </h3>
                      {r.dateLabel ? (
                        <span className="mt-2 block text-[0.76rem] text-muted">
                          📅 {r.dateLabel}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
