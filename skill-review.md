# Skill Review — writing-great-skills audit

Each skill evaluated against the writing-great-skills framework: invocation, information hierarchy, steering (leading words, completion criteria), and pruning (duplication, no-ops, sediment, sprawl).

---

## 1. roast-my-cv

**Lines:** 278 | **Type:** steps + reference | **Invocation:** model-invoked

### Diagnosis: Sprawl + Duplication

The skill's biggest problem is **sprawl** — 278 lines, making it the longest skill in the repo. Much of that length comes from **duplication** between SKILL.md and `references/review-rubric.md`.

### Description

> "Review a resume against a target job description, ask targeted intake questions one by one, then score the fit and give concrete resume improvement guidance"

This is identity, not triggers. It describes what the skill *is*, not when to fire it. A model-facing description should front-load trigger phrasing.

**Suggested rewrite:**
> "Review or roast a resume against a job description. Use when the user provides a resume and JD for scoring, CV feedback, ATS keyword analysis, or resume rewriting."

### Duplication (critical)

1. **Scoring rubric appears twice.** SKILL.md §2 defines a weighted scoring model (Hard requirement match: 35 pts, etc.). `review-rubric.md` defines its own scoring dimensions (Role Alignment, Keyword and ATS Match, Evidence and Impact, etc.). These are two sources of truth for the same meaning — the agent must reconcile them every run, which hurts predictability.
   - **Fix:** Pick one. Keep the weighted model in SKILL.md (it's more precise), strip scoring from the rubric, or move scoring entirely to the rubric and point at it.

2. **Question strategy contradicts the skill.** `review-rubric.md` says "Only ask follow-up questions **after** giving the score." SKILL.md says intake comes **before** scoring. This is a direct conflict, not just duplication.
   - **Fix:** Remove the "Question Strategy" section from the rubric entirely — the skill's intake protocol supersedes it.

3. **Rewrite rules duplicated.** SKILL.md §3 and §4 cover rewrite guidance. The rubric's "Rewrite Rules" section says the same things ("Mirror JD language", "Convert responsibilities into achievements", "Normalize titles"). Two sources of truth.
   - **Fix:** Keep rewrite rules in SKILL.md only. Strip them from the rubric, or consolidate all rewrite guidance into the rubric and point at it from one place.

### Progressive disclosure opportunities

The **Output Format** section (lines 173-225) is ~50 lines of rigid formatting rules. Not every branch needs them — the agent knows markdown formatting. The intake mode vs final review mode templates could move to a disclosed `references/output-format.md`, keeping only a one-line pointer in SKILL.md.

The **Input Contract** example block (lines 12-31) is reference the agent needs once per invocation. It could be tightened to 3-4 lines.

### No-ops

- `"Always respond in English."` — No-op unless the user writes in another language, and even then the agent defaults to the user's language. If this is genuinely needed (Hebrew-speaking user), sharpen it: "Respond in English regardless of the user's language."
- `"Direct, professional, brief. No fluff, no encouragement padding, no sarcasm."` — Partially no-op. "No sarcasm" despite the skill name being "roast" — this tension is worth keeping. But "professional" and "brief" are defaults. Tighten to: "No encouragement padding. Despite the name, no sarcasm — direct critique only."
- `"Do not inflate the score to be polite."` — The weighted scoring model already handles this. The line is a no-op restating what the rubric enforces.

### Leading words

"Roast" is in the name but never appears in the body — a missed opportunity. The skill's leading word should be **intake** (the two-stage process that differentiates it) and it's used well. **Fit Score** is used consistently as an anchoring output term — good.

Consider using "roast" once in the body to connect the skill name to its behaviour: "The roast is the final review — direct, unsentimental, every bullet judged on evidence."

### Completion criteria

The intake stage has good criteria: "3 to 6 questions, stop early if evidence is strong." The final review's completion criterion is implicit in the output format — the format itself is the criterion. This works but could be stated: "The review is complete when the Fit Score, ATS keywords, and every improvable bullet have a rewrite."

---

## 2. app-version-debug

**Lines:** 62 | **Type:** steps | **Invocation:** model-invoked

### Diagnosis: Description bloat + Cross-skill duplication

The skill body is lean and well-structured. The problems are in the description and in overlap with expo-publish.

### Description

> "Add or update app version display and hidden debug menu in Expo/React Native settings screens. Use when adding a settings screen with version info, setting up version bump scripts for EAS builds/updates, adding a hidden debug menu (triple-tap to reveal), or when the user asks to add debug options, version display, or OTA update version tracking to their app. Triggers on settings screen, version display, debug menu, hidden menu, app version, UPDATE_VERSION, bump version."

Three problems:
1. **Trigger duplication.** "debug menu" / "hidden debug menu" / "hidden menu" / "debug options" are one branch written four times. "version display" / "version info" / "app version" are one branch written three times.
2. **Identity in description.** "Expo/React Native settings screens" belongs in the body. The description's job is triggers.
3. **"Triggers on..." list** is a raw keyword dump that duplicates the trigger phrases already written above it.

**Suggested rewrite:**
> "Add app version display and hidden debug menu to Expo React Native settings screens. Use when adding version info, a debug menu, UPDATE_VERSION tracking, or version bump scripts."

### Cross-skill duplication with expo-publish

The npm scripts block in §2 (`"update"`, `"build:production:ios"`, `"build:production:android"`) appears identically in expo-publish's Setup section. The `debug-menu-pattern.md` reference also repeats these scripts.

- **Fix:** Make one skill the single source of truth for npm scripts. Since expo-publish is the publishing skill, it should own the script definitions. app-version-debug should say "See expo-publish for the npm script wiring" or, if these skills can't invoke each other, extract the scripts into an **external reference** file both can point at.

### Duplication within the skill

The npm scripts appear in both SKILL.md §2 and `references/debug-menu-pattern.md` §"npm scripts pattern". Two sources of truth within the same skill.

- **Fix:** Remove the npm scripts section from `debug-menu-pattern.md` — it's not part of the debug menu pattern, it's part of the version bump setup.

### The skill is otherwise well-built

- Steps are clear and ordered (check → scripts → display → debug menu).
- Progressive disclosure is used correctly — the debug menu implementation lives in a reference file.
- Length is tight at 62 lines.
- Completion criteria are implicit but clear: the version displays and the debug menu works.

---

## 3. execute-plan

**Lines:** 128 | **Type:** steps + reference | **Invocation:** model-invoked

### Diagnosis: Solid structure, some no-ops

This is the most well-structured skill in the repo. The leading word "blocked" anchors behaviour effectively, the steps are ordered, and the completion criteria are explicit.

### Description

> "Execute a local Markdown plan file task by task in order, updating the plan file itself as progress is made so work can resume after interruptions. Use when the user says things like '/execute-plan @path-to-plan', asks to execute a plan from a file, continue a partially completed plan, or work through a Markdown task list and mark completed and blocked items in place."

Mostly good. One trim: "Use when the user says things like '/execute-plan @path-to-plan'" — the agent doesn't need an example of its own invocation syntax as a trigger. The trigger is the intent, not the exact command string.

**Suggested rewrite:**
> "Execute a local Markdown plan file task by task, updating it in place as progress is made. Use when asked to execute a plan from a file, continue a partially completed plan, or work through a Markdown task list."

### No-ops

- `"If a task appears to require destructive or high-risk actions, pause and ask before doing them"` — The system prompt already enforces this for all tools. Pure no-op.
- `"Keep edits minimal"`, `"Do not rewrite unrelated sections"`, `"Do not reformat the entire file"` — Three lines saying one thing. The Edit tool already operates on minimal diffs. Collapse to one line or delete: "Preserve the user's text — edit only status markers."
- `"Do not invent task structure that is not present"` — Likely no-op; the agent doesn't hallucinate markdown structure by default. But if you've observed this, keep it.

### Leading words

**Blocked** is an excellent leading word — it's used consistently, has a clear definition section, and anchors both the stopping behaviour and the progress-marking format. Well done.

Consider whether **resume** (as in "resume from where you left off") could be a second leading word, since the skill's distinguishing feature is resumability.

### Minor duplication

"If the path is missing or unreadable, ask for a valid local path before continuing" appears in Input and is implied by Core behavior step 1. One place is enough — keep it in Input, cut it from the implied re-statement.

### Completion criteria — strong

"Continue automatically until blocked" with five explicit blocking conditions is a sharp, checkable, exhaustive criterion. This is the gold standard in the repo.

---

## 4. expo-publish

**Lines:** 139 | **Type:** all reference | **Invocation:** model-invoked

### Diagnosis: Clean reference skill, minor sediment

This skill is all reference — a lookup table of workflows and commands. That's a legitimate shape for a skill (flat peer-set of workflows, each on one rung). It works well.

### Description

> "Guides publishing an Expo/EAS app — OTA updates, production builds (iOS/Android), store submission, and simulator builds. Use when the user says 'publish', 'release', 'submit to store', 'OTA update', 'build for production', 'build simulator', or runs any EAS build/submit/update workflow. Knows the project's npm scripts, version-bump logic, and correct command order."

Good trigger coverage. Two trims:
1. "Knows the project's npm scripts, version-bump logic, and correct command order" — identity, not trigger. Cut it.
2. "runs any EAS build/submit/update workflow" subsumes most of the individual triggers. Could collapse.

**Suggested rewrite:**
> "Guides Expo/EAS publishing — OTA updates, production builds, store submission, simulator builds. Use when the user says publish, release, submit, OTA update, build for production, or build simulator."

### Sediment: Setup section

The "Setup in a New Project" section (lines 99-116) duplicates the npm scripts and version-bump logic that the workflow sections already define. If the project is already set up (the common case), this section is dead weight every run. It's also duplicated in app-version-debug.

- **Fix:** Move "Setup in a New Project" to a disclosed reference file, or delete it if app-version-debug already handles project setup.

### Completion criteria

This skill has none — it's pure reference. That's fine for a lookup skill, but adding a light criterion would help: "The workflow is complete when the command finishes and the version bump is committed." The checklist at the bottom gestures at this but frames it as user pre-flight, not agent completion.

### No-ops

- The checklist items ("All changes committed and pushed", "Tested on a physical device or simulator") are reminders for the *user*, not instructions for the *agent*. They're not no-ops — they're misplaced. Either frame them as things the agent should verify/remind about, or cut them.

---

## 5. app-onboarding

**Lines:** 172 | **Type:** steps + reference | **Invocation:** model-invoked

### Diagnosis: Duplication between steps and checklist + disclosure opportunity

### Description

> "Design or review mobile app onboarding flows that convert cold installs into committed users. Use when creating onboarding screens, signup/trial/paywall sequences, review prompts, activation flows, first-run personalization, question banks, social proof placement, or when improving app conversion by making onboarding feel like a story rather than a feature tour."

Trigger duplication: "onboarding screens" / "activation flows" / "first-run personalization" are one branch (designing the onboarding). "signup/trial/paywall sequences" / "review prompts" are sub-elements of onboarding, not independent triggers.

**Suggested rewrite:**
> "Design mobile app onboarding flows that convert cold installs into committed users. Use when creating onboarding screens, signup/paywall sequences, or improving app conversion through story-driven onboarding."

### Leading words — strong

**Story** / **story arc** is an excellent leading word. It recruits the model's deep priors about narrative structure (intro, climax, conclusion) and anchors the entire skill's philosophy: onboarding is a story, not a feature tour. This is the skill's best asset.

**Commitment** is a second leading word used effectively — questions create commitment, not just personalization.

**Cold install** is evocative but used only once. Consider repeating it where relevant: "The user arrives from a cold install — anxious, hopeful, uncommitted."

### Duplication: Review Checklist vs Steps

The Review Checklist (lines 162-172) restates the design workflow:
- "The flow starts from the user's problem, not the app's feature list" — said in Core Principle (line 18).
- "Each question increases personalization, commitment, or both" — said in Step 3 (line 75).
- "Important answers are reflected back" — said in Step 4 (line 79).
- "The user receives at least one concrete value preview before a major ask" — said in Step 5 (line 95).
- "Signup, review, trial, and payment prompts happen after a value or commitment moment" — said in Step 6 (line 109).

The checklist duplicates the steps. It's meant to serve as a completion criterion, but it achieves that by repeating the skill.

- **Fix:** Replace the checklist with a single completion criterion: "The design is complete when every screen has a goal, copy, and story justification, and the flow follows the arc: problem → commitment → proof → ask." Then delete the redundant checklist items.

### Progressive disclosure: Example Patterns

The example patterns section (lines 129-158) — pregnancy tracker, car-to-car messaging — is inline reference that not every branch needs. If the user asks to *review* an existing onboarding flow, these examples are irrelevant.

- **Fix:** Move examples to `references/example-patterns.md` with a context pointer: "See [example patterns](references/example-patterns.md) when designing a new flow from scratch."

### No-ops

- `"Keep copy emotionally specific and concise."` — "concise" is a no-op (default behaviour). "Emotionally specific" is the load-bearing part. Tighten to: "Keep copy emotionally specific."
- `"Avoid feature-list language unless it directly supports the user's stated problem."` — Already implied by the entire Core Principle. Borderline no-op, but it's concrete enough to keep if you've seen the agent slip here.

---

## 6. rtl-layout

**Lines:** 201 | **Type:** all reference | **Invocation:** model-invoked

### Diagnosis: Triple duplication (rules → table → checklist) causing sprawl

### Description

> "Use when building or editing React Native layout/UI components in an RTL (right-to-left) app — e.g. Hebrew/Arabic apps. Provides an RTL utility module and guidelines for directional styles (flexDirection, textAlign, margins, borders, alignment) so mirrored layouts stay consistent. Triggers on tasks like 'create a component', 'build a screen layout', 'fix RTL', 'style this view', or any work touching flexDirection/textAlign/margin/padding-left/right in a React Native codebase that uses Hebrew, Arabic, Farsi, or otherwise forces RTL."

Problems:
1. "Provides an RTL utility module and guidelines for directional styles (flexDirection, textAlign, margins, borders, alignment) so mirrored layouts stay consistent" — pure identity. Cut it; the body handles this.
2. The trigger list at the end overlaps with the opening clause. "'create a component', 'build a screen layout'" are generic triggers that would fire on any component work — too broad.

**Suggested rewrite:**
> "RTL layout conventions and utilities for React Native. Use when building or editing directional styles (flexDirection, textAlign, margins, padding, positioning) in a Hebrew/Arabic/RTL app, fixing RTL bugs, or porting LTR components to RTL."

### Duplication: The triple layer (critical)

The same information appears three times in three formats:

1. **Rules 1-9** (lines 45-119) — the canonical reference. Each rule has a name, explanation, and code example.
2. **Quick decision table** (lines 123-133) — restates Rules 1-6 as a lookup table.
3. **Checklist** (lines 190-197) — restates Rules 1-7 as checkbox items.

This is textbook **duplication** — three sources of truth for one set of meanings. Every rule change requires three edits. The table and checklist inflate the skill by ~40 lines and amplify the rules' prominence past their real rank.

- **Fix:** Delete the quick decision table entirely — the rules themselves are already structured as a lookup (rule name → use this utility). Keep the checklist **only if** you reframe it as the **completion criterion** (see below), but strip the explanatory content from it — just the checks, pointing back at the rules.

**Tightened checklist (completion criterion):**
```
## Completion check
- [ ] No hardcoded `'row'`, `'left'`, `'right'` literals in new/changed styles
- [ ] No physical NativeWind classes (`ml-*`, `mr-*`, `text-left`, etc.)
- [ ] Directional icons mirrored or swapped
- [ ] `expo-localization` RTL flags confirmed
```

### Progressive disclosure: Reference component patterns

The reference patterns section (lines 137-186) shows three example components. These are useful when building a new component but irrelevant when fixing an RTL bug in an existing one.

- **Fix:** Move to `reference/example-patterns.md` (alongside `reference/rtl.ts`). Add a pointer: "See [example patterns](reference/example-patterns.md) for row, chat bubble, and header implementations."

### Progressive disclosure: Installation section

The installation section (lines 22-41) is ~20 lines of one-time setup. After the first run, it's dead weight.

- **Fix:** Move to `reference/installation.md`. Pointer: "If the project lacks `utils/rtl.ts`, see [installation](reference/installation.md)."

### No-ops

- `"Do not trigger for: non-directional styles (colors, fonts, opacity), backend code, or projects that are strictly LTR."` — This is in the body (line 18) but it's an invocation concern, not a runtime rule. The description handles when to trigger. If kept, move it to the description; otherwise delete.
- Rule 9's explanation of how `isRTL` derives from `I18nManager.isRTL` (lines 118-119) is implementation detail the agent doesn't need to *do* anything with — it's context for debugging. Could stay but is a candidate for disclosure.

### Leading words

**start** / **end** (semantic direction) are strong implicit leading words used throughout the rules. They recruit the model's understanding of logical vs physical direction — well chosen.

The API names (`rtlFlexDirection`, `rtlTextAlign`, `rtlMargin`, etc.) serve as anchoring tokens — the agent knows exactly which utility to reach for. This is effective.

---

## Cross-cutting issues

### 1. expo-publish ↔ app-version-debug: shared npm scripts

The npm scripts (`update`, `build:production:ios`, `build:production:android`) appear in both skills and in `debug-menu-pattern.md` — three sources of truth across two skills.

**Fix:** Create an **external reference** file (e.g. `shared/npm-scripts-reference.md`) that both skills point at. Or designate one skill as the owner and have the other reference it.

### 2. No user-invoked skills in the repo

Every skill is model-invoked. Some likely don't need to be:
- **execute-plan** — always fired by the user typing `/execute-plan`. A strong candidate for user-invoked (`disable-model-invocation: true`). Its description would save context load every turn.
- **expo-publish** — always fired by explicit user request ("publish", "build"). Could be user-invoked if you remember to invoke it.
- **app-version-debug** — only useful during specific setup work. Could be user-invoked.

This is a **context load** question. Six model-invoked descriptions compete for attention every turn. If three became user-invoked, the remaining three would fire more reliably.

If cognitive load of remembering them becomes an issue, add a **router skill** that lists them.

### 3. No skill uses `disable-model-invocation`

Related to above — consider which skills genuinely need autonomous discovery vs. which are always hand-invoked.

---

## Summary table

| Skill | Lines | Top issue | Second issue | Quick win |
|-------|-------|-----------|-------------|-----------|
| roast-my-cv | 278 | Scoring duplication (SKILL vs rubric) | Sprawl | Remove rubric's Question Strategy + scoring |
| app-version-debug | 62 | Description trigger duplication | Cross-skill npm script duplication | Trim description |
| execute-plan | 128 | No-ops (safety, edit rules) | Minor description bloat | Delete safety no-ops |
| expo-publish | 139 | Setup section = sediment | Missing completion criterion | Disclose setup section |
| app-onboarding | 172 | Checklist duplicates steps | Examples inline (sprawl) | Replace checklist with one-line criterion |
| rtl-layout | 201 | Triple duplication (rules/table/checklist) | Installation inline (sprawl) | Delete decision table, tighten checklist |
