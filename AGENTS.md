# Agent System Rules

## 1. Code Review & Refactoring

Code Review & Refactoring are activated for all changes in `src/features`. Before accepting any PR, the agent must:

1. **Run `pnpm lint` and `pnpm typecheck`**
      - Fix errors unless explicitly asked to ignore.
2. **Follow the Code Guidelines in `code-gen-rules.md`**
      - Especially: use `features` folder, prefer `pnpm` over `npm`, proper error handling.
3. **Ensure changes follow the Architecture Rules in `ARCHITECTURE.md`**
      - For example, if the task is to implement business logic, the agent must:
           - Place it in `src/features/<feature>/hooks/`
           - Import it in `src/features/<feature>/components/page.tsx`
           - NOT place it directly in the component file.

## 2. Folder Structure (FEAT)

- All new frontend code goes into `src/features`.
- Examples:
     - New dashboard page: `src/features/dashboard/components/page.tsx`
     - New form: `src/features/projects/forms/ProjectForm.tsx`

## 3. Code Generation

- **Tools:** Use `generate-component`, `generate-hook`, `generate-page`, `generate-form`.
- **Imports:** Always use pnpm imports, e.g.: `import { generateComponent } from 'pnpm create'`. Do NOT use `npx`.
