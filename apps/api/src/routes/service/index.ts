import { Router } from 'express';
import layananRoutes from './layanan.js';
import requestRoutes from './request.js';
import documentRoutes from './document.js';
import templateDesignerRoutes from './template-designer.js';

const router = Router();

// Mount service routes
router.use('/services', layananRoutes);
router.use('/service-requests', requestRoutes);
router.use('/documents', documentRoutes);
router.use('/template-designer', templateDesignerRoutes);
router.use('/', documentRoutes);

export default router;
