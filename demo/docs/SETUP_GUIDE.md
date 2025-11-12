# Setup Guide — Applying TextFlow UI/Stack To A New App

This guide helps you bootstrap a new app with the same stack and design system.

## 1) Initialize Project

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm i
```

## 2) Install Core Dependencies

```bash
# UI & styling
npm i tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui and Radix primitives
npx shadcn@latest init

# State, routing, i18n, themes, icons
npm i @tanstack/react-query react-router-dom i18next react-i18next next-themes lucide-react

# Editor and utilities
npm i @tiptap/react @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-text-align @tiptap/extension-highlight @tiptap/extension-table @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-bubble-menu @tiptap/extension-code-block-lowlight lowlight highlight.js

# Styling utils
npm i class-variance-authority clsx tailwind-merge
```

## 3) Configure Vite Aliases

```1:56:vite.config.ts
resolve: { alias: { "@": path.resolve(__dirname, "./src") } }
```

## 4) Tailwind Configuration

Update `tailwind.config.ts` to include src paths, tokens, animations:

```1:119:tailwind.config.ts
content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"]
theme.extend.colors = { /* ...hsl(var(--tokens)) */ }
plugins: [require("tailwindcss-animate")]
```

## 5) Global CSS & Tokens

Create `src/index.css` and define tokens as `:root` + `.dark`. Example excerpts:

```183:246:src/index.css
:root { --background: 40 40% 99%; --foreground: 220 15% 20%; --primary: 185 70% 45%; /* ... */ }
```

```247:296:src/index.css
.dark { --background: 220 20% 12%; --foreground: 40 30% 95%; --primary: 185 65% 50%; /* ... */ }
```

Ensure base layer applies tokens:

```298:306:src/index.css
@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

## 6) shadcn/ui Setup

Configure `components.json` with Tailwind and aliases:

```1:21:components.json
{ "tailwind": { "config": "tailwind.config.ts", "css": "src/index.css", "cssVariables": true }, "aliases": { "components": "@/components", "ui": "@/components/ui", "utils": "@/lib/utils" } }
```

Install components as needed, e.g.:

```bash
npx shadcn@latest add button card input dialog dropdown-menu toast table tabs textarea select switch checkbox accordion tooltip sheet popover breadcrumb menubar navigation-menu progress slider avatar badge alert
```

## 7) Utilities

Add `cn` helper:

```1:6:src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

## 8) Theming

- Wrap app with `ThemeProvider` (next-themes)
- Toggle class on `html` or `body` to switch `.dark`
- Use token-driven utilities for consistent theming

## 9) Project Structure

- `src/components/ui/` for shadcn/ui primitives
- `src/components/` for app components
- `src/lib/` for utilities/services
- `src/pages/` or routing layer for views

## 10) Optional Feature Packs

- Rich Text: TipTap editor + menu bar + styles
- Internationalization: i18next setup and language switcher
- Server state: React Query provider and queryClient

## 11) Verification Checklist

- Tokens render and theme switches correctly
- shadcn/ui components build without style conflicts
- Animations and focus rings match expectations
- Lint/build/preview work in dev and production


