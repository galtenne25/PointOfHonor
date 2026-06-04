import { describe, it, expect, vi } from 'vitest'
import { createSupabaseMock } from './helpers/supabaseMock'

const sb = createSupabaseMock()
vi.mock('../src/utils/supabase', () => ({ supabase: sb }))

describe('storage.validateImageFile()', () => {
  it('rejects non-image MIME types with a Hebrew message', async () => {
    const { validateImageFile, FileValidationError } = await import('../src/services/storage')
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })
    expect(() => validateImageFile(file)).toThrow(FileValidationError)
    try { validateImageFile(file) } catch (e) { expect(e.message).toMatch(/לא נתמך/) }
  })

  it('rejects files larger than 5MB', async () => {
    const { validateImageFile, FileValidationError } = await import('../src/services/storage')
    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    expect(() => validateImageFile(big)).toThrow(FileValidationError)
  })

  it('accepts a valid image under the size cap', async () => {
    const { validateImageFile } = await import('../src/services/storage')
    const ok = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    expect(() => validateImageFile(ok)).not.toThrow()
  })
})

describe('storage.uploadImage()', () => {
  it('uploads to the "images" bucket and returns a public URL', async () => {
    const { uploadImage } = await import('../src/services/storage')
    const ok = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    const { url, path } = await uploadImage(ok, 'avatars/user-1')
    expect(url).toBe('https://x.test/img.jpg')
    expect(path).toMatch(/^avatars\/user-1\//)
    expect(sb.storage.from).toHaveBeenCalledWith('images')
  })
})
