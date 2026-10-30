---
name: z2a
description: Single entry point for Zero to App. Inside a Zero to App starter it hands the request to the starter's own z2a router. Anywhere else it picks the web or mobile starter from the request, downloads it for the user, and continues building. Run explicitly with $z2a in Codex or /z2a in Claude Code, followed by what you want.
---

# z2a

Everything the user wrote after `/z2a` or `$z2a` is the request. Users of this skill are often not technical: do all git and GitHub work yourself, never ask them to copy or run commands, and avoid jargon. Reply in the language the user writes in.

## 1. Already inside a starter?

Find the repository root with `git rev-parse --show-toplevel`. The current folder is a Zero to App starter when either is true:

- `git remote -v` points at `hightechguide/starter-web` or `hightechguide/starter-mobile`.
- The root has `SETUP.md` starting with `# Zero to App setup` and a `z2a` router at `.claude/skills/z2a/SKILL.md` or `.agents/skills/z2a/SKILL.md`.

If it is, open that starter's router (`.claude/skills/z2a/SKILL.md` in Claude Code, `.agents/skills/z2a/SKILL.md` in Codex), follow it in full with the whole request, and stop here. Its routing replaces everything below.

## 2. Choose web or mobile

- Mobile (`starter-mobile`): an iPhone or Android app, App Store, Google Play, Expo, or an app people install on their phone.
- Web (`starter-web`): a website, landing page, web app, online store, course or digital product sold online, or something opened in a browser.
- Unclear: ask one short question with the question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex), such as "Should this be a phone app or a website?". Do not guess.

## 3. Download the starter

If a subfolder of the current folder is already a starter for the chosen platform from an earlier run (same rules as step 1), skip to step 5 with that folder.

1. Check that `git` is installed. If it is missing, explain that a free tool called Git is needed, give the simplest install for their system (macOS: run `xcode-select --install` for them and say a window will ask to install; Windows: https://git-scm.com/download/win; Linux: the system package manager), and continue once it is installed.
2. Prefer the GitHub CLI. If `gh` is installed, check `gh auth status`. If they are not signed in, run `gh auth login --web --git-protocol https` for them and explain that a browser page will open to sign in to GitHub with the account they connected on the Zero to App site. If `gh` is missing, install it for them when that is simple (`brew install gh` on macOS with Homebrew, `winget install GitHub.cli` on Windows) and sign in the same way. Otherwise use plain `git` with `GIT_TERMINAL_PROMPT=0` so it cannot hang on a hidden password prompt; then a failed clone means sign-in or access is missing.
3. Choose a folder name: a short lowercase English name for the product, such as `haircut-booking`, falling back to `my-app` or `my-site`. Create it in the current folder. If the current folder is inside another git project, create it next to that project instead. If the name is taken, add `-2`, `-3`, and so on.
4. Clone: `gh repo clone hightechguide/starter-<web|mobile> <folder>`, or `git clone https://github.com/hightechguide/starter-<web|mobile>.git <folder>` without `gh`.
5. If the clone fails with "not found", "repository not found", 403, or 404 and `gh` is signed in, check `gh api user/repository_invitations` for an invitation to that repository. If one exists, tell the user their access invitation is waiting, accept it with `gh api -X PATCH user/repository_invitations/<id>`, and clone again.

Any other failure caused by missing access goes to step 4. Network or disk errors are not access problems: explain them plainly and retry.

## 4. No access yet

The starters are private and come with a Zero to App purchase. Stop and explain, in plain words and in the user's language, without git output:

- Not bought yet: the ready-made starter for this project comes with Zero to App. Get it at https://zerotoapp.co.il, then run `/z2a` again with the same request.
- Already bought: sign in at https://zerotoapp.co.il/access with the purchase email, press the button to connect GitHub, and accept the access it grants. Then run `/z2a` again. If they are signed in to GitHub here with a different account than the one they connected, name the account `gh api user --jq .login` reports and say to use the same one in both places.

Do not try other ways to get the code.

## 5. Continue the request

1. Move into the new folder and work from there for the rest of the session.
2. The starter ships its own skills in `.claude/skills` and `.agents/skills`, including its own `z2a` router, `setup`, and every integration skill. Nothing else needs installing. Open the starter's router (`.claude/skills/z2a/SKILL.md` in Claude Code, `.agents/skills/z2a/SKILL.md` in Codex) and follow it in full with the original request. It starts `setup` on a fresh starter.
3. When you finish, tell the user in one line where the project folder is, and that next time they can open that folder and type `/z2a` with what they want next.
