---
name: Shipcheck
description: Reply to /shipcheck with a short implementation or review checklist for Framinator work.
emoji: "✅"
labels: ["review", "qa"]
on:
  slash_command:
    name: shipcheck
    events: [issues, issue_comment, pull_request, pull_request_comment]
  reaction: "eyes"
  status-comment: false
permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write
engine:
  model: mini
tools:
  github:
    mode: gh-proxy
    toolsets: [issues, pull_requests, repos]
safe-outputs:
  add-comment:
    max: 1
---

# Framinator Shipcheck

When someone writes `/shipcheck`, reply with a very short checklist that helps them ship or review the work with low cognitive load.

Use the triggering item and, if applicable, inspect the related pull request files and description.

## Output format

Write a Markdown comment with exactly these sections:

- `What changed`
- `Main risk`
- `Manual checks`
- `Ship verdict`

## Content rules

- `What changed` must be 2 bullets max
- `Main risk` must be 1 bullet
- `Manual checks` must be exactly 3 bullets
- `Ship verdict` must be one line choosing one of: `Looks safe`, `Needs a closer check`, or `Do not ship yet`

## Framinator-specific focus

Prioritize checks around:

- crop and framing correctness
- smart layout alignment
- export output quality
- mobile behavior
- persistence/autosave
- template-specific rendering differences

## Guardrails

- Keep the whole comment under 170 words
- Be concrete and product-focused
- Do not write a long review summary
- If the command is used on an issue rather than a PR, infer the likely manual checks from the feature request or bug report
