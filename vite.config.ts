import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: { port: 3000 },
  // Vite 8 resolves tsconfig `paths` natively; the vite-tsconfig-paths plugin is no
  // longer needed for the `@/*` alias.
  resolve: {
    tsconfigPaths: true,
    // TanStack Start loads route layouts in separate chunks. Force those chunks and the
    // application shell to share one React instance, so router context is never split.
    dedupe: ["react", "react-dom"],
  },
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
});
