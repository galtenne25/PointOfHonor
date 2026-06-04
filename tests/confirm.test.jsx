import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider, useConfirm } from '../src/contexts/ConfirmContext'

// Exercises the Promise-based confirm() that replaced window.confirm() across
// the destructive-action flows (MySubmissionsPage / AdminPage).
function Harness({ onResult }) {
  const confirm = useConfirm()
  return (
    <button
      onClick={async () => {
        const ok = await confirm({
          title: 'מחיקה',
          message: 'בטוח שברצונך למחוק?',
          confirmLabel: 'מחק',
          cancelLabel: 'ביטול',
        })
        onResult(ok)
      }}
    >
      open
    </button>
  )
}

function setup() {
  let result
  render(
    <ConfirmProvider>
      <Harness onResult={(v) => { result = v }} />
    </ConfirmProvider>,
  )
  return { getResult: () => result }
}

describe('useConfirm() / ConfirmDialog', () => {
  it('renders the dialog content when opened', async () => {
    setup()
    await userEvent.click(screen.getByText('open'))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('מחיקה')).toBeInTheDocument()
    expect(screen.getByText('בטוח שברצונך למחוק?')).toBeInTheDocument()
  })

  it('resolves true and closes when the confirm button is clicked', async () => {
    const { getResult } = setup()
    await userEvent.click(screen.getByText('open'))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByText('מחק'))
    await waitFor(() => expect(getResult()).toBe(true))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('resolves false when cancelled', async () => {
    const { getResult } = setup()
    await userEvent.click(screen.getByText('open'))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByText('ביטול'))
    await waitFor(() => expect(getResult()).toBe(false))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('resolves false on Escape', async () => {
    const { getResult } = setup()
    await userEvent.click(screen.getByText('open'))
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(getResult()).toBe(false))
  })
})
