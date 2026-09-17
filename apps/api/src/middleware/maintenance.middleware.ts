import { Request, Response, NextFunction } from "express";
import { configCache } from "../services/config-cache.service.js";

export const maintenanceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Only block public and citizen routes
    if (
      req.originalUrl.startsWith("/api/public") ||
      req.originalUrl.startsWith("/api/citizen")
    ) {
      const isMaintenance = await configCache.getBoolean(
        "MAINTENANCE_MODE",
        false,
      );
      if (isMaintenance) {
        const message = await configCache.get(
          "MAINTENANCE_MESSAGE",
          "Sistem sedang dalam perbaikan (Maintenance). Silakan kembali beberapa saat lagi.",
        );
        res.status(503).json({
          success: false,
          error: {
            code: "MAINTENANCE_MODE",
            message,
          },
        });
        return;
      }
    }
    next();
  } catch (error) {
    // Failsafe: if cache throws, let request pass
    next();
  }
};
