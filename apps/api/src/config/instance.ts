import { AsyncLocalStorage } from 'async_hooks';

export interface InstanceContext {
  desaId: bigint;
}

export const instanceContext = new AsyncLocalStorage<InstanceContext>();

export function getInstanceContext(): InstanceContext {
  const ctx = instanceContext.getStore();
  if (!ctx) {
    // Return a default for now to prevent compilation/runtime errors until middleware is fully implemented
    return { desaId: 1n };
  }
  return ctx;
}
