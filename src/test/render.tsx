import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Extra wrapper rendered inside the app providers (e.g. a test router). */
  wrapper?: (props: { children: ReactNode }) => ReactElement;
}

export interface RenderWithProvidersResult extends RenderResult {
  user: UserEvent;
}

function AppProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * Renders `ui` inside the same providers the app uses and returns a
 * pre-configured `user` for interactions.
 *
 * @example
 * const { user } = renderWithProviders(<Button>Save</Button>);
 * await user.click(screen.getByRole('button', { name: 'Save' }));
 */
export function renderWithProviders(
  ui: ReactElement,
  { wrapper: Inner, ...options }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const user = userEvent.setup();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AppProviders>{Inner ? <Inner>{children}</Inner> : children}</AppProviders>
  );
  return { user, ...render(ui, { wrapper: Wrapper, ...options }) };
}
