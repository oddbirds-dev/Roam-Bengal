import { ButtonLink } from "@/components/ui/button";
import { FormatText } from "@/components/ui/format-text";

const CTA_BG = "linear-gradient(120deg,#EAF4EC,#FDF0E4)";

/** The soft green-to-peach invitation banner: heading and paragraph on the left, button on the right. */
export function CtaStrip({
  heading,
  body,
  label,
  link,
  className = "",
}: {
  heading: string;
  body?: string;
  label: string;
  link: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-[30px] rounded-[20px] px-7 py-9 min-[980px]:px-14 min-[980px]:py-[50px] ${className}`}
      style={{ background: CTA_BG }}
    >
      <div>
        <h3 className="mb-2 font-display text-[1.4rem] font-bold">{heading}</h3>
        {body ? (
          <p className="max-w-[400px] text-[0.88rem] text-muted">
            <FormatText>{body}</FormatText>
          </p>
        ) : null}
      </div>
      <ButtonLink to={link} variant="green-dark">
        {label}
      </ButtonLink>
    </div>
  );
}
