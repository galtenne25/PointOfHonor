import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSupabaseMock } from './helpers/supabaseMock'

const sb = createSupabaseMock()

// Replace the real supabase client used by every service with our mock.
vi.mock('../src/utils/supabase', () => ({ supabase: sb }))

beforeEach(() => { sb.__setResponse({ data: null, error: null }) })

describe('memorials.getMemorials() — Read with implicit RLS filter', () => {
  it('returns only approved rows (rows with status pending/rejected are filtered)', async () => {
    sb.__setResponse({
      data: [
        { id: 1, name: 'A', status: 'approved', latitude: 0, longitude: 0 },
        { id: 2, name: 'B', status: 'pending',  latitude: 0, longitude: 0 },
        { id: 3, name: 'C', status: 'rejected', latitude: 0, longitude: 0 },
        { id: 4, name: 'D', status: null,       latitude: 0, longitude: 0 }, // pre-migration row
      ],
      error: null,
    })
    const { getMemorials } = await import('../src/services/memorials')
    const result = await getMemorials()
    expect(result.map(r => r.id).sort()).toEqual([1, 4])
    expect(sb.from).toHaveBeenCalledWith('memorial_sites')
  })

  it('throws when supabase returns an error', async () => {
    sb.__setResponse({ data: null, error: { message: 'permission denied' } })
    const { getMemorials } = await import('../src/services/memorials')
    await expect(getMemorials()).rejects.toThrow('permission denied')
  })
})

describe('memorials.addMemorial() — Create', () => {
  it('sets user_id from the current session and inserts status="pending"', async () => {
    sb.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'user-123' } } } })
    sb.__setResponse({
      data: { id: 99, name: 'X', latitude: 31, longitude: 35, status: 'pending', site_galleries: [] },
      error: null,
    })
    const { addMemorial } = await import('../src/services/memorials')
    await addMemorial({
      name: 'New site',
      description: 'A long enough description text for validation',
      location: { lat: '31.5', lng: '35.0' },
      category: 'מורשת יחידה',
      imageFiles: [],
    })
    const last = sb.__lastInsert
    expect(last.table).toBe('memorial_sites')
    expect(last.payload.user_id).toBe('user-123')      // ← Phase 2 spec: user_id from auth
    expect(last.payload.status).toBe('pending')        // ← moderation default
    expect(last.payload.name).toBe('New site')
  })
})

describe('memorials.updateMemorial() — Update sends only patched fields', () => {
  it('translates `description` into snippet + full description, scoped to the owner', async () => {
    sb.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'owner-1' } } } })
    sb.__setResponse({
      data: { id: 1, name: 'edited', full_description: 'desc', latitude: 0, longitude: 0, site_galleries: [] },
      error: null,
    })
    const { updateMemorial } = await import('../src/services/memorials')
    await updateMemorial(1, { name: 'edited', description: 'a brand new description' })
    const last = sb.__lastUpdate
    expect(last.table).toBe('memorial_sites')
    expect(last.payload).toEqual({
      name: 'edited',
      description_snippet: 'a brand new description',
      full_description:    'a brand new description',
    })
    expect(sb.__lastFilters).toContainEqual(['eq', 'id', 1])
    expect(sb.__lastFilters).toContainEqual(['eq', 'user_id', 'owner-1'])  // ← owner scoping
  })

  it('throws (and never issues the update) when there is no session', async () => {
    sb.auth.getSession.mockResolvedValueOnce({ data: { session: null } })
    const { updateMemorial } = await import('../src/services/memorials')
    await expect(updateMemorial(1, { name: 'x' })).rejects.toThrow(/להתחבר/)
  })
})

describe('memorials.deleteMemorialOwn() — Delete', () => {
  it('issues DELETE scoped to BOTH the row id and the current user id', async () => {
    sb.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'owner-1' } } } })
    sb.__setResponse({ data: null, error: null })
    const { deleteMemorialOwn } = await import('../src/services/memorials')
    await deleteMemorialOwn(42)
    expect(sb.__lastTable).toBe('memorial_sites')
    expect(sb.__lastFilters).toContainEqual(['eq', 'id', 42])
    expect(sb.__lastFilters).toContainEqual(['eq', 'user_id', 'owner-1'])  // ← no unscoped delete
  })

  it('refuses to delete when logged out', async () => {
    sb.auth.getSession.mockResolvedValueOnce({ data: { session: null } })
    const { deleteMemorialOwn } = await import('../src/services/memorials')
    await expect(deleteMemorialOwn(42)).rejects.toThrow(/להתחבר/)
  })
})

describe('memorials.getMyMemorials() — Read scoped to current user (RLS-friendly)', () => {
  it('filters by user_id', async () => {
    sb.__setResponse({ data: [], error: null })
    const { getMyMemorials } = await import('../src/services/memorials')
    await getMyMemorials('user-555')
    expect(sb.__lastFilters).toContainEqual(['eq', 'user_id', 'user-555'])
  })

  it('returns empty array when called with no user (no DB hit)', async () => {
    const { getMyMemorials } = await import('../src/services/memorials')
    const result = await getMyMemorials(null)
    expect(result).toEqual([])
  })
})

describe('routes.getRoutes() — Read', () => {
  it('filters out non-approved rows client-side', async () => {
    sb.__setResponse({
      data: [
        { id: 1, title: 'X', status: 'approved', distance_km: 5, route_waypoints: [] },
        { id: 2, title: 'Y', status: 'pending',  distance_km: 5, route_waypoints: [] },
      ],
      error: null,
    })
    const { getRoutes } = await import('../src/services/routes')
    const result = await getRoutes()
    expect(result.map(r => r.id)).toEqual([1])
  })
})

describe('routes.addRoute() — Create', () => {
  it('stamps user_id from the session and submits status="pending"', async () => {
    sb.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'user-77' } } } })
    sb.__setResponse({
      data: { id: 5, title: 'T', distance_km: 4, status: 'pending', route_waypoints: [] },
      error: null,
    })
    const { addRoute } = await import('../src/services/routes')
    await addRoute({
      title: 'My route',
      description: 'A description long enough to pass validation',
      region: 'north',
      lengthKm: 4,
      hasWater: true,
      routeType: 'trail',
    })
    const last = sb.__lastInsert
    expect(last.table).toBe('routes')
    expect(last.payload.user_id).toBe('user-77')
    expect(last.payload.status).toBe('pending')
  })
})

describe('routes.updateRouteOwn() / deleteRouteOwn() — owner-scoped writes', () => {
  it('update is scoped to id + current user id', async () => {
    sb.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'owner-9' } } } })
    sb.__setResponse({ data: { id: 3, title: 'edited', distance_km: 2, route_waypoints: [] }, error: null })
    const { updateRouteOwn } = await import('../src/services/routes')
    await updateRouteOwn(3, { title: 'edited' })
    expect(sb.__lastTable).toBe('routes')
    expect(sb.__lastFilters).toContainEqual(['eq', 'id', 3])
    expect(sb.__lastFilters).toContainEqual(['eq', 'user_id', 'owner-9'])
  })

  it('delete is scoped to id + current user id', async () => {
    sb.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'owner-9' } } } })
    sb.__setResponse({ data: null, error: null })
    const { deleteRouteOwn } = await import('../src/services/routes')
    await deleteRouteOwn(3)
    expect(sb.__lastTable).toBe('routes')
    expect(sb.__lastFilters).toContainEqual(['eq', 'id', 3])
    expect(sb.__lastFilters).toContainEqual(['eq', 'user_id', 'owner-9'])
  })

  it('delete refuses to run when logged out', async () => {
    sb.auth.getSession.mockResolvedValueOnce({ data: { session: null } })
    const { deleteRouteOwn } = await import('../src/services/routes')
    await expect(deleteRouteOwn(3)).rejects.toThrow(/להתחבר/)
  })
})
