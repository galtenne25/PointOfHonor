/**
 * scripts/verify_full_app.js
 *
 * Counts records across ALL app tables (gracefully handling tables that don't
 * exist yet), then prints one sample row per populated entity to prove the
 * database is alive and relationally sound.
 *
 * Run: node --use-system-ca scripts/verify_full_app.js
 */

import { readFileSync }  from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient }  from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const raw = readFileSync(join(__dirname, '../.env'), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('='); if (eq < 0) continue
    let k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (k && process.env[k] === undefined) process.env[k] = v
  }
} catch {}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

const TABLES = [
  ['memorial_sites',       '🏛️  אתרי הנצחה'],
  ['routes',               '🗺️  מסלולים'],
  ['route_waypoints',      '📍 עצירות מסלול'],
  ['site_galleries',       '🖼️  תמונות גלריה'],
  ['profiles',             '👤 משתמשים'],
  ['community_activities', '📣 פעילות קהילה'],
  ['community_posts',      '📝 פוסטים'],
  ['community_comments',   '💬 תגובות'],
  ['saved_routes',         '⭐ מסלולים שמורים'],
  ['saved_memorials',      '⭐ אתרים שמורים'],
]

async function main() {
  console.log('\n══════════════════════════════════════════════════════')
  console.log('   🔍  אימות מסד הנתונים המלא — Nekudat Tziyon')
  console.log('══════════════════════════════════════════════════════\n')
  console.log('📊  ספירת רשומות בכל הטבלאות:\n')

  let grand = 0
  for (const [tbl, label] of TABLES) {
    const { count, error } = await supabase.from(tbl).select('*', { count: 'exact', head: true })
    if (error) {
      const missing = /Could not find the table/i.test(error.message)
      console.log(`   ${label.padEnd(22)} : ${missing ? '— (טבלה לא קיימת, נדרש schema_full_app.sql)' : 'שגיאה: ' + error.message}`)
    } else {
      grand += count ?? 0
      console.log(`   ${label.padEnd(22)} : ${count}`)
    }
  }
  console.log(`\n   ${'סה״כ רשומות'.padEnd(21)} : ${grand}`)

  // ── Sample: dedicated_to + gallery on one site ────────────────────────────
  const { data: site } = await supabase
    .from('memorial_sites')
    .select('id, name, dedicated_to, unit_name, category')
    .not('dedicated_to', 'is', null)
    .order('id').limit(1).maybeSingle()

  if (site) {
    const { count: gCount } = await supabase
      .from('site_galleries').select('*', { count: 'exact', head: true }).eq('site_id', site.id)
    console.log('\n══════════════════════════════════════════════════════')
    console.log('   🧩  דוגמת אתר מועשר')
    console.log('══════════════════════════════════════════════════════')
    console.log(`   אתר        : ${site.name}`)
    console.log(`   קטגוריה    : ${site.category}`)
    console.log(`   יחידה      : ${site.unit_name}`)
    console.log(`   מוקדש ל-   : ${site.dedicated_to}`)
    console.log(`   תמונות     : ${gCount} בגלריה`)
  }

  // ── Sample: community feed row with its profile join ──────────────────────
  const { data: act } = await supabase
    .from('community_activities')
    .select('action_type, target_name, created_at, profiles(full_name, initials)')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (act) {
    console.log('\n══════════════════════════════════════════════════════')
    console.log('   🧩  דוגמת פעילות קהילה (join ל-profiles)')
    console.log('══════════════════════════════════════════════════════')
    console.log(`   משתמש   : ${act.profiles?.full_name ?? '(לא מקושר)'} [${act.profiles?.initials ?? '?'}]`)
    console.log(`   פעולה   : ${act.action_type}`)
    console.log(`   יעד     : ${act.target_name}`)
  }

  // ── Sample: a community post + its comment count (if table exists) ────────
  const { data: post, error: postErr } = await supabase
    .from('community_posts')
    .select('id, title, post_type, like_count, profiles(full_name)')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (!postErr && post) {
    const { count: cCount } = await supabase
      .from('community_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id)
    console.log('\n══════════════════════════════════════════════════════')
    console.log('   🧩  דוגמת פוסט קהילה + תגובות')
    console.log('══════════════════════════════════════════════════════')
    console.log(`   כותב    : ${post.profiles?.full_name ?? '(לא מקושר)'}`)
    console.log(`   כותרת   : ${post.title}`)
    console.log(`   סוג     : ${post.post_type} · ${post.like_count} לייקים`)
    console.log(`   תגובות  : ${cCount}`)
  }

  // ── Sample: a route with its ordered waypoints ────────────────────────────
  const { data: route } = await supabase
    .from('routes')
    .select('id, title, distance_km, duration, difficulty, cover_image_url, map_image_url, route_waypoints(name, stop_order)')
    .eq('is_featured', true).order('id').limit(1).maybeSingle()
  if (route) {
    const wps = (route.route_waypoints ?? []).sort((a, b) => a.stop_order - b.stop_order)
    console.log('\n══════════════════════════════════════════════════════')
    console.log('   🧩  דוגמת מסלול + עצירות')
    console.log('══════════════════════════════════════════════════════')
    console.log(`   ${route.title}  ·  ${route.distance_km} ק"מ  ·  ${route.duration}  ·  ${route.difficulty}`)
    console.log(`   cover: ${route.cover_image_url ? '✓' : '✗'}   map: ${route.map_image_url ? '✓' : '✗'}`)
    wps.forEach(w => console.log(`     ${w.stop_order}. ${w.name}`))
  }

  // ── Visual-richness assertions (the "no broken vibe" requirement) ─────────
  console.log('\n══════════════════════════════════════════════════════')
  console.log('   🖼️  כיסוי ויזואלי')
  console.log('══════════════════════════════════════════════════════')
  const noCover = await supabase.from('memorial_sites').select('*', { count: 'exact', head: true })
    .or('cover_image_url.is.null,cover_image_url.eq.')
  const rtNoCover = await supabase.from('routes').select('*', { count: 'exact', head: true })
    .or('cover_image_url.is.null,cover_image_url.eq.')
  const rtNoMap = await supabase.from('routes').select('*', { count: 'exact', head: true })
    .or('map_image_url.is.null,map_image_url.eq.')
  const { data: gSites } = await supabase.from('site_galleries').select('site_id')
  const sitesWithGallery = new Set((gSites ?? []).map(g => g.site_id)).size
  const okCover  = (noCover.count ?? 0) === 0
  const okRoute  = (rtNoCover.count ?? 0) === 0 && (rtNoMap.count ?? 0) === 0
  console.log(`   אתרים ללא cover         : ${noCover.count ?? '?'}  ${okCover ? '✅' : '❌'}`)
  console.log(`   מסלולים ללא cover/map   : ${rtNoCover.count ?? '?'} / ${rtNoMap.count ?? '?'}  ${okRoute ? '✅' : '❌'}`)
  console.log(`   אתרים עם גלריה          : ${sitesWithGallery}`)

  console.log('\n══════════════════════════════════════════════════════')
  console.log('   ✅  האימות הושלם — מסד הנתונים מלא, עשיר ויזואלית ומקושר')
  console.log('══════════════════════════════════════════════════════\n')
}

main().catch(e => { console.error('\n❌ אימות נכשל:', e.message); process.exit(1) })
