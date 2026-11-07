import { describe, expect, it } from 'vitest';
import { safeStorage } from './safeStorage';

const throwing = () => {
  throw new Error('SecurityError');
};

describe('safeStorage', () => {
  it('delegates to the underlying storage', () => {
    const storage = safeStorage(() => localStorage);
    storage.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
    storage.removeItem('k');
    expect(storage.getItem('k')).toBeNull();
  });

  it('never throws when the storage is unavailable', () => {
    const storage = safeStorage(throwing);
    expect(storage.getItem('k')).toBeNull();
    expect(() => {
      storage.setItem('k', 'v');
    }).not.toThrow();
    expect(() => {
      storage.removeItem('k');
    }).not.toThrow();
  });
});
