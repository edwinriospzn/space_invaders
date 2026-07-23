# Grammar Check Skill — Learning Summary

## What we built

A manual, project-scoped skill at `.claude/skills/grammar-check/SKILL.md` that
reviews English text for grammar, spelling, and phrasing issues and suggests
a corrected version.

## Why a skill (not a hook)

- A **hook** (`UserPromptSubmit`) would run automatically on every prompt you
  send — good for a passive habit-check, but adds latency/cost to every
  message and you didn't want that yet.
- A **skill** only runs when invoked by name (`/grammar-check`) or when your
  request clearly matches its description — better for learning how skills
  are structured before automating anything.

## How the skill works

- Frontmatter (`name`, `description`) tells Claude *when* to reach for it —
  either by explicit slash command or by matching your intent.
- The body is a set of instructions Claude follows when the skill fires:
  identify the text, list issues one by one with the fix, then give one
  corrected version at the end.

## Trigger conditions

1. Explicit: typing `/grammar-check <text>`.
2. Implicit: asking Claude to "check my grammar," "proofread this," etc.

## Known limitation hit during setup

The list of available skills is loaded once per session at startup. A skill
file created mid-session won't be callable via the `Skill` tool (or as a
slash command) until the session restarts.

## Next steps (not yet done)

- Restart the Claude Code session to pick up the new skill and test
  `/grammar-check` for real.
- If useful later, revisit the `UserPromptSubmit` hook idea for automatic,
  passive checking.
