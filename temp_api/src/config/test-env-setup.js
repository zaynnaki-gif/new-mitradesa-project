// CRITICAL: This file runs BEFORE any module is imported by Jest.
// It ensures .env.test is loaded before config/index.ts calls process.exit(1)
// for missing DESA_ID, DESA_KODE, DESA_NAMA.
//
// setupFilesAfterEnv runs too late — modules are already imported by then.
// setupFiles runs first, before module resolution.

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });
