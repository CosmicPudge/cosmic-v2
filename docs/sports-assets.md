# Sports asset provenance

| League | Source | Retrieved | Local directory | Notes |
| --- | --- | --- | --- | --- |
| MLB | [MLB Stats API](https://statsapi.mlb.com/) identity IDs and existing repository assets | 2026-09-05 | `public/logos/mlb/` | Existing transparent SVGs retained. |
| NFL | [ESPN teams API](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard) identity data and [ESPN CDN](https://a.espncdn.com/i/teamlogos/nfl/500/) assets | 2026-09-05 | `public/sports/nfl/logos/` | Local PNGs; runtime never hotlinks the CDN. |
| College Football | [ESPN college-football team catalog](https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=900) identity data and approved [ESPN CDN](https://a.espncdn.com/i/teamlogos/ncaa/500/) assets | 2026-09-05 | `public/sports/cfb/teams/` | 760 active catalog entries were captured; 669 valid image assets were added locally. ESPN supplied no valid logo for 91 entries, which remain metadata-backed and use a safe initials fallback. |
| F1 | [Jolpica F1](https://github.com/jolpica/jolpica-f1) circuit IDs plus [f1-circuits-svg](https://github.com/julesr0y/f1-circuits-svg) CC-BY-4.0 layouts | 2026-09-05 | `public/sports/tracks/f1/` | Curated Monza, Marina Bay, and Austin outlines; unknown circuits remain text-only. |
| NASCAR | [NASCAR schedule metadata](https://feed.nascar.com/swagger/ui/index) plus [RaceTracksAPI](https://github.com/LigasAVBrasil/RaceTracksAPI) original SVG layouts | 2026-09-05 | `public/sports/tracks/nascar/` | Curated Daytona tri-oval/road and COTA NASCAR layouts; unknown configurations remain text-only. |

The CFB catalog and local manifest are generated with `npx tsx scripts/sports/sync-cfb-teams.ts`. The sync validates HTTPS, the `a.espncdn.com` host, image content type, and a 512 KiB per-file limit; it never deletes existing files implicitly. Sources are recorded for engineering provenance only; this file does not establish a license or other legal authorization. Assets are not remote runtime dependencies. The track SVGs are curated from the source repositories above; they are not generated or approximated by Cosmic.
