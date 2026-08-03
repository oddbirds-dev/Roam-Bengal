import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/admin/fields";

/**
 * Uploads go browser-direct to Supabase Storage using the admin's own session — they do
 * not pass through the app server. The `content-images` bucket is public, so we store the
 * plain public URL rather than a signed one: signed URLs eventually expire inside content
 * columns and are opaque to any CDN rewriting.
 *
 * A pasted URL is always accepted too, so images can live off-Supabase.
 */

const BUCKET = "content-images";

async function uploadFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const random = Math.random().toString(36).slice(2, 8);
  const path = `${Date.now()}-${random}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex flex-wrap items-start gap-4">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-rule bg-cream">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[0.7rem] text-muted">
              No image
            </span>
          )}
        </div>

        <div className="flex min-w-[240px] flex-1 flex-col gap-2">
          <input
            type="url"
            value={value}
            placeholder="Paste an image URL, or upload →"
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border-[1.5px] border-rule bg-paper px-3.5 py-2.5 text-[0.84rem] outline-none focus:border-green"
          />
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-[30px] border-[1.5px] border-rule px-4 py-2 text-[0.78rem] font-semibold text-muted transition-colors hover:border-green hover:text-green">
              {busy ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => onPick(e.target.files?.[0])}
              />
            </label>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-[0.78rem] font-semibold text-muted hover:text-rust"
              >
                Clear
              </button>
            ) : null}
          </div>
          {error ? <p className="text-[0.78rem] text-rust">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

/** Multi-image variant for gallery fields. */
export function GalleryField({
  label,
  values,
  onChange,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadFile(file));
      onChange([...values, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Label hint={hint}>{label}</Label>

      {values.length ? (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {values.map((url, i) => (
            <div key={`${url}-${i}`} className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-rule bg-cream">
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                className="absolute -top-2 -right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-rule bg-paper text-[0.75rem] text-muted shadow hover:border-rust hover:text-rust"
              >
                ✕
              </button>
              {i === 0 ? (
                <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 text-[0.62rem] font-semibold text-white">
                  Main
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-[30px] border-[1.5px] border-dashed border-rule px-4 py-2 text-[0.78rem] font-semibold text-muted transition-colors hover:border-green hover:text-green">
          {busy ? "Uploading…" : "+ Add images"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
        <input
          type="url"
          placeholder="…or paste a URL and press Enter"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const url = e.currentTarget.value.trim();
            if (!url) return;
            onChange([...values, url]);
            e.currentTarget.value = "";
          }}
          className="min-w-[220px] flex-1 rounded-xl border-[1.5px] border-rule bg-paper px-3.5 py-2 text-[0.82rem] outline-none focus:border-green"
        />
      </div>
      {error ? <p className="mt-2 text-[0.78rem] text-rust">{error}</p> : null}
    </div>
  );
}
