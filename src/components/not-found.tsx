import { ButtonLink } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="wrap flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="mb-3 font-script text-4xl text-orange">Lost the trail?</span>
      <h1 className="mb-4 font-display text-4xl text-green">Page Not Found</h1>
      <p className="mb-8 max-w-md text-muted">
        That page has drifted off somewhere. Try the tours — that is usually where people
        were heading anyway.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink to="/" variant="green-dark">
          Back Home
        </ButtonLink>
        <ButtonLink to="/tours" variant="outline-dark">
          Browse Tours
        </ButtonLink>
      </div>
    </div>
  );
}
