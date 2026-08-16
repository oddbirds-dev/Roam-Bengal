import { useSiteSettings } from "@/hooks/use-site-settings";
import { FeatureIcon } from "@/components/art/icons";
import { FEATURE_BG } from "./palette";
import type { HomeSectionProps } from "./registry";

export function FeaturesSection(_props: HomeSectionProps) {
  const { homepage } = useSiteSettings();
  return (
    <section className="shell pt-[70px] pb-[60px] nav:pt-[60px]" style={{ background: FEATURE_BG }}>
      <div className="wide grid grid-cols-3 gap-6 nav:grid-cols-6 nav:gap-2.5">
        {homepage.features.map((f) => (
          <div key={f.title} className="text-center">
            <span className="mx-auto mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-orange text-white">
              <FeatureIcon name={f.icon} />
            </span>
            <h4 className="mb-1 font-body text-[0.85rem] font-semibold">{f.title}</h4>
            <p className="text-center text-[0.72rem] text-muted">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
