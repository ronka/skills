# Publishing record

Create or update `LAUNCH.md` in the user's project root. It belongs to that project, not the template generator. Preserve unrelated launch sections if the project already has this file.

```markdown
# Launch

## Web

- Requested outcome: public release / test deployment
- Provider: Vercel
- Account/scope and project ID:
- Intended environment:
- Source revision and uncommitted-change summary:
- CLI version:
- Last updated:

| Stage | Status | Evidence / next action |
| --- | --- | --- |
| Local checks | pending | |
| Project linked | pending | |
| Environment configured | pending | Names and target only |
| Deployment | pending | Deployment ID, URL and actual target |
| Application verification | pending | Screen/action observed and timestamp |
| Intended audience access | pending | Signed-out/public or protected preview |

### Attempts

- Timestamp, source revision, deployment ID/URL, result.

### Continue

- Blocker:
- Next action:
```

Use `pending`, `verified`, `failed`, or `needs-user-action`. A provider's build status and application verification are separate evidence. Describe browser/device observations as such, and distinguish them from user-reported checks. Store names, identifiers, safe URLs and short error summaries; exclude secret values, credential-bearing URLs, and raw provider logs.

On resume, inspect the recorded deployment. If the request timed out before an ID was captured, inspect recent deployments for the linked project and source before starting another. Record a fresh attempt when source/configuration changes. Never treat a Markdown checkbox as fresher evidence than the provider's actual state.
