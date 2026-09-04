/**
 * Lifecycle and Process State Management
 * Tracks server draining state for Kubernetes / PM2 readiness probes
 */

let isDraining = false;

export const setServerDraining = (draining: boolean): void => {
  isDraining = draining;
};

export const isServerDraining = (): boolean => isDraining;
