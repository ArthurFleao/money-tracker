import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Switch } from './Switch';

describe('Switch', () => {
  it('toggles by click and reports changes', async () => {
    const onCheckedChange = vi.fn();
    const { user } = renderWithProviders(
      <Switch label="Auto-post" onCheckedChange={onCheckedChange} />,
    );
    const toggle = screen.getByRole('switch', { name: 'Auto-post' });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles from the label and the keyboard', async () => {
    const { user } = renderWithProviders(<Switch label="Auto-post" />);
    const toggle = screen.getByRole('switch', { name: 'Auto-post' });
    await user.click(screen.getByText('Auto-post'));
    expect(toggle).toBeChecked();
    await user.keyboard(' ');
    expect(toggle).not.toBeChecked();
  });

  it('is described by its description', () => {
    renderWithProviders(<Switch label="Auto-post" description="Create it on the due date" />);
    expect(screen.getByRole('switch', { name: 'Auto-post' })).toHaveAccessibleDescription(
      'Create it on the due date',
    );
  });

  it('uses a provided id and supports controlled state', () => {
    renderWithProviders(<Switch label="On" id="on" checked onCheckedChange={() => undefined} />);
    const toggle = screen.getByRole('switch', { name: 'On' });
    expect(toggle).toHaveAttribute('id', 'on');
    expect(toggle).toBeChecked();
  });
});
