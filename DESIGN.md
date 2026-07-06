# The Best Gel for 4C Type Natural Hair (In

## Mission
Create implementation-ready, token-driven UI guidance for The Best Gel for 4C Type Natural Hair (In that is optimized for consistency, accessibility, and fast delivery across marketing site.

## Brand
- Product/brand: The Best Gel for 4C Type Natural Hair (In
- URL: https://www.finefitbody.com/blog/the-best-gel-for-4c-type-natural-hair-in-depth-review
- Audience: readers and knowledge seekers
- Product surface: marketing site

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Main font style: `font.family.primary=halyard-text`, `font.family.stack=halyard-text`, `font.size.base=18.0488px`, `font.weight.base=300`, `font.lineHeight.base=28.8781px`
- Typography scale: `font.size.xs=11.9px`, `font.size.sm=13.95px`, `font.size.md=16px`, `font.size.lg=18.05px`, `font.size.xl=20.1px`, `font.size.2xl=26.24px`, `font.size.3xl=48.78px`, `font.size.4xl=56.98px`
- Color palette: `color.text.primary=#310a31`, `color.text.secondary=#ffffff`, `color.border.strong=#ce4760`, `color.surface.base=#000000`, `color.surface.strong=#f7f8fd`
- Spacing scale: `space.1=1.8px`, `space.2=8.33px`, `space.3=9.02px`, `space.4=13.91px`, `space.5=14.07px`, `space.6=16px`, `space.7=22.4px`, `space.8=23.49px`
- Radius/shadow/motion tokens: `motion.duration.instant=100ms`, `motion.duration.fast=300ms`, `motion.duration.normal=400ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (54), lists (23), buttons (12), navigation (5), cards (3), inputs (2).

- Extraction diagnostics: Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
