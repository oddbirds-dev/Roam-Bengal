import { useSiteSettings } from "@/hooks/use-site-settings";
import { Eyebrow } from "@/components/sections";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import type { HomeSectionProps } from "./registry";

export function FaithSection(_props: HomeSectionProps) {
  const { homepage } = useSiteSettings();
  return (
    <section className="pt-[100px] pb-[90px]">
      <div className="wrap grid items-center gap-10 nav:grid-cols-[0.85fr_1.15fr] nav:gap-[70px]">
        <div className="relative mx-auto min-h-[340px] w-full max-w-[340px] nav:mx-0 nav:min-h-[440px] nav:max-w-none">
          <div className="absolute -top-5 -left-[30px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(34,181,122,0.18),transparent_70%)]" />
          <PhotoFrame
            src=""
            alt="Bird native to the Sundarbans wetlands"
            gradientCss="linear-gradient(150deg,#3E7A6E,#123D30)"
            placeholderLabel="images/wildlife-1.jpg"
            className="absolute top-0 left-0 z-[1] aspect-[4/4.6] w-[78%] rotate-[-3deg] rounded-[22px] shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          />
          <PhotoFrame
            src=""
            alt="Royal Bengal tiger in the Sundarbans"
            gradientCss="linear-gradient(150deg,#F0791E,#8C3D0C)"
            placeholderLabel="images/wildlife-2.jpg"
            className="absolute right-0 -bottom-[30px] z-[2] aspect-[4/4.6] w-[60%] rotate-[3deg] rounded-[22px] shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          />
          <span className="absolute top-3.5 -right-1.5 z-[3] rounded-[20px] bg-paper px-3 py-1.5 text-[0.72rem] font-bold text-ink shadow-[0_6px_14px_rgba(0,0,0,0.15)]">
            {homepage.faith_pin}
          </span>
        </div>

        <div>
          <Eyebrow className="text-left">{homepage.faith_kicker}</Eyebrow>
          <h2 className="mt-2 mb-[22px] font-kalam text-[clamp(1.9rem,3.2vw,2.5rem)] leading-[1.3] font-bold text-green">
            {homepage.faith_heading_1}
            <br />
            <span className="text-orange">{homepage.faith_heading_2}</span>
          </h2>

          <ul className="mb-[30px] flex flex-col gap-3">
            {homepage.faith_list.map((item) => (
              <li key={item} className="relative pl-[26px] text-[0.92rem] leading-[1.5] text-ink">
                <span className="absolute top-px left-0 font-bold text-green">o"</span>
                <FormatText>{item}</FormatText>
              </li>
            ))}
          </ul>

          {homepage.faith_callouts.map((c) => (
            <div key={c.lead} className="mb-[18px] flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-[1.1rem] font-bold text-gold">→</span>
              <p className="text-[0.88rem] leading-[1.6] text-muted">
                <strong className="text-ink">
                  <FormatText>{c.lead}</FormatText>
                </strong>{" "}
                <FormatText>{c.text}</FormatText>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
