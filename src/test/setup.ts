import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { installMatchMediaMock } from './matchMedia';

beforeEach(() => {
  installMatchMediaMock();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.className = '';
  vi.useRealTimers();
});
