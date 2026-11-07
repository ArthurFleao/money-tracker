import { render, screen } from '@testing-library/react';
import { Inbox } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveClass('h-4', 'w-24');
  });
});

describe('EmptyState', () => {
  it('renders title, description, icon and action', () => {
    renderWithProviders(
      <EmptyState
        icon={Inbox}
        title="No wallets yet"
        description="Create one to start tracking."
        action={<button type="button">Create wallet</button>}
      />,
    );
    const region = screen.getByRole('region', { name: 'No wallets yet' });
    expect(region).toHaveTextContent('Create one to start tracking.');
    expect(screen.getByRole('heading', { level: 2, name: 'No wallets yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create wallet' })).toBeInTheDocument();
  });

  it('works with just a title', () => {
    renderWithProviders(<EmptyState title="Nothing here" />);
    const region = screen.getByRole('region', { name: 'Nothing here' });
    expect(region.querySelector('svg')).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
