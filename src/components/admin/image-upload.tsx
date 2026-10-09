import { useState } from "react";
import { uploadMedia } from "@/integrations/mysql/media.functions";
import { Label } from "@/components/admin/fields";

/**
 * Uploads go through the protected app server into MySQL's `media` table. Public content
 * stores a stable `/media/<id>` URL, so deployment does not depend on a writable filesystem.
 *
 * A pasted URL is always accepted too, so images can live on another CDN when desired.
 */

async function uploadFile(file: File): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.readAsDataURL(file);
  });
  const result = await uploadMedia({
    data: { filename: file.name, contentType: file.type as "image/jpeg", base64 },
  });
  return result.url;
}

export function ImageField({
  label,
  value,
  onChange,
  hint,
  alt,
  onAltChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
}: {
  /** Omitted inside a repeater cell, which prints its own column heading. */
  label?: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  /** Omitted when this image has no alt-text field (e.g. purely decorative uses). */
  alt?: string;
  onAltChange?: (alt: string) => void;
  /** Omitted when this image has no meta-title field. */
  title?: string;
  onTitleChange?: (title: string) => void;
  /** Omitted when this image has no meta-description field. Free text — no length cap. */
  description?: string;
  onDescriptionChange?: (description: string) => void;
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
      {label || hint ? <Label hint={hint}>{label}</Label> : null}
      <div className="flex flex-wrap items-start gap-4">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-rule bg-cream">
          {value ? (
            <img src={value} alt={alt || ""} className="h-full w-full object-cover" />
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
          {onAltChange ? (
            <input
              type="text"
              value={alt ?? ""}
              placeholder="Alt text (for screen readers & SEO)"
              onChange={(e) => onAltChange(e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-rule bg-paper px-3.5 py-2.5 text-[0.84rem] outline-none focus:border-green"
            />
          ) : null}
          {onTitleChange ? (
            <input
              type="text"
              value={title ?? ""}
              placeholder="Meta title"
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-rule bg-paper px-3.5 py-2.5 text-[0.84rem] outline-none focus:border-green"
            />
          ) : null}
          {onDescriptionChange ? (
            <textarea
              value={description ?? ""}
              placeholder="Meta description (no length limit)"
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl border-[1.5px] border-rule bg-paper px-3.5 py-2.5 text-[0.84rem] outline-none focus:border-green"
            />
          ) : null}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-[30px] border-[1.5px] border-rule px-4 py-2 text-[0.78rem] font-semibold text-muted transition-colors hover:border-green hover:text-green">
              {busy ? "Uploading…" : "Upload image"}
              <input
                type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
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

export interface GalleryImage {
  url: string;
  alt: string;
  title: string;
  /** Free text — no length cap. */
  description: string;
}

/**
 * Multi-image variant for gallery fields whose images carry alt/title/description
 * metadata (tours' gallery, testimonials' extra photos).
 */
export function GalleryFieldWithAlt({
  label,
  values,
  onChange,
  hint,
}: {
  label: string;
  values: GalleryImage[];
  onChange: (v: GalleryImage[]) => void;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded: GalleryImage[] = [];
      for (const file of Array.from(files))
        uploaded.push({ url: await uploadFile(file), alt: "", title: "", description: "" });
      onChange([...values, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function setAlt(i: number, alt: string) {
    onChange(values.map((img, idx) => (idx === i ? { ...img, alt } : img)));
  }

  function setTitle(i: number, title: string) {
    onChange(values.map((img, idx) => (idx === i ? { ...img, title } : img)));
  }

  function setDescription(i: number, description: string) {
    onChange(values.map((img, idx) => (idx === i ? { ...img, description } : img)));
  }

  return (
    <div>
      <Label hint={hint}>{label}</Label>

      {values.length ? (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {values.map((img, i) => (
            <div key={`${img.url}-${i}`} className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-rule bg-cream">
                <img src={img.url} alt={img.alt || ""} className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                className="absolute -top-2 -right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-rule bg-paper text-[0.75rem] text-muted shadow hover:border-rust hover:text-rust"
              >
                ✕
              </button>
              <input
                type="text"
                value={img.alt}
                placeholder="Alt text"
                onChange={(e) => setAlt(i, e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-2.5 py-1.5 text-[0.76rem] outline-none focus:border-green"
              />
              <input
                type="text"
                value={img.title}
                placeholder="Meta title"
                onChange={(e) => setTitle(i, e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-2.5 py-1.5 text-[0.76rem] outline-none focus:border-green"
              />
              <textarea
                value={img.description}
                placeholder="Meta description (no length limit)"
                onChange={(e) => setDescription(i, e.target.value)}
                rows={2}
                className="mt-1.5 w-full resize-y rounded-lg border border-rule bg-paper px-2.5 py-1.5 text-[0.76rem] outline-none focus:border-green"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-[30px] border-[1.5px] border-dashed border-rule px-4 py-2 text-[0.78rem] font-semibold text-muted transition-colors hover:border-green hover:text-green">
          {busy ? "Uploading…" : "+ Add images"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
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
            onChange([...values, { url, alt: "", title: "", description: "" }]);
            e.currentTarget.value = "";
          }}
          className="min-w-[220px] flex-1 rounded-xl border-[1.5px] border-rule bg-paper px-3.5 py-2 text-[0.82rem] outline-none focus:border-green"
        />
      </div>
      {error ? <p className="mt-2 text-[0.78rem] text-rust">{error}</p> : null}
    </div>
  );
}

