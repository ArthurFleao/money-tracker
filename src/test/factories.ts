/**
 * Test-data builders. Tests must build entities through these factories,
 * never through inline object literals (AGENTS.md §5).
 *
 * Entity factories (`makeWallet()`, `makeTransaction()`, …) are added in
 * Phase 1 alongside the Zod schemas, using `defineFactory`.
 */

/**
 * Creates a deterministic, monotonically increasing id generator.
 *
 * @example
 * const nextId = createSequence('wallet');
 * nextId(); // 'wallet-1'
 * nextId(); // 'wallet-2'
 */
export function createSequence(prefix: string): () => string {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}-${counter}`;
  };
}

/**
 * Defines a factory that merges overrides onto fresh defaults on every call.
 * `defaults` is a function so each built object gets new ids and nested values.
 *
 * @example
 * const makeUser = defineFactory(() => ({ id: nextId(), name: 'Ada' }));
 * makeUser({ name: 'Grace' }); // { id: 'user-1', name: 'Grace' }
 */
export function defineFactory<T extends object>(defaults: () => T): (overrides?: Partial<T>) => T {
  return (overrides = {}) => ({ ...defaults(), ...overrides });
}
