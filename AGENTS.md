# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `app/`: `layout.tsx` manages shared fonts/theme, `page.tsx` hosts the landing view, and `globals.css` defines Tailwind 4 tokens via `@theme inline`. Shared helpers stay in `lib/` (`cn` helper). Static files belong in `public/`; `.next/` is generated. Use the `@/*` alias from `tsconfig.json` for imports.

## Build, Test, and Development Commands
- `npm run dev`: start the hot-reloading server on `localhost:3000`.
- `npm run build`: compile the production bundle; the command powering CI/CD.
- `npm run start`: serve the contents of `.next/` locally for smoke tests.
- `npm run lint`: run ESLint with the Next.js Core Web Vitals rules; treat failures as required fixes.

## Coding Style & Naming Conventions
Code in strict TypeScript React. Keep indentation at two spaces and prefer function components in `app/`. Components and files use `PascalCase` (for example `HeroSection.tsx`), hooks `useCamelCase`, utilities `camelCase`. Compose styles with Tailwind classes plus the `cn` helper from `lib/utils.ts`; extend tokens in `app/globals.css` instead of inline colors. Default exports are reserved for Next.js routes or layouts.

## Testing Guidelines
Today linting is the automated gate, so run `npm run lint` before every commit and keep the output clean. When adding Jest or React Testing Library, colocate specs beside the feature (`app/dashboard/page.test.tsx`) or within a nearby `__tests__/` folder, mirror component names inside `describe` blocks, and target >=80% coverage on new modules. Snapshot UI only for layouts that rarely change, and stub all network traffic via Next.js route handlers.

## Commit & Pull Request Guidelines
History so far uses short imperative messages (`Initial commit from Create Next App`), so continue that voice, think `Add hero section copy`. Reference issue IDs when available and wrap summaries near 72 characters. Pull requests should explain purpose, list key changes, document verification steps (`npm run dev`, screenshots for UI changes), mention risks or rollbacks, and link follow-up tasks. Request at least one review and merge only when lint and build succeed.

## Environment & Configuration Tips
Global Next.js configuration lives in `next.config.ts`; extend its object rather than rewriting it. Design tokens, icon settings, and path aliases are defined in `components.json`, and Tailwind `@theme inline` variables live in `app/globals.css` - update them together when tweaking the design system. Keep secrets in `.env.local`, which Next.js auto-loads, and avoid hardcoding API keys or endpoints inside components.
