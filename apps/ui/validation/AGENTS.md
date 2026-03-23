# apps/ui/validation AGENTS.md

Pure validation library (Zod + vitest). One validator per file, each
paired with a co-located test. The public surface is the `validation`
aggregator object exported from `index.ts`.

Parent rules: `apps/ui/AGENTS.md` and `/AGENTS.md`.

## Layout

```
validation/
├── email.ts         \
├── handle.ts         \
├── ip.ts              \
├── length.ts           > One validator + one test each.
├── phone.ts           /
├── url.ts            /
├── <validator>.ts   /
├── <validator>.test.ts
├── _test-utils.ts   Underscore prefix = test-internal, not part of the
│                    public surface; kept out of the barrel.
├── helpers.ts       Shared package internals.
└── index.ts         Barrel; exposes a single `validation` aggregator
                     object -- that's the call-site API.
```

## Validator contract

Every validator returns **`true | ZodError`**:

```ts
export function validateHandle(value: string): true | ZodError {
  return validate(handleSchema, value);
}
```

- The literal `true` (not the wider `boolean`) is intentional -- it
  narrows the failure branch to `ZodError` with a plain `result === true`
  check, with no `instanceof` import at the call site.
- **Empty input is not special-cased** -- the schema decides. An empty
  field surfaces as a `ZodError` whenever the regex/shape requires
  content. If a field's UX wants empty to mean "untyped, no error yet",
  the **consumer** owns that branch (gate on `value.length === 0` at the
  call site).
- `length` is the documented exception: empty passes when `min` is unset
  and fails as soon as `min` is supplied.
- Each validator file also exports its Zod schema (`handleSchema`, etc.)
  for callers composing with `z.object`, `safeParse`, etc.

## Validator file anatomy

- Block-level JSDoc covering: format, the rules in plain English, a
  worked example list (valid + invalid + the *why*), and notes on edge
  cases.
- The regex (if any) is a private `const` -- callers go through the
  schema and the `validate*` function so the regex can tighten without
  breaking downstream copy-paste.
- The schema's error message lists all the rules in one sentence rather
  than firing five different messages for a single typo.

## Tests (vitest)

- Co-located: `foo.ts` -> `foo.test.ts`.
- Use `it.each` for valid and invalid tables. Each invalid row carries a
  human-readable reason as its second tuple value -- it's reported in
  the test name and forces the suite to articulate *why* each input is
  invalid.
- Use `firstMessage(result)` from `_test-utils.ts` to assert error
  messages; it throws if the result is `true`, which surfaces test-setup
  mistakes rather than silently passing.

Run tests:

```bash
pnpm --filter ui test:run     # CI / one-shot
pnpm --filter ui test         # watch mode
```

Today `apps/ui/vitest.config.ts` only collects
`validation/**/*.test.ts`. If you add tests elsewhere in `apps/ui`
(components, core, views), broaden the `include` glob in the same
change.

## JSDoc requirements

Required throughout this directory -- both the validator files and the
barrel. Every file starts with a block-level JSDoc; every exported
symbol gets JSDoc; every type property is documented. For the
`validation` aggregator in `index.ts`, include a worked example in
fenced code blocks inside the JSDoc.

## Anti-patterns

- Don't short-circuit empty input to `true` inside a validator. Empty is
  a UX decision; it belongs at the call site.
