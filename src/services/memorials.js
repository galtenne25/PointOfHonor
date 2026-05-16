import { supabase } from '../utils/supabase'

// Maps a DB row (+ joined galleries) → the UI shape expected by components
function mapSite(row) {
  return {
    id:                 row.id,
    name:               row.name,
    hebrewDate:         row.hebrew_date         ?? '',
    gregorianDate:      row.gregorian_date       ?? '',
    descriptionSnippet: row.description_snippet  ?? '',
    fullDescription:    row.full_description     ?? '',
    imageUrl:           row.cover_image_url      ?? '',
    location:           row.location_type        ?? '',
    city:               row.city                 ?? '',
    unit:               row.unit_name            ?? '',
    coordinates:        { lat: row.latitude, lng: row.longitude },
    category:           row.category             ?? '',
    gallery:            (row.site_galleries ?? []).map(g => g.image_url),
    distance:           '',
    distanceFull:       '',
  }
}

// ── Read: all memorials ───────────────────────────────────────────────────────
export async function getMemorials() {
  const { data, error } = await supabase
    .from('memorial_sites')
    .select('*, site_galleries(image_url)')
    .order('id')

  if (error) throw error
  return data.map(mapSite)
}

export async function getMemorialById(id) {
  const { data, error } = await supabase
    .from('memorial_sites')
    .select('*, site_galleries(image_url)')
    .eq('id', id)
    .single()

  if (error) return null
  return mapSite(data)
}

// ── PostGIS: fetch memorials inside the map's current bounding box ────────────
// Requires the `get_memorials_in_bounds` SQL function + PostGIS extension.
// Wire this into MapPage's `moveend` event once PostGIS migration is done.
export async function getMemorialsInBounds({ latMin, latMax, lngMin, lngMax }) {
  const { data, error } = await supabase.rpc('get_memorials_in_bounds', {
    lat_min: latMin, lat_max: latMax,
    lng_min: lngMin, lng_max: lngMax,
  })
  if (error) throw error
  return data.map(mapSite)
}

// ── Internal: upload one File to the 'images' bucket ─────────────────────────
// Returns { path, url } so callers can clean up on failure.
async function uploadImage(file, folder = 'memorials') {
  const ext  = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return { path, url: data.publicUrl }
}

// ── Internal: delete a list of storage paths (best-effort, never throws) ──────
async function deleteStoragePaths(paths) {
  const valid = paths.filter(Boolean)
  if (valid.length === 0) return
  await supabase.storage.from('images').remove(valid).catch(() => {})
}

// ── Write: insert a new memorial with full transactional cleanup ──────────────
// Rollback contract:
//   • cover upload fails  → throw (nothing in DB to clean)
//   • DB insert fails     → delete cover from storage, throw
//   • gallery inserts fail → rollback row + all uploaded files, throw
//   • individual gallery uploads partially fail → silently skip failed files,
//     insert only the ones that succeeded (partial gallery is still valid)
export async function addMemorial({
  name,
  description,
  location,
  category   = 'חרבות ברזל',
  imageFiles = [],
}) {
  let coverPath       = null
  let coverUrl        = null
  let insertedId      = null
  const galleryPaths  = []

  try {
    // ── Step 1: upload cover image ────────────────────────────────────────────
    if (imageFiles.length > 0) {
      const result = await uploadImage(imageFiles[0])
      coverPath = result.path
      coverUrl  = result.url
    }

    // ── Step 2: insert the memorial row ───────────────────────────────────────
    const { data: row, error: insertError } = await supabase
      .from('memorial_sites')
      .insert({
        name,
        description_snippet: description.slice(0, 120),
        full_description:    description,
        cover_image_url:     coverUrl,
        latitude:            parseFloat(location.lat),
        longitude:           parseFloat(location.lng),
        category,
      })
      .select('*, site_galleries(image_url)')
      .single()

    if (insertError) throw insertError
    insertedId = row.id

    // ── Step 3: upload additional images in parallel (best-effort) ────────────
    if (imageFiles.length > 1) {
      const results = await Promise.allSettled(
        imageFiles.slice(1).map(f => uploadImage(f))
      )

      const uploaded = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)

      if (uploaded.length > 0) {
        galleryPaths.push(...uploaded.map(u => u.path))

        const { error: galleryError } = await supabase
          .from('site_galleries')
          .insert(uploaded.map(u => ({ site_id: row.id, image_url: u.url })))

        // Gallery insert failure is critical — roll back the whole record
        if (galleryError) throw galleryError
      }
    }

    return mapSite(row)

  } catch (err) {
    // ── Rollback: remove the DB row first (prevents orphaned galleries) ────────
    if (insertedId != null) {
      await supabase
        .from('memorial_sites')
        .delete()
        .eq('id', insertedId)
        .catch(() => {})
    }

    // ── Rollback: purge every file we managed to upload ───────────────────────
    await deleteStoragePaths([coverPath, ...galleryPaths])

    throw err  // re-throw so AppContext can surface it to the UI
  }
}
