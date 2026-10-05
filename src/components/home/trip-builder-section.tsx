import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Minus, ShoppingCart } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormatText } from "@/components/ui/format-text";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { submitInquiry } from "@/lib/capture.functions";
import craftsCustomImage from "@/assets/abcd.png";
import type { HomeSectionProps } from "./registry";

interface TripBuilderArea {
  id: string;
  label: string;
  region: string;
  /** Typical length this area adds to an itinerary, used for the running total estimate. */
  days: number;
  blurb: string;
}

interface TripBuilderPreset {
  id: string;
  label: string;
  sublabel: string;
  /** Comma-separated `TripBuilderArea.id`s, as entered in the admin editor. */
  areaIds: string;
}

const FALLBACK_PRESETS: TripBuilderPreset[] = [
  {
    id: "first-time",
    label: "First time in Bangladesh",
    sublabel: "The classic loop",
    areaIds: "dhaka, sonargaon, bagerhat, sundarbans, sreemangal, chittagong, bandarban",
  },
  {
    id: "archaeology-heritage",
    label: "Archaeology & heritage",
    sublabel: "UNESCO sites, ruins, temples",
    areaIds: "dhaka-archaeology, sonargaon, bagerhat, puthia, natore-bagha, gaur, paharpur",
  },
  {
    id: "nature-wildlife",
    label: "Nature & wildlife",
    sublabel: "Forest, tigers, tea, birds",
    areaIds: "sundarbans, sreemangal, bandarban, barisal-backwaters",
  },
  {
    id: "photography",
    label: "Photography trip",
    sublabel: "Rivers, ships, markets, hills",
    areaIds: "dhaka-photography, barisal-backwaters, sundarbans, bandarban, chittagong",
  },
];

function splitAreaIds(areaIds: string): string[] {
  return areaIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

const FIELD =
  "w-full rounded-[10px] border-[1.5px] border-rule bg-paper px-3.5 py-2.5 " +
  "font-body text-[0.86rem] text-ink outline-none focus:border-green";

export function TripBuilderSection(_props: HomeSectionProps) {
  const { whatsapp, homepage } = useSiteSettings();
  const send = useServerFn(submitInquiry);

  const areas = homepage.trip_builder_areas as unknown as TripBuilderArea[];
  const configuredPresets = homepage.trip_builder_presets as unknown as TripBuilderPreset[];
  // Older CMS records may contain an empty array, which would otherwise leave the
  // ready-made-trip row invisible despite the feature being enabled in the UI.
  const presets = configuredPresets.length > 0 ? configuredPresets : FALLBACK_PRESETS;

  const areasByRegion = useMemo(() => {
    const regions: string[] = [];
    for (const area of areas) {
      if (!regions.includes(area.region)) regions.push(area.region);
    }
    return regions.map((region) => ({ region, areas: areas.filter((a) => a.region === region) }));
  }, [areas]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const selectedAreas = useMemo(
    () => areas.filter((a) => selected.has(a.id)),
    [areas, selected],
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
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setSelected(new Set(splitAreaIds(preset.areaIds)));
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
    const preset = activePreset ? presets.find((p) => p.id === activePreset) : null;
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
    <section className="shell relative isolate overflow-hidden bg-[#fffdf7] pt-[70px] pb-[60px]">
      <div className="tripBackground" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-no-repeat"
        style={{
          backgroundImage: `url(${craftsCustomImage})`,
          backgroundPosition: "center bottom",
          backgroundSize: "100% auto",
        }}
      />
      <div className="wide relative z-10">
        <div
          aria-label="Ready-made trip ideas"
          className="mx-auto mb-8 max-w-[1000px] text-center"
        >
          <h2 className="mb-2 font-display text-[1.9rem] font-bold">
            {homepage.trip_builder_heading}
          </h2>
          <p className="text-[0.92rem] text-muted">
            <FormatText>{homepage.trip_builder_intro}</FormatText>
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5 min-[980px]:flex-nowrap">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                aria-pressed={activePreset === preset.id}
                className={`rounded-full border-[1.5px] px-5 py-2.5 text-left transition-colors ${
                  activePreset === preset.id
                    ? "border-[#111827] bg-[#1249e8] text-white"
                    : "border-rule bg-paper text-ink hover:border-green"
                }`}
              >
                <span className="block text-[0.86rem] font-bold">{preset.label}</span>
                <span
                  className={`block text-[0.72rem] ${
                    activePreset === preset.id ? "text-white/80" : "text-muted"
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
              {areasByRegion.map(({ region, areas: regionAreas }) => (
                <div key={region}>
                  <div className="mb-4 flex items-center gap-3" aria-label={`${region} region`}>
                    <span className="h-px flex-1 bg-rule" />
                    <span className="rounded-full bg-[#e5eafb] px-4 py-2 text-center text-[0.74rem] font-bold uppercase tracking-[0.08em] text-[#2f5aa8]">
                      {region}
                    </span>
                    <span className="h-px flex-1 bg-rule" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-2">
                    {regionAreas.map((area) => (
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
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-[1.1rem] font-bold">
                2. Where should we send the plan?
              </h3>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#eef3ff] px-3 py-1.5 text-[0.74rem] font-bold text-[#2f5aa8]">
                <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                Cart · {selected.size}
              </span>
            </div>

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
              <div className="mt-3 rounded-xl border border-rule bg-cream/60 p-3">
                <div className="mb-2 flex items-center justify-between text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted">
                  <span>Your trip cart</span>
                  <span>{selectedAreas.length} place{selectedAreas.length === 1 ? "" : "s"}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                {selectedAreas.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-mint px-2.5 py-1.5 text-[0.74rem] font-medium text-green-dark"
                  >
                    <span className="min-w-0 truncate">{a.label}</span>
                    <button
                      type="button"
                      onClick={() => toggleArea(a.id)}
                      aria-label={`Remove ${a.label} from trip cart`}
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-green-dark/70 hover:bg-white hover:text-rust"
                    >
                      <Minus className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                </div>
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

/**
 * Corner watermark art for the trip builder — leaf sprigs, a pair of birds, a river
 * silhouette (boatman + palms) and a domed-building silhouette, plus the handwritten
 * "More Than a Trip / A Deeper Connection" note. Purely decorative, so every piece is
 * `aria-hidden` and sits behind the card content via `-z-10`.
 */
function TripBuilderDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden">
      <LeafSprig className="absolute -top-8 -left-8 h-44 w-44 text-green/30 sm:h-56 sm:w-56" />
      <LeafSprig className="absolute -top-8 -right-8 h-44 w-44 scale-x-[-1] text-green/30 sm:h-56 sm:w-56" />

      <Bird className="absolute top-[14%] right-[16%] h-4 w-7 text-ink/25" />
      <Bird className="absolute top-[20%] right-[9%] h-3 w-5 text-ink/20" />
      <Bird className="absolute top-[11%] right-[6%] h-2.5 w-4 text-ink/15" />

      {/* Full-width horizon band: dunes, the river/boatman/palms on the left, the domed
          building on the right — one continuous scene rather than two separate corner
          motifs, matching the reference banner. */}
      <svg
        className="absolute inset-x-0 bottom-0 h-40 w-full text-green-dark/15 sm:h-56"
        viewBox="0 0 1536 320"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 230C160 200 260 260 420 235S620 190 760 220 980 260 1140 225 1400 190 1536 215V320H0V230Z"
          fill="currentColor"
          opacity="0.55"
        />
        <path
          d="M0 265C200 245 340 285 480 268S740 235 900 260 1120 290 1280 262 1450 235 1536 250V320H0V265Z"
          fill="currentColor"
          opacity="0.35"
        />
      </svg>

      <RiverScene className="absolute -bottom-2 -left-2 h-40 w-56 text-green-dark/25 sm:h-52 sm:w-72" />
      <DomeBuilding className="absolute -right-4 -bottom-2 h-36 w-48 text-brown/25 sm:h-48 sm:w-64" />

      <p className="font-script absolute right-6 bottom-6 hidden -rotate-3 text-right text-[1.15rem] leading-tight text-green-dark/70 sm:block">
        More Than a Trip
        <br />A Deeper Connection
      </p>
    </div>
  );
}

/** One outlined petal, drawn along the local +x axis so it can be placed with a plain
 *  `translate + rotate` transform — simpler and tidier than rotating an off-center ellipse. */
function Petal({ x, y, angle, length = 15 }: { x: number; y: number; angle: number; length?: number }) {
  const w = length * 0.34;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path
        d={`M0 0C${length * 0.3} ${-w} ${length * 0.7} ${-w} ${length} 0C${length * 0.7} ${w} ${length * 0.3} ${w} 0 0Z`}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </g>
  );
}

/** A cascading leaf sprig, angled in from the corner it's anchored to: a curved stem
 *  with alternating petal-shaped leaves along its length. */
function LeafSprig({ className }: { className?: string }) {
  const stemPoints: [number, number][] = [
    [16, 14],
    [26, 30],
    [38, 48],
    [48, 66],
    [58, 84],
    [70, 100],
  ];
  const leaves = [
    { x: 22, y: 20, angle: -55 },
    { x: 26, y: 30, angle: 35 },
    { x: 34, y: 42, angle: -50 },
    { x: 40, y: 52, angle: 40 },
    { x: 46, y: 64, angle: -42 },
    { x: 50, y: 70, angle: 45 },
    { x: 56, y: 82, angle: -35 },
    { x: 60, y: 88, angle: 48 },
    { x: 66, y: 98, angle: -28 },
  ];

  const stem = stemPoints.reduce(
    (d, [x, y], i) => (i === 0 ? `M${x} ${y}` : `${d}L${x} ${y}`),
    "",
  );

  return (
    <svg viewBox="0 0 120 120" fill="none" className={className}>
      <path d={stem} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {leaves.map((leaf, i) => (
        <Petal key={i} x={leaf.x} y={leaf.y} angle={leaf.angle} length={13} />
      ))}
    </svg>
  );
}

function Bird({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 12" fill="none" className={className}>
      <path
        d="M1 8C4 2 8 2 12 6C16 2 20 2 23 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** One arched, drooping palm frond fanning out from an apex point. */
function Frond({
  apex,
  dir,
  length = 32,
}: {
  apex: [number, number];
  dir: [number, number];
  length?: number;
}) {
  const [ax, ay] = apex;
  const [ux, uy] = dir;
  const midX = ax + ux * length * 0.35;
  const midY = ay + uy * length * 0.65 - 7;
  const endMidX = ax + ux * length * 0.75;
  const endMidY = ay + uy * length * 0.95;
  const tipX = ax + ux * length;
  const tipY = ay + uy * length + 11;
  return (
    <path
      d={`M${ax} ${ay}C${midX} ${midY} ${endMidX} ${endMidY} ${tipX} ${tipY}`}
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  );
}

/** A palm: a slightly curved trunk topped with a fan of five drooping fronds. */
function PalmTree({ base, height = 60 }: { base: [number, number]; height?: number }) {
  const [bx, by] = base;
  const apex: [number, number] = [bx - height * 0.15, by - height];
  const dirs: [number, number][] = [
    [-1, -0.15],
    [-0.55, -0.85],
    [0, -1],
    [0.55, -0.85],
    [1, -0.15],
  ];
  return (
    <g>
      <path
        d={`M${bx} ${by}Q${bx - height * 0.25} ${by - height * 0.55} ${apex[0]} ${apex[1]}`}
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {dirs.map((dir, i) => (
        <Frond key={i} apex={apex} dir={dir} length={height * 0.55} />
      ))}
    </g>
  );
}

/** Boatman on the river flanked by two palms, as the left end of the horizon band. */
function RiverScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 200" fill="none" className={className}>
      <PalmTree base={[36, 150]} height={62} />
      <PalmTree base={[86, 168]} height={72} />

      <path
        d="M120 190C150 176 190 176 215 190"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M140 188L154 150L168 188Z" fill="currentColor" />
      <circle cx="154" cy="136" r="8" fill="currentColor" />
      <path d="M120 178L215 178" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A Taj-style domed pavilion with corner minarets, the right end of the horizon band. */
function DomeBuilding({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 200" fill="none" className={className}>
      <rect x="80" y="110" width="100" height="80" fill="currentColor" />
      <path d="M80 110L130 88L180 110Z" fill="currentColor" />
      <path
        d="M130 30C152 30 168 52 168 78C168 96 152 108 130 108C108 108 92 96 92 78C92 52 108 30 130 30Z"
        fill="currentColor"
      />
      <rect x="124" y="8" width="12" height="26" fill="currentColor" />
      <circle cx="130" cy="6" r="5" fill="currentColor" />
      <path d="M112 190V150C112 138 120 130 130 130C140 130 148 138 148 150V190Z" fill="currentColor" opacity="0.6" />

      {[36, 224].map((cx, i) => (
        <g key={i}>
          <rect x={cx - 8} y="118" width="16" height="72" fill="currentColor" />
          <path
            d={`M${cx - 10} 118C${cx - 10} 104 ${cx + 10} 104 ${cx + 10} 118Z`}
            fill="currentColor"
          />
          <rect x={cx - 3} y="96" width="6" height="14" fill="currentColor" />
          <circle cx={cx} cy="94" r="3.5" fill="currentColor" />
        </g>
      ))}

      <rect x="0" y="188" width="260" height="12" fill="currentColor" />
    </svg>
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
    <label
      className={`relative block cursor-pointer rounded-2xl border-[1.5px] p-4 text-left transition-colors ${
        selected ? "border-green-dark bg-mint/60" : "border-rule bg-paper hover:border-green"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        aria-label={`Select ${area.label}`}
        className="peer absolute top-4 right-4 h-5 w-5 cursor-pointer appearance-none rounded-md border-[1.5px] border-rule bg-paper checked:border-orange checked:bg-orange"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-4 right-4 flex h-5 w-5 items-center justify-center text-[0.7rem] text-white opacity-0 peer-checked:opacity-100"
      >
        ✓
      </span>
      <span className="flex items-center gap-2 pr-8">
        <span className="font-body text-[0.92rem] font-bold">{area.label}</span>
      </span>
      <span className="mt-1.5 block text-[0.78rem] leading-5 text-muted">{area.blurb}</span>
    </label>
  );
}
