import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Input } from './Input';

describe('Input', () => {
  it('is labelled and accepts typing', async () => {
    const { user } = renderWithProviders(<Input label="Wallet name" />);
    const input = screen.getByRole('textbox', { name: 'Wallet name' });
    await user.type(input, 'Savings');
    expect(input).toHaveValue('Savings');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('links the description', () => {
    renderWithProviders(<Input label="Name" description="Shown on cards" />);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription(
      'Shown on cards',
    );
  });

  it('marks errors as invalid and describes them', () => {
    renderWithProviders(<Input label="Name" description="Shown on cards" error="Required" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Shown on cards Required');
  });

  it('can visually hide the label while keeping the accessible name', () => {
    renderWithProviders(<Input label="Search" hideLabel />);
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByText('Search')).toHaveClass('sr-only');
  });

  it('uses a provided id', () => {
    renderWithProviders(<Input label="Amount" id="amount" />);
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveAttribute('id', 'amount');
  });
});
