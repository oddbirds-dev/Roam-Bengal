/**
 * Hand-torn paper seam between two bands of the page.
 *
 * The shape is painted in the colour of the band on the *other* side of the seam and
 * laid over the top (or bottom) of the band it lives in, so the neighbour appears to
 * tear away into it. `fill` takes any CSS background — flat colour, gradient, image —
 * because the shape is applied as a mask rather than an SVG `fill`, which only accepts
 * plain colours.
 *
 * Two passes give the deckle: a translucent fringe reaching a little further past the
 * seam, and the solid edge on top of it.
 */

/** Solid edge. Polyline only — the caller closes it up or down depending on `side`. */
const EDGE_MAIN =
  "M0,65.4L12.9,66.9L25.7,71.8L38.6,76.8L51.4,68.1L64.3,71.3L77.1,76.4L90.0,64.4L102.9,70.4L115.7,68.4L128.6,63.2L141.4,64.3L154.3,64.0L167.1,66.2L180.0,62.3L192.9,56.5L205.7,56.9L218.6,57.8L231.4,51.4L244.3,50.5L257.1,49.6L270.0,45.1L282.9,43.4L295.7,43.8L308.6,40.4L321.4,44.1L334.3,42.4L347.1,46.7L360.0,44.4L372.9,39.3L385.7,43.4L398.6,43.6L411.4,43.3L424.3,41.9L437.1,41.8L450.0,39.3L462.9,39.6L475.7,38.8L488.6,35.9L501.4,40.7L514.3,30.9L527.1,28.9L540.0,36.9L552.9,31.6L565.7,27.7L578.6,26.4L591.4,21.7L604.3,21.0L617.1,27.0L630.0,23.9L642.9,18.4L655.7,25.9L668.6,24.7L681.4,26.2L694.3,22.0L707.1,29.6L720.0,29.8L732.9,32.1L745.7,40.5L758.6,46.2L771.4,42.2L784.3,47.7L797.1,49.6L810.0,55.0L822.9,56.9L835.7,58.2L848.6,64.3L861.4,69.1L874.3,72.1L887.1,67.1L900.0,74.5L912.9,72.3L925.7,69.6L938.6,75.0L951.4,73.6L964.3,66.7L977.1,73.0L990.0,69.4L1002.9,66.1L1015.7,68.1L1028.6,64.2L1041.4,57.0L1054.3,54.8L1067.1,57.4L1080.0,54.4L1092.9,47.7L1105.7,46.7L1118.6,42.5L1131.4,44.3L1144.3,40.6L1157.1,40.1L1170.0,41.6L1182.9,41.5L1195.7,41.4L1208.6,41.6L1221.4,39.2L1234.3,41.8L1247.1,42.2L1260.0,42.2L1272.9,44.3L1285.7,41.0L1298.6,37.5L1311.4,38.0L1324.3,36.5L1337.1,41.2L1350.0,38.4L1362.9,35.9L1375.7,31.4L1388.6,33.3L1401.4,27.2L1414.3,34.8L1427.1,35.3L1440.0,30.7";
/** The fainter torn fibres, running a little beyond `EDGE_MAIN`. */
const EDGE_FRINGE =
  "M0,79.1L12.9,77.7L25.7,81.7L38.6,85.3L51.4,82.9L64.3,91.2L77.1,91.8L90.0,91.5L102.9,92.4L115.7,87.3L128.6,88.2L141.4,91.4L154.3,87.4L167.1,82.2L180.0,83.3L192.9,78.1L205.7,73.5L218.6,70.3L231.4,74.6L244.3,73.9L257.1,74.4L270.0,64.9L282.9,64.6L295.7,59.9L308.6,64.6L321.4,60.9L334.3,58.7L347.1,57.7L360.0,62.0L372.9,55.4L385.7,59.5L398.6,57.1L411.4,58.9L424.3,58.9L437.1,60.4L450.0,56.3L462.9,60.0L475.7,55.6L488.6,56.4L501.4,51.7L514.3,47.9L527.1,49.4L540.0,53.2L552.9,43.6L565.7,44.9L578.6,47.8L591.4,42.3L604.3,39.5L617.1,41.9L630.0,39.0L642.9,32.0L655.7,31.6L668.6,40.9L681.4,37.5L694.3,34.6L707.1,34.9L720.0,45.8L732.9,42.5L745.7,47.3L758.6,46.6L771.4,51.8L784.3,53.5L797.1,58.9L810.0,59.6L822.9,60.8L835.7,67.4L848.6,74.7L861.4,79.3L874.3,79.4L887.1,79.7L900.0,86.6L912.9,86.6L925.7,92.8L938.6,84.9L951.4,92.2L964.3,89.2L977.1,96.4L990.0,84.7L1002.9,92.5L1015.7,85.5L1028.6,83.5L1041.4,87.3L1054.3,83.7L1067.1,83.0L1080.0,71.0L1092.9,73.9L1105.7,67.5L1118.6,69.5L1131.4,63.7L1144.3,60.1L1157.1,67.3L1170.0,62.4L1182.9,60.5L1195.7,57.0L1208.6,59.0L1221.4,54.1L1234.3,56.6L1247.1,53.9L1260.0,57.0L1272.9,58.9L1285.7,53.0L1298.6,54.6L1311.4,52.1L1324.3,52.9L1337.1,48.2L1350.0,55.1L1362.9,52.4L1375.7,56.9L1388.6,51.4L1401.4,50.7L1414.3,50.4L1427.1,49.6L1440.0,43.6";

/** viewBox height the two polylines were drawn against. */
const BOX = 120;

function maskUrl(polyline: string, side: "top" | "bottom") {
  // A top cap is solid from the section's top edge down to the torn line; a bottom cap
  // is solid from the line down to the section's bottom edge. The bottom is mirrored
  // left-to-right so the two seams on one section aren't the same tear twice.
  const close = side === "top" ? `L1440,0L0,0Z` : `L1440,${BOX}L0,${BOX}Z`;
  const path = `<path d="${polyline}${close}" fill="#000"/>`;
  const body = side === "bottom" ? `<g transform="translate(1440,0) scale(-1,1)">${path}</g>` : path;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 ${BOX}" preserveAspectRatio="none">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// The fringe always has to reach *further into* the section than the solid edge does,
// which flips which of the two lines plays which role: measuring down from the top,
// deeper means a larger y; measuring up from the bottom, deeper means a smaller one.
const MASKS = {
  top: { main: maskUrl(EDGE_MAIN, "top"), fringe: maskUrl(EDGE_FRINGE, "top") },
  bottom: { main: maskUrl(EDGE_FRINGE, "bottom"), fringe: maskUrl(EDGE_MAIN, "bottom") },
};

function layer(background: string, mask: string, opacity?: number) {
  return {
    position: "absolute" as const,
    inset: 0,
    background,
    opacity,
    maskImage: mask,
    WebkitMaskImage: mask,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  };
}

export function TornEdge({
  side,
  fill,
  height = 74,
  className = "",
}: {
  /** Which edge of the parent section the seam sits on. Parent must be `relative`. */
  side: "top" | "bottom";
  /** CSS background of the band on the other side of the seam. */
  fill: string;
  height?: number;
  className?: string;
}) {
  const masks = MASKS[side];
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 z-[5] ${side === "top" ? "top-0" : "bottom-0"} ${className}`}
      style={{ height }}
    >
      <div style={layer(fill, masks.fringe, 0.45)} />
      <div style={layer(fill, masks.main)} />
    </div>
  );
}
