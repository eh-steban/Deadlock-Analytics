# applyTo: /frontend
---
applyTo: "**/*.ts,**/*.tsx"
---

# ⚛️ React (TypeScript) Project Coding Standards

## 🧱 Architecture & Structure

- Follow a modular folder structure by feature (e.g., `/components`, `/views`, `/services`, `/hooks`, `/types`)
- Separate logic concerns:
  - Use **components** for UI
  - Use **hooks** for state/data logic
  - Use **services** for API communication
- Avoid placing logic-heavy functions inside component files

## 📦 Imports & Modules

- Use **absolute imports** where possible (configured via `tsconfig.json`)
- Import React-related libraries first, then third-party libraries, then local modules
- Avoid default exports unless clearly warranted (named exports preferred)

## 🧑‍🎨 Styling

- Use **Tailwind CSS** for styling
- Prefer utility-first classes in JSX, avoid deeply nested class compositions
- Group Tailwind classes logically: layout → spacing → typography → colors → effects

## 🧠 Naming Conventions

- Use **PascalCase** for component and file names (e.g., `MatchCard.tsx`, `ReplayDownloader.tsx`)
- Use **camelCase** for variables, functions, and hooks
- Prefix custom hooks with `use` (e.g., `useMatchHistory`)
- Use ALL_CAPS for global constants (e.g., `API_BASE_URL`)

## 🔐 State Management

- Use local component state (`useState`) for simple UI behavior
- Use `useContext` for shared global state (avoid prop drilling)
- Prefer colocating state with the component or feature that uses it

## 🌐 API Integration

- Place API logic in a `services/` or `api/` directory
- Use `fetch` or `axios` with hooks like `useEffect` or custom hooks (`useSteamLogin`, `useMatchHistory`)
- Abstract request config (headers, base URLs) into a shared helper

## ⚠️ Error Handling

- Use `try/catch` inside `async` effects or API calls
- Provide user-friendly error messages via a toast, alert, or error boundary
- Handle loading and error states explicitly in components

## 🧪 Testing

- Prefer **React Testing Library** and **Jest** for unit/integration testing
- Test user behavior, not implementation details
- Use test IDs (`data-testid`) sparingly — only for complex selectors

## 💄 Component Best Practices

- Keep components small and composable (ideally < 150 lines)
- Extract subcomponents (e.g., `MatchCard`, `PlayerRow`) into their own files if reused
- Use `React.memo` only if you measure a performance gain
- Avoid excessive prop drilling — pass minimal necessary data

## ✅ Forms & Validation

- Use `react-hook-form` for scalable form logic
- Validate inputs using `zod` or `yup` with schema inference

## 🔁 Reusability

- Reuse layout, typography, and common UI patterns in `/components/ui`
- Create generic helpers like `formatDate`, `groupBy`, `truncateText` in a `utils/` directory

## 🔧 TypeScript Guidelines

- Prefer type aliases (`type Match = { ... }`) over interfaces unless extending
- Avoid using `any`; fall back to `unknown` + type guards when needed
- Type all props and state explicitly in components
- Infer types from API schemas when possible (e.g., from a shared backend `types.ts`)

## ⚙️ Tooling & Quality

- Follow Prettier and ESLint rules configured in the project
- Use `tsconfig.json` paths for clean import aliases
- Organize components alphabetically or by domain when appropriate
