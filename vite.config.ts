// TanStack Start & Vite Configuration
// Bundles plugins including TanStack devtools, React, Tailwind, and Nitro SSR entry.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    optimizeDeps: {
      include: [
        "sonner",
        "lucide-react",
        "@radix-ui/react-accordion",
        "@radix-ui/react-dialog",
        "@radix-ui/react-label",
        "@radix-ui/react-slot",
        "@radix-ui/react-tabs",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
      ],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts
    server: { entry: "server" },
  },
});