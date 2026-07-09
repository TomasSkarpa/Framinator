---
name: Issue Triage
description: Classify new Framinator issues and ask only for the missing details that matter.
emoji: "📷"
labels: ["support", "triage"]
on:
  issues:
    types: [opened]
  reaction: "eyes"
permissions:
  contents: read
  issues: read
  copilot-requests: write
safe-outputs:
  add-labels:
    allowed: [bug, enhancement, question, documentation]
    max: 1
  add-comment:
    max: 1
---

# Triage Framinator Issues

When a new issue is opened, classify it and leave a compact reply that helps the maintainer reproduce or understand it quickly.

## Labeling

Choose exactly one label:

- `bug`
- `enhancement`
- `question`
- `documentation`

Hints:

- `bug` for broken crop behavior, layout glitches, export problems, rendering issues, persistence problems, mobile issues, or smart-layout failures
- `enhancement` for feature requests, UX improvements, new templates, editing controls, presets, or sharing ideas
- `question` for compatibility, usage, deployment, or "can it do X?" requests
- `documentation` for setup, deployment, smart-layout configuration, or missing docs

## Comment style

Write one compact comment with:

1. A short greeting using the author's username
2. A one-sentence summary of the problem or request
3. Up to two specific follow-up questions only if they help reproduction
4. One short line naming the likely area, such as `export`, `crop`, `smart layout`, `template`, `filters`, `mobile UX`, or `persistence`

## Guardrails

- Keep it under 130 words
- Prefer specific questions like device, browser, exact step, or template used
- Avoid generic support-script language
- If the issue is already clear, do not ask for more details
