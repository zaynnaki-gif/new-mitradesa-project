import { prisma } from "./prisma.js";

class ConfigCache {
  private cache: Map<string, string> = new Map();
  private lastFetch = 0;
  private readonly TTL = 60 * 1000; // 1 minute cache

  async get(key: string, defaultValue: string = ""): Promise<string> {
    const now = Date.now();
    if (now - this.lastFetch > this.TTL || this.cache.size === 0) {
      await this.refresh();
    }
    return this.cache.has(key) ? this.cache.get(key)! : defaultValue;
  }

  async getBoolean(
    key: string,
    defaultValue: boolean = false,
  ): Promise<boolean> {
    const val = await this.get(key);
    if (val === "") return defaultValue;
    return val.toLowerCase() === "true";
  }

  async getNumber(key: string, defaultValue: number = 0): Promise<number> {
    const val = await this.get(key);
    if (val === "") return defaultValue;
    const parsed = Number(val);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  async refresh() {
    try {
      const configs = await prisma.configuration.findMany({
        select: { key: true, value: true },
      });
      this.cache.clear();
      configs.forEach((c) => this.cache.set(c.key, c.value || ""));
      this.lastFetch = Date.now();
    } catch (err) {
      console.error("[ConfigCache] Error refreshing config:", err);
    }
  }

  invalidate() {
    this.lastFetch = 0;
  }
}

export const configCache = new ConfigCache();
