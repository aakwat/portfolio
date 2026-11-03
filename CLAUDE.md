# CLAUDE.md

Rules for agents working in this repo. If a rule needs a paragraph to justify
itself, it is probably wrong.

## Working agreement

- Verify before claiming. Read the file, run the command, quote the output.
  Never report something as working that you have not seen work.
- Do not run builds, test suites or migrations unprompted. Name the command and
  let me run it.
- State the blast radius before editing: which files, which callers.
- Finish the task you were given. If you find a second problem, name it; do not
  silently widen scope.
- Ambiguity that changes the work is worth one question. Ambiguity that does not
  is worth a default and a sentence saying which you picked.
- Do not trust existing code or comments. They were right once.

## Comments

- One line. If it needs three, fix the code instead.
- Explain why, never what. `// increment i` is noise.
- One comment, one reason. Do not staple two unrelated facts together.
- Comment the non-obvious: a workaround, an ordering requirement, a constraint
  that is not visible locally, a deliberate omission.
- No commented-out code. Git remembers it.
- A stale comment is worse than none. Change it with the code or delete it.

## Commits

- One-line subject, imperative, no trailing period.
- No body unless the change is genuinely non-obvious. No trailers, no
  Co-Authored-By, no emoji.
- One logical change per commit. Use `git commit -- <path>` rather than sweeping
  in unrelated files.
- Never commit working-tree changes you did not make.

## Structure

- Single responsibility at every level: function, module, layer.
- No single large file. Split a file when it starts doing two things, not after
  it does four.
- Layer by layer. Dependencies point inward: the core knows nothing about
  transport, storage or frameworks.
- Module by module. A module exposes a small surface and hides the rest.
- Before adding an abstraction, say what breaks without it. One implementation
  needs no interface; a value that never changes needs no config.
- Deleting code is a valid change, and usually the better one.
- Shortest correct change in the right place. A small diff in the wrong place is
  a second bug.
- Re-think before you build: is this worth its own file, layer, or dependency?
  Most of the time the answer is no.

## TypeScript

### Types

- `strict: true`. If it is off, the type checker is decoration.
- No `any`. `unknown` at the boundary, then narrow. An `any` silently disables
  checking for everything it touches.
- No non-null `!`. If you know it is there, prove it with a check the compiler
  can see.
- Infer return types for local helpers; annotate them on exported functions, so
  a refactor cannot change a public signature by accident.
- Parse external data, do not cast it. `zod` at every edge: request bodies,
  env vars, third-party responses. A cast is a lie the compiler believes.

### Style

- Named exports. Default exports rename themselves at each import site.
- `const` by default; `let` only where reassignment is the point.
- Discriminated unions over optional-field soup. Make illegal states
  unrepresentable.
- Errors are values at boundaries you control; exceptions only for genuinely
  exceptional paths.

### Next.js / React

- Server Components by default. `"use client"` is opt-in, as low in the tree as
  possible — it is a boundary, and everything below it ships to the browser.
- Never import server-only code into a client component. Secrets leak that way.
- Data fetching belongs on the server. TanStack Query is for client state that
  mirrors the server, not a substitute for a server component.
- Keep components presentational. Business rules live in plain modules that do
  not import React and can be tested without a renderer.
- One component per file once a file holds more than a trivial pair.

### Structure

```
app/        routes; thin — parse, delegate, render
components/ presentational, no business rules
lib/        domain and use cases; no React, no Next imports
```

`lib/` importing from `app/` is the layering violation to watch for.
