import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Button } from './Button';
import { Dialog, DialogClose, DialogContent, DialogTrigger, SheetContent } from './Dialog';

describe('Dialog', () => {
  function renderDialog() {
    return renderWithProviders(
      <Dialog>
        <DialogTrigger asChild>
          <Button>New wallet</Button>
        </DialogTrigger>
        <DialogContent
          title="Create wallet"
          description="Where your money lives."
          footer={
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
          }
        >
          <input aria-label="Name" />
        </DialogContent>
      </Dialog>,
    );
  }

  it('opens as a labelled, described modal', async () => {
    const { user } = renderDialog();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New wallet' }));
    const dialog = screen.getByRole('dialog', { name: 'Create wallet' });
    expect(dialog).toHaveAccessibleDescription('Where your money lives.');
  });

  it('closes with Escape and returns focus to the trigger', async () => {
    const { user } = renderDialog();
    const trigger = screen.getByRole('button', { name: 'New wallet' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes from the close button and the footer action', async () => {
    const { user } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'New wallet' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New wallet' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports a visually hidden title without a description', () => {
    renderWithProviders(
      <Dialog open>
        <DialogContent title="Quick add" hideTitle>
          content
        </DialogContent>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Quick add' });
    expect(dialog).not.toHaveAttribute('aria-describedby');
  });
});

describe('SheetContent', () => {
  it.each(['bottom', 'right'] as const)('renders a %s sheet with dialog semantics', (side) => {
    renderWithProviders(
      <Dialog open>
        <SheetContent
          side={side}
          title="Quick add"
          description="Add an earning or a debt"
          footer={<span>footer</span>}
        >
          body
        </SheetContent>
      </Dialog>,
    );
    const sheet = screen.getByRole('dialog', { name: 'Quick add' });
    expect(sheet).toHaveAccessibleDescription('Add an earning or a debt');
    expect(sheet).toHaveTextContent('body');
    expect(sheet).toHaveTextContent('footer');
  });

  it('defaults to a bottom sheet and closes via the close button', async () => {
    const { user } = renderWithProviders(
      <Dialog defaultOpen>
        <SheetContent title="Filters" hideTitle>
          body
        </SheetContent>
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
