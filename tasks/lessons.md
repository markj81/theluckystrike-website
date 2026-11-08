# Lessons

- **Check a PR is still open before pushing to its branch.** A follow-up commit (WeTravel in the logos list) went to the side projects PR branch after it had been merged, so it never reached main. Run `gh pr view <n> --json state` first; if merged, branch from `origin/main` and open a new PR. Don't call a change live until it's on main.
