import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { SectionHead } from "@/components/sections";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { BLOG_FRAMES } from "./palette";
import type { HomeSectionProps } from "./registry";

export function JournalSection({ posts }: HomeSectionProps) {
  const { homepage } = useSiteSettings();
  const journalPosts = posts.slice(0, 3);

  return (
    <section id="blog" className="shell pt-20 pb-[30px] text-center">
      <SectionHead kicker={homepage.journal_kicker}>{homepage.journal_heading}</SectionHead>

      <div className="wide grid gap-[26px] nav:grid-cols-3">
        {journalPosts.map((post, i) => (
          <Link
            key={post.id}
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="overflow-hidden rounded-[18px] bg-paper pb-[26px] shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition-transform duration-[250ms] hover:-translate-y-1.5"
          >
            <PhotoFrame
              src={post.coverImage}
              alt={post.title}
              gradientCss={BLOG_FRAMES[i % BLOG_FRAMES.length]}
              placeholderLabel={`images/blog-${post.slug}.jpg`}
              className="mb-5 aspect-[4/3] w-full"
            />
            <h3 className="mx-[22px] mb-3.5 font-display text-[1.15rem] leading-[1.3] font-bold text-green">
              {post.title}
            </h3>
            {post.excerpt ? (
              <p className="mx-[22px] mb-5 line-clamp-3 text-[0.85rem] leading-[1.6] text-muted">
                {post.excerpt}
              </p>
            ) : null}
            <div className="mx-[22px] flex items-center justify-between border-t border-dashed border-[#E4E4E4] pt-4">
              <span className="border-b-2 border-green pb-0.5 text-[0.85rem] font-semibold text-green">
                Read More
              </span>
              <span className="text-[0.76rem] text-muted">
                📅 {post.readTime ?? post.dateLabel}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-11 mb-[90px]">
        <ButtonLink to="/blog" variant="outline-dark">
          View All Articles →
        </ButtonLink>
      </div>
    </section>
  );
}
