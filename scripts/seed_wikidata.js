/**
 * scripts/seed_wikidata.js
 *
 * Fetches Israeli monuments and memorials from the Wikidata SPARQL endpoint
 * and upserts them into the Supabase `memorial_sites` table.
 *
 * ─── One-time Supabase SQL setup (run once in SQL Editor) ────────────────────
 *
 *  1. Add the dedup column:
 *       ALTER TABLE memorial_sites
 *         ADD COLUMN IF NOT EXISTS wikidata_id TEXT UNIQUE;
 *
 *  2. Sync the ID sequence if existing rows were inserted with explicit IDs:
 *       SELECT setval(
 *         pg_get_serial_sequence('memorial_sites', 'id'),
 *         COALESCE((SELECT MAX(id) FROM memorial_sites), 0),
 *         true
 *       );
 *
 *  3. (Recommended) Add SUPABASE_SERVICE_ROLE_KEY to .env — bypasses RLS.
 *
 * ─── Run ──────────────────────────────────────────────────────────────────────
 *
 *   node --use-system-ca scripts/seed_wikidata.js
 *
 * Requires Node 18+ (native fetch). No extra npm packages needed.
 */

import { readFileSync }  from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient }  from '@supabase/supabase-js'

// ── Inline .env loader (no dotenv dependency) ─────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))

try {
  const raw = readFileSync(join(__dirname, '../.env'), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let   val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = val
  }
} catch {
  // No .env file — rely on system environment variables
}

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const BATCH_SIZE   = 50
const WIKIDATA_URL = 'https://query.wikidata.org/sparql'

// ── SPARQL query ──────────────────────────────────────────────────────────────
//
// Wikidata entity types targeted:
//   Q4989906  monument
//   Q179049   memorial
//   Q31604    war / military memorial
//   Q575759   Holocaust memorial
//
// Each item must have:
//   P17  = Q801  (country = Israel)
//   P625         (geographic coordinates)
//
// The bounding-box FILTER is a secondary guard.
// Label service prefers Hebrew (he), falls back to English (en).
//
const SPARQL = `
SELECT DISTINCT
  ?item
  ?itemLabel
  ?itemDescription
  ?lat
  ?lon
  ?image
  ?cityLabel
WHERE {
  VALUES ?type {
    wd:Q4989906
    wd:Q179049
    wd:Q31604
    wd:Q575759
  }

  ?item wdt:P31  ?type .
  ?item wdt:P17  wd:Q801 .
  ?item wdt:P625 ?coord .

  BIND(geof:latitude(?coord)  AS ?lat)
  BIND(geof:longitude(?coord) AS ?lon)

  FILTER(?lat > 29.0 && ?lat < 34.0)
  FILTER(?lon > 34.0 && ?lon < 36.5)

  OPTIONAL { ?item wdt:P18  ?image }
  OPTIONAL { ?item wdt:P131 ?city  }

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "he,en" .
  }
}
ORDER BY ?itemLabel
LIMIT 500
`

// ── Fetch raw SPARQL bindings from Wikidata ───────────────────────────────────
async function fetchFromWikidata() {
  const url = `${WIKIDATA_URL}?query=${encodeURIComponent(SPARQL)}&format=json`
  console.log('Querying Wikidata SPARQL endpoint…')

  const res = await fetch(url, {
    headers: {
      Accept:       'application/sparql-results+json',
      'User-Agent': 'NekudatZiyon/1.0 (memorial-map seeding script)',
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Wikidata returned HTTP ${res.status}: ${body.slice(0, 300)}`)
  }

  return (await res.json()).results.bindings
}

// ── Map one SPARQL binding → one memorial_sites row ───────────────────────────
function mapRow(binding) {
  const name = binding.itemLabel?.value ?? ''
  if (!name || /^Q\d+$/.test(name)) return null  // skip unlabelled items

  const lat = parseFloat(binding.lat?.value)
  const lon = parseFloat(binding.lon?.value)
  if (isNaN(lat) || isNaN(lon)) return null

  const description = binding.itemDescription?.value ?? ''

  // P18 values come back as Wikimedia Commons Special:FilePath redirect URLs —
  // usable directly as cover_image_url without further transformation.
  const imageUrl = binding.image?.value ?? null

  return {
    wikidata_id:         binding.item?.value ?? null,
    name,
    description_snippet: description ? description.slice(0, 120) : null,
    full_description:    description || null,
    cover_image_url:     imageUrl,
    latitude:            lat,
    longitude:           lon,
    city:                binding.cityLabel?.value ?? null,
    category:            'נציון היסטורי',
    location_type:       'אנדרטה',
  }
}

// ── Deduplicate by wikidata_id ────────────────────────────────────────────────
// A single Wikidata item can appear in multiple SPARQL result rows when it
// matches more than one entry in the VALUES clause (e.g. it is both a
// 'monument' and a 'war memorial'). SELECT DISTINCT only deduplicates on the
// full projection; we must dedup again by entity URI.
function deduplicateByWikidataId(rows) {
  const seen = new Set()
  return rows.filter(row => {
    const key = row.wikidata_id ?? `no-id-${Math.random()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Upsert one batch ──────────────────────────────────────────────────────────
// Uses ON CONFLICT (wikidata_id) DO UPDATE so the script is idempotent:
// re-running it refreshes existing rows and inserts genuinely new ones.
async function upsertBatch(supabase, rows, batchIndex, totalBatches) {
  const label = `Batch ${String(batchIndex + 1).padStart(String(totalBatches).length)}/${totalBatches}  (${rows.length} rows)`

  const { error } = await supabase
    .from('memorial_sites')
    .upsert(rows, { onConflict: 'wikidata_id' })

  if (error) {
    // Provide an actionable hint for the most common failure mode
    const hint = error.message.includes('_pkey')
      ? '\n  → Run this in Supabase SQL Editor to fix the ID sequence:\n' +
        "    SELECT setval(pg_get_serial_sequence('memorial_sites', 'id'), COALESCE((SELECT MAX(id) FROM memorial_sites), 0), true);"
      : ''
    console.error(`  ✗  ${label}  —  ${error.message}${hint}`)
    return { inserted: 0, failed: rows.length }
  }

  console.log(`  ✓  ${label}`)
  return { inserted: rows.length, failed: 0 }
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL) {
    console.error('ERROR: VITE_SUPABASE_URL is missing from .env')
    process.exit(1)
  }
  if (!SUPABASE_KEY) {
    console.error('ERROR: Neither SUPABASE_SERVICE_ROLE_KEY nor VITE_SUPABASE_PUBLISHABLE_KEY is set')
    process.exit(1)
  }

  const keyKind = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? 'service-role key (RLS bypassed ✓)'
    : 'publishable key  (RLS enforced)'
  console.log(`Key type : ${keyKind}`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // ── 1. Fetch from Wikidata ────────────────────────────────────────────────
  const bindings = await fetchFromWikidata()
  console.log(`Fetched  : ${bindings.length} raw SPARQL bindings\n`)

  // ── 2. Map, filter, deduplicate ───────────────────────────────────────────
  const mapped    = bindings.map(mapRow).filter(Boolean)
  const rows      = deduplicateByWikidataId(mapped)
  const skipped   = bindings.length - mapped.length
  const dupes     = mapped.length - rows.length

  console.log(`Mapped   : ${rows.length} valid rows`)
  if (skipped) console.log(`Skipped  : ${skipped} (no label or bad coordinates)`)
  if (dupes)   console.log(`Dupes    : ${dupes} removed (same entity matched multiple types)`)

  if (rows.length === 0) {
    console.log('\nNothing to upsert. Exiting.')
    return
  }

  // ── 3. Batch upsert ───────────────────────────────────────────────────────
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE)
  console.log(`\nUpserting in ${totalBatches} batch(es) of up to ${BATCH_SIZE}…\n`)

  let totalInserted = 0
  let totalFailed   = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { inserted, failed } = await upsertBatch(
      supabase,
      rows.slice(i, i + BATCH_SIZE),
      Math.floor(i / BATCH_SIZE),
      totalBatches
    )
    totalInserted += inserted
    totalFailed   += failed
  }

  console.log('\n─────────────────────────────────────')
  console.log(`Upserted : ${totalInserted} rows`)
  if (totalFailed) console.log(`Failed   : ${totalFailed} rows`)
  console.log('Done.')
}

main().catch(err => {
  console.error('\nSeed script failed:', err.message)
  process.exit(1)
})
