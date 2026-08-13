import { useSiteSettings } from "@/hooks/use-site-settings";
import { ButtonLink } from "@/components/ui/button";
import { FormatText } from "@/components/ui/format-text";
import { DhakaScene } from "@/components/art/dhaka-scene";
import { DREAM_BG } from "./palette";
import type { HomeSectionProps } from "./registry";

export function DreamCtaSection(_props: HomeSectionProps) {
  const { homepage } = useSiteSettings();
  return (
    <section id="contact" className="py-[70px]" style={{ background: DREAM_BG }}>
      <div className="wrap grid items-center gap-10 nav:grid-cols-2">
        <div>
          <h2 className="mb-[22px] font-kalam text-[clamp(1.9rem,3.4vw,2.5rem)] leading-[1.3] font-bold">
            <span className="text-green">{homepage.cta_heading_1}</span>
            <br />
            About <span className="text-gold">{homepage.cta_heading_2}</span>
          </h2>
          {homepage.cta_paragraphs.map((p) => (
            <p key={p} className="mb-[18px] max-w-[480px] text-[0.95rem] leading-[1.6] text-ink">
              <FormatText>{p}</FormatText>
            </p>
          ))}
          <ButtonLink to={homepage.cta_link} variant="green-dark">
            {homepage.cta_label}
          </ButtonLink>
        </div>
        <DhakaScene className="h-auto w-full" />
      </div>
    </section>
  );
}
