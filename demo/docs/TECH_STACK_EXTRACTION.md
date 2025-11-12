# Tech Stack Extraction — TextFlow AI Studio

This document extracts the complete technology stack used by TextFlow AI Studio so it can be applied to another application with no existing UI framework.

## Frontend

- React 18 (functional components and hooks)
- TypeScript (strict typing)
- Vite (dev/build with SWC React plugin)
- Tailwind CSS (utility-first styling)
- shadcn/ui (Radix UI primitives + Tailwind)
- React Router DOM (routing)
- TanStack React Query (server state)
- TipTap editor (rich text)
- i18next + react-i18next (i18n)
- next-themes (theme switching, dark mode)
- Lucide React (icons)
- Styling utilities: class-variance-authority, clsx, tailwind-merge

Key configuration files:

```1:56:vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 5173, hmr: { overlay: { warnings: false, errors: true } } },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  optimizeDeps: { esbuildOptions: { sourcemap: false } },
  build: {
    sourcemap: mode === "development",
    minify: mode === "production",
    rollupOptions: { onwarn(warning, warn) { /* filtered */ warn(warning); } },
  },
}));
```

```1:21:components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" }
}
```

```1:120:tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        sidebar: { DEFAULT: "hsl(var(--sidebar-background))", foreground: "hsl(var(--sidebar-foreground))", primary: "hsl(var(--sidebar-primary))", "primary-foreground": "hsl(var(--sidebar-primary-foreground))", accent: "hsl(var(--sidebar-accent))", "accent-foreground": "hsl(var(--sidebar-accent-foreground))", border: "hsl(var(--sidebar-border))", ring: "hsl(var(--sidebar-ring))" },
        editor: { bg: "hsl(var(--editor-bg))", selection: "hsl(var(--editor-selection))" },
        suggestion: { bg: "hsl(var(--suggestion-bg))", border: "hsl(var(--suggestion-border))" }
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: { /* accordion, fade, scale, slide */ },
      animation: { /* accordion, fade, scale, slide */ },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

## Backend

- Node.js + Express (REST API)
- TypeScript
- MongoDB + Mongoose
- JWT auth
- Validation with Zod
- Rate limiting, Helmet, CORS
- Logging with Winston

Representative dependencies:

```1:76:backend/package.json
{
  "name": "textflow-backend",
  "version": "1.0.0",
  "description": "TextFlow AI Studio Backend API",
  "main": "dist/server.js",
  "scripts": { "build": "tsc", "start": "node dist/server.js", "dev": "ts-node-dev --respawn --transpile-only src/server.ts" },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "zod": "^4.1.12",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.5.1",
    "winston": "^3.11.0"
  }
}
```

## Infrastructure

- Docker & Docker Compose
- Traefik reverse proxy with automatic HTTPS
- Nginx for static assets
- MongoDB database

For deployment and commands, see project README’s sections for “Production Deployment” and “Docker Commands”.

## Integration Pillars

- LiteLLM integration for AI features (proxy optional but required for quotas)
- OCR via Tesseract.js
- Vector DB integration options (Qdrant, pgvector, Pinecone)
- Internationalization (English, Vietnamese, French, Chinese)

## Applying This Stack To A New App

- Start with Vite + React + TS scaffold.
- Install Tailwind + shadcn/ui and set up color tokens and themes.
- Set up routing, React Query, and i18n early.
- Add auth layer and API client conventions.
- Introduce feature modules progressively (editor, admin, OCR, etc.) as needed.


