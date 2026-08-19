import { config } from './index';

export interface InstanceContext {
  desaId: bigint;
  desaKode: string;
  desaNama: string;
}

/**
 * Mendapatkan konteks instance MITRADESA saat ini.
 * Berdasarkan arsitektur single-tenant, satu instance Node.js
 * hanya melayani satu entitas desa.
 */
export function getInstanceContext(): InstanceContext {
  return {
    desaId: config.desaId,
    desaKode: config.desaKode,
    desaNama: config.desaNama,
  };
}
