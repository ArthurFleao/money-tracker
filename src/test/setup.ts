import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { installMatchMediaMock } from './matchMedia';

// Animations are verified visually/e2e; unit tests run them instantly for determinism.
MotionGlobalConfig.skipAnimations = true;

// jsdom lacks ResizeObserver, which Radix popper-based primitives (Tooltip) need.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub;

beforeEach(() => {
  installMatchMediaMock();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.className = '';
  vi.useRealTimers();
});
