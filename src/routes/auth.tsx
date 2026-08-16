import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/**
 * Staff sign-in. Email/password via GoTrue.
 *
 * `ssr: false` because the session lives in localStorage, and `noindex` because a login
 * page has no business in search results. There is deliberately no sign-up route —
 * accounts are provisioned by hand in the Supabase dashboard, and `enable_signup` is
 * false in supabase/config.toml.
 */
export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Sign In — Roam Bengal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "signing-in">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("signing-in");
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setState("idle");
      // GoTrue's own message is safe to show — it does not reveal whether the address
      // exists, only that the combination failed.
      setError(signInError.message);
      return;
    }

    await navigate({ to: "/admin" });
  }

  return (
    <main
      id="main"
      className="flex min-h-screen items-center justify-center bg-green-dark px-5 py-16"
    >
      <div className="w-full max-w-md rounded-2xl bg-paper p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <img src="/logo.png" alt="Roam Bengal" className="h-12 w-auto" />
          <h1 className="mt-4 font-display text-[1.4rem] text-green">Staff Sign In</h1>
          <p className="mt-1 text-center text-[0.84rem] text-muted">
            Accounts are provisioned by the site administrator.
          </p>
        </div>

        <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[0.82rem] font-semibold text-ink"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-rule px-4 py-3 text-[0.9rem] outline-none focus:border-green"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[0.82rem] font-semibold text-ink"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-[1.5px] border-rule px-4 py-3 text-[0.9rem] outline-none focus:border-green"
            />
          </div>

          {error ? (
            <p role="alert" className="text-[0.84rem] text-rust">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="green-dark"
            className="mt-2 w-full"
            disabled={state === "signing-in"}
          >
            {state === "signing-in" ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </main>
  );
}
