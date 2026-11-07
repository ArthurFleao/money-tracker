import { describe, expect, it } from 'vitest';
import { createSequence, defineFactory } from './factories';

describe('createSequence', () => {
  it('produces deterministic, prefixed, increasing ids', () => {
    const nextId = createSequence('wallet');
    expect([nextId(), nextId(), nextId()]).toEqual(['wallet-1', 'wallet-2', 'wallet-3']);
  });

  it('keeps independent counters per sequence', () => {
    const a = createSequence('a');
    const b = createSequence('b');
    a();
    expect(b()).toBe('b-1');
  });
});

describe('defineFactory', () => {
  const nextId = createSequence('thing');
  const makeThing = defineFactory(() => ({ id: nextId(), label: 'default', tags: [] as string[] }));

  it('builds fresh defaults on every call', () => {
    const first = makeThing();
    const second = makeThing();
    expect(first.id).not.toBe(second.id);
    expect(first.tags).not.toBe(second.tags);
  });

  it('applies overrides on top of defaults', () => {
    expect(makeThing({ label: 'custom' })).toMatchObject({ label: 'custom' });
  });
});
