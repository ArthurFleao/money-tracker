import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

function renderTabs() {
  return renderWithProviders(
    <Tabs defaultValue="earnings">
      <TabsList aria-label="Rule kind">
        <TabsTrigger value="earnings">Earnings</TabsTrigger>
        <TabsTrigger value="debts">Debts</TabsTrigger>
      </TabsList>
      <TabsContent value="earnings">Salary</TabsContent>
      <TabsContent value="debts">Rent</TabsContent>
    </Tabs>,
  );
}

describe('Tabs', () => {
  it('shows the selected panel', () => {
    renderTabs();
    expect(screen.getByRole('tablist', { name: 'Rule kind' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Earnings' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Earnings' })).toHaveTextContent('Salary');
  });

  it('switches panels by click', async () => {
    const { user } = renderTabs();
    await user.click(screen.getByRole('tab', { name: 'Debts' }));
    expect(screen.getByRole('tabpanel', { name: 'Debts' })).toHaveTextContent('Rent');
  });

  it('moves between tabs with arrow keys', async () => {
    const { user } = renderTabs();
    await user.click(screen.getByRole('tab', { name: 'Earnings' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Debts' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Debts' })).toHaveAttribute('aria-selected', 'true');
  });
});
