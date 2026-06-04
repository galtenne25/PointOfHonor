import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// `vi.hoisted` runs BEFORE any import is resolved, so we can construct the
// Supabase mock here and reference it both inside `vi.mock()` (also hoisted)
// AND inside the test bodies via the `sb` const below.
const { sb } = vi.hoisted(() => {
  // require() inside vi.hoisted is allowed; static `import` is not.
  const { createSupabaseMock } = require('./helpers/supabaseMock.js')
  return { sb: createSupabaseMock() }
})
vi.mock('../src/utils/supabase', () => ({ supabase: sb }))

// eslint-disable-next-line import/first
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'

beforeEach(() => {
  sb.auth.getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null })
  sb.auth.onAuthStateChange.mockReset().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  sb.auth.signUp.mockReset()
  sb.auth.signInWithPassword.mockReset()
  sb.auth.signOut.mockReset().mockResolvedValue({ error: null })
  sb.__setResponse({ data: null, error: null })
})

function AuthProbe() {
  const { user, profile, loading, isAdmin } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user-id">{user?.id ?? ''}</span>
      <span data-testid="profile-name">{profile?.full_name ?? ''}</span>
      <span data-testid="admin">{String(isAdmin)}</span>
    </div>
  )
}

function AuthActions() {
  const { signIn, signOut } = useAuth()
  return (
    <>
      <button onClick={() => signIn({ email: 'a@b.com', password: '123456' })}>signin</button>
      <button onClick={() => signOut()}>signout</button>
    </>
  )
}

describe('AuthContext — session lifecycle', () => {
  it('resolves loading=false even when there is no session (logged-out)', async () => {
    render(<AuthProvider><AuthProbe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('user-id')).toHaveTextContent('')
  })

  it('hydrates user + profile when a session is present at mount', async () => {
    sb.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u1', email: 'gal@example.com' } } },
      error: null,
    })
    sb.__setResponse({
      data: { id: 'u1', full_name: 'גל טנא', initials: 'ג', is_admin: false },
      error: null,
    })
    render(<AuthProvider><AuthProbe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('user-id')).toHaveTextContent('u1')
    expect(screen.getByTestId('profile-name')).toHaveTextContent('גל טנא')
    expect(screen.getByTestId('admin')).toHaveTextContent('false')
  })

  it('flags isAdmin=true when the profile row has is_admin', async () => {
    sb.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u2', email: 'admin@example.com' } } },
      error: null,
    })
    sb.__setResponse({
      data: { id: 'u2', full_name: 'Admin', is_admin: true },
      error: null,
    })
    render(<AuthProvider><AuthProbe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('admin')).toHaveTextContent('true'))
  })
})

describe('AuthContext — signIn / signOut wiring', () => {
  it('signIn forwards email+password to supabase.auth.signInWithPassword', async () => {
    sb.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: 'u9' } }, error: null })
    render(<AuthProvider><AuthActions /></AuthProvider>)
    await waitFor(() => expect(sb.auth.getSession).toHaveBeenCalled())
    await userEvent.click(screen.getByText('signin'))
    await waitFor(() =>
      expect(sb.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: '123456' })
    )
  })

  it('signIn rejects with the supabase error message on bad credentials', async () => {
    sb.auth.signInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'Invalid login credentials' } })
    let captured = null
    function Probe() {
      const { signIn } = useAuth()
      return (
        <button onClick={async () => { try { await signIn({ email: 'a', password: 'b' }) } catch (e) { captured = e } }}>
          x
        </button>
      )
    }
    render(<AuthProvider><Probe /></AuthProvider>)
    await act(async () => { await userEvent.click(screen.getByText('x')) })
    expect(captured?.message).toBe('Invalid login credentials')
  })

  it('signOut calls supabase.auth.signOut', async () => {
    render(<AuthProvider><AuthActions /></AuthProvider>)
    await userEvent.click(screen.getByText('signout'))
    await waitFor(() => expect(sb.auth.signOut).toHaveBeenCalled())
  })
})

describe('AuthContext — signUp wiring', () => {
  it('forwards email/password + trimmed full_name metadata to supabase.auth.signUp', async () => {
    sb.auth.signUp.mockResolvedValueOnce({ data: { session: { user: { id: 'new-1' } } }, error: null })
    function Probe() {
      const { signUp } = useAuth()
      return (
        <button onClick={() => signUp({ email: 'n@b.com', password: 'secret1', fullName: '  דנה  ' })}>
          signup
        </button>
      )
    }
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(sb.auth.getSession).toHaveBeenCalled())
    await act(async () => { await userEvent.click(screen.getByText('signup')) })
    expect(sb.auth.signUp).toHaveBeenCalledWith({
      email: 'n@b.com',
      password: 'secret1',
      options: { data: { full_name: 'דנה' } },
    })
    // A session came back → no fallback password sign-in needed.
    expect(sb.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('falls back to password sign-in when signUp returns no session', async () => {
    sb.auth.signUp.mockResolvedValueOnce({ data: { session: null }, error: null })
    sb.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: { user: { id: 'x' } } }, error: null })
    function Probe() {
      const { signUp } = useAuth()
      return (
        <button onClick={() => signUp({ email: 'n@b.com', password: 'secret1', fullName: 'דנה' })}>
          signup
        </button>
      )
    }
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(sb.auth.getSession).toHaveBeenCalled())
    await act(async () => { await userEvent.click(screen.getByText('signup')) })
    expect(sb.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'n@b.com', password: 'secret1' })
  })

  it('surfaces an email-confirmation error when neither signup nor sign-in yield a session', async () => {
    sb.auth.signUp.mockResolvedValueOnce({ data: { session: null }, error: null })
    sb.auth.signInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'Email not confirmed' } })
    let captured = null
    function Probe() {
      const { signUp } = useAuth()
      return (
        <button onClick={async () => {
          try { await signUp({ email: 'n@b.com', password: 'secret1', fullName: 'דנה' }) }
          catch (e) { captured = e }
        }}>signup</button>
      )
    }
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(sb.auth.getSession).toHaveBeenCalled())
    await act(async () => { await userEvent.click(screen.getByText('signup')) })
    expect(captured?.code).toBe('email-confirmation-required')
  })
})
