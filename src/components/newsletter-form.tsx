import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/lib/capture.functions";

export function NewsletterForm({ cta, source }: { cta: string; source: string }) {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (state === "done") {
    return (
      <p className="mt-6 rounded-xl bg-paper p-5 text-[0.9rem] font-medium text-green-dark">
        ✅ You're on the list. Look out for the next dispatch.
      </p>
    );
  }

  return (
    <form
      className="mt-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        setError("");
        try {
          await subscribe({ data: { email, source } });
          setState("done");
        } catch (err) {
          setState("error");
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="flex-1 rounded-[30px] border-[1.5px] border-rule bg-paper px-5 py-3 text-[0.88rem] outline-none focus:border-green"
        />
        <Button type="submit" variant="green-dark" disabled={state === "sending"}>
          {state === "sending" ? "Signing up…" : cta}
        </Button>
      </div>
      {state === "error" ? (
        <p role="alert" className="mt-3 text-[0.82rem] text-rust">
          {error}
        </p>
      ) : null}
    </form>
  );
}
