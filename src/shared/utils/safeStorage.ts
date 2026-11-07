/**
 * Wraps a Web Storage so quota, private-mode and security errors never break
 * the UI: reads fall back to `null`, writes are skipped.
 *
 * @example
 * const storage = safeStorage(() => window.localStorage);
 * storage.setItem('key', 'value'); // never throws
 */
export function safeStorage(
  getStorage: () => Storage,
): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  return {
    getItem(key) {
      try {
        return getStorage().getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        getStorage().setItem(key, value);
      } catch {
        // Persisting is best-effort; in-memory state still applies for the session.
      }
    },
    removeItem(key) {
      try {
        getStorage().removeItem(key);
      } catch {
        // See setItem.
      }
    },
  };
}
