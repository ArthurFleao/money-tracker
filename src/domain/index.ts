/**
 * Public API of the domain layer: pure, framework-free logic. Takes plain data
 * and an injected `today`, returns plain data (PLAN.md §4.2, docs/DOMAIN.md).
 */
export * from './dates/dates';
export * from './money';
export * from './schemas';
export * from './recurrence';
export * from './balances';
export * from './forecast';
