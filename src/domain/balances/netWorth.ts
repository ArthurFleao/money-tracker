import type { ISODate } from '../dates/dates';
import { type Minor, sum } from '../money/money';
import type { Transaction } from '../schemas/transaction';
import type { Wallet } from '../schemas/wallet';
import { computeWalletBalance } from './walletBalance';

/**
 * Sum of the balances of all non-archived wallets at the end of `asOf`. A
 * `credit` wallet that is owed money has a negative balance, so it reduces
 * net worth (PLAN.md §15 default: negative balance = amount owed).
 *
 * @example
 * computeNetWorth(
 *   [makeWallet({ initialBalanceMinor: 100_000 }), makeWallet({ type: 'credit', initialBalanceMinor: -30_000 })],
 *   [],
 *   '2026-01-31',
 * ); // 70_000
 */
export function computeNetWorth(
  wallets: readonly Wallet[],
  transactions: readonly Transaction[],
  asOf: ISODate,
): Minor {
  return sum(
    wallets
      .filter((wallet) => !wallet.archived)
      .map((wallet) => computeWalletBalance(wallet, transactions, asOf)),
  );
}
