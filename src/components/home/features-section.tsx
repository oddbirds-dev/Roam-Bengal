import { useSiteSettings } from "@/hooks/use-site-settings";
import { FeatureIcon } from "@/components/art/icons";
import { FEATURE_BG } from "./palette";
import type { HomeSectionProps } from "./registry";

const ADDITIONAL_FEATURES = [
  { icon: "calendar", title: "Festival Tours", text: "Experience Bangladesh's vibrant celebrations" },
  { icon: "route", title: "Schedule Tours", text: "Flexible itineraries built around your dates" },
] as const;

export function FeaturesSection(_props: HomeSectionProps) {
  const { homepage } = useSiteSettings();
  const features = [
    ...homepage.features,
    ...ADDITIONAL_FEATURES.filter((feature) => !homepage.features.some((item) => item.title === feature.title)),
  ];
  return (
    <section className="shell pt-[70px] pb-[60px] nav:pt-[60px]" style={{ background: FEATURE_BG }}>
      <div className="wide grid grid-cols-3 gap-6 nav:grid-cols-8 nav:gap-2.5">
        {features.map((f) => (
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
