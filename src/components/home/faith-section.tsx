import { useSiteSettings } from "@/hooks/use-site-settings";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import { Bed, DollarSign, Earth, File, Lock, MessageCircle } from "lucide-react";
import type { HomeSectionProps } from "./registry";

/** `faith_list` rows used to be plain strings before each reason got an icon; sites with
 *  settings saved under the old shape need to keep rendering until the admin re-saves. */
function faithListItem(row: string | { icon: string; text: string }) {
  return typeof row === "string" ? { icon: "globe", text: row } : row;
}

/** One bubble colour per reason, cycling through the brand palette so the list reads as
 *  colourful rather than a monochrome repeat of `WhyIcon`'s default green. */
const ICON_COLORS = [
  { bg: "#DCEFE0", fg: "#1E5F3B" }, // green
  { bg: "#FBE1D2", fg: "#C4390E" }, // rust
  { bg: "#FBF0C8", fg: "#8C6A3D" }, // gold
  { bg: "#DCEAE7", fg: "#123D30" }, // teal
  { bg: "#F0E6D8", fg: "#5A3E1B" }, // brown
  { bg: "#FCE8D6", fg: "#C4390E" }, // orange
];

/** Icons are fixed by position, matching the order of the reasons in the list. */
const ICONS = [Lock, DollarSign, File, Bed, Earth, MessageCircle];

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

          <ul className="flex flex-col gap-3.5">
            {homepage.faith_list.map(faithListItem).map((item, i) => {
              const Icon = ICONS[i % ICONS.length]!;
              const { bg, fg } = ICON_COLORS[i % ICON_COLORS.length]!;
              return (
              <li key={item.text} className="flex items-center gap-3 text-[0.95rem] leading-[1.5] text-ink">
                <span
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: bg, color: fg }}
                >
                  <Icon size={20} strokeWidth={2} aria-hidden="true" />
                </span>
                <FormatText>{item.text}</FormatText>
              </li>
              );
            })}
          </ul>
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
