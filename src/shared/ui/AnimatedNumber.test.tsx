import { act, render, screen, waitFor } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installMatchMediaMock } from '@/test/matchMedia';
import { AnimatedNumber } from './AnimatedNumber';

const usd = (minor: number) => `$${(minor / 100).toFixed(2)}`;

function visibleText(container: HTMLElement) {
  return container.querySelector('[data-slot="animated-number"]');
}

describe('AnimatedNumber', () => {
  afterEach(() => {
    MotionGlobalConfig.skipAnimations = true;
  });

  it('shows the formatted value and exposes only the final value to screen readers', () => {
    const { container } = render(<AnimatedNumber value={123456} format={usd} />);
    expect(visibleText(container)).toHaveTextContent('$1234.56');
    expect(visibleText(container)).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('$1234.56', { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('uses String formatting by default', () => {
    const { container } = render(<AnimatedNumber value={42} />);
    expect(visibleText(container)).toHaveTextContent('42');
  });

  it('settles on the new value and flashes the trend color', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { container, rerender } = render(<AnimatedNumber value={1000} format={usd} />);

    rerender(<AnimatedNumber value={2500} format={usd} />);
    await vi.waitFor(() => {
      expect(visibleText(container)).toHaveTextContent('$25.00');
    });
    expect(visibleText(container)).toHaveAttribute('data-trend', 'up');

    rerender(<AnimatedNumber value={500} format={usd} />);
    await vi.waitFor(() => {
      expect(visibleText(container)).toHaveTextContent('$5.00');
    });
    expect(visibleText(container)).toHaveAttribute('data-trend', 'down');

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(visibleText(container)).not.toHaveAttribute('data-trend');
  });

  it('can skip the trend flash', async () => {
    const { container, rerender } = render(<AnimatedNumber value={1} flash={false} />);
    rerender(<AnimatedNumber value={2} flash={false} />);
    await waitFor(() => {
      expect(visibleText(container)).toHaveTextContent('2');
    });
    expect(visibleText(container)).not.toHaveAttribute('data-trend');
  });

  it('counts up from zero on mount when asked', async () => {
    const { container } = render(<AnimatedNumber value={900} animateOnMount />);
    await waitFor(() => {
      expect(visibleText(container)).toHaveTextContent('900');
    });
    expect(visibleText(container)).not.toHaveAttribute('data-trend');
  });

  it('tweens through intermediate integer frames when animations run', async () => {
    MotionGlobalConfig.skipAnimations = false;
    const frames: string[] = [];
    const { container, rerender } = render(<AnimatedNumber value={0} duration={0.05} />);
    const node = visibleText(container);
    const observer = new MutationObserver(() => frames.push(node?.textContent ?? ''));
    if (node) observer.observe(node, { childList: true, characterData: true, subtree: true });

    rerender(<AnimatedNumber value={1000} duration={0.05} />);
    await waitFor(() => {
      expect(node).toHaveTextContent('1000');
    });
    observer.disconnect();
    expect(frames.every((frame) => /^\d+$/.test(frame))).toBe(true);
  });

  it('jumps straight to the value when the user prefers reduced motion', () => {
    MotionGlobalConfig.skipAnimations = false;
    installMatchMediaMock().setMatches('(prefers-reduced-motion: reduce)', true);
    const { container, rerender } = render(<AnimatedNumber value={10} />);
    rerender(<AnimatedNumber value={20} />);
    expect(visibleText(container)).toHaveTextContent('20');
  });

  it('stops an in-flight tween when unmounted', () => {
    MotionGlobalConfig.skipAnimations = false;
    const { rerender, unmount } = render(<AnimatedNumber value={0} />);
    rerender(<AnimatedNumber value={100} />);
    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
