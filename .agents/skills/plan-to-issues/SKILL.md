---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Every issue carries the shape in "What every issue carries" below. Ask the human only
   about what it doesn't cover.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --label plan:<plan> --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## What every issue carries

Agreed with the human on the morning-digest plan (2026-11-01). The label is `plan:<plan>`,
from the plan's frontmatter (`plan: morning-digest` → `plan:morning-digest`); create it once
if the repo lacks it. The body opens with the source line, which the reviewer sorts by:

```md
Source: plan.md § <n>

## Scope
<what to build, from the plan section; constraints that bind it>

## Done when
<the section's done condition, checkable>

## Blocked by
<#n, or —. When the issue can start before its done condition can hold, say both:
"#1 (to start). Done when also needs #2.">
```

One plan section can be several issues when part of it unblocks others (§ 1 of
morning-digest: types first, reader second). Each keeps the same `Source:` line.

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
