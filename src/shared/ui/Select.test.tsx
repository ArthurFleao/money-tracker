import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Select, type SelectOption } from './Select';

const OPTIONS: SelectOption[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'checking', label: 'Checking' },
  { value: 'credit', label: 'Credit', disabled: true },
];

describe('Select', () => {
  it('is labelled and selectable', async () => {
    const { user } = renderWithProviders(<Select label="Type" options={OPTIONS} />);
    const select = screen.getByRole('combobox', { name: 'Type' });
    await user.selectOptions(select, 'checking');
    expect(select).toHaveValue('checking');
    expect(screen.getByRole('option', { name: 'Credit' })).toBeDisabled();
  });

  it('renders an optional empty placeholder option', () => {
    renderWithProviders(
      <Select label="Wallet" options={OPTIONS} placeholder="Choose a wallet" defaultValue="" />,
    );
    expect(screen.getByRole('combobox', { name: 'Wallet' })).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Choose a wallet' })).toBeInTheDocument();
  });

  it('shows errors accessibly', () => {
    renderWithProviders(<Select label="Wallet" options={OPTIONS} error="Pick one" />);
    const select = screen.getByRole('combobox', { name: 'Wallet' });
    expect(select).toBeInvalid();
    expect(select).toHaveAccessibleDescription('Pick one');
  });
});
