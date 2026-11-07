import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('opens on keyboard focus and describes the trigger', async () => {
    const { user } = renderWithProviders(
      <Tooltip content="Archived wallets are hidden">
        <button type="button">Info</button>
      </Tooltip>,
    );
    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Archived wallets are hidden');
    expect(screen.getByRole('button', { name: 'Info' })).toHaveAccessibleDescription(
      'Archived wallets are hidden',
    );
  });

  it('opens on hover and closes with Escape', async () => {
    const { user } = renderWithProviders(
      <Tooltip content="Hint" side="bottom">
        <button type="button">Help</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole('button', { name: 'Help' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Hint');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
