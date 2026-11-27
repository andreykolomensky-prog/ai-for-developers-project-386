import { MantineProvider } from '@mantine/core'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from '../App.tsx'
import { theme } from '../theme.ts'

/** Рендерит приложение целиком на указанном адресе, как его увидит пользователь. */
export function renderApp(path = '/') {
  return render(
    <MantineProvider theme={theme} env="test">
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  )
}
