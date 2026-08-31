import type { ComponentProps } from "react";
import { EditorShell } from "@/components/admin/editor-shell";
import type { TourDTO } from "@/lib/content-types";

/**
 * Typed home for the tour editor's shared chrome. Keeping this boundary outside the route
 * prevents the route from growing another bespoke preview/save shell while the detailed,
 * Roam-specific field sections remain composed by the caller.
 */
export function TourFormShell(props: ComponentProps<typeof EditorShell<TourDTO>>) {
  return <EditorShell<TourDTO> {...props} />;
}
