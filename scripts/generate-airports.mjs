/**
 * Downloads OurAirports data and writes lib/airports/airports.json.
 * Run: node scripts/generate-airports.mjs
 *
 * Data source: https://ourairports.com/data/ (Public Domain)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "../lib/airports/airports.json");
const CSV_URL =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else current += c;
  }
  result.push(current);
  return result;
}

const res = await fetch(CSV_URL);
if (!res.ok) {
  throw new Error(`Failed to download airports.csv: ${res.status}`);
}

const text = await res.text();
const lines = text.split("\n");
const cols = parseCSVLine(lines[0]).map((c) => c.replace(/"/g, ""));
const idx = Object.fromEntries(cols.map((c, i) => [c, i]));

const airports = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const row = parseCSVLine(lines[i]);
  const iata = row[idx.iata_code]?.replace(/"/g, "");
  if (!iata || iata.length !== 3) continue;

  const type = row[idx.type]?.replace(/"/g, "");
  if (type === "closed" || type === "heliport" || type === "seaplane_base") {
    continue;
  }

  const lat = parseFloat(row[idx.latitude_deg]);
  const lng = parseFloat(row[idx.longitude_deg]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

  const keywords = row[idx.keywords]?.replace(/"/g, "");
  airports.push({
    iata,
    name: row[idx.name]?.replace(/"/g, ""),
    lat,
    lng,
    country: row[idx.iso_country]?.replace(/"/g, ""),
    ...(keywords ? { keywords } : {}),
    type,
  });
}

fs.writeFileSync(OUT_PATH, JSON.stringify(airports));
console.log(`Wrote ${airports.length} airports to ${OUT_PATH}`);
