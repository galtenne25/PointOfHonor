import { supabase } from '../utils/supabase'

/**
 * Centralized storage utility for the public 'images' bucket.
 *
 * Used by:
 *   - AddPointPage  (memorial covers + galleries)  via memorials.js
 *   - ProfileEditPage (user avatar)
 *
 * Returns { url, path } so callers can clean up on rollback.
 */

export const MAX_FILE_MB = 5
export const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024
export const ACCEPTED_MIME_PREFIX = 'image/'

export class FileValidationError extends Error {
  constructor(reason) { super(reason); this.name = 'FileValidationError' }
}

/** Throws FileValidationError if the file fails our rules. */
export function validateImageFile(file) {
  if (!file)                                    throw new FileValidationError('לא נבחר קובץ')
  if (!file.type?.startsWith(ACCEPTED_MIME_PREFIX))
                                                throw new FileValidationError(`סוג קובץ לא נתמך (${file.type || 'unknown'}). נא להעלות תמונה.`)
  if (file.size > MAX_FILE_SIZE)                throw new FileValidationError(`הקובץ גדול מ-${MAX_FILE_MB}MB. נא לבחור קובץ קטן יותר.`)
}

/**
 * Uploads a single file to the 'images' bucket under the given folder.
 * Returns { url, path }. Throws on validation or storage error.
 */
export async function uploadImage(file, folder = 'misc') {
  validateImageFile(file)

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (upErr) throw new Error(upErr.message || 'העלאת התמונה נכשלה')

  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return { url: data.publicUrl, path }
}

/** Best-effort cleanup — never throws (used in rollback paths). */
export async function deleteImagePath(path) {
  if (!path) return
  try { await supabase.storage.from('images').remove([path]) } catch { /* ignore */ }
}
