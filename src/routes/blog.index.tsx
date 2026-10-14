import { createFileRoute, Link } from "@tanstack/react-router";
import { FaCalendar } from "react-icons/fa";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { imageMeta } from "@/lib/image-meta";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { toPlainText } from "@/lib/markdown";
import { listPublishedPosts } from "@/lib/site-content.functions";

export const Route = createFileRoute("/blog/")({
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
  const { blog_page } = useSiteSettings();

  return (
    <>

      <main id="main">
        {/* Masthead */}
        <section className="full-bleed relative flex min-h-[480px] flex-col overflow-hidden text-center text-white">
          <PhotoFrame src={blog_page.banner_image} alt={imageMeta(blog_page, "banner_image").alt || toPlainText(blog_page.heading)} title={imageMeta(blog_page, "banner_image").title} gradientCss={FEATURED_BG} priority showPlaceholder={false} className="absolute inset-0 z-0 h-full w-full" />
          <div className="absolute inset-0 z-[1] bg-black/60" aria-hidden="true" />
          <SiteHeader logo="light" />
          <div className="relative z-[1]">
            <span className="mb-[22px] inline-flex items-center gap-2.5 text-[0.72rem] font-bold tracking-[0.18em] text-white/80 uppercase">
              <span className="h-px w-[34px] bg-white/40" aria-hidden="true" />
              {blog_page.volume_label}
              <span className="h-px w-[34px] bg-white/40" aria-hidden="true" />
            </span>
            <h1 className="mx-auto mb-[18px] max-w-[820px] font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.08] font-bold text-white [text-shadow:0_4px_20px_rgba(0,0,0,0.4)]">
              <Emphasised text={blog_page.heading} />
            </h1>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1340px] px-5 pt-[81px] pb-[90px] font-opensans text-[#2B2B2B]">
          {/* Story grid */}
          {posts.length ? (
            <div className="grid gap-[31px] min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
              {posts.map((post, i) => (
                <article
                  key={post.id}
                  className="flex flex-col rounded-[10px] bg-paper p-5 pb-[25px] shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
                >
                  <Link to="/blog/$slug" params={{ slug: post.slug }} tabIndex={-1} aria-hidden="true">
                    <PhotoFrame
                      src={post.coverImage}
                      alt={post.coverImageAlt ?? post.title}
                      gradientCss={STORY_FRAMES[i % STORY_FRAMES.length]}
                      placeholderLabel={`images/blog-${post.slug}.jpg`}
                      className="aspect-[372/250] w-full overflow-hidden rounded-[10px]"
                    />
                  </Link>

                  <h3 className="mt-[22px] mb-[18px] text-center font-montserrat text-[19px] leading-[25px] font-bold text-[#115436]">
                    <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:underline">
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt ? (
                    <p className="mb-[16px] line-clamp-3 text-[14px] leading-[20px] text-[#2B2B2B]">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between gap-3 font-body">
                    <Link
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="border-b-2 border-[#115436] px-1 pb-[2px] text-[15px] leading-[20px] text-[#115436]"
                    >
                      Read More
                    </Link>
                    {post.dateLabel ? (
                      <span className="flex items-center gap-2 text-[14px] leading-[20px] text-black">
                        <FaCalendar aria-hidden="true" className="text-[13px] text-[#115436]" />
                        {post.dateLabel}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-rule py-16 text-center text-muted">
              No stories published yet.
            </p>
          )}
        </div>
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
