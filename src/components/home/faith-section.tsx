import { useSiteSettings } from "@/hooks/use-site-settings";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import type { HomeSectionProps } from "./registry";

export function FaithSection(_props: HomeSectionProps) {
  const { homepage } = useSiteSettings();
  return (
    <section className="pt-[100px] pb-[90px]">
      <div className="wrap grid grid-cols-1 items-start gap-10 nav:grid-cols-2 nav:gap-x-[60px] nav:gap-y-14">
        <div className="relative nav:col-start-1 nav:row-start-1">
          <div className="absolute -top-4 -left-4 h-full w-full rounded-[20px] bg-green" />
          <PhotoFrame
            src={homepage.faith_image_1}
            alt="Local guide talking with a group of travellers in Bangladesh"
            gradientCss="linear-gradient(150deg,#22B57A,#0B6B47)"
            placeholderLabel="images/why-trust-guide.jpg"
            className="relative aspect-[4/3] w-full rounded-[20px] shadow-[0_20px_46px_rgba(0,0,0,0.16)]"
          />
        </div>

        <div className="nav:col-start-2 nav:row-start-1">
          <h2 className="mb-5 font-kalam text-[clamp(1.9rem,3.2vw,2.5rem)] leading-[1.25] font-bold text-ink">
            {homepage.faith_heading_1}
            <br />
            {homepage.faith_heading_2}
          </h2>

          <ol className="flex flex-col gap-3">
            {homepage.faith_list.map((item, i) => (
              <li key={item} className="flex gap-2.5 text-[0.95rem] leading-[1.5] text-ink">
                <span className="shrink-0 font-semibold text-green">{i + 1}.</span>
                <FormatText>{item}</FormatText>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col justify-center gap-5 nav:col-start-1 nav:row-start-2">
          {homepage.faith_callouts.map((c) => (
            <p key={c.lead} className="text-[0.92rem] leading-[1.6] text-muted">
              <strong className="text-ink">
                <FormatText>{c.lead}</FormatText>
              </strong>{" "}
              <FormatText>{c.text}</FormatText>
            </p>
          ))}
        </div>

        <div className="relative nav:col-start-2 nav:row-start-2">
          <div className="absolute -right-4 -bottom-4 h-full w-full rounded-[20px] bg-orange" />
          <PhotoFrame
            src={homepage.faith_image_2}
            alt="Travellers on a private boat tour through the Sundarbans"
            gradientCss="linear-gradient(150deg,#F0791E,#C4390E)"
            placeholderLabel="images/why-trust-boat.jpg"
            className="relative aspect-[4/3] w-full rounded-[20px] shadow-[0_20px_46px_rgba(0,0,0,0.16)]"
          />
        </div>
      </div>
    </section>
  );
}
