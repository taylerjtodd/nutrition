# Phase 1: Project Initialization & Configuration

This phase details how to set up the core framework (Next.js), install essential dependencies, and configure PostCSS with Tailwind CSS v4.

## Checklist

- [ ] Check `create-next-app` CLI options using `--help`.
- [ ] Initialize Next.js project in current directory using TypeScript, ESLint, App Router, and no Tailwind (we'll set Tailwind v4 up manually).
- [ ] Install production dependencies:
  - `@upstash/redis` (Database client)
  - `next-auth` (Authentication)
  - `lucide-react` (Icons)
- [ ] Install Tailwind CSS v4 and PostCSS dependencies:
  - `tailwindcss`
  - `@tailwindcss/postcss`
  - `postcss`
- [ ] Create PostCSS configuration (`postcss.config.mjs`).
- [ ] Verify initial local dev server starts successfully.

## Step-by-Step Instructions

### 1. Inspect Next.js Init Options
First, inspect the bootstrap command:
```bash
npx create-next-app@latest --help
```

### 2. Bootstrap the Project
Run the creation script non-interactively to initialize the application in the workspace root:
```bash
npx create-next-app@latest ./ \
  --typescript \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm \
  --no-tailwind
```
*(We bootstrap without the default Tailwind CSS v3 option because we are manually setting up Tailwind CSS v4).*

### 3. Install Dependencies
```bash
npm install @upstash/redis next-auth lucide-react
npm install tailwindcss @tailwindcss/postcss postcss
```

### 4. Create PostCSS Config
Create `postcss.config.mjs` in the project root:
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### 5. Verify Setup
Run the development command to ensure everything compiles:
```bash
npm run dev
```
Navigate to `http://localhost:3000` to verify the page renders properly.
