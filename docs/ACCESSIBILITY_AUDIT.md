# Accessibility Audit — "Passbook"

Real findings from (1) calculating WCAG 2.1 contrast ratios for every color pair actually used in the design system, and (2) inspecting keyboard-navigation behavior in the Modal and mobile sidebar. Not a generic checklist — every number below was computed from the live token values in `index.css`.

---

## 1. Color contrast

Method: relative luminance + contrast ratio computed directly from the hex values in `client/src/index.css`, checked against WCAG AA (4.5:1 normal text, 3:1 large text/graphical objects).

| Pair | Ratio | AA normal | AA large/graphical |
|---|---|---|---|
| Body text on paper background (light) | 12.32 | Pass | Pass |
| Muted text on paper background (light) | 6.17 | Pass | Pass |
| Muted text on surface (light) | 5.69 | Pass | Pass |
| Rose text on paper background | 8.28 | Pass | Pass |
| Sage text on paper background | 7.52 | Pass | Pass |
| Paper text on primary-600 button | 12.32 | Pass | Pass |
| Body text on dark background | 14.99 | Pass | Pass |
| Muted text on dark background | 7.44 | Pass | Pass |
| Muted text on dark surface | 6.74 | Pass | Pass |
| Gold-100 / rose-100 / sage-100 on dark surface | 9.89–11.73 | Pass | Pass |
| **Gold-400 as text on paper background** | **2.83** | **Fail** | **Fail** |

### Finding & fix

`gold-400` (`#C88719`), the identity's primary accent, fails contrast when used as text on the paper background — both as the "Passbook**.**" brand-mark accent and as the color for loading spinners (`Loader2` icons, which convey active state, not pure decoration).

**Fixed:** every instance switched to a theme-aware pairing — `text-gold-600 dark:text-gold-100` — which resolves to 5.15:1 in light mode and 11.73:1 in dark mode, both comfortably passing AA. Applied in:
- `layouts/AppLayout.jsx`, `layouts/AuthLayout.jsx` (brand mark)
- `App.jsx`, `components/ProtectedRoute.jsx`, `pages/History.jsx`, `pages/Goals.jsx`, `pages/Savings.jsx` (loading spinners)

`gold-400` remains safe to use as a **background** behind icons/progress bars (checked separately against the 3:1 graphical-object threshold — the one actual case, the brand-mark icon badge in dark mode, measures 4.36:1 and passes) — only its use as *text* was the problem.

## 2. Keyboard navigation

Inspected `Modal.jsx` (used for every create/edit form) and the mobile sidebar drawer in `AppLayout.jsx`.

### Findings
- Modal had no Escape-to-close handler
- Modal had no focus trap — Tab could escape the dialog into the page behind it
- Modal had no `role="dialog"` / `aria-modal` / `aria-labelledby` — screen readers wouldn't announce it as a dialog or associate it with its title
- Modal's close button used `focus:outline-none` with no replacement — removed the focus indicator with nothing to replace it, a real regression for keyboard users
- Mobile sidebar drawer had no Escape-to-close handler

### Fixes
- `Modal.jsx`: added an Escape-key listener, a lightweight focus trap (Tab/Shift+Tab cycle within the dialog's focusable elements), `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing at the title, focus moves to the close button on open and returns to the previously-focused element on close, and a visible `focus-visible:ring-2 focus-visible:ring-gold-400` on the close button
- `AppLayout.jsx`: added an Escape-key listener that closes the mobile sidebar

Both verified: production build succeeds, lint shows 0 new issues (same 4 pre-existing warnings, unrelated to this change).

## 3. Not covered in this pass

- No automated tooling (axe-core, Lighthouse) was run — this was a manual calculation + code-reading pass. Recommended as a follow-up with real browser access.
- Screen-reader testing (VoiceOver/NVDA) wasn't performed — same reason.
- Form field labeling/error-association wasn't audited beyond what was already handled in the Zod-validated forms.

These remain listed in `docs/DEVELOPMENT_PLAN.md` Phase B as follow-up work where actual browser/AT tooling is available.
