import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Server-function failure → a sentence a site owner can act on.
 *
 * Failures arrive two different ways: a thrown `Response` surfaces as an HTTP status, while an
 * error thrown inside the handler — a Zod validation failure, for instance — arrives as a rejected
 * promise whose message is a JSON array of issues. Unwrap that array into readable lines rather
 * than showing the raw blob.
 */
export function getErrorMessage(e: unknown, fallback = "Something went wrong. Please try again."): string {
  const message = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  if (!message) return fallback;
  try {
    const issues: unknown = JSON.parse(message);
    if (Array.isArray(issues)) {
      const lines = issues
        .map((i: { path?: unknown; message?: unknown }) => {
          const path = Array.isArray(i.path) ? i.path.join(" → ") : "";
          const text = typeof i.message === "string" ? i.message : "";
          if (!text) return "";
          return path ? `${path}: ${text}` : text;
        })
        .filter(Boolean);
      if (lines.length) return lines.join("\n");
    }
  } catch {
    /* not JSON — fall through to the raw message */
  }
  return message;
}
