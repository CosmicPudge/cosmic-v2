import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const teams = [
  { abbr: "LAA", id: 108 },
  { abbr: "ARI", id: 109 },
  { abbr: "BAL", id: 110 },
  { abbr: "BOS", id: 111 },
  { abbr: "CHC", id: 112 },
  { abbr: "CIN", id: 113 },
  { abbr: "CLE", id: 114 },
  { abbr: "COL", id: 115 },
  { abbr: "DET", id: 116 },
  { abbr: "HOU", id: 117 },
  { abbr: "KC", id: 118 },
  { abbr: "LAD", id: 119 },
  { abbr: "WSH", id: 120 },
  { abbr: "NYM", id: 121 },
  { abbr: "OAK", id: 133 },
  { abbr: "PIT", id: 134 },
  { abbr: "SD", id: 135 },
  { abbr: "SEA", id: 136 },
  { abbr: "SF", id: 137 },
  { abbr: "STL", id: 138 },
  { abbr: "TB", id: 139 },
  { abbr: "TEX", id: 140 },
  { abbr: "TOR", id: 141 },
  { abbr: "MIN", id: 142 },
  { abbr: "PHI", id: 143 },
  { abbr: "ATL", id: 144 },
  { abbr: "CWS", id: 145 },
  { abbr: "MIA", id: 146 },
  { abbr: "NYY", id: 147 },
  { abbr: "MIL", id: 158 }
];

const outputDir = path.join(process.cwd(), "public", "logos", "mlb");
fs.mkdirSync(outputDir, { recursive: true });

function download(url, destination) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(destination);
      res.pipe(file);

      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", reject);
  });
}

(async () => {
  for (const team of teams) {
    const destination = path.join(outputDir, `${team.abbr}.svg`);

    if (fs.existsSync(destination)) {
      console.log(`✓ ${team.abbr}`);
      continue;
    }

    const url =
      `https://www.mlbstatic.com/team-logos/${team.id}.svg`;

    console.log(`Downloading ${team.abbr}...`);

    try {
      await download(url, destination);
      console.log(`✓ ${team.abbr}`);
    } catch (err) {
      console.error(`✗ ${team.abbr}`);
    }
  }

  console.log("Done!");
})();