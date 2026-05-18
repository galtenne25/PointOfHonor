/**
 * scripts/seed_wikidata.js  (v2 — deep seed)
 *
 * Fetches Israeli monuments / memorials from Wikidata SPARQL, upserts them
 * into memorial_sites, then generates realistic hiking routes by clustering
 * nearby sites and inserts them into routes + route_waypoints.
 *
 * ─── One-time Supabase SQL setup (run once in SQL Editor) ───────────────────
 *
 *   CREATE OR REPLACE FUNCTION truncate_seed_tables()
 *   RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
 *   BEGIN
 *     TRUNCATE TABLE route_waypoints RESTART IDENTITY CASCADE;
 *     TRUNCATE TABLE routes          RESTART IDENTITY CASCADE;
 *     TRUNCATE TABLE memorial_sites  RESTART IDENTITY CASCADE;
 *   END;
 *   $$;
 *
 * ─── Run ─────────────────────────────────────────────────────────────────────
 *
 *   node --use-system-ca scripts/seed_wikidata.js [--clean]
 *
 *   --clean  Truncates all three tables first (full refresh)
 *
 * Requires Node 18+ (native fetch). No extra npm packages needed.
 */

import { readFileSync }  from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient }  from '@supabase/supabase-js'

// ── Inline .env loader ────────────────────────────────────────────────────────
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
} catch { /* rely on system env */ }

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const BATCH_SIZE     = 50
const WIKIDATA_URL   = 'https://query.wikidata.org/sparql'
const MAX_CLUSTER_KM = 25
const MIN_STOPS      = 3
const MAX_STOPS      = 6
const CLEAN_FLAG     = process.argv.includes('--clean')

// ── Enhanced SPARQL query ─────────────────────────────────────────────────────
// P138 = named after, P571 = inception date, P607 = conflict / military operation
const SPARQL = `
SELECT DISTINCT
  ?item
  ?itemLabel
  ?itemDescription
  ?lat
  ?lon
  ?image
  ?cityLabel
  ?namedAfterLabel
  ?inception
  ?conflictLabel
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

  OPTIONAL { ?item wdt:P18  ?image      }
  OPTIONAL { ?item wdt:P131 ?city       }
  OPTIONAL { ?item wdt:P138 ?namedAfter }
  OPTIONAL { ?item wdt:P571 ?inception  }
  OPTIONAL { ?item wdt:P607 ?conflict   }

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "he,en" .
  }
}
ORDER BY ?itemLabel
LIMIT 800
`

// ── Geographic regions of Israel ──────────────────────────────────────────────
const REGIONS = [
  {
    id: 'galilee_north',
    name: 'הגליל העליון',
    latMin: 32.9, latMax: 33.3, lngMin: 35.1, lngMax: 35.7,
    terrain: 'הרים ויערות',
    difficulty: 'medium',
    category: 'טבע והנצחה',
    titleTemplates: [
      'מסלול אנדרטאות הגליל העליון',
      'שביל הזיכרון בפסגות הגליל',
      'טיול הנצחה ביערות הצפון',
    ],
  },
  {
    id: 'galilee_lower',
    name: 'הגליל התחתון',
    latMin: 32.6, latMax: 32.9, lngMin: 35.1, lngMax: 35.6,
    terrain: 'עמקים ורמות',
    difficulty: 'easy',
    category: 'מורשת יחידה',
    titleTemplates: [
      'מסלול הנצחה בגליל התחתון',
      'שביל הזיכרון בעמק יזרעאל',
      'טיול מורשת בין אנדרטאות הגליל',
    ],
  },
  {
    id: 'jezreel_valley',
    name: 'עמק יזרעאל',
    latMin: 32.4, latMax: 32.7, lngMin: 35.0, lngMax: 35.5,
    terrain: 'עמק פורה',
    difficulty: 'easy',
    category: 'מורשת יחידה',
    titleTemplates: [
      'מסלול אנדרטאות עמק יזרעאל',
      'שביל הזיכרון של עמק החולה',
      'טיול מורשת בין קיבוצי העמק',
    ],
  },
  {
    id: 'carmel',
    name: 'הכרמל וחיפה',
    latMin: 32.6, latMax: 32.9, lngMin: 34.9, lngMax: 35.1,
    terrain: 'הר ים',
    difficulty: 'medium',
    category: 'טבע והנצחה',
    titleTemplates: [
      'מסלול הנצחה בהר הכרמל',
      'שביל הזיכרון לאורך כרמל',
      'טיול אנדרטאות מהכרמל לים',
    ],
  },
  {
    id: 'sharon',
    name: 'השרון והשפלה',
    latMin: 32.0, latMax: 32.5, lngMin: 34.8, lngMax: 35.2,
    terrain: 'חורשות וחולות',
    difficulty: 'easy',
    category: 'מורשת יחידה',
    titleTemplates: [
      'מסלול אנדרטאות אזור השרון',
      'שביל הזיכרון בשפלת החוף',
      'טיול הנצחה בין ערי השרון',
    ],
  },
  {
    id: 'tel_aviv_center',
    name: 'גוש דן והמרכז',
    latMin: 31.9, latMax: 32.2, lngMin: 34.7, lngMax: 35.0,
    terrain: 'עירוני ופרברי',
    difficulty: 'easy',
    category: 'מורשת יחידה',
    titleTemplates: [
      'מסלול אנדרטאות גוש דן',
      'שביל הזיכרון במרכז הארץ',
      'טיול מורשת בין אנדרטאות המטרופולין',
    ],
  },
  {
    id: 'jerusalem',
    name: 'ירושלים וסביבותיה',
    latMin: 31.6, latMax: 31.9, lngMin: 34.9, lngMax: 35.4,
    terrain: 'הרי יהודה',
    difficulty: 'medium',
    category: 'מורשת יחידה',
    titleTemplates: [
      'מסלול אנדרטאות הרי ירושלים',
      'שביל הזיכרון בעיר הבירה',
      'טיול מורשת סביב ירושלים',
    ],
  },
  {
    id: 'shfela',
    name: 'השפלה ויהודה',
    latMin: 31.5, latMax: 31.8, lngMin: 34.7, lngMax: 35.1,
    terrain: 'גבעות שפלה',
    difficulty: 'easy',
    category: 'מורשת יחידה',
    titleTemplates: [
      'מסלול אנדרטאות שפלת יהודה',
      'שביל הזיכרון בגבעות השפלה',
      'טיול הנצחה בין ערי הדרום',
    ],
  },
  {
    id: 'negev_north',
    name: 'הנגב הצפוני',
    latMin: 31.0, latMax: 31.5, lngMin: 34.5, lngMax: 35.0,
    terrain: 'מדבר ושפלה',
    difficulty: 'medium',
    category: 'מורשת יחידה',
    titleTemplates: [
      'מסלול אנדרטאות הנגב הצפוני',
      'שביל הזיכרון בשדות הנגב',
      'טיול מורשת בין שדות הקרב',
    ],
  },
  {
    id: 'negev_south',
    name: 'הנגב הדרומי',
    latMin: 29.5, latMax: 31.0, lngMin: 34.3, lngMax: 35.5,
    terrain: 'מדבר ומכתשים',
    difficulty: 'hard',
    category: 'טבע והנצחה',
    titleTemplates: [
      'מסלול אנדרטאות הנגב הדרומי',
      'שביל הזיכרון במדבר יהודה',
      'טיול הנצחה במכתשים הגדולים',
    ],
  },
]

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Order stops by nearest-neighbor (greedy TSP) ──────────────────────────────
function orderByNearestNeighbor(points) {
  if (points.length <= 2) return [...points]
  const remaining = [...points]
  const result    = [remaining.shift()]
  while (remaining.length) {
    const last    = result[result.length - 1]
    let   bestIdx  = 0
    let   bestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(last.latitude, last.longitude,
                             remaining[i].latitude, remaining[i].longitude)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    }
    result.push(remaining.splice(bestIdx, 1)[0])
  }
  return result
}

// ── Total path distance ───────────────────────────────────────────────────────
function totalDistanceKm(pts) {
  let dist = 0
  for (let i = 1; i < pts.length; i++) {
    dist += haversineKm(pts[i - 1].latitude, pts[i - 1].longitude,
                         pts[i].latitude,     pts[i].longitude)
  }
  return dist
}

// ── Hebrew duration string ────────────────────────────────────────────────────
function formatDurationHe(distKm, difficulty) {
  const speedKmh = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 3 : 2.5
  const totalMin = Math.round((distKm / speedKmh) * 60) + 30
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} דקות`
  if (m === 0) return `${h} שעות`
  return `${h} שעות ו-${m} דקות`
}

// ── Assign one site to the first matching region ──────────────────────────────
function assignRegion(site) {
  for (const r of REGIONS) {
    if (site.latitude  >= r.latMin && site.latitude  <= r.latMax &&
        site.longitude >= r.lngMin && site.longitude <= r.lngMax) {
      return r.id
    }
  }
  return null
}

// ── Greedy proximity clustering within one region ─────────────────────────────
function clusterRegion(sites) {
  const unused   = [...sites]
  const clusters = []

  while (unused.length >= MIN_STOPS) {
    const seed  = unused.shift()
    const group = [seed]

    unused.sort((a, b) =>
      haversineKm(seed.latitude, seed.longitude, a.latitude, a.longitude) -
      haversineKm(seed.latitude, seed.longitude, b.latitude, b.longitude)
    )

    let i = 0
    while (group.length < MAX_STOPS && i < unused.length) {
      const d = haversineKm(seed.latitude, seed.longitude,
                             unused[i].latitude, unused[i].longitude)
      if (d <= MAX_CLUSTER_KM) {
        group.push(unused.splice(i, 1)[0])
      } else {
        i++
      }
    }

    if (group.length >= MIN_STOPS) clusters.push(group)
  }

  return clusters
}

// ── Build one route row + waypoint rows from a cluster ────────────────────────
function buildRoute(cluster, region, clusterIndex) {
  const ordered  = orderByNearestNeighbor(cluster)
  const distKm   = totalDistanceKm(ordered)
  const title    = region.titleTemplates[clusterIndex % region.titleTemplates.length]
  const startLoc = ordered[0].city ?? ordered[0].name
  const stopNames = ordered.map(s => s.name).join(', ')

  const description =
    `מסלול הנצחה ב${region.name} הכולל ${ordered.length} עצירות: ${stopNames}. ` +
    `אורך המסלול ${distKm.toFixed(1)} ק"מ דרך ${region.terrain}.`

  const route = {
    title,
    duration:          formatDurationHe(distKm, region.difficulty),
    distance_km:       Math.round(distKm * 10) / 10,
    difficulty:        region.difficulty,
    description_short: description.slice(0, 200),
    cover_image_url:   ordered[0].imageUrl ?? null,
    map_image_url:     null,
    category:          region.category,
    start_location:    startLoc,
    is_featured:       clusterIndex === 0,
  }

  const waypoints = ordered.map((site, idx) => ({
    name:       site.name,
    description: (site.descriptionSnippet || site.fullDescription?.slice(0, 120)) ?? null,
    image_url:  site.imageUrl ?? null,
    stop_order: idx + 1,
  }))

  return { route, waypoints }
}

// ── Fetch raw SPARQL bindings ─────────────────────────────────────────────────
async function fetchFromWikidata() {
  const url = `${WIKIDATA_URL}?query=${encodeURIComponent(SPARQL)}&format=json`
  console.log('Querying Wikidata SPARQL endpoint…')
  const res = await fetch(url, {
    headers: {
      Accept:       'application/sparql-results+json',
      'User-Agent': 'NekudatZiyon/2.0 (deep-seed script)',
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Wikidata HTTP ${res.status}: ${body.slice(0, 300)}`)
  }
  return (await res.json()).results.bindings
}

// ── Map one SPARQL binding → memorial_sites row ───────────────────────────────
function mapRow(binding) {
  const name = binding.itemLabel?.value ?? ''
  if (!name || /^Q\d+$/.test(name)) return null

  const lat = parseFloat(binding.lat?.value)
  const lon = parseFloat(binding.lon?.value)
  if (isNaN(lat) || isNaN(lon)) return null

  const description = binding.itemDescription?.value ?? ''
  const namedAfter  = binding.namedAfterLabel?.value
  const conflict    = binding.conflictLabel?.value
  const inception   = binding.inception?.value?.slice(0, 10) ?? null

  const extras = [
    namedAfter ? `על שם: ${namedAfter}` : null,
    conflict   ? `מלחמה / עימות: ${conflict}` : null,
    inception  ? `הוקם: ${inception}` : null,
  ].filter(Boolean)

  const fullDescription = extras.length
    ? [description || null, ...extras].filter(Boolean).join(' • ')
    : (description || null)

  return {
    wikidata_id:         binding.item?.value ?? null,
    name,
    description_snippet: description ? description.slice(0, 120) : null,
    full_description:    fullDescription,
    cover_image_url:     binding.image?.value ?? null,
    latitude:            lat,
    longitude:           lon,
    city:                binding.cityLabel?.value ?? null,
    category:            'נציון היסטורי',
    location_type:       'אנדרטה',
  }
}

// ── Deduplicate by wikidata_id ────────────────────────────────────────────────
function deduplicateByWikidataId(rows) {
  const seen = new Set()
  return rows.filter(row => {
    const key = row.wikidata_id ?? `no-id-${Math.random()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Upsert memorial_sites in one batch ───────────────────────────────────────
async function upsertBatch(supabase, rows, batchIndex, totalBatches) {
  const label = `Batch ${String(batchIndex + 1).padStart(String(totalBatches).length)}/${totalBatches}  (${rows.length} rows)`
  const { error } = await supabase
    .from('memorial_sites')
    .upsert(rows, { onConflict: 'wikidata_id' })

  if (error) {
    const hint = error.message.includes('_pkey')
      ? "\n  → Run: SELECT setval(pg_get_serial_sequence('memorial_sites','id'), COALESCE((SELECT MAX(id) FROM memorial_sites),0), true);"
      : ''
    console.error(`  ✗  ${label}  —  ${error.message}${hint}`)
    return { inserted: 0, failed: rows.length }
  }

  console.log(`  ✓  ${label}`)
  return { inserted: rows.length, failed: 0 }
}

// ── Clean all three seed tables ───────────────────────────────────────────────
async function cleanTables(supabase) {
  console.log('--clean: truncating tables…')
  const { error: rpcError } = await supabase.rpc('truncate_seed_tables')
  if (!rpcError) {
    console.log('  ✓  Truncated via RPC\n')
    return
  }
  console.log(`  ⚠ RPC unavailable (${rpcError.message}), falling back to DELETE…`)
  for (const table of ['route_waypoints', 'routes', 'memorial_sites']) {
    const { error } = await supabase.from(table).delete().gte('id', 0)
    if (error) console.log(`    Warning: could not clear ${table}: ${error.message}`)
  }
  console.log('  ✓  Manual delete complete\n')
}

// ── Verify final row counts and show a sample route ──────────────────────────
async function verify(supabase) {
  console.log('\n══════════════════ VERIFICATION ══════════════════\n')

  const [memRes, routeRes, wpRes] = await Promise.all([
    supabase.from('memorial_sites') .select('*', { count: 'exact', head: true }),
    supabase.from('routes')         .select('*', { count: 'exact', head: true }),
    supabase.from('route_waypoints').select('*', { count: 'exact', head: true }),
  ])

  console.log(`  Memorials  : ${memRes.count   ?? '?'}`)
  console.log(`  Routes     : ${routeRes.count ?? '?'}`)
  console.log(`  Waypoints  : ${wpRes.count    ?? '?'}`)

  const { data: featured, error: featErr } = await supabase
    .from('routes')
    .select('*')
    .eq('is_featured', true)
    .limit(1)
    .maybeSingle()

  if (!featErr && featured) {
    console.log('\n── Sample featured route ──────────────────────────')
    console.log(`  Title      : ${featured.title}`)
    console.log(`  Category   : ${featured.category}`)
    console.log(`  Distance   : ${featured.distance_km} km`)
    console.log(`  Duration   : ${featured.duration}`)
    console.log(`  Difficulty : ${featured.difficulty}`)
    console.log(`  Start      : ${featured.start_location}`)

    const { data: waypoints } = await supabase
      .from('route_waypoints')
      .select('stop_order, name, description')
      .eq('route_id', featured.id)
      .order('stop_order')

    if (waypoints?.length) {
      console.log('\n  Stops:')
      for (const wp of waypoints) {
        console.log(`    ${wp.stop_order}. ${wp.name}`)
        if (wp.description) {
          console.log(`       ${wp.description.slice(0, 80)}${wp.description.length > 80 ? '…' : ''}`)
        }
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════\n')
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
  if (CLEAN_FLAG) console.log('Mode     : --clean (full refresh)')
  console.log('')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // ── 1. Clean / reset ─────────────────────────────────────────────────────
  if (CLEAN_FLAG) {
    await cleanTables(supabase)
  } else {
    // Always regenerate routes from scratch even without --clean
    console.log('Clearing existing routes and waypoints…')
    await supabase.from('route_waypoints').delete().gte('id', 0)
    await supabase.from('routes')         .delete().gte('id', 0)
    console.log('  ✓  Done\n')
  }

  // ── 2. Fetch from Wikidata ────────────────────────────────────────────────
  const bindings = await fetchFromWikidata()
  console.log(`Fetched  : ${bindings.length} raw SPARQL bindings\n`)

  // ── 3. Map → filter → deduplicate ────────────────────────────────────────
  const mapped  = bindings.map(mapRow).filter(Boolean)
  const rows    = deduplicateByWikidataId(mapped)
  const skipped = bindings.length - mapped.length
  const dupes   = mapped.length - rows.length

  console.log(`Mapped   : ${rows.length} valid rows`)
  if (skipped) console.log(`Skipped  : ${skipped} (no label or bad coordinates)`)
  if (dupes)   console.log(`Dupes    : ${dupes} removed (multi-type entity)`)
  console.log('')

  if (rows.length === 0) { console.log('Nothing to upsert. Exiting.'); return }

  // ── 4. Upsert memorial_sites ──────────────────────────────────────────────
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE)
  console.log(`Upserting ${rows.length} memorial sites in ${totalBatches} batch(es)…\n`)

  let totalInserted = 0
  let totalFailed   = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { inserted, failed } = await upsertBatch(
      supabase, rows.slice(i, i + BATCH_SIZE),
      Math.floor(i / BATCH_SIZE), totalBatches
    )
    totalInserted += inserted
    totalFailed   += failed
  }
  console.log(`\n  Upserted : ${totalInserted} rows${totalFailed ? `  (${totalFailed} failed)` : ''}\n`)

  // ── 5. Re-fetch DB rows to get real IDs for route generation ─────────────
  const { data: dbSites, error: fetchErr } = await supabase
    .from('memorial_sites')
    .select('id, name, latitude, longitude, city, description_snippet, full_description, cover_image_url')

  if (fetchErr || !dbSites?.length) {
    console.error('Could not fetch inserted sites for route generation:', fetchErr?.message)
    process.exit(1)
  }

  const siteObjs = dbSites.map(r => ({
    id:                 r.id,
    name:               r.name,
    latitude:           r.latitude,
    longitude:          r.longitude,
    city:               r.city,
    descriptionSnippet: r.description_snippet,
    fullDescription:    r.full_description,
    imageUrl:           r.cover_image_url,
  }))

  // ── 6. Cluster → routes ───────────────────────────────────────────────────
  console.log('Clustering memorials into hiking routes…\n')

  const routesToInsert   = []
  const waypointsByRoute = []

  for (const region of REGIONS) {
    const regional = siteObjs.filter(s => assignRegion(s) === region.id)

    if (regional.length < MIN_STOPS) {
      console.log(`  ${region.name.padEnd(26)} — ${regional.length} sites (too few, skipping)`)
      continue
    }

    const clusters = clusterRegion(regional)
    console.log(`  ${region.name.padEnd(26)} — ${regional.length} sites → ${clusters.length} route(s)`)

    clusters.forEach((cluster, idx) => {
      const { route, waypoints } = buildRoute(cluster, region, idx)
      routesToInsert.push(route)
      waypointsByRoute.push(waypoints)
    })
  }

  if (routesToInsert.length === 0) {
    console.log('\nNo routes generated. Verify that SPARQL returned coordinates within region bounds.')
    await verify(supabase)
    return
  }

  // ── 7. Insert routes ──────────────────────────────────────────────────────
  console.log(`\nInserting ${routesToInsert.length} routes…`)
  const { data: insertedRoutes, error: routeErr } = await supabase
    .from('routes')
    .insert(routesToInsert)
    .select('id')

  if (routeErr) {
    console.error('Route insert failed:', routeErr.message)
    process.exit(1)
  }
  console.log(`  ✓  ${insertedRoutes.length} routes inserted`)

  // ── 8. Insert waypoints in batches ────────────────────────────────────────
  const allWaypoints = []
  for (let i = 0; i < insertedRoutes.length; i++) {
    const routeId = insertedRoutes[i].id
    for (const wp of waypointsByRoute[i]) {
      allWaypoints.push({ ...wp, route_id: routeId })
    }
  }

  console.log(`\nInserting ${allWaypoints.length} waypoints…`)
  let wpInserted = 0
  for (let i = 0; i < allWaypoints.length; i += BATCH_SIZE) {
    const batch = allWaypoints.slice(i, i + BATCH_SIZE)
    const { error: wpErr } = await supabase.from('route_waypoints').insert(batch)
    if (wpErr) {
      console.error(`  ✗  Waypoint batch failed: ${wpErr.message}`)
    } else {
      wpInserted += batch.length
      process.stdout.write('.')
    }
  }
  console.log(`\n  ✓  ${wpInserted} waypoints inserted`)

  // ── 9. Verify ─────────────────────────────────────────────────────────────
  await verify(supabase)
  console.log('Done.')
}

main().catch(err => {
  console.error('\nSeed script failed:', err.message)
  process.exit(1)
})
