import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button, ButtonLink } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { submitInquiry } from "@/lib/capture.functions";
import {
  TRIP_BUILDER_AREAS,
  TRIP_BUILDER_PRESETS,
  TRIP_BUILDER_REGIONS,
  type TripBuilderArea,
} from "@/content/trip-builder-data";
import type { HomeSectionProps } from "./registry";

const AREAS_BY_REGION = TRIP_BUILDER_REGIONS.map((region) => ({
  region,
  areas: TRIP_BUILDER_AREAS.filter((a) => a.region === region),
}));

const FIELD =
  "w-full rounded-[10px] border-[1.5px] border-rule bg-paper px-3.5 py-2.5 " +
  "font-body text-[0.86rem] text-ink outline-none focus:border-green";

export function TripBuilderSection(_props: HomeSectionProps) {
  const { whatsapp } = useSiteSettings();
  const send = useServerFn(submitInquiry);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const selectedAreas = useMemo(
    () => TRIP_BUILDER_AREAS.filter((a) => selected.has(a.id)),
    [selected],
  );
  const totalDays = selectedAreas.reduce((sum, a) => sum + a.days, 0);

  function toggleArea(id: string) {
    setActivePreset(null);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyPreset(presetId: string) {
    const preset = TRIP_BUILDER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setSelected(new Set(preset.areaIds));
  }

  function clearAll() {
    setActivePreset(null);
    setSelected(new Set());
  }

  const areaNames = selectedAreas.map((a) => a.label).join(", ");
  const dayWord = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

  const whatsappText = selectedAreas.length
    ? `Hi! I'd like a custom tour covering: ${areaNames} (about ${dayWord(totalDays)}).`
    : "Hi! I'd like help planning a custom tour of Bangladesh.";
  const whatsappHref = whatsapp.link.includes("?")
    ? `${whatsapp.link}&text=${encodeURIComponent(whatsappText)}`
    : `${whatsapp.link}?text=${encodeURIComponent(whatsappText)}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedAreas.length === 0) return;
    const form = new FormData(e.currentTarget);
    setState("sending");
    setError("");
    const notes = String(form.get("notes") ?? "").trim();
    const startDate = String(form.get("start_date") ?? "").trim();
    const preset = activePreset ? TRIP_BUILDER_PRESETS.find((p) => p.id === activePreset) : null;
    const message = [
      `Areas selected (${selectedAreas.length}): ${areaNames}`,
      `Estimated trip length: about ${dayWord(totalDays)}`,
      notes ? `Notes: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await send({
        data: {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          destination: preset ? preset.label : "Custom trip builder",
          start_date: startDate,
          message,
        },
      });
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <section className="shell pt-[70px] pb-[60px]">
      <div className="wide">
        <div className="mx-auto mb-8 max-w-[1000px] text-center">
          <h2 className="mb-2 font-display text-[1.9rem] font-bold">Build Your Own Trip</h2>
          <p className="text-[0.92rem] text-muted">
            Not sure where to start? Tap a ready-made trip, then add or remove areas.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5 min-[980px]:flex-nowrap">
            {TRIP_BUILDER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                aria-pressed={activePreset === preset.id}
                className={`rounded-2xl border-[1.5px] px-5 py-2.5 text-left transition-colors ${
                  activePreset === preset.id
                    ? "border-orange bg-orange text-white"
                    : "border-rule bg-paper text-ink hover:border-green"
                }`}
              >
                <span className="block text-[0.86rem] font-bold">{preset.label}</span>
                <span
                  className={`block text-[0.72rem] ${
                    activePreset === preset.id ? "text-white/75" : "text-muted"
                  }`}
                >
                  {preset.sublabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 min-[980px]:grid-cols-[1.6fr_1fr] min-[980px]:items-start">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-[1.1rem] font-bold">1. Tap the areas you want</h3>
              {selected.size > 0 ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[0.82rem] font-semibold text-green hover:underline"
                >
                  Clear all ({selected.size})
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-7">
              {AREAS_BY_REGION.map(({ region, areas }) => (
                <div key={region}>
                  <div className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-2">
                    {areas.map((area) => (
                      <AreaCard
                        key={area.id}
                        area={area}
                        selected={selected.has(area.id)}
                        onToggle={() => toggleArea(area.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-rule bg-paper p-6 min-[980px]:sticky min-[980px]:top-24">
            <h3 className="mb-1 font-display text-[1.1rem] font-bold">
              2. Where should we send the plan?
            </h3>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-cream px-3 py-1 text-[0.78rem] font-semibold text-ink">
                {selected.size} area{selected.size === 1 ? "" : "s"} selected
              </span>
              {selected.size > 0 ? (
                <span className="rounded-full bg-orange px-3 py-1 text-[0.78rem] font-semibold text-white">
                  about {dayWord(totalDays)}
                </span>
              ) : null}
            </div>

            {selectedAreas.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedAreas.map((a) => (
                  <span
                    key={a.id}
                    className="rounded-full bg-mint px-2.5 py-1 text-[0.74rem] font-medium text-green-dark"
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="mt-3 text-[0.76rem] text-muted">
              Travel time between areas is added by us when we build the route.
            </p>

            {state === "done" ? (
              <div className="mt-5 rounded-xl border border-green-bright/40 bg-mint p-5 text-center">
                <p className="font-display text-[1rem] font-bold text-green">Sent — thank you!</p>
                <p className="mt-1.5 text-[0.84rem] text-muted">
                  We reply to every request personally, usually the same day.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3.5">
                <input name="name" type="text" required placeholder="Your name" className={FIELD} />
                <input name="email" type="email" required placeholder="Your email" className={FIELD} />
                <input
                  name="start_date"
                  type="date"
                  aria-label="Preferred start date (optional)"
                  className={FIELD}
                />
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Optional — how many people, anything special"
                  className={`${FIELD} resize-y`}
                />

                {state === "error" ? (
                  <p role="alert" className="text-[0.82rem] text-rust">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  variant="green-dark"
                  disabled={selectedAreas.length === 0 || state === "sending"}
                  className="w-full py-3.5"
                >
                  {state === "sending" ? "Sending…" : "Send the places — get a custom tour"}
                </Button>
                <ButtonLink to={whatsappHref} variant="whatsapp" className="w-full py-3.5">
                  Or send it on WhatsApp
                </ButtonLink>
                <p className="text-center text-[0.74rem] text-muted">
                  Free, no payment now. We reply within 24 hours.
                </p>
              </form>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

function AreaCard({
  area,
  selected,
  onToggle,
}: {
  area: TripBuilderArea;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`relative rounded-2xl border-[1.5px] p-4 text-left transition-colors ${
        selected ? "border-green-dark bg-mint/60" : "border-rule bg-paper hover:border-green"
      }`}
    >
      <span
        className={`absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-md border-[1.5px] text-[0.7rem] ${
          selected ? "border-orange bg-orange text-white" : "border-rule text-transparent"
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
      <span className="flex items-center gap-2 pr-8">
        <span className="font-body text-[0.92rem] font-bold">{area.label}</span>
      </span>
      <span className="mt-1.5 block text-[0.78rem] leading-5 text-muted">{area.blurb}</span>
    </button>
  );
}
