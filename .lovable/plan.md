## Problem

The preview loads at `/plant-pulse/` and shows the 404 "Page not found" screen instead of the login page.

The cause is in `vite.config.ts`:

```ts
export default defineConfig({
  base: "/plant-pulse/",
  ...
});
```

The Vite `base` option prefixes asset URLs and serves the app under `/plant-pulse/`, but TanStack Router's route tree is declared at `/`, `/dashboard`, `/entry`, etc. When the browser visits `/plant-pulse/`, the router tries to match that path against its route table, finds nothing, and renders the root `notFoundComponent` (the "404 / Page not found / Go home" screen).

TanStack Start projects on Lovable are served from the domain root — no base path is needed or supported.

## Fix

Edit `vite.config.ts` and remove the `base` line:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
});
```

After the dev server restarts, `/` will render the login page and the existing nav (`/dashboard`, `/entry`, `/history`, `/admin`, `/energie`) will resolve correctly.

No other files need to change.
