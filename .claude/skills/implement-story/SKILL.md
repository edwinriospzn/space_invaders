---
name: implement-story
description: Implement a sprint/story-formatted task spec (Goal, Files to create/edit, Responsibilities, Constraints, Acceptance criteria, Commit message) exactly as written, then propose the given commit message. Use when the user pastes a story ticket like "Story X.Y — <title>" and asks to implement it.
---

# Implement Story

Read the pasted story spec and implement it literally — these tickets are
already fully specified; the job is faithful execution, not redesign.

## Steps

1. Parse the spec sections: Goal, Files to create/edit, Responsibilities /
   Steps, Constraints, Expected usage, Acceptance criteria, Commit message.
2. Check current repo state for anything the spec assumes (e.g. a file that
   should already exist from a prior story, an import that should already be
   there). Read those files before editing.
3. Implement exactly what's described:
   - Create/edit only the files listed under "Files".
   - Follow "Responsibilities"/"Steps" precisely — don't add methods, error
     handling, or abstractions beyond what's asked.
   - Treat "Constraints" as hard rules (e.g. "do NOT import X", "must not
     access Y") — verify the final code respects each one before reporting
     done.
   - If "Expected usage" is given, sanity-check the implementation against it
     mentally (or by running it) rather than assuming it fits.
4. Verify each "Acceptance criteria" bullet is actually true of the current
   diff (e.g. "no scene modifications" — confirm no scene file was touched).
5. Do not commit unless the user explicitly asks. If they do ask, use the
   exact commit message given in the spec (the "Commit" section), verbatim.
6. Report back concisely: what was created/changed, and confirmation that
   constraints/acceptance criteria hold. Flag anything the spec didn't cover
   but the current code needed (e.g. a missing import) as a deviation, not a
   silent addition.
