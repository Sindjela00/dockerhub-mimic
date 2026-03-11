import { render, screen } from '@testing-library/react'

import App from './App'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('/vite.svg', () => ({ default: 'vite.svg' }), { virtual: true })



describe('App', () => {
  test('renders heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /vite \+ react/i })).toBeTruthy()
  })

  test('increments counter on button click', async () => {
    const user = userEvent.setup()
    render(<App />)

    const button = screen.getAllByRole('button', { name: /count is 0/i })[0]
    await user.click(button)

    expect(screen.getAllByRole('button', { name: /count is 1/i })[0]).toBeTruthy()
  })
})
