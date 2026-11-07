/**
 * Zustand test double: identical API, but every store created during a test
 * file is reset to its initial state after each test (pattern from the Zustand
 * testing guide). Installed globally in setup.ts via `vi.mock('zustand')`.
 */
import { act } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import type * as ZustandModule from 'zustand';
import type { StateCreator } from 'zustand';

type Zustand = typeof ZustandModule;
type AnyStateCreator = StateCreator<unknown>;

const actual = await vi.importActual<Zustand>('zustand');

const storeResetFns = new Set<() => void>();

function track<S extends { getInitialState: () => unknown; setState: (...args: never[]) => void }>(
  store: S,
): S {
  const initialState = store.getInitialState();
  storeResetFns.add(() => {
    (store.setState as (state: unknown, replace: true) => void)(initialState, true);
  });
  return store;
}

const createUncurried = (stateCreator: AnyStateCreator) => track(actual.create(stateCreator));

export const create = ((stateCreator?: AnyStateCreator) =>
  stateCreator ? createUncurried(stateCreator) : createUncurried) as Zustand['create'];

const createStoreUncurried = (stateCreator: AnyStateCreator) =>
  track(actual.createStore(stateCreator));

export const createStore = ((stateCreator?: AnyStateCreator) =>
  stateCreator
    ? createStoreUncurried(stateCreator)
    : createStoreUncurried) as Zustand['createStore'];

export const useStore = actual.useStore;

afterEach(() => {
  act(() => {
    storeResetFns.forEach((reset) => {
      reset();
    });
  });
});
