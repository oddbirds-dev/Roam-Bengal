import { useSiteSettings } from "@/hooks/use-site-settings";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import { WhyIcon } from "@/components/art/icons";
import { STORY_BG } from "./palette";
import type { HomeSectionProps } from "./registry";

export function WhyChooseUsSection(_props: HomeSectionProps) {
  const { homepage } = useSiteSettings();
  return (
    <section className="py-[90px]" style={{ background: STORY_BG }}>
      <div className="wrap grid items-center gap-10 nav:grid-cols-2 nav:gap-[60px]">
        <div>
          <h2 className="mb-[18px] font-display text-[clamp(2rem,3.6vw,2.7rem)] leading-[1.15] font-bold text-ink">
            {homepage.why_heading}
          </h2>
          <p className="mb-[30px] max-w-[480px] text-[0.95rem] text-muted">
            <FormatText>{homepage.why_intro}</FormatText>
          </p>
          <div className="flex flex-col gap-[26px]">
            {homepage.why_items.map((item) => (
              <div key={item.title} className="flex items-start gap-[18px]">
                <WhyIcon name={item.icon} />
                <div>
                  <h3 className="mb-1 font-display text-[1.1rem] font-bold text-ink">{item.title}</h3>
                  <p className="max-w-[420px] text-[0.86rem] text-muted">
                    <FormatText>{item.text}</FormatText>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PhotoFrame
          src=""
          alt="Traveller hiking a forest trail in Bangladesh"
          gradientCss="linear-gradient(150deg,#22B57A,#F2B705 60%,#C4390E)"
          placeholderLabel="images/why-choose-us.jpg"
          className="order-first aspect-[4/4.6] w-full rounded-[20px] shadow-[0_20px_46px_rgba(0,0,0,0.16)] nav:order-none"
        />
      </div>
    </section>
  );
}
