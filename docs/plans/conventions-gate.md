# Conventions Gate — Master Plan

AI-driven self-repair gate that enforces project conventions on every build.
Designed for AI agents, not humans — failures produce machine-readable fix instructions
so the AI can repair and retry without human involvement.

## Design (locked)

- **Strict fail, no bypass, no env-var skip.** Every violation blocks the build.
- **3-pass cap then escalate.** AI tries fix, re-runs, up to 3 attempts.
- **AI cannot edit convention docs without human approval.** Enforced by the meta-check.
- **Machine rules:** `tools/conventions.yaml` — source of truth for automation.
- **Human rules:** `docs/conventions/*.md` — tagged inline with rule IDs (e.g. `**R03**`).
- **Meta-check:** verifies every YAML rule ID appears in a doc and every doc rule ID appears in YAML. Sync drift = fail.
- **Scope:** convention conformance only. Not CWV metrics, not broken links, not Lighthouse.
- **Runs at:** pre-build inside `build.js` + CI pre-deploy.

## Escalation path (after 3 passes)

1. Exit code 2.
2. stderr: rule ID, file, issue, fixes attempted, last detection output.
3. Append structured entry to `docs/memory/escalations.jsonl`.
4. Update `docs/memory/next-actions.md` with broken state for next session.
5. Chat message to human: "Escalate this to the PM or CTO."

## Sessions

### Session 1 — Fix convention docs + delete ghost files

Goal: bring the convention docs into full alignment with reality before writing any rules.
No AI agent can enforce rules from a broken spec.

### Session 2 — Rule enumeration + detectors

- Extract every hard rule from the four convention docs into `tools/conventions.yaml`.
- Write `tools/check-conventions.js` — pure detector, no side effects, reads YAML.
- Run detectors in "report everything" mode → produce the full violation list.
- Output: machine-readable punch list for session 3.

### Session 3 — Cleanup sprint

- Fix every violation the detectors found.
- Heaviest item: fake SVG extraction (30+ files, ~18 MB base64 payloads).
  Needs a new one-off tool: `tools/unwrap-fake-svgs.js`.
- Re-run detectors until zero violations.

### Session 4 — Gate build + activation

- Write `tools/check-conventions-loop.js` (loop wrapper, 3-pass cap, escalation).
- Write `tools/test-fixtures/` (good/bad fixture set, one per rule).
- Write self-test mode — every bad fixture triggers its declared rule ID, every good fixture triggers none.
- Write meta-check (YAML ↔ docs sync validator).
- Wire the loop into `build.js` as first step.
- Flip to strict mode (fail-on-violation, no bypass).

---

## Doc priorities

All four convention docs must be audit-ready:
1. `docs/conventions/head-order.md` — defines step ordering
2. `docs/conventions/css-strategy.md` — defines CSS taxonomy
3. `docs/conventions/js-strategy.md` — defines JS rules
4. `docs/conventions/image-strategy.md` — defines image rules

Focus on clarity, accuracy, and alignment with build.js behavior.
