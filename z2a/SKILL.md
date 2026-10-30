---
name: z2a
description: Single entry point for Zero to App. Inside a Zero to App starter it hands the request to the starter's own z2a router. Anywhere else it picks the web or mobile starter from the request, downloads it for the user, and continues building. Run explicitly with $z2a in Codex or /z2a in Claude Code, followed by what you want.
disable-model-invocation: true
---

# z2a

Everything the user wrote after `/z2a` or `$z2a` is the request. Users of this skill are often not technical: do all git and GitHub work yourself, never ask them to copy or run commands, and avoid jargon. Reply in the language the user writes in.

This skill is often installed globally, and a global skill wins over a starter's own `z2a` with the same name. So this file may run even inside a starter. Whenever you work in an existing starter, in the current folder or a subfolder, always defer to that starter's own router file and never route the request yourself. "Follow the router" below means: open `.claude/skills/z2a/SKILL.md` in Claude Code or `.agents/skills/z2a/SKILL.md` in Codex, at that starter's root, and follow it in full with the whole request.

A folder is a Zero to App starter when its root has `SETUP.md` starting with `# Zero to App setup` and a router at `.claude/skills/z2a/SKILL.md` or `.agents/skills/z2a/SKILL.md`, or when its `git remote -v` points at `hightechguide/starter-web` or `hightechguide/starter-mobile`.

## 1. Is there already a starter?

1. Find the repository root with `git rev-parse --show-toplevel`. If it is a starter, follow the router from that root and stop here. Its routing replaces everything below.
2. Otherwise check the immediate subfolders of the current folder for starters.
   - Exactly one, and it is either unfinished (`SETUP.md` says `Status: in-progress`) or the request is about that existing product: move into it and go to step 5.
   - Several, or a finished one (`Status: complete`) while the request sounds like a new product: ask one short question with the question tool, naming the folders: continue one of them (go to step 5 with that folder) or start a new product (go to step 2). Never put a new product into a finished one.
   - None: go to step 2.

## 2. Choose web or mobile

- Mobile (`starter-mobile`): an iPhone or Android app, App Store, Google Play, Expo, or an app people install on their phone.
- Web (`starter-web`): a website, landing page, web app, online store, course or digital product sold online, or something opened in a browser.
- Unclear: ask one short question with the question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex), such as "Should this be a phone app or a website?". Do not guess.

## 3. Download the starter

1. Check that `git` is installed. If it is missing, explain that a free tool called Git is needed, give the simplest install for their system (macOS: run `xcode-select --install` for them and say a window will ask to install; Windows: https://git-scm.com/download/win; Linux: the system package manager), and continue once it is installed.
2. Prefer the GitHub CLI. If `gh` is installed, check `gh auth status`. If they are not signed in, sign them in with `gh auth login --web --hostname github.com --git-protocol https`. They cannot see command output while it runs, so start it in the background (or with output going to a file), read its output for the one-time code and the `https://github.com/login/device` link, and tell them both in plain words: a browser page opens, they enter that code, and sign in with the GitHub account they connected on the Zero to App site. Wait for the command to finish, then check `gh auth status` again. If `gh` is missing, install it for them when that is simple (`brew install gh` on macOS with Homebrew, `winget install GitHub.cli` on Windows) and sign in the same way. On Windows a freshly installed `gh` is not found in the same terminal: run it by its full path (usually `C:\Program Files\GitHub CLI\gh.exe`) or from a new terminal. Otherwise use plain `git` with `GIT_TERMINAL_PROMPT=0` so it cannot hang on a hidden password prompt; then a failed clone means sign-in or access is missing.
3. Choose a folder name: a short lowercase English name for the product, such as `haircut-booking`, falling back to `my-app` or `my-site`. Create it inside the current folder, even when the current folder is itself a git project, so it stays where the coding tool is allowed to work. If the name is taken, add `-2`, `-3`, and so on. Never delete or overwrite an existing folder.
4. Clone: `gh repo clone hightechguide/starter-<web|mobile> <folder>`, or `git clone https://github.com/hightechguide/starter-<web|mobile>.git <folder>` without `gh`.
5. If the clone fails with "not found", "repository not found", 403, or 404 and `gh` is signed in, check `gh api user/repository_invitations` for an invitation to that exact repository. If one exists, tell the user their access invitation is waiting, accept it with `gh api -X PATCH user/repository_invitations/<id>`, and clone again.

Any other failure caused by missing access goes to step 4. Network or disk errors are not access problems: explain them plainly and retry.

## 4. No access yet

The starters are private and come with a Zero to App purchase. You cannot tell whether this person has bought it, so give both options. Stop and explain, in plain words and in the user's language, without git output:

- Not bought yet: the ready-made starter for this project comes with Zero to App. Get it at https://zerotoapp.co.il, then run `/z2a` again with the same request.
- Already bought: sign in at https://zerotoapp.co.il/access with the purchase email, press the button to connect GitHub, and accept the access it grants. Then run `/z2a` again. If they are signed in to GitHub here with a different account than the one they connected, name the account `gh api user --jq .login` reports and say to use the same one in both places.

Do not try other ways to get the code.

## 5. Continue the request

1. Move into the starter folder and work from there for the rest of the session.
2. This session started outside the starter, so the coding tool did not load its instructions. Read the starter's `AGENTS.md` and `CLAUDE.md` now and follow them for the rest of the session. Note that `.claude/settings.json`, when present, only takes effect when the coding tool is opened inside the folder.
3. The starter ships its own skills in `.claude/skills` and `.agents/skills`, including its own `z2a` router, `setup`, and every integration skill. Nothing else needs installing. Follow the router with the original request. It starts `setup` on a fresh starter.
4. When you finish, tell the user in plain words, in their language, where the project folder is, and that from now on they should open their coding tool inside that folder and keep typing `/z2a` with what they want next.
