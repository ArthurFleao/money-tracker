import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Button } from './Button';

describe('Button', () => {
  it('is a type="button" by default so it never submits forms by accident', () => {
    renderWithProviders(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('respects an explicit type', () => {
    renderWithProviders(<Button type="submit">Send</Button>);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'renders the %s variant',
    (variant) => {
      renderWithProviders(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole('button', { name: variant })).toBeEnabled();
    },
  );

  it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
    renderWithProviders(<Button size={size}>{size}</Button>);
    expect(screen.getByRole('button', { name: size })).toBeInTheDocument();
  });

  it('renders an icon-only button with an accessible name', () => {
    renderWithProviders(
      <Button size="icon" aria-label="Add">
        +
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('shows a busy state and blocks clicks while loading', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Save/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Loading…');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('can be disabled', () => {
    renderWithProviders(<Button disabled>Nope</Button>);
    expect(screen.getByRole('button', { name: 'Nope' })).toBeDisabled();
  });

  it('renders its child element when asChild is set', () => {
    renderWithProviders(
      <Button asChild variant="secondary">
        <a href="/wallets">Wallets</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Wallets' });
    expect(link).toHaveAttribute('href', '/wallets');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
