# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Property insurance calculator frontend (React 18 + Vite) for Bulgarian market. Multi-step form that collects property data, insurance coverage options, and personal information to generate insurance quotes. Communicates with a Symfony REST API backend.

**Live Demo:** https://propcalc-dy7.pages.dev/

## Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Production build (outputs to dist/)
npm run lint     # Run ESLint over src/
npm run preview  # Preview production build
```

> **Note:** There is no test runner configured.

## Architecture

### Multi-Step Form Flow
The app is a 5-step wizard form controlled by `MultiStepForm.jsx`:
1. **EstateDataForm** - Property location, type, subtype, area
2. **CoveredRisksForm** - Insurance package selection (predefined or custom)
3. **TariffPreviewForm** - Review selected tariff/coverage
4. **InsurerForm** - Personal/contact information
5. **OrderPreviewForm** - Final review and submission

State is lifted to `MultiStepForm` and passed down to each step. Form navigation uses animated transitions (`nextStep`/`prevStep`).

### Authentication
Anonymous JWT authentication via `AuthService` (`src/services/auth.js`):
- Auto-authenticates on form load via `loginAnonymous()`
- Axios interceptors auto-attach tokens and handle 401s with automatic token refresh
- Tokens expire after 1 hour; 401 responses trigger automatic re-authentication
- Tokens stored in localStorage (`jwt_token`, `user`)

See `src/TOKEN_REFRESH_README.md` for detailed token refresh documentation.

### API Layer
- `src/services/api.js` - Axios instance with base URL. The base URL is hardcoded — there is **no `.env` config**; switching environments means editing the commented `API_URL` lines in this file.
- Production: `https://propcalc.zastrahovaite.com/`
- Admin Panel: `https://propcalc-admin.pages.dev/`
- Local dev: Comment out production URL and use `https://127.0.0.1:8000/`
- Initial form data fetched once on mount and stored in `window.initialFormData` (read globally by step components rather than threaded through props)
- Interceptors live in `auth.js` (imported for side effects via `MultiStepForm`): a request interceptor attaches the `Bearer` token; a response interceptor catches 401s, calls `loginAnonymous()`, and retries the original request once (guarded by `originalRequest._retry`).

### Business Logic (`src/services/`, `src/utils/`)
- `services/calc-statistics.js` (`CalcStatisticsService.calculate`) - Pure premium math: applies regular discount, tax percent, and optional promo discount; returns premium/discount/tax/total breakdown. All amounts rounded to 2 decimals.
- `utils/helpers.js` - Domain rules: `isSolarByEstateTypeApplicable` (true when `estate_type_id === '4'`), `getSolarClauseId` (returns `3`), `isClauseWithCheckbox` (clauses `6, 14, 15, 16`).
- `utils/formatters.jsx` - `formatCurrency` uses `bg-BG` locale; `formatDescription` converts newlines to `<br />`.

### Styling
- Tailwind CSS with custom color theme defined in `tailwind.config.js`:
  - Primary: `#8B2131` (burgundy) with dark variants
  - Accent: `#ffcc00` (yellow) with variants
  - Success/Error colors with variants
- Material UI components for form controls
- Form plugin: `@tailwindcss/forms`

### UI Components
Reusable components in `src/components/ui/`:
- `LoadingSpinner`, `ErrorDisplay`, `ErrorBoundary` - Loading/error states
- `BackButton`, `ProceedButton` - Navigation
- `InfoTooltip`, `InfoModal` - Help/information display
- `TariffPreview` - Tariff display component

## Key State Variables

In `MultiStepForm`:
- `formData` - Property details (settlement, estate type, area, etc.)
- `selectedTariff` - Chosen insurance package/tariff
- `customClauseAmounts` - Custom coverage amounts when using custom package
- `insurerData` - Personal information for the insurer
- `clauseCheckboxes` - Special clause toggles (14, 15, 16)
- `promoCode*` - Promotional code state

**Note:** When `estate_type_id` changes, all custom package state is reset (amounts, risks, tariff, clause checkboxes) but promo codes are preserved.

## Deployment

Deployed to Cloudflare Pages. Build outputs static files to `dist/`.

## Bulgarian Context

This is a Bulgarian insurance application. Form labels, step names, and UI text are in Bulgarian. The currency symbol comes from the API response.