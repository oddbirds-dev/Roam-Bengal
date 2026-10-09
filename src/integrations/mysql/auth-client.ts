import { getCurrentUser, signIn } from "./auth.functions";

const STORAGE_KEY = "roam-bengal-admin-session";
type User = { id: string; email: string };

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export const auth = {
  getAccessToken: readToken,
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const result = await signIn({ data: { email, password } });
      window.localStorage.setItem(STORAGE_KEY, result.token);
      return { data: { user: result.user }, error: null };
    } catch {
      return { data: { user: null }, error: { message: "Invalid email or password" } };
    }
  },
  async getUser(): Promise<{ data: { user: User | null } }> {
    if (!readToken()) return { data: { user: null } };
    try {
      return { data: { user: await getCurrentUser() } };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return { data: { user: null } };
    }
  },
  async signOut() {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    return { error: null };
  },
};
