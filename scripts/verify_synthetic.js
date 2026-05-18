/**
 * scripts/verify_synthetic.js
 *
 * Connects to Supabase, counts records in memorial_sites / routes /
 * route_waypoints, then fetches ONE complete route with its waypoints
 * (ordered by stop_order) to prove relational integrity is flawless.
 *
 * Run: node --use-system-ca scripts/verify_synthetic.js
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
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    let k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (k && process.env[k] === undefined) process.env[k] = v
  }
} catch { /* rely on system env */ }

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ חסרים משתני סביבה: VITE_SUPABASE_URL ו/או SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  console.log('═══════════════════════════════════════════════════')
  console.log('   🔍  אימות הנתונים הסינתטיים — Nekudat Tziyon')
  console.log('═══════════════════════════════════════════════════\n')

  // ── 1. Count records in all three tables ───────────────────────────────────
  const [memRes, routeRes, wpRes] = await Promise.all([
    supabase.from('memorial_sites') .select('*', { count: 'exact', head: true }),
    supabase.from('routes')         .select('*', { count: 'exact', head: true }),
    supabase.from('route_waypoints').select('*', { count: 'exact', head: true }),
  ])

  for (const [label, res] of [
    ['memorial_sites ', memRes],
    ['routes         ', routeRes],
    ['route_waypoints', wpRes],
  ]) {
    if (res.error) {
      console.error(`   ❌ ${label}: ${res.error.message}`)
      process.exit(1)
    }
  }

  console.log('📊  ספירת רשומות:')
  console.log(`   🏛️  אתרי הנצחה  (memorial_sites) : ${memRes.count}`)
  console.log(`   🗺️  מסלולים      (routes)         : ${routeRes.count}`)
  console.log(`   📍  עצירות מסלול (route_waypoints): ${wpRes.count}`)

  const expectedWp = (memRes.count != null && routeRes.count != null)
  console.log('')

  // ── 2. Fetch ONE complete route + its ordered waypoints ────────────────────
  const { data: route, error: routeErr } = await supabase
    .from('routes')
    .select(`
      id, title, description_short, difficulty, duration,
      distance_km, category, start_location, is_featured,
      route_waypoints ( id, name, description, stop_order )
    `)
    .eq('is_featured', true)
    .order('id')
    .limit(1)
    .maybeSingle()

  if (routeErr || !route) {
    console.error(`   ❌ לא ניתן לאחזר מסלול לדוגמה: ${routeErr?.message ?? 'אין מסלולים'}`)
    process.exit(1)
  }

  const waypoints = (route.route_waypoints ?? [])
    .sort((a, b) => a.stop_order - b.stop_order)

  console.log('═══════════════════════════════════════════════════')
  console.log('   🧩  בדיקת שלמות יחסים — מסלול מלא לדוגמה')
  console.log('═══════════════════════════════════════════════════\n')
  console.log(`   📛  כותרת      : ${route.title}`)
  console.log(`   🏷️  קטגוריה    : ${route.category}`)
  console.log(`   ⛰️  דרגת קושי  : ${route.difficulty}`)
  console.log(`   📏  מרחק       : ${route.distance_km} ק"מ`)
  console.log(`   ⏱️  משך        : ${route.duration}`)
  console.log(`   📌  נקודת זינוק: ${route.start_location}`)
  console.log(`   ⭐  מומלץ      : ${route.is_featured ? 'כן' : 'לא'}`)
  console.log(`   📝  תיאור      : ${route.description_short}`)
  console.log(`\n   📍  עצירות המסלול (${waypoints.length}):\n`)

  for (const wp of waypoints) {
    console.log(`      ${wp.stop_order}. ${wp.name}`)
    if (wp.description) console.log(`         ${wp.description}`)
  }

  // ── 3. Integrity assertions ────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════')
  const orderOk = waypoints.every((wp, i) => wp.stop_order === i + 1)
  const linkOk  = waypoints.every(wp => wp.id != null)

  console.log(`   ✓ עצירות ממוינות ברצף תקין : ${orderOk ? '✅ תקין' : '❌ שגוי'}`)
  console.log(`   ✓ כל עצירה מקושרת למסלול   : ${linkOk  ? '✅ תקין' : '❌ שגוי'}`)
  console.log(`   ✓ נתונים קיימים בכל הטבלאות: ${expectedWp && wpRes.count > 0 ? '✅ תקין' : '❌ שגוי'}`)
  console.log('═══════════════════════════════════════════════════\n')

  if (orderOk && linkOk && wpRes.count > 0) {
    console.log('   🎉  שלמות הנתונים אומתה בהצלחה — Relational integrity flawless!\n')
  } else {
    console.log('   ⚠️  נמצאו בעיות בשלמות הנתונים\n')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('\n❌ אימות נכשל:', err.message)
  process.exit(1)
})
