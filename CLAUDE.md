# healthadri-admin — React Admin Dashboard

## Stack
Vite + React 18 + TypeScript, Tailwind CSS v3, Radix UI primitives (shadcn-style), React Hook Form, React Router DOM v6, Axios, lucide-react

---

## Project Structure

```
src/
  pages/              ← one file per route
    Dashboard.tsx
    Login.tsx
    Navigators.tsx    ← CRUD
    Hospitals.tsx     ← CRUD
    Doctors.tsx       ← CRUD
    Playbooks.tsx     ← CRUD
    Symptoms.tsx      ← CRUD
    Roles.tsx         ← info/stub
  components/
    ui/               ← primitive components (Button, Card, Dialog, Input, Label)
    layout/           ← AppShell.tsx, PageHeader.tsx
  lib/
    api.ts            ← axios instance + JWT interceptor
    auth.tsx          ← AuthContext, useAuth
    utils.ts          ← cn() Tailwind merge helper
```

---

## Forms

Use **React Hook Form only** — Zod is not installed, do not add it unless the whole project adopts it.

For validation, use:
- Native HTML5 attributes on `<Input>`: `required`, `minLength`, `maxLength`, `type="email"`, `min`, `max`
- `register('field', { validate: fn })` for custom rules
- react-hook-form's `formState.isSubmitting` to disable the submit button during submission

```tsx
// ✅ correct
const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

// ❌ wrong — Zod is not installed
const schema = z.object({ name: z.string().min(2) });
```

---

## UI Components

Radix UI primitives are wrapped with Tailwind via `cva` (class-variance-authority) in `src/components/ui/`. **Always use these — do not import Radix directly.**

**Available:**
- `Button` (variants: `default`, `destructive`, `outline`, `ghost`, `secondary`, `link`; sizes: `default`, `sm`, `lg`, `icon`)
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`, `CardFooter`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `DialogClose`
- `Input`
- `Label`

**Not yet available:** Select, Checkbox, Switch, Toast, Table, Badge.
- For **selects**: use a native `<select>` with these Tailwind classes to match Input styling:
  ```
  flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
  ```
- For **checkboxes**: use `<input type="checkbox">` with `register()` from React Hook Form.

---

## Auth

- Token stored in `localStorage` key `admin_token`.
- The `api.ts` axios instance reads this token and attaches `Authorization: Bearer <token>` on every request.
- On any 401 response, the interceptor clears `admin_token` and `admin_user` from localStorage and redirects to `/login`.
- Only `super-admin` role can reach the dashboard (`POST /auth/admin/login`).
- `useAuth()` from `src/lib/auth.tsx` exposes `{ user, signIn, signOut }`.

---

## Routing

React Router DOM v6 nested routes:

```
/login              → LoginPage (public)
/                   → DashboardPage   ┐
/navigators         → NavigatorsPage  │  all wrapped by ProtectedRoute + AppShell
/hospitals          → HospitalsPage   │
/doctors            → DoctorsPage     │
/playbooks          → PlaybooksPage   │
/symptoms           → SymptomsPage    │
/roles              → RolesPage       ┘
```

`ProtectedRoute` redirects unauthenticated users to `/login`. Do not add public routes outside the login path.

---

## Page Pattern

Every CRUD page follows this structure:

```tsx
export function <Resource>Page() {
  // 1. state: items[], loading, open (dialog), editing (item | null), deleteTarget
  // 2. load() — fetches list, called on mount and after mutations
  // 3. openAdd() — resets form, clears editing, opens dialog
  // 4. openEdit(item) — resets form with item values, sets editing, opens dialog
  // 5. onSubmit(data) — POST (create) or PATCH (edit), then closes dialog + reload
  // 6. confirmDelete() — DELETE, then closes confirm dialog + reload

  return (
    <>
      {/* PageHeader with title, description, "Add X" button */}
      {/* Card > table */}
      {/* Create/Edit Dialog */}
      {/* Delete confirm Dialog (only if resource supports DELETE) */}
    </>
  );
}
```

---

## Backend Endpoints Used by Each Page

| Page | GET | POST | PATCH | DELETE |
|------|-----|------|-------|--------|
| Navigators | `/users/navigators` | `/users` (role: navigator) | `/users/:id` | `/users/:id` |
| Hospitals | `/hospitals` | `/hospitals` | `/hospitals/:id` | — |
| Doctors | `/doctors` + `/hospitals` | `/doctors` | `/doctors/:id` | `/doctors/:id` |
| Playbooks | `/playbooks` | `/playbooks` | `/playbooks/:id` | `/playbooks/:id` |
| Symptoms | `/symptoms` | `/symptoms` | `/symptoms/:id` | — |
| Dashboard | `/hospitals` + `/doctors` + `/playbooks` + `/symptoms` | — | — | — |

---

## Style Rules

- **Tailwind utility classes only** — no inline `style={{}}` objects, no CSS files beyond `index.css`.
- Use `cn()` from `src/lib/utils.ts` to merge conditional classes.
- Prefer `text-muted-foreground` for secondary text, `text-foreground` for primary text — do not hardcode hex colors.
- Icons: `lucide-react` only. Import by name, render at `w-4 h-4` inside buttons.
