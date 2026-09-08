import { DEFAULT_HOME_ORDER, isHomeSectionId, type HomeSectionId } from "@/components/home/registry";

export type HomeLayoutEntry = { id: HomeSectionId; visible: boolean };
export type HomeLayout = HomeLayoutEntry[];

export const HOME_LAYOUT_KEY = "homepage_layout";

/**
 * Turn the stored `homepage_layout` row into a layout the homepage can render.
 *
 * The stored value is edited by hand often enough (and by an admin panel that can be a
 * release behind the code) that it is treated as untrusted:
 *
 *  - anything that isn't a known section id is dropped;
 *  - duplicates collapse to their first appearance;
 *  - sections the saved layout has never seen are slotted in beside their code-order
 *    neighbours, so adding a section to the registry ships it in the place the code puts
 *    it — not at the bottom of the page — without a data migration;
 *  - a missing, malformed or empty value falls back to the default order.
 *
 * The result therefore always lists every section exactly once.
 */
export function resolveHomeLayout(raw: unknown): HomeLayout {
  const stored = readEntries(raw);

  const seen = new Set<HomeSectionId>();
  const layout: HomeLayout = [];
  for (const entry of stored) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    layout.push(entry);
  }

  // An unseen section goes directly after the nearest section that precedes it in code
  // order and is already in the layout — appending would bury every newly shipped band at
  // the foot of the page regardless of where the registry puts it. Nothing preceding it is
  // present (or the layout was empty), so it goes to the front.
  DEFAULT_HOME_ORDER.forEach((id, i) => {
    if (seen.has(id)) return;
    seen.add(id);

    let at = 0;
    for (const preceding of DEFAULT_HOME_ORDER.slice(0, i).reverse()) {
      const before = layout.findIndex((entry) => entry.id === preceding);
      if (before !== -1) {
        at = before + 1;
        break;
      }
    }
    layout.splice(at, 0, { id, visible: true });
  });

  return layout;
}

function readEntries(raw: unknown): HomeLayout {
  if (!raw || typeof raw !== "object") return [];
  const sections = (raw as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) return [];

  const out: HomeLayout = [];
  for (const item of sections) {
    if (!item || typeof item !== "object") continue;
    const { id, visible } = item as { id?: unknown; visible?: unknown };
    if (!isHomeSectionId(id)) continue;
    // Only an explicit `false` hides a section; a missing flag means visible.
    out.push({ id, visible: visible !== false });
  }
  return out;
}

/** Serialise a layout back into the shape stored in `site_settings`. */
export function serializeHomeLayout(layout: HomeLayout): { sections: HomeLayoutEntry[] } {
  return { sections: layout.map(({ id, visible }) => ({ id, visible })) };
}
