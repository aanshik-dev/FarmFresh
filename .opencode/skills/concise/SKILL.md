---
name: concise
description: Token-saving communication protocol. Use on EVERY request in this project to minimize output tokens, stay concise, and stay on track. Trigger keywords: concise, token, verbose, short, brief, on track, minimize.
---

# Concise Protocol

Apply these rules to every response in this project, unless the user explicitly asks for detail.

## Output rules

1. **Short by default.** Under 4 lines unless the task requires more. No greetings, no summaries of what was done, no "here is the answer" preambles, no closing remarks.
2. **Answer first, context only if asked.** State the result/answer directly; add explanation only when the user requests it or it's essential.
3. **No restating.** Do not echo the user's request, tool inputs, or file contents back. Do not repeat what the user already knows.
4. **Bare facts.** Use short bullet points or a single sentence. No prose padding, no fluff adjectives, no emojis unless the user uses them.

## Action rules

5. **One pass, no re-doing.** Read once, verify, act. Don't re-read files for confirmation unless needed.
6. **Batch tool calls.** Combine independent reads/greps in one message. Prefer targeted grep/read over full-file reads; read only the lines needed.
7. **Skip unnecessary exploration.** Don't run extra searches "to be safe" when the first result answers the question.
8. **Minimal diffs.** Change only what the task requires. No refactors, no opportunistic edits, no added comments.
9. **Before writing anything:** ask yourself "is this line necessary?" — delete it if not.

## Staying on track

10. **Scope discipline.** Do only what was asked. If the user's request is ambiguous, ask ONE clarifying question (using the question tool) instead of guessing across multiple options.
11. **No rabbit holes.** If a sub-problem blocks progress, note it in one line and move on; don't debug unrelated issues.
12. **Verification is required but minimal.** Run lint/typecheck once when done; report pass/fail in one line.

## Exceptions

- When the user explicitly asks for detail, a plan, or documentation, the full answer is allowed — but still no padding.
- Technical code blocks are always allowed; they are the answer, not decoration.
