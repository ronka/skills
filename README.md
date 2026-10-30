# Ronka skills

Reusable agent skills, including the canonical skills bundled with the Zero to App mobile and web starters. `mobile-release` covers EAS releases, App Store Connect metadata, and store screenshot uploads.

Install an individual skill with:

```bash
npx skills add ronka/skills --skill mobile-release
```

Maintain full skill directories here. `setup` is a platform template for the Zero to App generator. The starters' `z2a` router remains local to that project. The `z2a` skill here is a public entry point: run it anywhere and it downloads the purchased web or mobile starter for you (or explains how to get access), then hands off to the starter's own router. Install it with `npx skills add ronka/skills --skill z2a`. Other skills, such as `execute-plan` and `roast-my-cv`, are independent and are not bundled into the starters.

After editing, committing, and pushing here, update Zero to App from its root:

```bash
npm run skills:update
```

This fetches the published skills, imports the manifest-listed directories, regenerates the starters, and runs tests. For committed local changes before pushing:

```bash
npm run skills:sync -- --repo /Users/ronkantor/Projects/ronka-skills
npm run generate
npm run test:templates
```

Review and commit the consumer snapshot/lock and push generated changes in affected starter repos. See the consumer's `templates/README.md` for previews, conflict handling, and changes to the bundled skill set.
