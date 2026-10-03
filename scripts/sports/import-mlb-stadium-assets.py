#!/usr/bin/env python3
"""Import current MLB home-park photos from Wikimedia Commons as kiosk WebP assets.

This is an explicit, repeatable import step. It never hotlinks source images at
runtime and writes only optimized derivatives plus a source/attribution manifest.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public/kiosk/scenes/sports/mlb"
MANIFEST = ROOT / "docs/mlb-stadium-assets.json"
USER_AGENT = "CosmicOS-kiosk-assets/1.0 (local development)"
SKIP_WORDS = {"logo", "map", "diagram", "plan", "ticket", "rendering", "concept", "sign"}


def get_json(url: str):
    for attempt in range(4):
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 3:
                raise
            time.sleep(10 * (attempt + 1))


def slug(value: str) -> str:
    value = value.lower().replace("&", "and")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def commons_photo(search: str):
    time.sleep(2)
    query = urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrsearch": search,
        "gsrnamespace": 6,
        "gsrlimit": 10,
        "prop": "imageinfo",
        "iiprop": "url|mime|size|extmetadata",
        "iiurlwidth": 1600,
        "format": "json",
        "origin": "*",
    })
    data = get_json(f"https://commons.wikimedia.org/w/api.php?{query}")
    pages = list(data.get("query", {}).get("pages", {}).values())
    candidates = []
    for page in pages:
        info = (page.get("imageinfo") or [{}])[0]
        title = page.get("title", "")
        width, height = int(info.get("width", 0)), int(info.get("height", 0))
        mime = info.get("mime", "")
        words = set(re.findall(r"[a-z]+", title.lower()))
        if mime not in {"image/jpeg", "image/png"} or width < 700 or height < 400 or width < height:
            continue
        score = min(width, 2400) / 100
        score += 20 if width >= 1200 else 0
        score += 10 if width / max(height, 1) >= 1.45 else 0
        score -= 100 if words & SKIP_WORDS else 0
        candidates.append((score, info, page))
    if not candidates:
        return None
    _, info, page = sorted(candidates, key=lambda item: item[0], reverse=True)[0]
    metadata = info.get("extmetadata", {})
    return {
        "title": page.get("title"),
        "sourceUrl": info.get("thumburl") or info.get("url"),
        "descriptionUrl": info.get("descriptionurl"),
        "license": metadata.get("LicenseShortName", {}).get("value"),
        "artist": metadata.get("Artist", {}).get("value"),
        "width": info.get("width"),
        "height": info.get("height"),
    }


def main():
    teams = get_json("https://statsapi.mlb.com/api/v1/teams?sportId=1&hydrate=venue")["teams"]
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    with tempfile.TemporaryDirectory(prefix="cosmic-mlb-assets-") as temp_dir:
        temp = Path(temp_dir)
        for team in teams:
            venue = team.get("venue") or {}
            name = venue.get("name") or f"{team['name']} home park"
            park_slug = slug(name.replace("UNIQLO Field at ", "").replace("Daikin Park", "daikin-park"))
            search_names = [name]
            if "Dodger Stadium" in name:
                search_names.append("Dodger Stadium Los Angeles")
            photo = None
            for search_name in search_names:
                photo = commons_photo(f"{search_name} {team.get('locationName', '')}")
                if photo:
                    break
            record = {
                "team": team.get("abbreviation"),
                "teamId": str(team.get("id")),
                "venueId": str(venue.get("id")),
                "canonicalName": name,
                "city": team.get("locationName"),
                "slug": park_slug,
                "imagePath": f"/kiosk/scenes/sports/mlb/{park_slug}.webp",
                "aliases": [name, team.get("name"), team.get("teamName")],
                "status": "missing-source",
            }
            if photo:
                source = temp / f"{park_slug}.source"
                output = OUTPUT / f"{park_slug}.webp"
                request = urllib.request.Request(photo["sourceUrl"], headers={"User-Agent": USER_AGENT})
                for attempt in range(4):
                    try:
                        with urllib.request.urlopen(request, timeout=60) as response, source.open("wb") as handle:
                            shutil.copyfileobj(response, handle)
                        break
                    except urllib.error.HTTPError as error:
                        if error.code != 429 or attempt == 3:
                            raise
                        time.sleep(10 * (attempt + 1))
                subprocess.run(["node", "--input-type=module", "-e", "import sharp from 'sharp'; await sharp(process.argv[1]).resize(1280, 720, { fit: 'cover', position: 'centre' }).webp({ quality: 82 }).toFile(process.argv[2]);", str(source), str(output)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                record.update({"status": "imported", "source": photo})
            manifest.append(record)
            print(f"{record['team']} {name}: {record['status']}")
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"Imported {sum(item['status'] == 'imported' for item in manifest)}/{len(manifest)} stadium assets")


if __name__ == "__main__":
    main()
