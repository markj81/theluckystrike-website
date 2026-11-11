---
name: blog-post-sync
description: After every deployment of a project that has a companion blog post, decide whether the post needs updating and, if it does, update it, refresh any screenshots that no longer match, and deploy the blog. Use right after pushing or deploying a project (a push to its deploy branch or main), when the user asks to "update the blog", or at the end of a batch of shipped changes. Works for any project whose CLAUDE.md names a blog post, or whose post can be found on the blog site.
---

# Blog post sync

Every deployment of a project with a write-up ends with one question: **does the post still tell the truth?**
Answer it, act on it, and say in one line what you decided.

## 1. Find the post

In order, stop at the first hit:
1. The project's `CLAUDE.md`: a line like `Blog post: <repo>/<path>` (for example `theluckystrike-website/writing/listening-room.html`).
2. The blog repo: search the posts for the project's live URL or name (`grep -rl "<live-url-or-name>" writing/`).
3. Ask the user once, then add the `Blog post:` line to the project's `CLAUDE.md` so you never have to ask again.

If the blog repo isn't in the session, attach it (add_repo or clone) before going further. Pull its deploy branch first.

## 2. Decide if it's needed

List what shipped since the post last changed:
```bash
since=$(git -C <blog-repo> log -1 --format=%ci -- <post-path>)
git -C <project-repo> log --since="$since" --format='%h %s'
```
Then judge each change against the post as written (read the post; don't go from memory):

| Update the post | Leave it (batch for later) |
|---|---|
| A feature visitors can see or use was added, removed or renamed | Internal refactors, tests, tooling |
| The post now describes something that's gone or works differently (controls, keys, buttons, panels) | A few pixels of spacing, colour tweaks |
| A screenshot in the post no longer matches the live product | A fix that only restores what the post already says |
| A bug with a story worth telling (what you saw, the real cause, the fix) | Reverts, typo fixes, version bumps |
| A change in approach the post discusses (design decisions, how it was prompted or built) | |

If nothing qualifies, stop and say: **"Blog: no update needed (only <reason>)."** Don't touch the post.

## 3. Update it

- **Fix what's now false first.** Search the post for every control, key, panel and feature you changed or removed, and correct each mention, including image `alt` text and captions.
- **Add only what a reader would care about.** Extend existing lists and tables (a feature list, a "what broke" table, stats) rather than adding new sections. Add a section only for a genuinely new idea.
- **Keep the author's voice.** Match the post's tone, sentence length, spelling (British or American) and punctuation. Short, concrete, no hype. Quote the user's real prompts verbatim, typos included, if the post does that.
- **Never** put model names or IDs in the post.
- **Screenshots:** if an image shows UI that changed, retake it from the **live** site at the same size and crop, save it over the same filename in the same format (for example webp, quality about 82), and keep `width`/`height` attributes correct. Wait for animations and camera moves to finish before capturing. Look at every new image before using it.
- **Stats** (counts, totals): update only those you can verify; otherwise leave them.

## 4. Check and ship

1. Screenshot the edited parts of the post (a local static server or the built page) and look at them: no broken layout, images load.
2. Commit in the blog repo with a message like `<Project> post: <what changed>`, using the session's commit attribution.
3. Push the way the blog repo deploys (its branch rules in its CLAUDE.md or the session's git instructions). Then confirm the live page contains the new text (`curl -s <post-url>?x=$RANDOM | grep -c "<new phrase>"`).
4. Report in one or two lines: what you changed in the post and which images you replaced, or why no update was needed.

## Don't

- Don't update the post before the deployment itself is verified live.
- Don't rewrite sections that are still true just to freshen them.
- Don't let the post describe unreleased or half-finished work.
