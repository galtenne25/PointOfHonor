import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Default env vars so utils/supabase.js can instantiate during tests
process.env.VITE_SUPABASE_URL ??= 'https://test.supabase.co'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??= 'sb_publishable_test'

// JSDOM URL.createObjectURL stub — image upload tests need it.
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
}

beforeEach(() => {
  // Reset all mocks between tests so each test starts clean.
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})
