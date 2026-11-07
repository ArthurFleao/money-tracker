import type { ISODate } from '../dates/dates';
import { type Minor, sum } from '../money/money';
import { signedAmount } from '../recurrence/occurrence';
import type { Transaction } from '../schemas/transaction';
import type { Wallet } from '../schemas/wallet';

/**
 * Whether a transaction moves a wallet's balance: it belongs to the wallet
 * and is not dated before the wallet's opening balance.
 *
 * @example
 * affectsWallet(makeWallet({ id: 'w', initialBalanceDate: '2026-01-10' }), makeTransaction({ walletId: 'w', date: '2026-01-09' })); // false
 */
export function affectsWallet(
  wallet: Pick<Wallet, 'id' | 'initialBalanceDate'>,
  item: { walletId: string; date: ISODate },
): boolean {
  return item.walletId === wallet.id && item.date >= wallet.initialBalanceDate;
}

/**
 * Balance of a wallet at the end of `asOf`: the initial balance (which holds
 * from the start of `initialBalanceDate`) plus every **cleared** transaction
 * from that date through `asOf`. Pending transactions and transactions dated
 * before `initialBalanceDate` are ignored. Before `initialBalanceDate` the
 * balance is the initial balance — we have no earlier history. Archived
 * wallets compute like any other.
 *
 * @example
 * computeWalletBalance(
 *   makeWallet({ initialBalanceMinor: 10_000, initialBalanceDate: '2026-01-01' }),
 *   [makeTransaction({ kind: 'expense', amountMinor: 2_500, date: '2026-01-02' })],
 *   '2026-01-31',
 * ); // 7_500
 */
export function computeWalletBalance(
  wallet: Wallet,
  transactions: readonly Transaction[],
  asOf: ISODate,
): Minor {
  return sum([
    wallet.initialBalanceMinor,
    ...transactions
      .filter((t) => t.status === 'cleared' && t.date <= asOf && affectsWallet(wallet, t))
      .map(signedAmount),
  ]);
}
