// Client-side SEO + readability analysis (English heuristic).
export type CheckStatus = "good" | "ok" | "bad" | "info";
export type Check = { id: string; label: string; status: CheckStatus; message: string };

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, " ");
const norm = (s: string) =>
  stripHtml(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
const words = (s: string) =>
  norm(s)
    .split(/[^a-z0-9']+/i)
    .filter(Boolean);
const sentences = (s: string) =>
  stripHtml(s)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\[])/)
    .map((x) => x.trim())
    .filter(Boolean);

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const h = norm(haystack);
  const n = norm(needle);
  if (!n) return 0;
  let i = 0,
    count = 0;
  while ((i = h.indexOf(n, i)) !== -1) {
    count++;
    i += n.length;
  }
  return count;
}

// Rough syllable heuristic for English
function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const clean = w.replace(/e$/, "").replace(/[aeiouy]{2,}/g, "a");
  const m = clean.match(/[aeiouy]/g);
  return Math.max(1, m ? m.length : 1);
}

const TRANSITIONS = new Set([
  "accordingly",
  "additionally",
  "after",
  "afterward",
  "also",
  "although",
  "and",
  "as",
  "because",
  "before",
  "besides",
  "but",
  "consequently",
  "despite",
  "during",
  "earlier",
  "eventually",
  "finally",
  "first",
  "following",
  "for",
  "further",
  "furthermore",
  "hence",
  "however",
  "in",
  "in addition",
  "in contrast",
  "in fact",
  "indeed",
  "instead",
  "later",
  "likewise",
  "meanwhile",
  "moreover",
  "namely",
  "nevertheless",
  "next",
  "nonetheless",
  "notably",
  "otherwise",
  "overall",
  "particularly",
  "similarly",
  "since",
  "so",
  "specifically",
  "still",
  "subsequently",
  "then",
  "therefore",
  "though",
  "thus",
  "typically",
  "ultimately",
  "whereas",
  "while",
  "yet",
]);

export type KeyphraseInput = {
  keyphrase: string;
  title: string;
  metaDescription: string;
  slug: string;
  h1?: string;
  body: string;
  firstParagraph?: string;
  imageAlts?: string[];
  url?: string;
};

export function analyzeKeyphrase(i: KeyphraseInput): Check[] {
  const checks: Check[] = [];
  const kp = i.keyphrase.trim();
  if (!kp) {
    return [
      {
        id: "kp-missing",
        label: "Focus keyphrase",
        status: "bad",
        message: "Set a focus keyphrase to score this page.",
      },
    ];
  }
  const kpWords = words(kp);

  // Length
  checks.push(
    kpWords.length === 0
      ? {
          id: "kp-length",
          label: "Keyphrase length",
          status: "bad",
          message: "Focus keyphrase is empty.",
        }
      : kpWords.length > 4
        ? {
            id: "kp-length",
            label: "Keyphrase length",
            status: "ok",
            message: `Your keyphrase is ${kpWords.length} words. Under 5 words is easier to rank.`,
          }
        : {
            id: "kp-length",
            label: "Keyphrase length",
            status: "good",
            message: `Good — ${kpWords.length} word${kpWords.length > 1 ? "s" : ""}.`,
          },
  );

  // Title
  const inTitle = countOccurrences(i.title, kp) > 0;
  checks.push({
    id: "kp-title",
    label: "Keyphrase in SEO title",
    status: inTitle ? "good" : "bad",
    message: inTitle
      ? "Keyphrase appears in the title."
      : "Add the focus keyphrase to your SEO title.",
  });

  // Title length
  const tl = i.title.length;
  checks.push({
    id: "title-length",
    label: "SEO title length",
    status: tl >= 40 && tl <= 60 ? "good" : tl > 0 ? "ok" : "bad",
    message: tl === 0 ? "Set an SEO title." : `Title is ${tl} chars. Aim for 40–60.`,
  });

  // Meta description
  const inMeta = countOccurrences(i.metaDescription, kp) > 0;
  checks.push({
    id: "kp-meta",
    label: "Keyphrase in meta description",
    status: inMeta ? "good" : "bad",
    message: inMeta
      ? "Keyphrase found in meta description."
      : "Include the keyphrase in the meta description.",
  });
  const ml = i.metaDescription.length;
  checks.push({
    id: "meta-length",
    label: "Meta description length",
    status: ml >= 120 && ml <= 160 ? "good" : ml > 0 ? "ok" : "bad",
    message:
      ml === 0 ? "Write a meta description." : `Meta description is ${ml} chars. Aim for 120–160.`,
  });

  // Slug
  const inSlug = i.slug.toLowerCase().includes(norm(kp).replace(/\s+/g, "-"));
  checks.push({
    id: "kp-slug",
    label: "Keyphrase in URL slug",
    status: inSlug ? "good" : "ok",
    message: inSlug
      ? "Slug contains the keyphrase."
      : "Consider including the keyphrase in the slug.",
  });

  // H1
  if (i.h1 !== undefined) {
    const inH1 = countOccurrences(i.h1, kp) > 0;
    checks.push({
      id: "kp-h1",
      label: "Keyphrase in H1",
      status: inH1 ? "good" : "ok",
      message: inH1 ? "Keyphrase found in H1." : "H1 does not contain the keyphrase.",
    });
  }

  // First paragraph
  if (i.firstParagraph !== undefined) {
    const inFirst = countOccurrences(i.firstParagraph, kp) > 0;
    checks.push({
      id: "kp-first",
      label: "Keyphrase in intro",
      status: inFirst ? "good" : "ok",
      message: inFirst
        ? "Keyphrase appears in the first paragraph."
        : "Mention the keyphrase in the first paragraph.",
    });
  }

  // Density
  const bodyWordCount = words(i.body).length;
  const occ = countOccurrences(i.body, kp);
  const density = bodyWordCount > 0 ? (occ * kpWords.length * 100) / bodyWordCount : 0;
  checks.push({
    id: "kp-density",
    label: "Keyphrase density",
    status: density >= 0.5 && density <= 2.5 ? "good" : occ > 0 ? "ok" : "bad",
    message: `Keyphrase appears ${occ} time${occ === 1 ? "" : "s"} (${density.toFixed(2)}%). Aim for 0.5–2.5%.`,
  });

  // Body length
  checks.push({
    id: "body-length",
    label: "Content length",
    status: bodyWordCount >= 300 ? "good" : bodyWordCount >= 150 ? "ok" : "bad",
    message: `Body has ${bodyWordCount} words. Aim for 300+.`,
  });

  // Image alts
  if (i.imageAlts && i.imageAlts.length) {
    const hasAlt = i.imageAlts.some((a) => a && countOccurrences(a, kp) > 0);
    checks.push({
      id: "kp-img-alt",
      label: "Keyphrase in image alt",
      status: hasAlt ? "good" : "ok",
      message: hasAlt
        ? "At least one image alt contains the keyphrase."
        : "Add the keyphrase to at least one image alt.",
    });
  }

  return checks;
}

export function analyzeReadability(body: string): Check[] {
  const checks: Check[] = [];
  const text = stripHtml(body).trim();
  if (!text)
    return [
      {
        id: "read-empty",
        label: "Readability",
        status: "info",
        message: "No content to analyze yet.",
      },
    ];

  const wordArr = words(text);
  const sents = sentences(text);
  const wordCount = wordArr.length;
  const sentCount = Math.max(1, sents.length);
  const syllCount = wordArr.reduce((s, w) => s + syllables(w), 0);
  const asl = wordCount / sentCount;
  const asw = syllCount / Math.max(1, wordCount);
  const flesch = 206.835 - 1.015 * asl - 84.6 * asw;

  checks.push({
    id: "flesch",
    label: "Flesch Reading Ease",
    status: flesch >= 60 ? "good" : flesch >= 30 ? "ok" : "bad",
    message: `Score ${flesch.toFixed(0)}. ${flesch >= 60 ? "Easy to read." : flesch >= 30 ? "Somewhat difficult." : "Hard to read — shorten sentences and simplify words."}`,
  });

  const longSent = sents.filter((s) => words(s).length > 20).length;
  const longPct = (longSent / sentCount) * 100;
  checks.push({
    id: "sentence-length",
    label: "Sentence length",
    status: longPct <= 25 ? "good" : longPct <= 40 ? "ok" : "bad",
    message: `${longPct.toFixed(0)}% of sentences over 20 words. Aim for ≤25%.`,
  });

  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const longPara = paragraphs.filter((p) => words(p).length > 150).length;
  checks.push({
    id: "paragraph-length",
    label: "Paragraph length",
    status: longPara === 0 ? "good" : longPara <= 1 ? "ok" : "bad",
    message:
      longPara === 0
        ? "All paragraphs are a comfortable length."
        : `${longPara} paragraph(s) exceed 150 words. Split them up.`,
  });

  // Passive voice heuristic: "be" + past participle
  const beRe = /\b(is|are|was|were|be|been|being)\s+([a-z]+ed|[a-z]+en)\b/gi;
  const passiveMatches = text.match(beRe)?.length ?? 0;
  const passivePct = (passiveMatches / sentCount) * 100;
  checks.push({
    id: "passive",
    label: "Passive voice",
    status: passivePct <= 10 ? "good" : passivePct <= 20 ? "ok" : "bad",
    message: `About ${passivePct.toFixed(0)}% of sentences use passive voice. Aim for ≤10%.`,
  });

  // Transition words
  const hasTrans = sents.filter((s) => {
    const w = words(s);
    return w.some(
      (word, i) => TRANSITIONS.has(word) || TRANSITIONS.has(`${word} ${w[i + 1] ?? ""}`),
    );
  }).length;
  const transPct = (hasTrans / sentCount) * 100;
  checks.push({
    id: "transitions",
    label: "Transition words",
    status: transPct >= 30 ? "good" : transPct >= 20 ? "ok" : "bad",
    message: `${transPct.toFixed(0)}% of sentences use transition words. Aim for ≥30%.`,
  });

  return checks;
}

export function overallScore(checks: Check[]): {
  score: number;
  label: string;
  color: CheckStatus;
} {
  if (!checks.length) return { score: 0, label: "No data", color: "info" };
  const weights: Record<CheckStatus, number> = { good: 1, ok: 0.5, bad: 0, info: 0.5 };
  const total = checks.reduce((s, c) => s + weights[c.status], 0);
  const score = Math.round((total / checks.length) * 100);
  const color: CheckStatus = score >= 75 ? "good" : score >= 45 ? "ok" : "bad";
  const label = color === "good" ? "Good" : color === "ok" ? "OK" : "Needs work";
  return { score, label, color };
}
