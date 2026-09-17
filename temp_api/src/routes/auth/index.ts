import { Router } from 'express';
import internalAuthRouter from './internal.js';
import citizenAuthRouter from './citizen.js';

const router = Router();

// Mount auth routers - internal routes at root, citizen under /citizen
router.use('/', internalAuthRouter);
router.use('/citizen', citizenAuthRouter);

export default router;
