import { Router, Request, Response } from 'express';
import { authenticateInternal, authorizeAny } from '../../middleware/index.js';
import { asyncHandler, ApiError } from '../../utils/response.js';
import { config } from '../../config/index.js';
import { spawn } from 'child_process';
// Removed fs import

const router = Router();
router.use(authenticateInternal());
// Only users with system management roles can perform backups
router.use(authorizeAny('sistem.manage'));

router.get('/download', asyncHandler(async (req: Request, res: Response) => {
  if (!config.databaseUrl) {
    throw ApiError.internal('DATABASE_URL is not configured.');
  }

  const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup-mitradesa-${date}.sql`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/sql');

  // Use pg_dump via spawn, passing the connection string directly
  // Note: For production systems, it's often safer to use PGPASSWORD env var
  // instead of passing the full URL if logs might capture it, but spawn doesn't log args automatically.
  const dump = spawn('pg_dump', [config.databaseUrl, '--clean', '--if-exists', '--format=plain']);

  dump.stdout.pipe(res);

  dump.stderr.on('data', (data) => {
    console.error(`[pg_dump error]: ${data.toString()}`);
  });

  dump.on('error', (error) => {
    console.error(`[pg_dump] Failed to start subprocess: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to start backup process. Ensure pg_dump is installed and in PATH.' });
    }
  });

  dump.on('close', (code) => {
    if (code !== 0) {
      console.error(`[pg_dump] Process exited with code ${code}`);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Backup process failed' });
      }
    }
  });
}));

export default router;
