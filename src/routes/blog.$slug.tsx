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
import { FormatDocument } from "@/components/ui/format-text";
import type { BlogPostDTO } from "@/lib/content-types";

/**
 * No reference design exists for the post detail page — blog.html links to a
 * `blog-post-sundarbans.html` that was never built (PRD §16). This layout is derived
 * from the policy-page pattern: banner, single prose column, author block, related
 * posts.
 */
/** Curated `relatedSlugs` win; otherwise fall back to the other posts in sort order.
 *  Mirrors `resolveRelated` in tours.$slug.tsx. */
function resolveRelated(post: BlogPostDTO, all: BlogPostDTO[]): BlogPostDTO[] {
  const others = all.filter((p) => p.slug !== post.slug);
  if (post.relatedSlugs.length) {
    const picked = post.relatedSlugs
      .map((slug) => others.find((p) => p.slug === slug))
      .filter((p): p is BlogPostDTO => Boolean(p));
    if (picked.length) return picked.slice(0, 3);
  }
  return others.slice(0, 3);
}

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
      related: resolveRelated(post, all),
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
  const { post, related, tours } = Route.useLoaderData();
  const fullUrl = `https://roambengal.com/blog/${post.slug}`; // Could be dynamic, but this is fine for share links

  return (
    <>
      <div className="bg-green-dark">
        <SiteHeader />
        {/* The extra bottom padding is the runway the article card is pulled up into —
            it has to exceed the negative margin below or the card would clear the banner
            entirely and the overlap would collapse. */}
        <div className="wrap pt-14 pb-24 text-left md:pb-28">
          <nav className="mb-4 text-[0.76rem] font-semibold text-white" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-gold transition-colors">
              Home
            </Link>
            <span className="mx-2 text-white/50">&raquo;</span>
            <Link to="/blog" className="hover:text-gold transition-colors">
              Blogs
            </Link>
            <span className="mx-2 text-white/50">&raquo;</span>
            <span className="text-white/80">{post.title}</span>
          </nav>
          
          <h1 className="max-w-4xl font-display text-[clamp(1.8rem,4.4vw,2.9rem)] leading-tight text-white">
            {post.title}
          </h1>
          
          <div className="mt-8 flex items-center justify-between border-t border-white/15 pt-6">
            <BlogShare url={fullUrl} title={post.title} />
          </div>
        </div>
      </div>

      <main id="main">
        {/* `z-10` keeps the card above the banner's background but below the header's
            `z-30`, so the mobile nav drawer still opens over the article. */}
        <div className="wrap relative z-10 -mt-14 grid gap-10 pb-12 lg:grid-cols-[1fr_340px] md:-mt-20">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-rule bg-paper shadow-lg">
              <PhotoFrame
                src={post.coverImage}
                alt={post.title}
                gradient={gradientFor(post.slug)}
                priority
                placeholderLabel={`images/blog-${post.slug}.jpg`}
                className="aspect-[16/10] w-full"
              />

              <div className="p-6 md:p-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5 text-[0.82rem] text-muted">
                  {post.authorName ? (
                    <div className="flex items-center gap-2.5">
                      <InitialAvatar name={post.authorName} className="h-7 w-7 text-[0.7rem]" />
                      <span>
                        <b className="font-semibold text-ink">@ {post.authorName}</b>
                      </span>
                    </div>
                  ) : <div />}
                  {post.dateLabel ? (
                    <span className="font-medium">📅 {post.dateLabel}</span>
                  ) : null}
                </div>

                {post.excerpt ? (
                  <p className="mb-8 font-display text-[1.15rem] leading-8 text-green-dark italic">
                    {post.excerpt}
                  </p>
                ) : null}

                {post.body.length ? (
                  <article className="blog-body">
                    <FormatDocument>{post.body.join("\n\n")}</FormatDocument>
                  </article>
                ) : (
                  <p className="mt-8 rounded-xl border border-dashed border-rule p-8 text-center text-[0.9rem] text-muted">
                    The full story is being written — check back shortly.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cancels the grid's pull-up so only the article card laps onto the banner.
              Below `lg` this column stacks under the article, where it never applied. */}
          <aside className="lg:sticky lg:top-6 lg:mt-20 lg:h-fit">
            <BlogSidebar relatedBlogs={related} tours={tours} />
          </aside>
        </div>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
