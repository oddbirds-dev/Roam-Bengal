import { createElement, type ReactNode } from "react";
import {
  type ContentBlock,
  type GroupRow,
  type LinkRow,
  type RepeaterColumn,
} from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-upload";
import { TOUR_SECTION_OPTIONS } from "@/lib/tour-sections";
import type { HomeSectionId } from "@/components/home/registry";
import {
  INFO_SLUGS,
  POLICY_SLUGS,
  infoDefaults,
  policyDefaults,
} from "@/content/policy-defaults";

/**
 * Plain-language forms for `site_settings`.
 *
 * Each key's stored value is free-form JSON, so the shape lives here as a declaration
 * rather than in the database: a list of sections, each a list of labelled fields. The
 * `settings-form.tsx` turns this registry into the same inputs the other editors use, so
 * nobody has to type JSON to change site copy.
 *
 * Two rules hold the whole thing together:
 *   1. Anything not described here is preserved untouched on save (see `mergeSetting`),
 *      so a key added to the database later cannot be silently dropped by this form.
 *   2. Every field falls back to its shipped default in src/content/site-defaults.ts,
 *      so a section that has never been saved still opens pre-filled with the live copy.
 */

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

export type SettingsField =
  | { kind: "text"; key: string; label: string; hint?: string; placeholder?: string }
  | { kind: "textarea"; key: string; label: string; hint?: string; rows?: number; plain?: boolean }
  | { kind: "image"; key: string; label: string; hint?: string }
  | {
      kind: "select";
      key: string;
      label: string;
      hint?: string;
      options: readonly { value: string; label: string }[];
    }
  | {
      kind: "list";
      key: string;
      label: string;
      hint?: string;
      multiline?: boolean;
      placeholder?: string;
    }
  | {
      /**
       * A grid of on/off switches. The stored value is the list of options that are
       * **off**, so an option added to the code later is on everywhere by default rather
       * than silently missing from every record saved before it existed.
       */
      kind: "toggles";
      key: string;
      label: string;
      hint?: string;
      options: readonly { value: string; label: string; hint?: string }[];
    }
  | { kind: "links"; key: string; label: string; hint?: string; addLabel?: string }
  | { kind: "linkGroups"; key: string; label: string; hint?: string }
  | {
      kind: "groups";
      key: string;
      label: string;
      hint?: string;
      /** Offers an icon picker per group. */
      icons?: readonly { value: string; label: string }[];
    }
  | { kind: "blocks"; key: string; label: string; hint?: string }
  | {
      kind: "rows";
      key: string;
      label: string;
      hint?: string;
      columns: RepeaterColumn<Record<string, unknown>>[];
      blank: Record<string, unknown>;
      /** Row heading, e.g. "Photo 1". */
      title?: (row: Record<string, unknown>, index: number) => string;
    };

export interface SettingsSection {
  title: string;
  description?: string;
  fields: SettingsField[];
}

export interface SettingsSchema {
  /** Friendly name shown instead of the raw key. */
  title: string;
  /** What a non-technical editor needs to know about this section. */
  description: string;
  /** Public page this content appears on, for the "where does this show?" line. */
  where: string;
  /**
   * Route path to open a live preview against, e.g. `/reviews`. Omitted for keys with no
   * single sensible page — header/footer/whatsapp affect every page at once, and
   * custom_fonts/integrations don't render visibly at all.
   */
  previewPath?: string;
  /** Element id to bring into view and briefly highlight in the live preview. */
  previewAnchor?: string;
  sections: SettingsSection[];
}

/** The settings hub's definition for one editable content group. */
export type ContentGroupDef = SettingsSchema;

// ---------------------------------------------------------------------------
// Reusable column sets
// ---------------------------------------------------------------------------

/** Icon choices are fixed by the drawings in src/components/art/icons.tsx. */
const FEATURE_ICONS = [
  { value: "box", label: "Package" },
  { value: "user", label: "Person" },
  { value: "shield", label: "Shield" },
  { value: "card", label: "Payment card" },
  { value: "headset", label: "Headset" },
  { value: "route", label: "Route map" },
] as const;

/** Icons offered for the tour pricing promise blocks — see FEATURE_PATHS in art/icons.tsx. */
const PROMISE_ICONS = [
  { value: "shield", label: "Shield" },
  { value: "calendar", label: "Calendar" },
  { value: "headset", label: "Headset" },
  { value: "card", label: "Payment card" },
  { value: "users", label: "People" },
  { value: "route", label: "Route map" },
] as const;

const WHY_ICONS = [
  { value: "globe", label: "Globe" },
  { value: "lock", label: "Lock" },
  { value: "coin", label: "Coin" },
  { value: "compass", label: "Compass" },
  { value: "ban", label: "Ban" },
  { value: "sparkles", label: "Sparkles" },
  { value: "shield", label: "Shield" },
  { value: "chat", label: "Chat" },
] as const;

/** Image cell for repeaters — see the `render` note on RepeaterColumn. */
const imageCell = (value: unknown, onChange: (v: unknown) => void): ReactNode =>
  createElement(ImageField, {
    label: "",
    value: typeof value === "string" ? value : "",
    onChange,
  });

// ---------------------------------------------------------------------------
// The schema, one entry per site_settings key
// ---------------------------------------------------------------------------

export const SETTINGS_SCHEMA: Record<string, SettingsSchema> = {
  tour_editor: {
    title: "Tour editor template",
    description:
      "Which sections a brand-new tour starts with. Every tour can then switch its own sections on or off while you edit it.",
    where: "The tour editor form",
    sections: [
      {
        title: "Sections for new tours",
        description:
          "This only sets the starting point for tours created from now on — tours you have already saved keep their own settings. Switching a section off never removes anything from the live website; it only tidies the editing form.",
        fields: [
          {
            kind: "toggles",
            key: "hidden_sections",
            label: "Sections",
            hint: "Turn off what a typical new tour does not need — a day tour rarely has a day-by-day itinerary, for instance.",
            options: TOUR_SECTION_OPTIONS,
          },
        ],
      },
    ],
  },

  custom_fonts: {
    title: "Custom Fonts",
    description:
      "Load external fonts, e.g. from Google Fonts. Each one you add here appears by name in the Font menu when you format text.",
    where: "The Font menu in every text editor",
    sections: [
      {
        title: "Your fonts",
        description:
          "Adding a font does not change anything on its own — select some text in any editor and pick the font by name from the Font menu.",
        fields: [
          {
            kind: "rows",
            key: "fonts",
            label: "Fonts",
            hint: "In Google Fonts: pick the weights you want, then copy the <link> href into Stylesheet URL and the font-family line into Font family name.",
            title: (row, i) => String(row.label ?? "").trim() || `Font ${i + 1}`,
            columns: [
              {
                key: "label",
                label: "Name in the Font menu",
                placeholder: "Open Sans",
              },
              {
                key: "font_url",
                label: "Stylesheet URL",
                placeholder:
                  "https://fonts.googleapis.com/css2?family=Open+Sans&display=swap",
              },
              {
                key: "font_family",
                label: "Font family name",
                placeholder: "'Open Sans', sans-serif",
              },
            ],
            blank: { label: "", font_url: "", font_family: "" },
          },
        ],
      },
      {
        title: "The original font",
        description:
          "This page used to hold a single font, and it still works — it is the one called “Custom” in the Font menu. Any text already using it keeps working; add new fonts to the list above.",
        fields: [
          {
            kind: "text",
            key: "font_url",
            label: "Stylesheet URL",
            hint: "Example: https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
          },
          {
            kind: "text",
            key: "font_family",
            label: "Font Family Name",
            hint: "Example: 'Roboto', sans-serif",
          },
        ],
      },
    ],
  },
  integrations: {
    title: "Google tools",
    description: "Connect Google Tag Manager, AdSense, and Search Console — no code or redeploy needed.",
    where: "Every page, in the page <head>",
    sections: [
      {
        title: "Google Tag Manager",
        description:
          "Add GA4 and Google Ads tags inside the GTM container itself once this ID is saved — no further changes needed here.",
        fields: [
          {
            kind: "text",
            key: "gtm_container_id",
            label: "Container ID",
            placeholder: "GTM-XXXXXXX",
            hint: "From tagmanager.google.com, top right of your container.",
          },
        ],
      },
      {
        title: "AdSense",
        fields: [
          {
            kind: "text",
            key: "adsense_client_id",
            label: "Publisher ID",
            placeholder: "ca-pub-XXXXXXXXXXXXXXXX",
            hint: "From your AdSense account. Also update the numeric ID in public/ads.txt to match.",
          },
        ],
      },
      {
        title: "Search Console",
        fields: [
          {
            kind: "text",
            key: "google_site_verification",
            label: "HTML tag verification token",
            hint: "In Search Console: Settings → Ownership verification → HTML tag. Paste just the content= value, not the whole tag.",
          },
        ],
      },
    ],
  },

  header: {
    title: "Header & menu",
    description: "Your logo, the menu across the top, and the button beside it.",
    where: "Top of every page",
    sections: [
      {
        title: "Logo",
        fields: [
          {
            kind: "image",
            key: "logo_url",
            label: "Logo image",
            hint: "Leave empty to use the default logo.",
          },
          {
            kind: "image",
            key: "logo_url_light",
            label: "Logo image (light)",
            hint: "Used on pages with a photo banner behind the header, e.g. Tours. Leave empty to reuse the default light logo.",
          },
          {
            kind: "text",
            key: "logo_alt",
            label: "Logo description",
            hint: "Read aloud by screen readers and shown if the image fails to load.",
          },
          { kind: "text", key: "wordmark_1", label: "Name — first word" },
          { kind: "text", key: "wordmark_2", label: "Name — second word" },
          {
            kind: "text",
            key: "tagline",
            label: "Small line under the name",
            placeholder: "EXPLORE THE HEART OF BANGLADESH",
          },
        ],
      },
      {
        title: "Menu & button",
        fields: [
          {
            kind: "links",
            key: "nav",
            label: "Menu items",
            hint: "Left box is what people read, right box is the page it opens (start with /).",
            addLabel: "menu item",
          },
          { kind: "text", key: "cta_label", label: "Button text" },
          { kind: "text", key: "cta_link", label: "Button goes to", placeholder: "/contact" },
        ],
      },
    ],
  },

  footer: {
    title: "Footer",
    description: "The dark band at the bottom of every page.",
    where: "Bottom of every page",
    sections: [
      {
        title: "Logo",
        fields: [
          {
            kind: "image",
            key: "logo_url",
            label: "Footer logo",
            hint: "Shown above the intro paragraph. The footer band is dark green, so use a light logo. Leave empty for the default light logo.",
          },
        ],
      },
      {
        title: "Intro",
        fields: [
          {
            kind: "textarea",
            key: "intro",
            label: "Short paragraph about the company",
            rows: 3,
          },
        ],
      },
      {
        title: "Link columns",
        description: "Each column has a heading and its own list of links.",
        fields: [{ kind: "linkGroups", key: "columns", label: "Columns" }],
      },
      {
        title: "Fine print",
        fields: [
          { kind: "text", key: "copyright", label: "Copyright line" },
          { kind: "text", key: "site_label", label: "Website name shown in the footer" },
        ],
      },
    ],
  },

  hero: {
    title: "Homepage banner",
    description: "The large photo and headline visitors see first.",
    where: "Top of the homepage",
    previewPath: "/",
    previewAnchor: "section-hero",
    sections: [
      {
        title: "Background",
        fields: [
          { kind: "image", key: "background_url", label: "Background photo" },
          {
            kind: "text",
            key: "background_alt",
            label: "Photo description",
            hint: "Describe the photo for people using screen readers.",
          },
        ],
      },
      {
        title: "Wording",
        fields: [
          {
            kind: "text",
            key: "script",
            label: "Handwritten word above the headline",
            placeholder: "Explore",
          },
          { kind: "text", key: "headline", label: "Headline" },
          { kind: "textarea", key: "subtext", label: "Sentence under the headline", rows: 2 },
        ],
      },
      {
        title: "Buttons",
        fields: [
          { kind: "text", key: "primary_label", label: "Main button text" },
          { kind: "text", key: "primary_link", label: "Main button goes to", placeholder: "/tours" },
          { kind: "text", key: "secondary_label", label: "Second button text" },
          {
            kind: "text",
            key: "secondary_link",
            label: "Second button goes to",
            hint: "Leave empty to hide the second button.",
          },
        ],
      },
    ],
  },

  // Per-section wording (Feature strip, Popular tours, Faith, Journal, Why choose us,
  // Closing invitation) lives in `HOMEPAGE_SECTION_FIELDS` below, not here — the homepage
  // builder (`/admin/settings/homepage-sections`) edits those inline, scoped to each block's
  // own row, instead of one long page covering every block at once. What's left here is
  // "Reviews block": two homepage-only fields (`reviews_heading_1/2`, `reviews_cta_*`) that
  // the reviews *section* reads alongside the separate `reviews` settings row — not moved
  // into `HOMEPAGE_SECTION_FIELDS` because the homepage builder's "Reviews" row already
  // links to that separate `reviews` group instead of expanding inline.
  homepage: {
    title: "Homepage — reviews block wording",
    description: "The heading and button above the reviews carousel on the homepage.",
    where: "Homepage",
    previewPath: "/",
    previewAnchor: "reviews",
    sections: [
      {
        title: "Reviews block",
        fields: [
          {
            kind: "text",
            key: "reviews_eyebrow",
            label: "Handwritten line above the heading",
            placeholder: "Loved by Travellers Worldwide",
          },
          { kind: "text", key: "reviews_heading_1", label: "Heading — first line" },
          { kind: "text", key: "reviews_heading_2", label: "Heading — second line" },
          {
            kind: "textarea",
            key: "reviews_subtext",
            label: "Line under the heading",
            rows: 2,
          },
          { kind: "text", key: "reviews_cta_label", label: "Button text" },
          { kind: "text", key: "reviews_cta_link", label: "Button goes to" },
        ],
      },
      {
        title: "Reviews block — side photos",
        description:
          "The two tilted prints at the edges of the reviews band. Decorative, and only shown on wide screens — leave them empty to hide them.",
        fields: [
          { kind: "image", key: "reviews_photo_left", label: "Left photo" },
          { kind: "image", key: "reviews_photo_right", label: "Right photo" },
        ],
      },
    ],
  },

  gallery: {
    title: "Photo gallery block",
    description: "The photo strip and its wording.",
    where: "Homepage",
    previewPath: "/",
    previewAnchor: "section-gallery",
    sections: [
      {
        title: "Wording",
        fields: [
          { kind: "text", key: "heading_1", label: "Heading — first line" },
          { kind: "text", key: "heading_2", label: "Heading — second line" },
          { kind: "textarea", key: "blurb", label: "Paragraph", rows: 3 },
          { kind: "text", key: "bold", label: "Bold line under the paragraph" },
          { kind: "text", key: "cta_label", label: "Button text" },
          { kind: "text", key: "cta_link", label: "Button goes to" },
        ],
      },
      {
        title: "Photos",
        fields: [
          {
            kind: "rows",
            key: "photos",
            label: "Photos",
            title: (_row, i) => `Photo ${i + 1}`,
            columns: [
              { key: "tag", label: "Caption", placeholder: "Sundarbans River" },
              { key: "image_url", label: "Photo", render: imageCell },
            ],
            blank: { tag: "", image_url: "" },
          },
        ],
      },
    ],
  },

  reviews: {
    title: "Reviews page",
    description: "Star scores, review platforms, and the page wording.",
    where: "/reviews",
    previewPath: "/reviews",
    sections: [
      {
        title: "Overall score",
        fields: [
          { kind: "text", key: "score", label: "Your score", placeholder: "4.9" },
          { kind: "text", key: "score_out_of", label: "Out of", placeholder: "5" },
          {
            kind: "text",
            key: "count_label",
            label: "Line under the score",
            placeholder: "Based on 340+ verified reviews",
          },
        ],
      },
      {
        title: "Page wording",
        fields: [
          { kind: "text", key: "heading_1", label: "Heading — first line" },
          { kind: "text", key: "heading_2", label: "Heading — second line" },
          { kind: "textarea", key: "subtext", label: "Paragraph under the heading", rows: 2 },
        ],
      },
      {
        title: "Review platforms",
        description: "The scores shown for each site you are reviewed on.",
        fields: [
          {
            kind: "rows",
            key: "platforms",
            label: "Platforms",
            columns: [
              { key: "name", label: "Platform name", span: 6 },
              { key: "score", label: "Score", span: 6 },
              { key: "colour", label: "Brand colour", type: "color", span: 8 },
              { key: "icon", label: "Symbol", placeholder: "★", span: 4 },
            ],
            blank: { name: "", score: "", colour: "#1E5F3B", icon: "★" },
          },
        ],
      },
      {
        title: "Leave-a-review invitation",
        fields: [
          { kind: "text", key: "cta_heading", label: "Heading" },
          { kind: "textarea", key: "cta_body", label: "Paragraph", rows: 2 },
          { kind: "text", key: "cta_label", label: "Button text" },
          { kind: "text", key: "cta_link", label: "Button goes to" },
        ],
      },
    ],
  },

  tours_page: {
    title: "Tours page",
    description: "The banner and introduction above the tour list.",
    where: "/tours",
    previewPath: "/tours",
    sections: [
      {
        title: "Banner",
        fields: [
          { kind: "text", key: "banner_title", label: "Banner title" },
          { kind: "image", key: "banner_image", label: "Banner photo" },
        ],
      },
      {
        title: "Introduction",
        fields: [
          { kind: "text", key: "intro_heading_1", label: "Heading — first line" },
          { kind: "text", key: "intro_heading_2", label: "Heading — second line" },
          {
            kind: "list",
            key: "intro_paragraphs",
            label: "Paragraphs",
            multiline: true,
            hint: "Each box is one paragraph.",
          },
          { kind: "text", key: "intro_bold", label: "Bold closing line" },
        ],
      },
    ],
  },

  tour_pricing: {
    title: "Tour pricing block",
    description:
      "The wording around the price cards on every tour page. The prices themselves are set per tour, under Tours → Pricing.",
    where: "Every tour page",
    sections: [
      {
        title: "Heading",
        fields: [
          { kind: "text", key: "eyebrow", label: "Small label above the heading" },
          { kind: "text", key: "heading", label: "Heading" },
          { kind: "text", key: "subhead", label: "Line under the heading" },
          {
            kind: "text",
            key: "per_person_label",
            label: "Text under each price",
            hint: "Shown on every price card, e.g. “USD / person”.",
          },
        ],
      },
      {
        title: "Promises",
        description: "The panel of reassurances under the price cards.",
        fields: [
          { kind: "text", key: "promises_heading", label: "Panel heading" },
          {
            kind: "groups",
            key: "promises",
            label: "Promise blocks",
            hint: "Each block has an icon, a heading and its bullet points. Use **bold** for the lead-in, and the link button to point at a policy page.",
            icons: PROMISE_ICONS,
          },
        ],
      },
      {
        title: "Booking call to action",
        fields: [
          { kind: "text", key: "cta_heading", label: "Heading" },
          { kind: "text", key: "cta_label", label: "Button text" },
          { kind: "text", key: "cta_footnote", label: "Reassurance under the button" },
        ],
      },
      {
        title: "Tour Cost box",
        description: "The sticky price box in the sidebar of every tour page.",
        fields: [
          {
            kind: "list",
            key: "sidebar_promises",
            label: "Ticked reassurances",
            hint: "One per line, each shown with a green tick above the Book Now button. Leave empty to hide the list.",
            placeholder: "100% Exclusive Private Tours",
          },
        ],
      },
    ],
  },

  blog_page: {
    title: "Blog page",
    description: "Headings on the blog index and the newsletter box.",
    where: "/blog",
    previewPath: "/blog",
    sections: [
      {
        title: "Masthead",
        fields: [
          {
            kind: "text",
            key: "volume_label",
            label: "Small label at the top",
            placeholder: "The Roam Bengal Journal — Vol. 04",
          },
          {
            kind: "text",
            key: "heading",
            label: "Heading",
            hint: "Wrap a phrase in *asterisks* to show it in italic orange.",
          },
          { kind: "textarea", key: "subtext", label: "Paragraph under the heading", rows: 2 },
        ],
      },
      {
        title: "Section labels",
        fields: [
          { kind: "text", key: "featured_eyebrow", label: "Label on the featured post" },
          { kind: "text", key: "latest_heading", label: "Heading above the post list" },
        ],
      },
      {
        title: "Newsletter box",
        fields: [
          { kind: "text", key: "newsletter_heading", label: "Heading" },
          { kind: "textarea", key: "newsletter_body", label: "Paragraph", rows: 2 },
          { kind: "text", key: "newsletter_cta", label: "Button text" },
        ],
      },
    ],
  },

  contact: {
    title: "Contact page",
    description: "Your contact details and the wording around the enquiry form.",
    where: "/contact",
    previewPath: "/contact",
    sections: [
      {
        title: "Page wording",
        fields: [
          { kind: "text", key: "hero_eyebrow", label: "Small label above the title" },
          { kind: "text", key: "banner_title", label: "Banner title" },
          {
            kind: "textarea",
            key: "hero_intro",
            label: "Paragraph under the title",
            rows: 3,
          },
          { kind: "text", key: "form_heading", label: "Heading above the form" },
          { kind: "textarea", key: "form_intro", label: "Paragraph above the form", rows: 3 },
          { kind: "text", key: "form_cta", label: "Send button text" },
          {
            kind: "text",
            key: "art_note",
            label: "Reassuring note beside the form",
            placeholder: "Every message gets a real reply — usually the same day.",
          },
        ],
      },
      {
        title: "Contact details",
        fields: [
          { kind: "text", key: "email", label: "Email address" },
          { kind: "text", key: "phone", label: "Phone number" },
          { kind: "text", key: "address", label: "Address" },
          { kind: "text", key: "office_hours_label", label: "Opening hours label" },
          {
            kind: "text",
            key: "office_hours",
            label: "Opening hours",
            placeholder: "Sat – Thu, 9am – 7pm (BST)",
          },
        ],
      },
      {
        title: "Map",
        fields: [
          { kind: "text", key: "map_label", label: "Caption under the map" },
          {
            kind: "textarea",
            key: "map_embed",
            label: "Google Maps embed code",
            rows: 4,
            plain: true,
            hint: "In Google Maps: Share → Embed a map → Copy HTML, then paste it here. Leave empty to hide the map.",
          },
        ],
      },
    ],
  },

  about: {
    title: "About page",
    description: "Your story, the numbers you show off, and why people travel with you.",
    where: "/about",
    previewPath: "/about",
    sections: [
      {
        title: "Opening",
        fields: [
          { kind: "text", key: "eyebrow", label: "Small label above the heading" },
          { kind: "text", key: "heading_1", label: "Heading — first line" },
          { kind: "text", key: "heading_2", label: "Heading — second line" },
          {
            kind: "list",
            key: "intro_paragraphs",
            label: "Opening paragraphs",
            multiline: true,
            hint: "Each box is one paragraph.",
          },
          { kind: "text", key: "cta_label", label: "Button text" },
          { kind: "text", key: "cta_link", label: "Button goes to" },
          { kind: "image", key: "hero_image", label: "Main photo" },
          {
            kind: "textarea",
            key: "intro_strip",
            label: "Wide paragraph across the page",
            rows: 5,
          },
        ],
      },
      {
        title: "Numbers",
        description: "The four figures shown in a row.",
        fields: [
          {
            kind: "rows",
            key: "stats",
            label: "Numbers",
            columns: [
              { key: "value", label: "Figure", placeholder: "40+", span: 4 },
              { key: "label", label: "What it counts", placeholder: "Tours & Itineraries", span: 8 },
            ],
            blank: { value: "", label: "" },
          },
        ],
      },
      {
        title: "Mission, vision & values",
        fields: [
          { kind: "text", key: "mvv_kicker", label: "Small label above the heading" },
          { kind: "text", key: "mvv_heading", label: "Heading" },
          { kind: "textarea", key: "mvv_intro", label: "Paragraph under the heading", rows: 2 },
          {
            kind: "rows",
            key: "pillars",
            label: "Cards",
            columns: [
              { key: "icon", label: "Emoji", placeholder: "🧭", span: 3 },
              { key: "title", label: "Title", placeholder: "Mission", span: 9 },
              { key: "text", label: "Description", type: "textarea" },
            ],
            blank: { icon: "", title: "", text: "" },
          },
        ],
      },
      {
        title: "Why travel with us",
        fields: [
          { kind: "text", key: "why_kicker", label: "Small label above the heading" },
          { kind: "text", key: "why_heading", label: "Heading" },
          {
            kind: "rows",
            key: "why_items",
            label: "Reasons",
            columns: [
              { key: "title", label: "Title" },
              { key: "text", label: "Description", type: "textarea" },
            ],
            blank: { title: "", text: "" },
          },
        ],
      },
    ],
  },

  whatsapp: {
    title: "WhatsApp",
    description: "Your WhatsApp number and the chat prompts shown around the site.",
    where: "Floating button on every page, plus the contact page",
    sections: [
      {
        title: "Your number",
        fields: [
          {
            kind: "text",
            key: "number",
            label: "Number as people should read it",
            placeholder: "+880 1XXX-XXXXXX",
          },
          {
            kind: "text",
            key: "link",
            label: "WhatsApp chat link",
            hint: "Digits only after wa.me/, no plus sign or spaces — e.g. https://wa.me/8801XXXXXXXXX",
          },
        ],
      },
      {
        title: "Wording",
        fields: [
          { kind: "text", key: "float_label", label: "Floating button label" },
          { kind: "text", key: "strip_heading", label: "Chat invitation heading" },
          { kind: "textarea", key: "strip_body", label: "Chat invitation paragraph", rows: 2 },
          { kind: "text", key: "strip_cta", label: "Chat invitation button text" },
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Per-homepage-section fields
//
// The homepage builder (`/admin/settings/homepage-sections`) expands a section's own
// fields inline, in its own row, instead of sending the owner to one long page covering
// every homepage block at once. All of these fields live in the single `homepage`
// settings row — this just regroups the same field definitions by which block reads them.
// `gallery` and `whyChooseUs`'s sibling `reviews` block aren't here: `gallery`/`reviews`
// are their own settings rows, so the builder links those two straight to
// `/admin/settings/$group` instead of expanding them inline.
// ---------------------------------------------------------------------------

export const HOMEPAGE_SECTION_FIELDS: Partial<Record<HomeSectionId, SettingsField[]>> = {
  features: [
    {
      kind: "rows",
      key: "features",
      label: "Features",
      columns: [
        { key: "icon", label: "Icon", type: "select", options: FEATURE_ICONS, span: 4 },
        { key: "title", label: "Title", span: 8 },
        { key: "text", label: "One-line description" },
      ],
      blank: { icon: "box", title: "", text: "" },
    },
  ],
  popularTours: [
    { kind: "text", key: "popular_kicker", label: "Small label above the heading" },
    { kind: "text", key: "popular_heading", label: "Heading" },
    { kind: "image", key: "popular_bg_image", label: "Background photo" },
  ],
  faith: [
    { kind: "text", key: "faith_heading_1", label: "Heading — first line" },
    { kind: "text", key: "faith_heading_2", label: "Heading — second line" },
    { kind: "image", key: "faith_image_1", label: "Top-left photo (green accent)" },
    { kind: "image", key: "faith_image_2", label: "Bottom-right photo (orange accent)" },
    {
      kind: "rows",
      key: "faith_list",
      label: "Reasons",
      hint: "One reason per row, with an icon.",
      columns: [
        { key: "icon", label: "Icon", type: "select", options: WHY_ICONS, span: 4 },
        { key: "text", label: "Reason", type: "textarea", span: 8 },
      ],
      blank: { icon: "globe", text: "" },
    },
    {
      kind: "rows",
      key: "faith_callouts",
      label: "Comparison notes",
      columns: [
        { key: "lead", label: "Bold opening", placeholder: "Roam Bengal vs. Local Operators —" },
        { key: "text", label: "Rest of the sentence", type: "textarea" },
      ],
      blank: { lead: "", text: "" },
    },
  ],
  journal: [
    { kind: "text", key: "journal_kicker", label: "Small label above the heading" },
    { kind: "text", key: "journal_heading", label: "Heading" },
  ],
  whyChooseUs: [
    { kind: "text", key: "why_heading_1", label: "Heading — first line" },
    { kind: "text", key: "why_heading_2", label: "Heading — second line" },
    { kind: "textarea", key: "why_intro", label: "Paragraph under the heading", rows: 3 },
    { kind: "image", key: "why_image", label: "Photo" },
    {
      kind: "rows",
      key: "why_items",
      label: "Reasons",
      columns: [
        { key: "icon", label: "Icon", type: "select", options: WHY_ICONS, span: 4 },
        { key: "title", label: "Title", span: 8 },
        { key: "text", label: "Description", type: "textarea" },
      ],
      blank: { icon: "globe", title: "", text: "" },
    },
  ],
  dreamCta: [
    { kind: "text", key: "cta_heading_1", label: "Heading — first line" },
    { kind: "text", key: "cta_heading_2", label: "Heading — second line" },
    {
      kind: "list",
      key: "cta_paragraphs",
      label: "Paragraphs",
      multiline: true,
      hint: "Each box is one paragraph.",
    },
    { kind: "text", key: "cta_label", label: "Button text" },
    { kind: "text", key: "cta_link", label: "Button goes to" },
    {
      kind: "image",
      key: "cta_image",
      label: "Photo beside the text",
      hint: "Leave empty to keep the drawn Dhaka skyline.",
    },
    {
      kind: "text",
      key: "cta_image_alt",
      label: "Photo description",
      hint: "Describe the photo for screen readers and search engines. Ignored while the drawing is showing.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Policy and info pages
//
// Every one of these shares the `PolicyPage` shape from src/content/policy-defaults.ts
// and renders through PolicyLayout, so one builder covers all eleven.
// ---------------------------------------------------------------------------

function pageSchema(title: string, path: string, description: string): SettingsSchema {
  return {
    title,
    description,
    where: path,
    // `where` is only the chip on the hub card. Without `previewPath` too, `EditorShell`
    // guards the pane, the divider and the toggle on it, so all eleven standalone pages
    // opened with no preview at all.
    previewPath: path,
    sections: [
      {
        title: "Page top",
        fields: [
          { kind: "text", key: "eyebrow", label: "Small label above the title" },
          { kind: "text", key: "title", label: "Page title" },
          { kind: "textarea", key: "subhead", label: "Sentence under the title", rows: 2 },
        ],
      },
      {
        title: "Page sections",
        description:
          "Each section has a heading, and any mix of paragraphs and bullet points beneath it.",
        fields: [{ kind: "blocks", key: "blocks", label: "Sections" }],
      },
      {
        title: "Questions box at the bottom",
        fields: [
          { kind: "text", key: "contact_heading", label: "Heading" },
          { kind: "textarea", key: "contact_body", label: "Paragraph", rows: 2 },
        ],
      },
    ],
  };
}

const POLICY_META: Record<(typeof POLICY_SLUGS)[number], string> = {
  payment: "How and when guests pay, and which methods you accept.",
  cancellation: "What happens when a guest cancels a booked trip.",
  refund: "When money is returned, and how much.",
  privacy: "What guest information you collect and how it is handled.",
  terms: "The terms guests agree to when they book.",
};

const INFO_META: Record<(typeof INFO_SLUGS)[number], string> = {
  "visa-information": "Entry requirements and the visa help you offer.",
  "embassy-directory": "Embassy and consulate contacts for visiting guests.",
  "travel-faqs":
    "The page wrapper only — the questions themselves are edited under FAQs in the menu.",
  "responsible-travel": "Your promises on local pay, wildlife, and the environment.",
  guides: "Who your guides are and how they are chosen.",
  careers: "Roles you are hiring for and how to apply.",
};

for (const slug of POLICY_SLUGS) {
  SETTINGS_SCHEMA[`policy_${slug}`] = pageSchema(
    policyDefaults[slug].title,
    `/policies/${slug}`,
    POLICY_META[slug],
  );
}

for (const slug of INFO_SLUGS) {
  SETTINGS_SCHEMA[`info_${slug}`] = pageSchema(
    infoDefaults[slug].title,
    `/${slug}`,
    INFO_META[slug],
  );
}

/** Display order on the settings index — grouped by where it appears, not alphabetically. */
export const SETTINGS_ORDER = [
  "tour_editor",
  "custom_fonts",
  "integrations",
  "header",
  "footer",
  "hero",
  "homepage",
  "gallery",
  "reviews",
  "tours_page",
  "tour_pricing",
  "blog_page",
  "about",
  "contact",
  "whatsapp",
] as const;

/** Policy and info pages, listed separately from the site chrome above. */
export const PAGE_SETTINGS_ORDER = [
  ...INFO_SLUGS.map((slug) => `info_${slug}`),
  ...POLICY_SLUGS.map((slug) => `policy_${slug}`),
];

// ---------------------------------------------------------------------------
// Value coercion
// ---------------------------------------------------------------------------

type Obj = Record<string, unknown>;

const asObject = (v: unknown): Obj =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};

const asText = (v: unknown): string =>
  typeof v === "string" ? v : v === null || v === undefined ? "" : String(v);

const asTextList = (v: unknown): string[] => (Array.isArray(v) ? v.map(asText) : []);

const asRows = (v: unknown): Obj[] => (Array.isArray(v) ? v.map(asObject) : []);

const asLinks = (v: unknown): LinkRow[] =>
  Array.isArray(v)
    ? v.map((row) => ({ label: asText(asObject(row).label), to: asText(asObject(row).to) }))
    : [];

const asLinkGroups = (v: unknown): { title: string; links: LinkRow[] }[] =>
  Array.isArray(v)
    ? v.map((row) => ({ title: asText(asObject(row).title), links: asLinks(asObject(row).links) }))
    : [];

const asBlocks = (v: unknown): ContentBlock[] =>
  Array.isArray(v)
    ? v.map((row) => {
        const b = asObject(row);
        return {
          heading: asText(b.heading),
          // Both lists are optional in the shipped defaults — a section may be all prose
          // or all bullets — so a missing key becomes an empty list, not undefined.
          paragraphs: asTextList(b.paragraphs),
          items: asTextList(b.items),
        };
      })
    : [];

// `icon` is carried through rather than dropped: this coercion runs on load, so anything
// it discards is discarded again on the next save.
const asGroups = (v: unknown): GroupRow[] =>
  Array.isArray(v)
    ? v.map((row) => {
        const o = asObject(row);
        const group: GroupRow = { title: asText(o.title), items: asTextList(o.items) };
        if (typeof o.icon === "string") group.icon = o.icon;
        return group;
      })
    : [];

export type SettingsObject = Obj;

export { asObject, asText, asTextList, asRows, asLinks, asLinkGroups, asBlocks, asGroups };
