import { vi } from 'vitest'

/**
 * Fluent Supabase mock. Each chained call returns the same builder; the
 * `.thenable()` ending lets you set what the awaited query should resolve to.
 *
 * Usage:
 *   const sb = createSupabaseMock()
 *   sb.__setResponse({ data: [{id:1}], error: null })
 *   const { data } = await sb.from('memorial_sites').select('*').eq('user_id', 'u1')
 *   expect(sb.from).toHaveBeenCalledWith('memorial_sites')
 *   expect(sb.__lastFilters).toContainEqual(['eq', 'user_id', 'u1'])
 */
export function createSupabaseMock() {
  const state = { response: { data: null, error: null }, filters: [], lastTable: null, inserts: [], updates: [] }

  const builder = {
    select: vi.fn(function () { return builder }),
    insert: vi.fn(function (payload) { state.inserts.push({ table: state.lastTable, payload }); return builder }),
    update: vi.fn(function (payload) { state.updates.push({ table: state.lastTable, payload }); return builder }),
    delete: vi.fn(function () { state.deletes ??= []; state.deletes.push({ table: state.lastTable }); return builder }),
    upsert: vi.fn(function (payload, opts) { state.inserts.push({ table: state.lastTable, payload, opts, upsert: true }); return builder }),
    eq:    vi.fn(function (col, val) { state.filters.push(['eq', col, val]); return builder }),
    neq:   vi.fn(function (col, val) { state.filters.push(['neq', col, val]); return builder }),
    in:    vi.fn(function (col, vals) { state.filters.push(['in', col, vals]); return builder }),
    gte:   vi.fn(function (col, val) { state.filters.push(['gte', col, val]); return builder }),
    order: vi.fn(function () { return builder }),
    limit: vi.fn(function () { return builder }),
    single:      vi.fn(function () { return Promise.resolve(state.response) }),
    maybeSingle: vi.fn(function () { return Promise.resolve(state.response) }),
    // Allow `await` on the builder itself (for query without .single())
    then: (resolve) => Promise.resolve(state.response).then(resolve),
  }

  const sb = {
    from: vi.fn((table) => {
      state.lastTable = table
      state.filters = []  // reset filters per query
      return builder
    }),
    rpc: vi.fn(() => Promise.resolve(state.response)),
    auth: {
      getSession:           vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange:    vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signUp:               vi.fn(),
      signInWithPassword:   vi.fn(),
      signOut:              vi.fn(() => Promise.resolve({ error: null })),
    },
    storage: {
      from: vi.fn(() => ({
        upload:        vi.fn(() => Promise.resolve({ data: { path: 'p' }, error: null })),
        getPublicUrl:  vi.fn(() => ({ data: { publicUrl: 'https://x.test/img.jpg' } })),
        remove:        vi.fn(() => Promise.resolve({ error: null })),
      })),
    },
    __setResponse: (r) => { state.response = r },
    get __lastFilters() { return state.filters },
    get __lastInsert()  { return state.inserts[state.inserts.length - 1] },
    get __lastUpdate()  { return state.updates[state.updates.length - 1] },
    get __lastTable()   { return state.lastTable },
    __state: state,
  }
  return sb
}
