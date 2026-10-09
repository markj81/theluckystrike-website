# Sample Explorer — plan

A sample-lineage explorer at **theluckystrike.co.uk/sample-explorer**. Pick a track and
see what it sampled and what sampled it, then follow the chain as a graph you can explore.

## Decisions

| Area | Choice | Why |
|---|---|---|
| Hosting | Separate Vercel project and repo (`sample-explorer`), proxied through the portfolio with rewrites | Keeps the URL on your domain, lets it deploy on its own, and keeps the static portfolio simple |
| Stack | Next.js (App Router), TypeScript, `basePath: '/sample-explorer'` | Needs server routes to hold API tokens and cache results. `basePath` makes assets resolve behind the proxy |
| Lineage data | **Genius API** (primary), **MusicBrainz** (secondary/open) | WhoSampled has no public API and its ToS bans scraping. Genius `GET /songs/:id` returns `song_relationships` (`samples`, `sampled_in`, `interpolates`…). MusicBrainz has "samples material" recording relationships (CC0, 1 req/s) |
| Audio previews | Deezer track search (30s `preview` field, no auth) or iTunes Search API | Spotify removed `preview_url` and audio features for new apps in Nov 2024 |
| Cache | Next fetch cache to start, add Upstash Redis (Vercel Marketplace) if rate limits bite | Lineage data rarely changes, so cache it hard |
| Graph | d3-force on canvas | Fits the generative, flow-field feel of the portfolio hero |
| Design | Ink & Acid system: ink background, bone type, acid `#C8F542`, Instrument Serif/Sans, Geist Mono, hairlines | Reads as part of the portfolio rather than a separate product |

## Portfolio wiring (this repo — the only change here)

```json
"rewrites": [
  { "source": "/sample-explorer", "destination": "https://sample-explorer.vercel.app/sample-explorer" },
  { "source": "/sample-explorer/:path*", "destination": "https://sample-explorer.vercel.app/sample-explorer/:path*" }
]
```
Also: add it to `sitemap.xml` and link it from the portfolio, for example in a "Side projects" section.

## Phases

### Phase 0 — Data spike (half a day, do this before building anything)
- [x] Get a Genius API client token and check `song_relationships` coverage on 10 known tracks
- [x] Query MusicBrainz for the same 10 tracks and compare coverage
- [x] Confirm Deezer previews resolve from artist + title
- [x] **Go / no-go: GO** (2026-10-09)

**Spike results:**

| Track | Genius samples / sampled in | MusicBrainz sampled by | Deezer |
|---|---|---|---|
| Amen, Brother | 0 / 683 | 50 | ✓ |
| Think (About It) | 0 / 577 | 0 | ✓ |
| Funky Drummer | 0 / 338 | 8 | ✓ |
| Apache | 0 / 76 | 0 | ✓ |
| Ain't No Half-Steppin' | 6 / 73 | 3 | ✓ |
| One More Time | 1 / 52 | 0 | ✓ |
| Runaway | 4 / 51 (+32 interpolated by) | 0 | ✓ |
| Paid in Full | 3 / 51 | 0 | ✓ |
| Impeach the President | search matched an article | 59 | ✓ |
| Shook Ones, Part II | search matched the Everlast cover | 0 | ✓ |

- Genius has strong coverage. The two misses were search-matching problems, not missing data, so the search must filter by `primary_artist`.
- MusicBrainz shows zero forward ("samples") links on every track. Use it only as a fallback, or drop it for the MVP.
- Some tracks have hundreds of relationships (Amen: 683), so the graph needs pagination and clustering, not render-everything.

### Phase 1 — MVP: search → lineage
- [x] Scaffold the Next.js app with `basePath`, Ink & Acid tokens and fonts, and deploy to Vercel (`sample-explorer.vercel.app`)
- [ ] Add the portfolio rewrites and confirm `/sample-explorer` serves the app with assets loading (rewrites added on this branch; verify on the PR preview)
- [x] Search: `/search?q=` server-rendered page (cached Genius search) instead of a JSON API. Results are a pick-list, and Genius translation/editorial pages are filtered out
- [x] `getLineage(id)`: normalized `{ song, samples, sampledIn, interpolates, interpolatedBy }`, `use cache` for weeks
- [x] Track page: two columns, "Samples" and "Sampled in", with year, artist and preview play button (Deezer via `/api/preview` 302, one preview plays at a time)
- [ ] Shareable URLs: `/sample-explorer/track/[id]` works now; human-readable slug still to do

### Phase 2 — The graph
- [ ] Force-directed lineage graph: the chosen track in the centre, ancestors to the left, descendants to the right, with time as the x-axis
- [ ] Click a node to expand its relationships (fetched lazily, with a depth limit)
- [ ] Hover a node to start its preview; reduced motion shows a static layout
- [ ] Keyboard navigation and a list view as an accessible fallback to the graph

### Phase 3 — Polish & share
- [ ] Dynamic OG images per track ("X sampled Y")
- [ ] Curated starting points on the landing page: the most-sampled breaks
- [ ] Light/paper mode to match the portfolio
- [ ] Vercel Analytics

## Open questions
- ~~Repo~~ **Decided 2026-10-09:** new GitHub repo `markj81/sample-explorer`, its own Vercel project.
- Ties to yt-mpc: should there be a "send this sample to yt-mpc" deep link later?
- Credit and attribution: show "Data: Genius / MusicBrainz" in the footer, as their terms require

## Risks
- **Genius relationships are user-contributed**, so coverage is uneven and skews hip-hop. That's acceptable, but it's why Phase 0 comes first.
- **Rate limits:** the MusicBrainz limit is 1 req/s, so graph expansion needs caching and request queuing
- **Proxy gotchas:** without `basePath`, `/_next/*` assets 404 behind the rewrite. Test this early in Phase 1.

## Review
_(fill in after build)_
