---
name: grammar-check
description: Check a piece of English text (usually your own prompt draft) for grammar, spelling, and phrasing issues, and suggest a corrected version. Use when the user asks to check grammar, proofread a message, or fix their English.
---

# Grammar Check

Review the text the user provides (or, if none is given, the text of their
most recent message in this conversation) for English grammar, spelling,
punctuation, and awkward phrasing.

## Steps

1. Identify the text to check:
   - If the user passed text as an argument, use that.
   - Otherwise, use their most recent chat message.
2. List each issue found, in order of appearance:
   - Quote the problematic phrase.
   - Say what's wrong (grammar rule, spelling, word choice, etc.) in one short line.
   - Give the fix.
3. Provide one clean, corrected version of the full text at the end.
4. If there are no errors, say so plainly — don't invent issues.

Keep the tone plain and instructive, like a quick proofreading pass, not a
lecture. Do not rewrite the user's intent or style beyond fixing actual
errors.
