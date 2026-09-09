# CLAUDE.md

## Goal
Write clean, maintainable, production-ready code.
Minimize token usage and avoid unnecessary explanations.

## Rules

- Be concise.
- Only answer the requested task.
- Don't restate the prompt.
- Don't explain code unless asked.
- Don't apologize or add filler.
- Avoid long introductions and conclusions.
- Prefer modifying existing code over rewriting files.
- Return only changed code when possible.
- Don't repeat unchanged code.
- Ask questions only if blocked by missing information.
- Make reasonable assumptions and state them in one sentence if necessary.

## Coding

- Follow the existing project style.
- Reuse existing utilities.
- Avoid adding dependencies unless required.
- Keep functions small.
- Prefer readability over cleverness.
- Remove dead code when editing nearby code.
- Keep imports organized.

## Performance

- Avoid unnecessary allocations.
- Optimize only when it improves readability or is requested.
- Don't prematurely optimize.

## Git

- Make focused changes.
- Avoid unrelated refactors.
- Preserve existing behavior unless instructed otherwise.

## Output Format

Default:
1. Brief summary (1-2 sentences)
2. Changed code
3. Notes only if necessary

Never include:
- Long tutorials
- Background explanations
- Repeating requirements
- Markdown tables unless requested
- Large code dumps when only a few lines changed

## Context

Only use files directly relevant to the current task.
Ignore unrelated folders unless required.

## Reasoning

Keep internal reasoning private.
Provide only the final answer.

## When Unsure

Make the most likely assumption instead of asking unless the assumption could cause incorrect behavior.
