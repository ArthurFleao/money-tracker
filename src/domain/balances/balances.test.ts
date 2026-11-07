import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeTransaction, makeWallet } from '@/test/factories';
import { computeNetWorth } from './netWorth';
import { affectsWallet, computeWalletBalance } from './walletBalance';

describe('computeWalletBalance', () => {
  const wallet = makeWallet({ initialBalanceMinor: 10_000, initialBalanceDate: '2026-01-10' });
  const tx = (overrides: Parameters<typeof makeTransaction>[0]) =>
    makeTransaction({ walletId: wallet.id, ...overrides });

  it('adds cleared income and subtracts cleared expenses', () => {
    const transactions = [
      tx({ kind: 'income', amountMinor: 5_000, date: '2026-01-15' }),
      tx({ kind: 'expense', amountMinor: 2_500, date: '2026-01-20' }),
    ];
    expect(computeWalletBalance(wallet, transactions, '2026-01-31')).toBe(12_500);
  });

  it('counts transactions on the initial balance date but not before it', () => {
    const transactions = [
      tx({ kind: 'expense', amountMinor: 1_000, date: '2026-01-10' }),
      tx({ kind: 'expense', amountMinor: 9_999, date: '2026-01-09' }),
    ];
    expect(computeWalletBalance(wallet, transactions, '2026-01-31')).toBe(9_000);
  });

  it('ignores pending transactions, later dates and other wallets', () => {
    const transactions = [
      tx({ status: 'pending', amountMinor: 1_000, date: '2026-01-15' }),
      tx({ amountMinor: 1_000, date: '2026-02-01' }),
      makeTransaction({ walletId: 'other-wallet', amountMinor: 1_000, date: '2026-01-15' }),
    ];
    expect(computeWalletBalance(wallet, transactions, '2026-01-31')).toBe(10_000);
  });

  it('includes transactions on the asOf date', () => {
    const transactions = [tx({ amountMinor: 1_000, date: '2026-01-31' })];
    expect(computeWalletBalance(wallet, transactions, '2026-01-31')).toBe(9_000);
    expect(computeWalletBalance(wallet, transactions, '2026-01-30')).toBe(10_000);
  });

  it('is the initial balance before the initial balance date', () => {
    expect(computeWalletBalance(wallet, [tx({ date: '2026-01-10' })], '2025-12-31')).toBe(10_000);
  });

  it('still computes for archived wallets', () => {
    const archived = { ...wallet, archived: true };
    expect(computeWalletBalance(archived, [tx({ date: '2026-01-11' })], '2026-01-31')).toBe(9_000);
  });

  it('equals the initial balance plus the signed sum of what it counts', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            kind: fc.constantFrom('income' as const, 'expense' as const),
            amountMinor: fc.integer({ min: 1, max: 1_000_000 }),
            day: fc.integer({ min: 1, max: 28 }),
          }),
        ),
        (rows) => {
          const transactions = rows.map(({ kind, amountMinor, day }) =>
            tx({ kind, amountMinor, date: `2026-02-${String(day).padStart(2, '0')}` }),
          );
          const expected = rows.reduce(
            (total, { kind, amountMinor }) =>
              total + (kind === 'income' ? amountMinor : -amountMinor),
            10_000,
          );
          expect(computeWalletBalance(wallet, transactions, '2026-02-28')).toBe(expected);
        },
      ),
    );
  });
});

describe('affectsWallet', () => {
  it('requires the same wallet and a date on or after the initial balance date', () => {
    const wallet = makeWallet({ initialBalanceDate: '2026-01-10' });
    expect(affectsWallet(wallet, { walletId: wallet.id, date: '2026-01-10' })).toBe(true);
    expect(affectsWallet(wallet, { walletId: wallet.id, date: '2026-01-09' })).toBe(false);
    expect(affectsWallet(wallet, { walletId: 'other', date: '2026-01-10' })).toBe(false);
  });
});

describe('computeNetWorth', () => {
  it('sums non-archived wallets; credit balances owed count negatively', () => {
    const checking = makeWallet({ initialBalanceMinor: 100_000 });
    const card = makeWallet({ type: 'credit', initialBalanceMinor: -30_000 });
    const archived = makeWallet({ initialBalanceMinor: 999_999, archived: true });
    const purchase = makeTransaction({ walletId: card.id, kind: 'expense', amountMinor: 5_000 });
    expect(computeNetWorth([checking, card, archived], [purchase], '2026-01-31')).toBe(65_000);
  });

  it('is zero without wallets', () => {
    expect(computeNetWorth([], [], '2026-01-31')).toBe(0);
  });
});
