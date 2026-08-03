import type { ErrorComponentProps } from "@tanstack/react-router";
import { ButtonLink } from "@/components/ui/button";

export function ErrorPage({ error }: ErrorComponentProps) {
  return (
    <div className="wrap flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="mb-3 font-script text-4xl text-orange">Well, that went sideways</span>
      <h1 className="mb-4 font-display text-4xl text-green">Something Went Wrong</h1>
      <p className="mb-8 max-w-md text-muted">
        We hit an unexpected error loading this page. Try again, or message us on WhatsApp
        and we will sort it out.
      </p>

      {import.meta.env.DEV ? (
        <pre className="mb-8 max-w-2xl overflow-x-auto rounded-lg bg-mint p-4 text-left text-[0.78rem] text-ink">
          {error instanceof Error ? error.stack || error.message : String(error)}
        </pre>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink to="/" variant="green-dark">
          Back Home
        </ButtonLink>
        <ButtonLink to="/contact" variant="outline-dark">
          Contact Us
        </ButtonLink>
      </div>
    </div>
  );
}
