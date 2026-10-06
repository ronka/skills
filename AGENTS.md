# Canonical skills

This repository is the source of truth for skills shared with Zero to App. Edit skill directories here, including references, scripts, assets, and frontmatter. `mobile-release` replaces `expo-publish`. Skills not used by Zero to App remain independently maintained. `skill-review.md` is a historical review and may refer to retired names.

`setup/SKILL.md.tmpl` and `setup/agents/openai.yaml.tmpl` are platform templates consumed by Zero to App's generator. Keep mobile/web conditional markers on their own lines. The `z2a` router lives only in the Zero to App project and must not be added here.

After committing changes, validate their consumer from `/Users/ronkantor/Projects/zero-to-saas`: run `npm run skills:sync -- --repo /Users/ronkantor/Projects/ronka-skills`, `npm run generate`, and `npm run test:templates`. When a skill is added, renamed, or removed from a starter, update `templates/skills.json` and the corresponding platform block in `templates/sources/skills/z2a/SKILL.md.tmpl` in that project. Commit and push generated changes in the affected starter repositories. Push this repo before using the consumer's default `npm run skills:update`, which reads GitHub main.

The generic version helper scripts live in `app-version-update/scripts`; Zero to App copies those into the mobile starter root. `mobile-release/scripts` retains its older-layout bump variants and includes its required commit helper.
