# Persepolis Foods — The Strategy Map Escape Room

A playable six-room Balanced Scorecard learning game. Next.js App Router, React, TypeScript, Tailwind, a shadcn-style Radix/CVA Button, Lucide, Motion, dnd-kit, React Flow, Recharts, Zod, Vitest and Playwright.

## Run

Requires Node.js 22+ (validated on Node 24) and npm. Use the existing checkout; each cloud task is already isolated and does not need a Git worktree.

```sh
cd /workspace/BSC_Scape_Room
npm ci
npm run dev
```

Open the development server on port 3000 in your local browser. Anonymous play requires no credentials. Use `npm run build` and `npm start` for a production Node server. The cloud onboarding UI does not provide a web preview; browser checks run internally.

```sh
npm test
npm run validate:content
npm run typecheck
npm run test:e2e
```

Playwright defaults to `/usr/bin/chromium`. Set `CHROMIUM_PATH` to another installed Chromium executable, or install Playwright Chromium and set the path. Tests start an isolated dev server on port 3100, with test-only credentials and a separate `.data/e2e` directory. The port must be free. They do not reuse a running cohort instance or connect to your Supabase database. E2E fixtures know answers; they are not shipped in public assets.

## What is implemented

- Six strictly sequential rooms, explicit next-room entry, read-only completed rooms and resumable progress.
- Vision selection, three progressive O–M–T–I rows in each perspective, any-order chains, component-safe drag/drop and click selection, used-card disabling, mistakes and current-room resets.
- Linked baseline calculations, D25 directional feedback, D26 chain alignment, scoring, clean-attempt bonuses and rollback of failed-room points.
- Twelve-objective React Flow map with accessible perspective and connection controls, configurable multiple causal hypotheses and a written explanation.
- Forty theory questions (ten supplied plus thirty original additions); ten random questions per attempt, shuffled choices, blank-answer alternatives, unlimited retakes, default 8/10 pass boundary.
- Accessible annual-review sections, search and financial tables; student dashboard, chart and PDF certificate with Unicode font.
- Instructor login, full JSON content editing/import/export, quick option editing, annual-review text/JSON upload, student analytics, distractor frequencies, anonymised CSV and authorised resets.
- Optional Supabase email/password accounts, server-authoritative assessment and progress, private answer mappings and server-authorised instructor access.

## Supplied content and reconciliation

`src/data/supplied.json` contains **all 128 options from the uploaded instructor bank** (48 correct, 80 distractors), with its exact student-facing text and correctness verdicts. Diagnostic categories and explanations are explicitly labelled editorial annotations because the revised matrix does not provide them. `src/data/supplied-quiz.json` contains the ten supplied questions and marking alternatives. `supplied.json` also defines the revised calculations and provisional causal links; `demo.ts` supplies the original extra theory questions and vision interpretations. These modules are imported only by the server or tests. No answer-key files are served from `public/`.

The uploaded annual-review document's internal content already uses Persepolis Foods branding. It is presented as a fictional teaching case, not an official report. A reference to a real business in its source note is generalised in the website.

Important source issues are explicitly presented in the review's reconciliation supplement:

- The annual review reports 2025 profit of **£1,745m** and closing assets of **£24,000m**. It does not give 2024 opening assets. Do not calculate 2025 ROA using an invented opening balance.
- The revised matrix uses **forecast 2026 ROA of 8%**: £1,948m forecast profit / average assets of (£24,000m + £24,700m)/2 = 8%. The old £240m scenario is retired.
- Market share £600m/£5,000m remains a supplementary illustration. The emissions baseline of 500,000 tonnes comes from the annual review. Learning & Growth L1 now concerns external R&D partnerships; L2 concerns AI proficiency, with a linked 80% − 30% = 50 percentage-point calculation. The old certification task is retired.
- Each of the sixteen perspective/component groups contains eight options (3 correct + 5 incorrect), giving 128 total, 48 correct and 80 distractors. The attachment’s stale “nine options” header and “six distractors” Process footer do not override its actual eight rows or the user’s explicit instruction.
- The review says both “more than 70 markets” and “28 markets”; the scope needs instructor reconciliation.
- Vision selections and allowable causal links are editorial interpretations pending instructor review. Maps are hypotheses. Text explanations meet a length gate; this application does not claim automated semantic grading of student prose.
- The complete supplied bank is preserved; no generated distractors replace it. Targets remain fictional educational assumptions. `approved` defaults to false until an instructor reconciles the case.

## Instructor configuration and imports

Copy `.env.example` to `.env.local`, set a strong unique `INSTRUCTOR_PASSWORD` and a random stable `SESSION_SECRET` (for example generate one with `openssl rand -hex 32`), restart the server, then use `/instructor`. There is **no built-in instructor password**. Keep secrets out of Git. Instructor cookies are signed, HttpOnly, SameSite Lax, expire after eight hours and are Secure in production. Login attempts have a per-process throttle; use platform-level rate limiting for public production deployments.

Export the complete course from the authorised dashboard to obtain the exact import format. Edit and re-import it, or use:

```sh
npm run validate:content -- /path/to/course.json
```

The format includes `label`, `approved`, `settings`, `options`, `chains`, `calculations`, `vision`, `theory`, `causalLinks`, and `review`. Each option has:

```ts
{
  id: string;
  perspective: 'F' | 'C' | 'P' | 'L';
  component: 'O' | 'M' | 'T' | 'I';
  text: string;
  correct: boolean;
  chainId: string | null;
  primaryCategory: 'D1' /* through D26 */ | null;
  secondaryCategories: string[];
  explanation: string;
  feedback: string;
  evidence: string;
  calculationId?: string;
}
```

`chains` are `{id,perspective,options:[objectiveId,measureId,targetId,initiativeId]}`. Each correct option belongs to exactly one chain; each distractor has a diagnostic category and explanation. All D1–D26 codes are supported, including secondary categories. Students receive diagnostic relationship feedback, never complete keys.

`settings` defaults to `{mistakeLimit:3,passThreshold:0.75,chainPoints:20,cleanBonus:50,calculationPoints:10,assessmentPoints:10}`. Pass marks are rounded up to a whole question. Configure these in the structured editor. Changing settings/content changes its fingerprint and requires an authorised progress reset for existing authenticated sessions. Anonymous users can choose “Start updated demo mission” if their saved mission belongs to the old bank. Instructor-imported custom banks must also be updated to the 128-option format.

Calculations use `{id,chainId,title,formula,inputs,expected,tolerance,unit,kind?}`. `kind: "difference"` computes the first input minus the second for percentage-point changes. Otherwise, the current supported conventions are: `F-` calculations use net profit / mean(opening assets, closing assets) × 100; `P-` calculations use baseline × (1 − reduction proportion); other calculations use numerator / denominator × 100. Input insertion order follows those operands. Imports independently recompute expected results; formulas are explanatory text and are never executed. New mathematical conventions require an engine extension.

Annual-review upload accepts plain text or an array of `{title,body,table?:string[][]}` sections. DOCX conversion was performed during implementation; runtime DOCX parsing is not provided. The full course editor supports all question, explanation, mapping and causal-link changes. Authorised imports are all-or-nothing. Content and results stored on disk must remain outside public assets.

## Optional Supabase assessment

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and a stable `SESSION_SECRET` in server environment settings. Never use `NEXT_PUBLIC_` for any credential.
3. Create student accounts through your administrative account-provisioning process. The site supports sign-in, not public registration. Users sign in from the top-right student icon.
4. To authorise a Supabase instructor, set **app metadata**, not user-editable metadata: `{"role":"instructor"}` using an administrative API. Sign in through student access, then choose “Use existing instructor session” in the instructor workspace.
5. Deploy on HTTPS. Authentication tokens are held in HttpOnly cookies. Expired tokens require another sign-in; refresh-token rotation is not implemented.

The server verifies the user with Supabase `getUser` for every request. Progress comes from private Postgres tables; the browser cannot restore or mutate authenticated progress directly. Every game transition checks unlocking, completion, chains and calculations on the server. The service role remains server-only. RLS is enabled with no direct student/anonymous policies. A transaction-scoped advisory lock and expected-value compare-and-swap prevent concurrent progress overwrites across Node instances. Never expose the service-role key or the instructor export to students.

Supabase integration and schema are provided, but a live Supabase deployment was **not tested** because credentials were not supplied. Verify authentication, RLS, concurrent updates and instructor roles in your own staging project before assessed use. Optional services are disabled by default.

## Persistence, privacy and deployment

Anonymous mode mirrors progress to `localStorage` and a local server file. Local storage is tamperable and is **not suitable for secure summative assessment**. Anonymous certificates explicitly state that identity/progress are unverified. Names are optional. Authenticated mode rejects the demo-restore endpoint and derives all progress from server records.

Local demo state and instructor imports live in `.data/` (ignored), or `DATA_DIR`. Local file mode is intended for **one persistent Node process**. Use backups and a persistent volume for durable local teaching data. A browser may restore its anonymous progress after a restart. Do not use local files for distributed assessed cohorts.

### Vercel

Import this repository, select the Next.js preset, use `npm ci` / `npm run build`, and configure environment variables. Set `DATA_DIR=/tmp/persepolis-demo` for writeable demo scratch space. For durable instructor imports and authenticated cohorts, configure Supabase and apply its schema first. Ephemeral serverless files are not durable, and anonymous progress/certificates are demonstrations. Set a stable session secret across instances. No public deployment was performed by this task.

### Persistent Node server

Run `npm ci && npm run build`, then `npm start` behind an HTTPS reverse proxy. Persist `DATA_DIR`. Keep all service credentials in your host's secret manager. No extra external API is required for anonymous play. The application only needs npm registry access for installation, and the configured Supabase hostname for optional authentication/database requests.

## Architecture

- `src/lib/game-engine.ts`: pure state transitions and scoring.
- `src/lib/content-validation.ts`: Zod schema plus bank/calculation/mapping invariants.
- `src/lib/server.ts`: server-only content, cookie authorisation, persistence and redacted student responses.
- `src/app/api/`: game, auth, instructor and certificate endpoints.
- `src/components/`: responsive presentation, strategy boards, map, document viewer and dashboards.
- `tests/`: rules and import invariants; `e2e/`: browser play-through and security checks.
- `supabase/schema.sql`: private tables and atomic progress RPC.

Accessibility includes click alternatives to dragging, keyboard drag support, labelled controls, live feedback, visible focus, text statuses, reduced-motion support, a map text alternative and no mandatory timer. Manual assistive-technology testing remains advisable. The included DejaVu font license is in `public/fonts/LICENSE-DejaVu.txt`.

## Visual identity and design credit

Each room uses a distinct sapphire, gold, cyan, emerald, amethyst or copper palette. Text and option cards use larger type, opaque surfaces and stronger contrast. The opening screen, completion screen, footer and PDF certificate credit **Dr Masoud Keimasi** as the game designer for teaching purposes.

Photographs are configured in `src/lib/page-themes.ts`; each room can use one local image in `public/images/`. The six inline photo references were visible in chat but their original files were not available to download. Consequently no substitute or unverified remote image is currently embedded. See `docs/room-photographs.md` for the intended mapping. Wikimedia sourcing is pending access to `commons.wikimedia.org` and `upload.wikimedia.org` through the environment's supported network settings. Keep any required photographer/source/license attribution when adding sourced images.
