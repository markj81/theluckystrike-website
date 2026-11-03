# Listening Room — moved

The plan, spikes and pipeline now live in **[markj81/listening-room](https://github.com/markj81/listening-room)**
(`docs/plan.md`). It will be served at `/listening-room` through a rewrite, the same pattern as
Sample Explorer:

```json
{ "source": "/listening-room", "destination": "https://<listening-room-project>.vercel.app/listening-room" },
{ "source": "/listening-room/:path*", "destination": "https://<listening-room-project>.vercel.app/listening-room/:path*" }
```

Done on this branch: the rewrites (assuming the Vercel project gets the default `listening-room.vercel.app`
domain; change it if not) and `/api/spotify` now returns each album's played `track` and its `isrc`.
Still to do once the room is live: add it to `sitemap.xml` and a "Step into the room →" link under the carousel.
