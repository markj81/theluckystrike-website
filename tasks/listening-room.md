# Listening Room — moved

The plan, spikes and pipeline now live in **[markj81/listening-room](https://github.com/markj81/listening-room)**
(`docs/plan.md`). It will be served at `/listening-room` through a rewrite, the same pattern as
Sample Explorer:

```json
{ "source": "/listening-room", "destination": "https://<listening-room-project>.vercel.app/listening-room" },
{ "source": "/listening-room/:path*", "destination": "https://<listening-room-project>.vercel.app/listening-room/:path*" }
```

Still to do in this repo, once the app is deployed: add those rewrites, add it to `sitemap.xml`, and add a
"Step into the room →" link under the Spotify carousel. `/api/spotify` also needs to return each
track's ISRC so recently played tracks match Deezer previews exactly.
