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
  const { post, related, tours } = Route.useLoaderData();
  const fullUrl = `https://roambengal.com/blog/${post.slug}`; // Could be dynamic, but this is fine for share links

  return (
    <>
      <div className="bg-green-dark">
        <SiteHeader />
        <div className="wrap py-14 text-left">
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
        <div className="wrap grid gap-10 py-12 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-rule bg-paper shadow-sm">
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
                    <span className="font-medium">dY". {post.dateLabel}</span>
                  ) : null}
                </div>

                {post.excerpt ? (
                  <p className="mb-8 font-display text-[1.15rem] leading-8 text-green-dark italic">
                    {post.excerpt}
                  </p>
                ) : null}

                {post.body.length ? (
                  <article className="prose prose-sm md:prose-base max-w-none text-ink/85 prose-headings:font-display prose-headings:font-bold prose-headings:text-green-dark prose-a:text-orange prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-rule prose-th:bg-cream prose-th:p-3 prose-th:text-left prose-td:border prose-td:border-rule prose-td:p-3">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {post.body.join("\n\n")}
                    </ReactMarkdown>
                  </article>
                ) : (
                  <p className="mt-8 rounded-xl border border-dashed border-rule p-8 text-center text-[0.9rem] text-muted">
                    The full story is being written ?" check back shortly.
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <BlogSidebar relatedBlogs={related} tours={tours} />
          </aside>
        </div>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
