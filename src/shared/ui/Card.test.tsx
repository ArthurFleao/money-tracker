import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

describe('Card', () => {
  it('composes header, content and footer', () => {
    renderWithProviders(
      <Card aria-label="Checking">
        <CardHeader>
          <CardTitle>Checking</CardTitle>
          <CardDescription>Main account</CardDescription>
        </CardHeader>
        <CardContent>Balance</CardContent>
        <CardFooter>
          <button type="button">Edit</button>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Checking' })).toBeInTheDocument();
    expect(screen.getByText('Main account')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it.each([1, 2, 3] as const)('supports elevation %i', (elevation) => {
    renderWithProviders(
      <Card elevation={elevation} interactive role="group" aria-label={`card-${elevation}`} />,
    );
    expect(screen.getByRole('group', { name: `card-${elevation}` })).toBeInTheDocument();
  });
});
