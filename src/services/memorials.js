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

// ── Upload a single File to the 'images' bucket; returns the public URL ────────
async function uploadImage(file, folder = 'memorials') {
  const ext  = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}

// ── Insert a new memorial; imageFiles is an array of File objects ─────────────
export async function addMemorial({ name, description, location, category = 'חרבות ברזל', imageFiles = [] }) {
  // 1. Upload cover image (first file), if provided
  let cover_image_url = null
  if (imageFiles.length > 0) {
    cover_image_url = await uploadImage(imageFiles[0])
  }

  // 2. Insert the memorial_sites row
  const { data: row, error } = await supabase
    .from('memorial_sites')
    .insert({
      name,
      description_snippet: description.slice(0, 120),
      full_description:    description,
      cover_image_url,
      latitude:            parseFloat(location.lat),
      longitude:           parseFloat(location.lng),
      category,
    })
    .select('*, site_galleries(image_url)')
    .single()

  if (error) throw error

  // 3. Upload remaining files as gallery images
  if (imageFiles.length > 1) {
    const extraUrls = await Promise.all(
      imageFiles.slice(1).map(f => uploadImage(f).catch(() => null))
    )
    const valid = extraUrls.filter(Boolean)
    if (valid.length > 0) {
      await supabase
        .from('site_galleries')
        .insert(valid.map(url => ({ site_id: row.id, image_url: url })))
    }
  }

  return mapSite(row)
}
